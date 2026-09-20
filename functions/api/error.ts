import { getCorsOrigin, getCorsHeaders } from '../utils/cors';
import { MAX_STACK_LENGTH } from '../utils/validation';

interface Env {
  RATELIMIT_KV?: KVNamespace;
}

interface ClientErrorPayload {
  message?: unknown;
  stack?: unknown;
  timestamp?: unknown;
  url?: unknown;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_URL_LENGTH = 500;
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_PER_HOUR = 30;

/**
 * Scrub common PII patterns before logging. Best-effort, not a security boundary.
 */
function scrubPII(input: string): string {
  if (!input) return '';
  const patterns: Array<[RegExp, string]> = [
    // JWT tokens
    [/\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '[REDACTED_JWT]'],
    // Bearer tokens
    [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED_TOKEN]'],
    // Generic key=... / token=... / api_key=...
    [/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|token)\s*[:=]\s*[^\s&]+/gi, '$1=[REDACTED]'],
    // Email addresses
    [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]'],
    // IPv4
    [/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[REDACTED_IP]'],
    // IPv6 (full and compressed forms)
    [/\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g, '[REDACTED_IP]'],
    [/\b::(?:[A-Fa-f0-9]{1,4}:){0,6}[A-Fa-f0-9]{1,4}\b/g, '[REDACTED_IP]'],
    // US phone numbers
    [/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]'],
    // Credit-card-shaped
    [/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED_CC]'],
    // Unix/macOS home folders
    [/(\/(?:Users|home)\/)[a-zA-Z0-9._-]+/g, '$1[REDACTED_USER]'],
    // Windows user profile paths
    [/([a-zA-Z]:\\Users\\)[a-zA-Z0-9._-]+/g, '$1[REDACTED_USER]'],
  ];
  let result = input;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement as string);
  }
  return result;
}

function stripNewlines(s: string): string {
  return s.replace(/[\r\n]+/g, ' ');
}

function sanitize(value: unknown, maxLen: number): string {
  let str: string;
  if (typeof value === 'string') {
    str = value;
  } else if (value === null || value === undefined) {
    return '';
  } else {
    try {
      str = JSON.stringify(value);
    } catch {
      return '';
    }
  }
  // Truncate first, then scrub PII, then strip newlines.
  const truncated = str.length > maxLen ? str.slice(0, maxLen) : str;
  const scrubbed = scrubPII(truncated);
  return stripNewlines(scrubbed);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = getCorsOrigin(request);
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders as HeadersInit,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        Allow: 'POST, OPTIONS',
      } as HeadersInit,
    });
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: corsHeaders as HeadersInit });
  }

  // Rate limit — unique-key-per-request pattern (atomic, race-free).
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  const hourBlock = Math.floor(Date.now() / 3600000);
  const prefix = `rate_limit:error:${ip}:${hourBlock}:`;

  if (env.RATELIMIT_KV) {
    try {
      const listed = await env.RATELIMIT_KV.list({ prefix, limit: RATE_LIMIT_PER_HOUR + 1 });
      if (listed.keys.length >= RATE_LIMIT_PER_HOUR) {
        return new Response(null, { status: 429, headers: corsHeaders as HeadersInit });
      }
      const uniqueKey = prefix + crypto.randomUUID();
      await env.RATELIMIT_KV.put(uniqueKey, '1', { expirationTtl: 3600 });
    } catch (kvErr) {
      console.error('KV rate limit check failed:', kvErr);
    }
  }

  try {
    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 413, headers: corsHeaders as HeadersInit });
    }

    let data: ClientErrorPayload;
    try {
      data = JSON.parse(rawText) as ClientErrorPayload;
    } catch {
      return new Response(null, { status: 204, headers: corsHeaders as HeadersInit });
    }

    const cleanMessage = sanitize(data.message, MAX_MESSAGE_LENGTH);
    const cleanStack = sanitize(data.stack, MAX_STACK_LENGTH);
    const cleanUrl = sanitize(data.url, MAX_URL_LENGTH);
    const cleanTimestamp = sanitize(
      data.timestamp || new Date().toISOString(),
      50
    );

    console.error(
      JSON.stringify({
        type: 'client-error',
        timestamp: cleanTimestamp,
        url: cleanUrl,
        message: cleanMessage,
        stack: cleanStack,
      })
    );
  } catch (err) {
    console.error('Error ingestion service failure:', err);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders as HeadersInit,
  });
};
