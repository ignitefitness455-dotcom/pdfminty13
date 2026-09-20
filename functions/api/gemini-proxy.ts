import { getCorsOrigin, getCorsHeaders } from '../utils/cors';

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  GORK_API_KEY?: string;
  GROK_API_KEY?: string;
  GEMINI_MODEL?: string;
  GROQ_MODEL?: string;
  GORK_MODEL?: string;
  GROK_MODEL?: string;
  RATELIMIT_KV?: KVNamespace;
}

const MAX_TEXT_LENGTH = 30000;
const MAX_QUERY_LENGTH = 2000;
const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Parses space/comma/newline/semicolon/pipe separated API keys from secret variables.
 */
function parseApiKeys(...rawStrings: (string | undefined)[]): string[] {
  const keys: string[] = [];
  for (const str of rawStrings) {
    if (!str) continue;
    const parts = str.split(/[\n\r,;\s|]+/);
    for (const part of parts) {
      const trimmed = part.replace(/^['"]|['"]$/g, '').trim();
      if (trimmed.length > 0 && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }
  return keys;
}

// Ephemeral in-memory fallback rate-limiting store (per-isolate, not a global cluster-wide counter).
const fallbackStore = new Map<string, { count: number; expiresAt: number }>();

function checkFallbackRateLimit(ip: string): boolean {
  const now = Date.now();
  const cell = fallbackStore.get(ip);
  if (!cell || now > cell.expiresAt) {
    fallbackStore.set(ip, { count: 1, expiresAt: now + 3600000 });
    return true;
  }
  if (cell.count >= 30) {
    return false;
  }
  cell.count += 1;
  return true;
}

function mapGeminiError(err: unknown): string {
  if (!err) {
    return 'An unknown error occurred during AI analysis.';
  }
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  if (
    msg.includes('api key') ||
    msg.includes('auth') ||
    msg.includes('unauthorized') ||
    msg.includes('key_invalid') ||
    msg.includes('key not') ||
    msg.includes('invalid key')
  ) {
    return 'AI authentication failure. Ensure the server API credentials are correctly configured.';
  }
  if (
    msg.includes('quota') ||
    msg.includes('limit') ||
    msg.includes('429') ||
    msg.includes('exhausted') ||
    msg.includes('resource_exhausted')
  ) {
    return 'AI quota exceeded. Please wait a bit before requesting more analysis.';
  }
  if (msg.includes('model') || msg.includes('not found') || msg.includes('404')) {
    return 'The requested AI model is currently unavailable or unsupported.';
  }
  if (msg.includes('timeout') || msg.includes('504') || msg.includes('deadline')) {
    return 'The request timed out. Try optimizing/reducing the size of the text to analyze.';
  }
  if (msg.includes('bad request') || msg.includes('400') || msg.includes('invalid')) {
    return 'Failed to analyze document content (invalid input structure or empty context).';
  }
  return 'An unexpected error occurred while communicating with Gemini. Verification of credentials is required.';
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = getCorsOrigin(request);
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight
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
      } as HeadersInit,
    });
  }

  // Request body size guard — allow up to 8 MB for multimodal OCR image payloads or extracted PDF text + query.
  const MAX_BODY_BYTES = 8 * 1024 * 1024;
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Request body too large. Reduce document size or number of pages.' }),
      {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  }

// Rate limit — uses a unique KV key per request to avoid the read-then-write
  // TOCTOU race that affects the classic "increment a counter" pattern. We list
  // all keys with the per-IP-per-hour prefix; if there are already >= LIMIT,
  // reject. Otherwise we write a new unique key with TTL and proceed.
  //
  // Cost: one KV list + one KV put per request. list() is eventually consistent
  // but the over-count window is ~60s, which is acceptable for an AI proxy.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  const hourBlock = Math.floor(Date.now() / 3600000);
  const prefix = `rate_limit:gemini:${ip}:${hourBlock}:`;
  const LIMIT_PER_HOUR = 30;
  let isAllowed = true;

  if (env.RATELIMIT_KV) {
    try {
      const listed = await env.RATELIMIT_KV.list({ prefix, limit: LIMIT_PER_HOUR + 1 });
      if (listed.keys.length >= LIMIT_PER_HOUR) {
        isAllowed = false;
      } else {
        // Write a unique key for this request. crypto.randomUUID() is available
        // in the Workers runtime.
        const uniqueKey = prefix + crypto.randomUUID();
        await env.RATELIMIT_KV.put(uniqueKey, '1', { expirationTtl: 3600 });
      }
    } catch (kvErr) {
      console.error('KV rate limiting failed, reverting to memory map fallback:', kvErr);
      isAllowed = checkFallbackRateLimit(ip);
    }
  } else {
    isAllowed = checkFallbackRateLimit(ip);
  }

  if (!isAllowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many AI analysis requests from this IP. Limit is 30 per hour.',
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  }

  try {
    interface GeminiProxyPayload {
      textContent?: unknown;
      query?: unknown;
      mode?: unknown;
      imagesBase64?: unknown;
    }
    const rawData = (await request.json()) as GeminiProxyPayload;
    const { textContent, query, mode, imagesBase64 } = rawData;

    if (mode !== 'summary' && mode !== 'qa' && mode !== 'ocr') {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Allowed values: 'summary', 'qa', 'ocr'." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          } as HeadersInit,
        }
      );
    }

    if (mode !== 'ocr' && (!textContent || typeof textContent !== 'string')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid textContent parameters.' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }

    // Validate query in 'qa' mode — prevent cost abuse via oversized prompts.
    if (mode === 'qa') {
      if (typeof query !== 'string' || !query.trim()) {
        return new Response(
          JSON.stringify({ error: 'A non-empty query is required in qa mode.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            } as HeadersInit,
          }
        );
      }
      if (query.length > MAX_QUERY_LENGTH) {
        return new Response(
          JSON.stringify({
            error: `Query is too long (max ${MAX_QUERY_LENGTH} characters).`,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            } as HeadersInit,
          }
        );
      }
    }

    const truncated = typeof textContent === 'string' ? textContent.slice(0, MAX_TEXT_LENGTH) : '';
    const apiKeys = parseApiKeys(env.GEMINI_API_KEY, env.GROQ_API_KEY, env.GROK_API_KEY, env.GORK_API_KEY);

    if (apiKeys.length === 0) {
      console.error('Missing GEMINI_API_KEY, GROQ_API_KEY, or GROK_API_KEY secret environment variable');
      return new Response(
        JSON.stringify({
          error: 'API proxy authentication failed. Verify GEMINI_API_KEY, GROQ_API_KEY, or GROK_API_KEY secret environment variable is loaded in Cloudflare Settings.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          } as HeadersInit,
        }
      );
    }

    let systemInstruction = 'You are a professional PDF document analysis assistant.';
    let contentsPayload: unknown = '';

    if (mode === 'ocr') {
      systemInstruction =
        'You are an expert Document Parsing & OCR engine. Your sole task is to transcribe the provided scanned PDF page image into high-fidelity, cleanly structured Markdown. Preserve headers (#, ##), lists (- or 1.), bold (**), italics (*), and format all tables accurately as Markdown tables (| col |). Do not include conversational introductory or concluding text.';
      const parts: unknown[] = [
        'Transcribe this document image accurately into well-formatted Markdown:',
      ];
      if (Array.isArray(imagesBase64)) {
        for (const imgStr of imagesBase64) {
          if (typeof imgStr === 'string') {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: imgStr.replace(/^data:image\/\w+;base64,/, ''),
              },
            });
          }
        }
      }
      contentsPayload = parts;
    } else if (mode === 'summary') {
      systemInstruction +=
        ' Your task is to provide clear, detailed, and objective summaries of the provided custom text.';
      contentsPayload = `Please analyze and summarize the following document text content. Focus on identifying the primary messages, key sections, important metadata, and critical bullet points. Keep it clear and beautifully formatted with clean, professional linebreaks.\n\nDOCUMENT TEXT CONTENT:\n${truncated}`;
    } else {
      systemInstruction +=
        " Your task is to answer user queries accurately based exclusively on the provided document text context. If the answer cannot be found or deduced, reply with 'This information could not be found in the document.'";
      contentsPayload = `Use the provided document text below to answer the user's specific query.\n\nUSER SPECIFIC QUERY:\n${query}\n\nDOCUMENT TEXT CONTEXT:\n${truncated}`;
    }

    let lastError: unknown = null;
    let aiText: string | null = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      try {
        const isGeminiKey = currentKey.startsWith('AIza');
        const isExplicitGrokKey = currentKey.startsWith('xai-');
        const isGroqKey = currentKey.startsWith('gsk_') || currentKey === env.GROQ_API_KEY;

        // 1. Try Groq API (console.groq.com)
        if (isGroqKey || (!isGeminiKey && !isExplicitGrokKey)) {
          try {
            const groqModel = env.GROQ_MODEL || env.GROK_MODEL || env.GORK_MODEL || (mode === 'ocr' ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile');
            let userMessageContent: unknown = '';

            if (mode === 'ocr') {
              const contentParts: unknown[] = [
                { type: 'text', text: 'Transcribe this document image accurately into well-formatted Markdown:' },
              ];
              if (Array.isArray(imagesBase64)) {
                for (const imgStr of imagesBase64) {
                  if (typeof imgStr === 'string') {
                    const cleanBase64 = imgStr.startsWith('data:') ? imgStr : `data:image/jpeg;base64,${imgStr}`;
                    contentParts.push({
                      type: 'image_url',
                      image_url: { url: cleanBase64 },
                    });
                  }
                }
              }
              userMessageContent = contentParts;
            } else {
              userMessageContent = contentsPayload as string;
            }

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${currentKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: groqModel,
                messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: userMessageContent },
                ],
                temperature: mode === 'ocr' ? 0.1 : 0.2,
              }),
            });

            if (groqRes.ok) {
              const json = (await groqRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
              const text = json.choices?.[0]?.message?.content;
              if (text) {
                aiText = text;
              }
            } else if (isGroqKey) {
              const errText = await groqRes.text();
              throw new Error(`Groq API Error (${groqRes.status}): ${errText}`);
            }
          } catch (groqErr) {
            if (isGroqKey) throw groqErr;
            // Fallback to other providers below
          }
        }

        // 2. Try xAI Grok API (x.ai) if not handled by Groq
        if (!aiText && (isExplicitGrokKey || (!isGeminiKey && !isGroqKey))) {
          try {
            const grokModel = env.GORK_MODEL || env.GROK_MODEL || 'grok-2-latest';
            let userMessageContent: unknown = '';

            if (mode === 'ocr') {
              const contentParts: unknown[] = [
                { type: 'text', text: 'Transcribe this document image accurately into well-formatted Markdown:' },
              ];
              if (Array.isArray(imagesBase64)) {
                for (const imgStr of imagesBase64) {
                  if (typeof imgStr === 'string') {
                    const cleanBase64 = imgStr.startsWith('data:') ? imgStr : `data:image/jpeg;base64,${imgStr}`;
                    contentParts.push({
                      type: 'image_url',
                      image_url: { url: cleanBase64 },
                    });
                  }
                }
              }
              userMessageContent = contentParts;
            } else {
              userMessageContent = contentsPayload as string;
            }

            const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${currentKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: grokModel,
                messages: [
                  { role: 'system', content: systemInstruction },
                  { role: 'user', content: userMessageContent },
                ],
                temperature: mode === 'ocr' ? 0.1 : 0.2,
              }),
            });

            if (grokRes.ok) {
              const json = (await grokRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
              const text = json.choices?.[0]?.message?.content;
              if (text) {
                aiText = text;
              }
            } else if (isExplicitGrokKey) {
              const errText = await grokRes.text();
              throw new Error(`Grok API Error (${grokRes.status}): ${errText}`);
            }
          } catch (grokErr) {
            if (isExplicitGrokKey) throw grokErr;
            // Fallback to Gemini below
          }
        }

        // If not explicit Grok key and Grok attempt did not set aiText, try Google Gemini REST API
        if (!aiText) {
          const modelName = env.GEMINI_MODEL || DEFAULT_MODEL;
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(currentKey)}`;

          let partsPayload: unknown[] = [];
          if (mode === 'ocr') {
            partsPayload = contentsPayload as unknown[];
          } else {
            partsPayload = [{ text: contentsPayload as string }];
          }

          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: [
                {
                  role: 'user',
                  parts: partsPayload,
                },
              ],
              generationConfig: {
                temperature: mode === 'ocr' ? 0.1 : 0.2,
              },
            }),
          });

          if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API Error (${geminiRes.status}): ${errText}`);
          }

          interface GeminiResponse {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string }>;
              };
            }>;
          }
          const json = (await geminiRes.json()) as GeminiResponse;
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            throw new Error('API returned an empty completion response.');
          }
          aiText = text;
        }

        // Successfully produced AI output! Break out of the key loop.
        break;
      } catch (keyErr: unknown) {
        lastError = keyErr;
        console.warn(`API Key #${i + 1} failed during AI analysis:`, keyErr);
        if (i < apiKeys.length - 1) {
          console.log(`Failing over to API key #${i + 2}...`);
        }
      }
    }

    if (!aiText) {
      throw lastError || new Error('All configured API keys failed.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: aiText,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  } catch (err: unknown) {
    console.error('Gemini API Proxy Exception:', err);
    const safeMsg = mapGeminiError(err);
    return new Response(JSON.stringify({ error: safeMsg }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
  }
};
