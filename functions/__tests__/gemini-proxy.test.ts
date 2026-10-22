import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequest } from '../api/gemini-proxy';

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
