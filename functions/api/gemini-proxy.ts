import { getCorsOrigin, getCorsHeaders, isAllowedRequestOrigin } from '../utils/cors';
import {
  extractBearerToken,
  verifyFirebaseIdToken,
  verifyFirestoreProStatus,
} from '../utils/firebase-auth';
import { checkRateLimit } from '../utils/rate-limiter';

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  GORK_API_KEY?: string;
  GROK_API_KEY?: string;
  GEMINI_MODEL?: string;
  GROQ_MODEL?: string;
  GORK_MODEL?: string;
  GROK_MODEL?: string;
  FIREBASE_PROJECT_ID?: string;
  RATELIMIT_KV?: KVNamespace;
}

const MAX_TEXT_LENGTH = 60000;
const MAX_QUERY_LENGTH = 2000;
const MAX_OCR_IMAGES = 15;
const MAX_SINGLE_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024; // ~3 MB binary per page
const MAX_CHAT_MESSAGES = 30;
const MAX_MESSAGE_CONTENT_LENGTH = 4000;
const DEFAULT_MODEL = 'gemini-2.5-flash';

function redactSecretsFromMessage(input: unknown, secrets: string[]): string {
  let text = String(input instanceof Error ? input.message : input || '');
  for (const secret of secrets) {
    if (secret && secret.length >= 6) {
      text = text.split(secret).join('[REDACTED_KEY]');
    }
  }
  return text.replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED_KEY]');
}

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

  // Multi-tier rate limiting: Cloudflare KV (primary) + Signed Edge Cookie Token (secondary fallback) + In-memory Burst Guard
  const rateLimitResult = await checkRateLimit({
    request,
    kv: env.RATELIMIT_KV,
    secret: env.GEMINI_API_KEY || env.GROQ_API_KEY || 'pdfminty_gemini_salt',
    scope: 'gemini',
    limit: 30,
    windowSec: 3600,
    burstLimit: 8,
    burstWindowSec: 10,
  });

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error:
          rateLimitResult.error ||
          'Too many AI analysis requests from this IP. Limit is 30 per hour.',
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          ...rateLimitResult.responseHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  }

  const groqKeys = new Set(parseApiKeys(env.GROQ_API_KEY));
  const grokKeys = new Set(parseApiKeys(env.GROK_API_KEY, env.GORK_API_KEY));
  const apiKeys = parseApiKeys(
    env.GEMINI_API_KEY,
    env.GROQ_API_KEY,
    env.GROK_API_KEY,
    env.GORK_API_KEY
  );

  try {
    interface GeminiProxyPayload {
      textContent?: unknown;
      query?: unknown;
      mode?: unknown;
      imagesBase64?: unknown;
      messages?: unknown;
      language?: unknown;
    }

    const rawBodyText = await request.text();
    if (rawBodyText.length > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({
          error: 'Request body too large. Reduce document size or number of pages.',
        }),
        {
          status: 413,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          } as HeadersInit,
        }
      );
    }

    let rawData: GeminiProxyPayload;
    try {
      rawData = JSON.parse(rawBodyText) as GeminiProxyPayload;
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed JSON body.' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }
    const { textContent, query, mode, imagesBase64, messages, language } = rawData;

    if (mode !== 'summary' && mode !== 'qa' && mode !== 'ocr' && mode !== 'chat') {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Allowed values: 'summary', 'qa', 'ocr', 'chat'." }),
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

    const validatedImages: string[] = [];
    if (mode === 'ocr') {
      if (!Array.isArray(imagesBase64) || imagesBase64.length === 0) {
        return new Response(
          JSON.stringify({ error: 'At least one page image is required for OCR mode.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            } as HeadersInit,
          }
        );
      }
      if (imagesBase64.length > MAX_OCR_IMAGES) {
        return new Response(
          JSON.stringify({
            error: `Too many images in a single OCR request (maximum ${MAX_OCR_IMAGES} pages per batch).`,
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
      for (const item of imagesBase64) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid image payload in imagesBase64 array.' }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }
        if (item.length > MAX_SINGLE_IMAGE_BASE64_LENGTH) {
          return new Response(
            JSON.stringify({ error: 'Individual page image exceeds maximum allowed size.' }),
            {
              status: 413,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }
        validatedImages.push(item);
      }
    }

    // Validate query in 'qa' or 'chat' mode
    if (
      (mode === 'qa' || mode === 'chat') &&
      !query &&
      (!Array.isArray(messages) || messages.length === 0)
    ) {
      return new Response(JSON.stringify({ error: 'A query or message history is required.' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }

    // Server-side authentication & Pro tier enforcement when FIREBASE_PROJECT_ID is configured
    const firebaseProjectId = (env.FIREBASE_PROJECT_ID || '').trim();
    if (firebaseProjectId) {
      let bearerToken: string | null = null;
      try {
        bearerToken = extractBearerToken(request);
      } catch {
        return new Response(
          JSON.stringify({ error: 'Malformed Authorization header. Expected Bearer token.' }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            } as HeadersInit,
          }
        );
      }

      if (mode === 'chat' || mode === 'summary' || mode === 'qa') {
        if (!bearerToken) {
          return new Response(
            JSON.stringify({
              error: 'Authentication required. Please sign in to your PDFMinty Pro account.',
            }),
            {
              status: 401,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }

        let claims;
        try {
          claims = await verifyFirebaseIdToken(bearerToken, firebaseProjectId);
        } catch {
          return new Response(
            JSON.stringify({
              error: 'Invalid or expired authentication session. Please sign in again.',
            }),
            {
              status: 401,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }

        let isProUser = false;
        try {
          isProUser = await verifyFirestoreProStatus(firebaseProjectId, claims.sub, bearerToken);
        } catch {
          return new Response(
            JSON.stringify({
              error: 'Unable to verify subscription status right now. Please retry shortly.',
            }),
            {
              status: 503,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }

        if (!isProUser) {
          return new Response(
            JSON.stringify({
              error: 'PDFMinty Pro subscription required for AI document analysis.',
            }),
            {
              status: 403,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              } as HeadersInit,
            }
          );
        }
      } else {
        // mode === 'ocr'
        if (bearerToken) {
          try {
            await verifyFirebaseIdToken(bearerToken, firebaseProjectId);
          } catch {
            return new Response(
              JSON.stringify({
                error: 'Invalid or expired authentication session. Please sign in again.',
              }),
              {
                status: 401,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                } as HeadersInit,
              }
            );
          }
        } else {
          if (!isAllowedRequestOrigin(request)) {
            return new Response(
              JSON.stringify({
                error: 'Forbidden request origin for unauthenticated OCR request.',
              }),
              {
                status: 403,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                } as HeadersInit,
              }
            );
          }

          const guestOcrRateLimit = await checkRateLimit({
            request,
            kv: env.RATELIMIT_KV,
            secret: env.GEMINI_API_KEY || env.GROQ_API_KEY || 'pdfminty_gemini_salt',
            scope: 'gemini_guest_ocr',
            limit: 10,
            windowSec: 3600,
            burstLimit: 3,
            burstWindowSec: 10,
          });

          if (!guestOcrRateLimit.allowed) {
            return new Response(
              JSON.stringify({
                error:
                  guestOcrRateLimit.error ||
                  'Guest OCR rate limit exceeded (10 requests/hour). Sign in for higher limits.',
              }),
              {
                status: 429,
                headers: {
                  ...corsHeaders,
                  ...guestOcrRateLimit.responseHeaders,
                  'Content-Type': 'application/json',
                } as HeadersInit,
              }
            );
          }
        }
      }
    }

    const truncated = typeof textContent === 'string' ? textContent.slice(0, MAX_TEXT_LENGTH) : '';
    const safeQuery = typeof query === 'string' ? query.slice(0, MAX_QUERY_LENGTH) : '';

    if (apiKeys.length === 0) {
      console.error(
        'Missing GEMINI_API_KEY, GROQ_API_KEY, or GROK_API_KEY secret environment variable'
      );
      return new Response(
        JSON.stringify({
          error:
            'API proxy authentication failed. Verify GEMINI_API_KEY, GROQ_API_KEY, or GROK_API_KEY secret environment variable is loaded in Cloudflare Settings.',
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
      const langHint =
        typeof language === 'string' && language.trim() && language !== 'auto'
          ? ` Primary document language hint: ${language.trim().slice(0, 16)}.`
          : '';
      systemInstruction = `You are an expert Document Parsing & OCR engine. Your sole task is to transcribe the provided scanned PDF page image into high-fidelity, cleanly structured Markdown. Preserve headers (#, ##), lists (- or 1.), bold (**), italics (*), and format all tables accurately as Markdown tables (| col |). Do not include conversational introductory or concluding text.${langHint}`;
      const parts: unknown[] = [
        `Transcribe this document image accurately into well-formatted Markdown:${langHint}`,
      ];
      for (const imgStr of validatedImages) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imgStr.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
      contentsPayload = parts;
    } else if (mode === 'summary') {
      systemInstruction +=
        ' Your task is to provide clear, detailed, and objective summaries of the provided custom text.';
      contentsPayload = `Please analyze and summarize the following document text content. Focus on identifying the primary messages, key sections, important metadata, and critical bullet points. Keep it clear and beautifully formatted with clean, professional linebreaks.\n\nDOCUMENT TEXT CONTENT:\n${truncated}`;
    } else if (mode === 'chat') {
      systemInstruction =
        'You are PdfMinty AI Assistant, an elite document intelligence and PDF chat system powered by Gemini. You analyze uploaded PDF documents accurately to answer user questions, explain specific clauses, summarize key points, extract structured data and financial tables into Markdown format, and provide clear explanations. If asked in Bengali (বাংলা), answer naturally in Bengali. Always cite page numbers or sections when available. When extracting data or numbers, format them cleanly as Markdown tables.';
      interface ChatHistoryItem {
        role?: string;
        content?: string;
        text?: string;
      }
      const msgsArray = Array.isArray(messages)
        ? (messages as ChatHistoryItem[]).slice(-MAX_CHAT_MESSAGES)
        : [];
      const historyText = msgsArray
        .map((m) => {
          const rawMsg =
            typeof m.content === 'string' ? m.content : typeof m.text === 'string' ? m.text : '';
          return `${m.role === 'user' ? 'User' : 'Assistant'}: ${rawMsg.slice(0, MAX_MESSAGE_CONTENT_LENGTH)}`;
        })
        .join('\n\n');
      contentsPayload = `DOCUMENT CONTEXT:\n${truncated}\n\nCONVERSATION HISTORY:\n${historyText}\n\nLATEST USER QUERY:\n${safeQuery}\n\nPlease respond directly to the user based on the document context and conversation history:`;
    } else {
      systemInstruction +=
        " Your task is to answer user queries accurately based exclusively on the provided document text context. If the answer cannot be found or deduced, reply with 'This information could not be found in the document.'";
      contentsPayload = `Use the provided document text below to answer the user's specific query.\n\nUSER SPECIFIC QUERY:\n${safeQuery}\n\nDOCUMENT TEXT CONTEXT:\n${truncated}`;
    }

    let lastError: unknown = null;
    let aiText: string | null = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      try {
        const isExplicitGrokKey = currentKey.startsWith('xai-') || grokKeys.has(currentKey);
        const isGroqKey = currentKey.startsWith('gsk_') || groqKeys.has(currentKey);

        // 1. Try Groq API (console.groq.com) only when an explicit Groq key is configured
        if (isGroqKey) {
          const groqModel =
            env.GROQ_MODEL ||
            env.GROK_MODEL ||
            env.GORK_MODEL ||
            (mode === 'ocr' ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile');
          let userMessageContent: unknown = '';

          if (mode === 'ocr') {
            const contentParts: unknown[] = [
              {
                type: 'text',
                text: 'Transcribe this document image accurately into well-formatted Markdown:',
              },
            ];
            for (const imgStr of validatedImages) {
              const cleanBase64 = imgStr.startsWith('data:')
                ? imgStr
                : `data:image/jpeg;base64,${imgStr}`;
              contentParts.push({
                type: 'image_url',
                image_url: { url: cleanBase64 },
              });
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
            const json = (await groqRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const text = json.choices?.[0]?.message?.content;
            if (text) {
              aiText = text;
            }
          } else {
            const errText = await groqRes.text();
            throw new Error(`Groq API Error (${groqRes.status}): ${errText}`);
          }
        }

        // 2. Try xAI Grok API (x.ai) only when an explicit xAI Grok key is configured
        if (!aiText && isExplicitGrokKey) {
          const grokModel = env.GORK_MODEL || env.GROK_MODEL || 'grok-2-latest';
          let userMessageContent: unknown = '';

          if (mode === 'ocr') {
            const contentParts: unknown[] = [
              {
                type: 'text',
                text: 'Transcribe this document image accurately into well-formatted Markdown:',
              },
            ];
            for (const imgStr of validatedImages) {
              const cleanBase64 = imgStr.startsWith('data:')
                ? imgStr
                : `data:image/jpeg;base64,${imgStr}`;
              contentParts.push({
                type: 'image_url',
                image_url: { url: cleanBase64 },
              });
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
            const json = (await grokRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const text = json.choices?.[0]?.message?.content;
            if (text) {
              aiText = text;
            }
          } else {
            const errText = await grokRes.text();
            throw new Error(`Grok API Error (${grokRes.status}): ${errText}`);
          }
        }

        // 3. Google Gemini REST API (pass key via x-goog-api-key header, never in URL query string)
        if (!aiText) {
          const modelName = env.GEMINI_MODEL || DEFAULT_MODEL;
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;

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
              'x-goog-api-key': currentKey,
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
        console.warn(
          `API Key #${i + 1} failed during AI analysis:`,
          redactSecretsFromMessage(keyErr, apiKeys)
        );
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
          ...rateLimitResult.responseHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  } catch (err: unknown) {
    console.error('Gemini API Proxy Exception:', redactSecretsFromMessage(err, apiKeys));
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
