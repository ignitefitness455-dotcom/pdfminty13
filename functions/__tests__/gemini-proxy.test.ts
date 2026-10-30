import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequest } from '../api/gemini-proxy';
import {
  _clearFirebaseAuthCacheForTesting,
  uint8ArrayToBase64Url,
} from '../utils/firebase-auth';

function makeContext(
  request: Request,
  env: Record<string, unknown> = { GEMINI_API_KEY: 'AIzaTestKeyForUnitTestsOnly123456' }
): Parameters<typeof onRequest>[0] {
  return {
    request,
    env,
    params: {},
    data: {},
    functionPath: '/api/gemini-proxy',
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(),
  } as unknown as Parameters<typeof onRequest>[0];
}

describe('gemini-proxy security & input boundary tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('rejects OCR mode when imagesBase64 exceeds MAX_OCR_IMAGES (15)', async () => {
    const tooManyImages = Array.from({ length: 16 }, () => 'data:image/jpeg;base64,aGVsbG8=');
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.10',
      },
      body: JSON.stringify({
        mode: 'ocr',
        imagesBase64: tooManyImages,
      }),
    });

    const res = await onRequest(makeContext(req));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('maximum 15 pages');
  });

  it('rejects single OCR image exceeding MAX_SINGLE_IMAGE_BASE64_LENGTH (4MB)', async () => {
    const hugeImage = 'A'.repeat(4 * 1024 * 1024 + 100);
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.14',
      },
      body: JSON.stringify({
        mode: 'ocr',
        imagesBase64: [hugeImage],
      }),
    });

    const res = await onRequest(makeContext(req));
    expect(res.status).toBe(413);
  });

  it('passes Gemini API key via x-goog-api-key header and never in the request URL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Summary output' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const fakeKey = 'AIzaTestKeyHeaderCheck987654321';
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.11',
      },
      body: JSON.stringify({
        mode: 'summary',
        textContent: 'Sample contract text for local extraction test.',
      }),
    });

    const res = await onRequest(makeContext(req, { GEMINI_API_KEY: fakeKey }));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('https://generativelanguage.googleapis.com/');
    expect(calledUrl).not.toContain('key=');
    expect(calledUrl).not.toContain(fakeKey);
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe(fakeKey);
  });

  it('truncates oversized query in qa mode to 2,000 characters', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'QA answer' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const longQuery = 'Q'.repeat(3500);
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.12',
      },
      body: JSON.stringify({
        mode: 'qa',
        textContent: 'Document body text.',
        query: longQuery,
      }),
    });

    const res = await onRequest(makeContext(req));
    expect(res.status).toBe(200);
    const [, calledInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const sentPayload = JSON.parse(String(calledInit.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    const promptSent = sentPayload.contents[0].parts[0].text;
    expect(promptSent).toContain('Q'.repeat(2000));
    expect(promptSent).not.toContain('Q'.repeat(2001));
  });

  it('does not route GEMINI_API_KEY to Groq or xAI endpoints even if key does not start with AIza', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const customGeminiKey = 'CustomFormatGoogleKey_123456789';
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.13',
      },
      body: JSON.stringify({
        mode: 'summary',
        textContent: 'Confidential document text.',
      }),
    });

    const res = await onRequest(makeContext(req, { GEMINI_API_KEY: customGeminiKey }));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0] as [string];
    expect(calledUrl).toContain('https://generativelanguage.googleapis.com/');
  });
});

describe('gemini-proxy Firebase RS256 auth & Pro entitlement enforcement (TASK-P0-03)', () => {
  const originalFetch = globalThis.fetch;
  const projectId = 'pdfminty-9836d';
  const testKid = 'test-firebase-kid-2026';
  let signingKey: CryptoKey;
  let publicJwk: JsonWebKey & { kid: string };

  async function mintTestFirebaseIdToken(overrides: Record<string, unknown> = {}): Promise<string> {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: testKid };
    const payload = {
      iss: `https://securetoken.google.com/${projectId}`,
      aud: projectId,
      sub: 'user_pro_verified_123',
      iat: nowSec - 10,
      exp: nowSec + 3600,
      email: 'pro@pdfminty.com',
      ...overrides,
    };
    const enc = new TextEncoder();
    const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
    const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
    const sigBuf = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      signingKey,
      enc.encode(`${headerB64}.${payloadB64}`) as BufferSource
    );
    const sigB64 = uint8ArrayToBase64Url(new Uint8Array(sigBuf));
    return `${headerB64}.${payloadB64}.${sigB64}`;
  }

  beforeEach(async () => {
    vi.restoreAllMocks();
    _clearFirebaseAuthCacheForTesting();
    if (!signingKey) {
      const pair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );
      signingKey = pair.privateKey;
      const exported = await crypto.subtle.exportKey('jwk', pair.publicKey);
      publicJwk = { ...exported, kid: testKid };
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    _clearFirebaseAuthCacheForTesting();
  });

  it('rejects unauthenticated chat/summary/qa requests with 401 when FIREBASE_PROJECT_ID is configured', async () => {
    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.50',
      },
      body: JSON.stringify({
        mode: 'chat',
        textContent: 'Confidential contract clause.',
        query: 'Summarize section 1.',
      }),
    });

    const res = await onRequest(
      makeContext(req, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects expired Firebase ID tokens with 401', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredToken = await mintTestFirebaseIdToken({
      iat: nowSec - 7200,
      exp: nowSec - 60,
    });

    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expiredToken}`,
        'CF-Connecting-IP': '203.0.113.51',
      },
      body: JSON.stringify({
        mode: 'summary',
        textContent: 'Sample text.',
      }),
    });

    const res = await onRequest(
      makeContext(req, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated user does not have isPro === true in Firestore', async () => {
    const validToken = await mintTestFirebaseIdToken({ sub: 'free_user_456' });
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('service_accounts/v1/jwk/securetoken')) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/documents/users/free_user_456')) {
        return new Response(
          JSON.stringify({ fields: { isPro: { booleanValue: false }, plan: { stringValue: 'free' } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected upstream call: ${url}`);
    }) as unknown as typeof fetch;

    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
        'CF-Connecting-IP': '203.0.113.52',
      },
      body: JSON.stringify({
        mode: 'chat',
        textContent: 'Document text.',
        query: 'Explain this.',
      }),
    });

    const res = await onRequest(
      makeContext(req, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(res.status).toBe(403);
  });

  it('allows chat requests (200) when RS256 Firebase ID token and Firestore isPro === true both pass', async () => {
    const validToken = await mintTestFirebaseIdToken({ sub: 'pro_user_789' });
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('service_accounts/v1/jwk/securetoken')) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/documents/users/pro_user_789')) {
        return new Response(
          JSON.stringify({ fields: { isPro: { booleanValue: true }, plan: { stringValue: 'pro' } } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Verified Pro AI response' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected upstream call: ${url}`);
    }) as unknown as typeof fetch;

    const req = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
        'CF-Connecting-IP': '203.0.113.53',
      },
      body: JSON.stringify({
        mode: 'chat',
        textContent: 'Annual financial statement.',
        query: 'What is net revenue?',
      }),
    });

    const res = await onRequest(
      makeContext(req, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; result: string };
    expect(body.success).toBe(true);
    expect(body.result).toBe('Verified Pro AI response');
  });

  it('blocks cross-origin unauthenticated guest OCR (403) while permitting allowlisted pdfminty.com origin (200)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '# Transcribed OCR Page' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch;

    const evilReq = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil-scraper.example',
        'CF-Connecting-IP': '203.0.113.54',
      },
      body: JSON.stringify({
        mode: 'ocr',
        imagesBase64: ['data:image/jpeg;base64,aGVsbG8='],
      }),
    });
    const evilRes = await onRequest(
      makeContext(evilReq, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(evilRes.status).toBe(403);

    const allowedReq = new Request('https://pdfminty.com/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://pdfminty.com',
        'CF-Connecting-IP': '203.0.113.55',
      },
      body: JSON.stringify({
        mode: 'ocr',
        imagesBase64: ['data:image/jpeg;base64,aGVsbG8='],
      }),
    });
    const allowedRes = await onRequest(
      makeContext(allowedReq, {
        GEMINI_API_KEY: 'AIzaTestKeyForAuth123456',
        FIREBASE_PROJECT_ID: projectId,
      })
    );
    expect(allowedRes.status).toBe(200);
  });
});
