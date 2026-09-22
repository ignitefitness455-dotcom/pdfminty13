/**
 * Advanced Rate Limiting Utility for Cloudflare Pages Functions.
 *
 * Architecture:
 * 1. Primary: Cloudflare KV (`RATELIMIT_KV`) distributed store with high-throughput
 *    `get` + `put` counters (100,000 operations/day free tier quota vs. 1,000 for list).
 * 2. Secondary (Serverless Isolate Persistence): Cryptographically signed HTTP-only
 *    cookies (HMAC-SHA256). Even if edge isolates restart or requests hit different
 *    data centers before KV is bound, the signed client token maintains request counts
 *    across isolates without tampering.
 * 3. Tertiary: Ephemeral in-memory burst guard with automatic LRU pruning and IPv6
 *    /64 subnet normalization to stop burst abuse and script cycling.
 */

export interface RateLimitOptions {
  request: Request;
  kv?: KVNamespace;
  secret?: string;
  scope: string; // e.g., 'gemini', 'contact', 'feedback', 'subscribe', 'error'
  limit: number; // Max requests per window
  windowSec?: number; // Time window in seconds (default: 3600 = 1 hour)
  burstLimit?: number; // Max requests in burst window (default: 10 in 10s)
  burstWindowSec?: number; // Burst window in seconds (default: 10)
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  resetAt: number; // Epoch seconds
  responseHeaders: Record<string, string>;
  error?: string;
}

// In-memory burst store with automatic garbage collection
interface BurstCell {
  count: number;
  expiresAt: number;
}
const inMemoryStore = new Map<string, BurstCell>();
let lastGcTime = 0;

/**
 * Normalizes IPv4 and IPv6 addresses.
 * IPv6 addresses are truncated to /64 subnet to prevent rotating address bypass.
 */
export function normalizeClientIp(ip: string): string {
  if (!ip || ip === 'unknown-ip') return 'unknown-client';
  const clean = ip.trim().toLowerCase();

  // Handle IPv6
  if (clean.includes(':')) {
    const segments = clean.split(':').filter(Boolean);
    // Use the first 4 segments (/64 routing prefix)
    return segments.slice(0, 4).join(':') || clean;
  }

  return clean;
}

/**
 * Performs periodic in-memory garbage collection to prevent memory leaks
 * in long-lived warm edge isolates.
 */
function pruneInMemoryStore(now: number) {
  if (now - lastGcTime < 60000 && inMemoryStore.size < 1000) return;
  lastGcTime = now;
  for (const [key, cell] of inMemoryStore.entries()) {
    if (now > cell.expiresAt) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Signs data using HMAC-SHA256 via Web Crypto API.
 */
async function signHmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies HMAC-SHA256 signature using constant-time comparison.
 */
async function verifyHmac(data: string, sig: string, secret: string): Promise<boolean> {
  try {
    const expected = await signHmac(data, secret);
    if (expected.length !== sig.length) return false;
    let match = 0;
    for (let i = 0; i < expected.length; i++) {
      match |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return match === 0;
  } catch {
    return false;
  }
}

/**
 * Extracts a cookie value from the request Cookie header.
 */
function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Main rate-limiting coordinator.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const {
    request,
    kv,
    secret = 'pdfminty_default_edge_salt_2026',
    scope,
    limit,
    windowSec = 3600,
    burstLimit = 10,
    burstWindowSec = 10,
  } = options;

  const rawIp = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  const ip = normalizeClientIp(rawIp);
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const windowId = Math.floor(nowSec / windowSec);
  const resetAtSec = (windowId + 1) * windowSec;
  const retryAfterSec = Math.max(1, resetAtSec - nowSec);

  pruneInMemoryStore(nowMs);

  // 1. Local burst check (e.g. max 10 requests in 10 seconds)
  const burstKey = `burst:${scope}:${ip}`;
  const burstCell = inMemoryStore.get(burstKey);
  if (burstCell && nowMs < burstCell.expiresAt) {
    if (burstCell.count >= burstLimit) {
      return {
        allowed: false,
        currentCount: burstCell.count,
        limit,
        remaining: 0,
        resetAt: resetAtSec,
        responseHeaders: {
          'Retry-After': String(Math.ceil((burstCell.expiresAt - nowMs) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAtSec),
        },
        error: `Too many rapid requests. Please wait a few seconds before trying again.`,
      };
    }
    burstCell.count += 1;
  } else {
    inMemoryStore.set(burstKey, { count: 1, expiresAt: nowMs + burstWindowSec * 1000 });
  }

  let currentCount = 0;
  let usedKv = false;

  // 2. Primary: Cloudflare KV check
  if (kv) {
    try {
      const kvKey = `rl:${scope}:${ip}:${windowId}`;
      const existingVal = await kv.get(kvKey);
      currentCount = existingVal ? parseInt(existingVal, 10) || 0 : 0;

      if (currentCount >= limit) {
        return {
          allowed: false,
          currentCount,
          limit,
          remaining: 0,
          resetAt: resetAtSec,
          responseHeaders: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetAtSec),
          },
          error: `Rate limit exceeded for this IP. Limit is ${limit} requests per ${windowSec >= 3600 ? Math.round(windowSec / 3600) + ' hour(s)' : windowSec + 's'}.`,
        };
      }

      // Increment KV counter
      currentCount += 1;
      await kv.put(kvKey, String(currentCount), { expirationTtl: windowSec + 120 });
      usedKv = true;
    } catch (kvErr) {
      console.error('[RateLimiter] KV check failed, falling back to signed edge token:', kvErr);
    }
  }

  // 3. Secondary: Signed Edge Cookie fallback (when KV is unavailable or failed)
  const cookieName = `__cf_rl_${scope}`;
  if (!usedKv) {
    const rawCookie = getCookie(request, cookieName);

    if (rawCookie) {
      // Format: <count>.<resetSec>.<sig>
      const parts = rawCookie.split('.');
      if (parts.length === 3) {
        const [cStr, rStr, sig] = parts;
        const parsedCount = parseInt(cStr, 10);
        const parsedReset = parseInt(rStr, 10);

        if (!isNaN(parsedCount) && !isNaN(parsedReset) && nowSec < parsedReset) {
          const payload = `${scope}:${ip}:${cStr}:${rStr}`;
          const isSignatureValid = await verifyHmac(payload, sig, secret);
          if (isSignatureValid) {
            currentCount = parsedCount;
          }
        }
      }
    }

    // Check in-memory store as additional corroboration across requests in the same isolate
    const memKey = `window:${scope}:${ip}:${windowId}`;
    const memCell = inMemoryStore.get(memKey);
    if (memCell && nowMs < memCell.expiresAt) {
      currentCount = Math.max(currentCount, memCell.count);
    }

    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount,
        limit,
        remaining: 0,
        resetAt: resetAtSec,
        responseHeaders: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAtSec),
        },
        error: `Rate limit exceeded for this IP. Limit is ${limit} requests per hour.`,
      };
    }

    // Increment
    currentCount += 1;
    inMemoryStore.set(memKey, { count: currentCount, expiresAt: nowMs + windowSec * 1000 });
  }

  // 4. Generate signed cookie for response to ensure cross-isolate persistence
  const cookiePayload = `${scope}:${ip}:${currentCount}:${resetAtSec}`;
  const sig = await signHmac(cookiePayload, secret);
  const cookieVal = `${currentCount}.${resetAtSec}.${sig}`;
  const cookieHeader = `${cookieName}=${encodeURIComponent(cookieVal)}; Path=/api/; Max-Age=${windowSec}; HttpOnly; SameSite=Lax; Secure`;

  const remaining = Math.max(0, limit - currentCount);

  return {
    allowed: true,
    currentCount,
    limit,
    remaining,
    resetAt: resetAtSec,
    responseHeaders: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetAtSec),
      'Set-Cookie': cookieHeader,
    },
  };
}
