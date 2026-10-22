import { describe, it, expect, vi } from 'vitest';

import { onRequest } from '../_middleware';

describe('Cloudflare Pages Middleware - Redirect & Routing Tests', () => {
  const createMockContext = (urlStr: string, headersInit: Record<string, string> = {}) => {
    const request = new Request(urlStr, {
      headers: new Headers(headersInit),
    });

    const next = vi.fn().mockImplementation(async () => {
      return new Response('<html><body>Mock HTML Content</body></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    });

    return {
      request,
      next,
      env: {},
      params: {},
      data: {},
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as Parameters<typeof onRequest>[0];
  };

  it('redirects /blog (without slash) to /blog/ with 301 and Location header without throwing error', async () => {
    const ctx = createMockContext('https://pdfminty.com/blog');
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/blog/');
    expect(res.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(ctx.next).not.toHaveBeenCalled();
  });

  it('passes /blog/ (with slash) through to context.next() with 200 OK', async () => {
    const ctx = createMockContext('https://pdfminty.com/blog/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(200);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('redirects legacy alias /about to /about-us/ with 301', async () => {
    const ctx = createMockContext('https://pdfminty.com/about');
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/about-us/');
    expect(res.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
  });

  it('redirects legacy alias /jpg-to-pdf to /image-to-pdf/ with 301', async () => {
    const ctx = createMockContext('https://pdfminty.com/jpg-to-pdf');
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/image-to-pdf/');
  });

  it('redirects uppercase /Blog/ to lowercase /blog/ with 301', async () => {
    const ctx = createMockContext('https://pdfminty.com/Blog/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/blog/');
  });

  it('redirects www.pdfminty.com to non-www https://pdfminty.com', async () => {
    const ctx = createMockContext('https://www.pdfminty.com/blog/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/blog/');
  });

  it('redirects plain HTTP requests via x-forwarded-proto to HTTPS', async () => {
    const ctx = createMockContext('http://pdfminty.com/blog/', {
      'x-forwarded-proto': 'http',
    });
    const res = await onRequest(ctx);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://pdfminty.com/blog/');
  });

  it('returns 404 for random unknown routes without throwing 500', async () => {
    const ctx = createMockContext('https://pdfminty.com/xyz-random-non-existent-path/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('bypasses static assets without redirecting', async () => {
    const ctx = createMockContext('https://pdfminty.com/assets/index.abc1234.js');
    const res = await onRequest(ctx);

    expect(ctx.next).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('returns 404 and noindex, nofollow for ungenerated localized subpaths like /de/blog/', async () => {
    const ctx = createMockContext('https://pdfminty.com/de/blog/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('returns 404 and noindex, nofollow for ungenerated localized subpaths like /zh/about-us/', async () => {
    const ctx = createMockContext('https://pdfminty.com/zh/about-us/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(404);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('allows valid localized subpaths like /de/merge-pdf/ with 200 and index, follow', async () => {
    const ctx = createMockContext('https://pdfminty.com/de/merge-pdf/');
    const res = await onRequest(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Robots-Tag')).toBe('index, follow');
    expect(res.headers.get('Content-Language')).toBe('de');
  });

  it('always sets noindex, nofollow when upstream status is not 200 (e.g. 404 from Pages static asset lookup)', async () => {
    const request = new Request('https://pdfminty.com/de/blog/');
    const next = vi.fn().mockImplementation(async () => {
      return new Response('<html><body>404 Not Found</body></html>', {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    });

    const ctx = {
      request,
      next,
      env: {},
      params: {},
      data: {},
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as Parameters<typeof onRequest>[0];

    const res = await onRequest(ctx);
    expect(res.status).toBe(404);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('redirects /pricing to /pricing/ (301) and serves /pricing/ with 200 and index, follow', async () => {
    const redirectCtx = createMockContext('https://pdfminty.com/pricing');
    const redirectRes = await onRequest(redirectCtx);
    expect(redirectRes.status).toBe(301);
    expect(redirectRes.headers.get('Location')).toBe('https://pdfminty.com/pricing/');

    const okCtx = createMockContext('https://pdfminty.com/pricing/');
    const okRes = await onRequest(okCtx);
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('X-Robots-Tag')).toBe('index, follow');
  });

  it('redirects /compare-pdf and /pdf-diff to /compare-pdf/ (301) and serves /compare-pdf/ with 200', async () => {
    const slashCtx = createMockContext('https://pdfminty.com/compare-pdf');
    const slashRes = await onRequest(slashCtx);
    expect(slashRes.status).toBe(301);
    expect(slashRes.headers.get('Location')).toBe('https://pdfminty.com/compare-pdf/');

    const legacyCtx = createMockContext('http://www.pdfminty.com/pdf-diff');
    const legacyRes = await onRequest(legacyCtx);
    expect(legacyRes.status).toBe(301);
    expect(legacyRes.headers.get('Location')).toBe('https://pdfminty.com/compare-pdf/');

    const okCtx = createMockContext('https://pdfminty.com/compare-pdf/');
    const okRes = await onRequest(okCtx);
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('X-Robots-Tag')).toBe('index, follow');
  });

  it('redirects /grayscale-pdf to /grayscale-pdf/ (301) and serves /grayscale-pdf/ with 200', async () => {
    const slashCtx = createMockContext('https://pdfminty.com/grayscale-pdf');
    const slashRes = await onRequest(slashCtx);
    expect(slashRes.status).toBe(301);
    expect(slashRes.headers.get('Location')).toBe('https://pdfminty.com/grayscale-pdf/');

    const okCtx = createMockContext('https://pdfminty.com/grayscale-pdf/');
    const okRes = await onRequest(okCtx);
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('X-Robots-Tag')).toBe('index, follow');
  });

  it('serves auth and account routes (/login/, /signup/, /dashboard/) with 200 OK and X-Robots-Tag: noindex, nofollow', async () => {
    for (const route of ['/login/', '/signup/', '/dashboard/']) {
      const ctx = createMockContext(`https://pdfminty.com${route}`);
      const res = await onRequest(ctx);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    }

    const legacyAuthCtx = createMockContext('https://pdfminty.com/account');
    const legacyAuthRes = await onRequest(legacyAuthCtx);
    expect(legacyAuthRes.status).toBe(301);
    expect(legacyAuthRes.headers.get('Location')).toBe('https://pdfminty.com/dashboard/');
  });
});
