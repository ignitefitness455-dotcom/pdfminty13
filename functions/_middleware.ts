import { TOOLS } from '../src/config/seo-data';

import { getCorsOrigin, getCorsHeaders } from './utils/cors';

// Canonical legacy redirects map (always 301 directly to canonical destination)
const LEGACY_REDIRECTS: Record<string, string> = {
  '/about': '/about-us/',
  '/contact-us': '/contact/',
  '/privacy': '/privacy-policy/',
  '/terms': '/terms-of-service/',
  '/tos': '/terms-of-service/',
  '/edit-metadata': '/edit-pdf-metadata/',
  '/protect': '/protect-pdf/',
  '/unlock': '/unlock-pdf/',
  '/compress': '/blog/how-to-compress-a-pdf-without-losing-quality-2026/',
  '/compress-pdf': '/blog/how-to-compress-a-pdf-without-losing-quality-2026/',
  '/delete-pages': '/delete-pages-pdf/',
  '/extract-pages': '/extract-pages-pdf/',
  '/reorder': '/reorder-pdf/',
  '/watermark': '/watermark-pdf/',
  '/page-numbers': '/add-page-numbers/',
  '/add-blank': '/add-blank-page/',
  '/img-to-pdf': '/image-to-pdf/',
  '/jpg-to-pdf': '/image-to-pdf/',
  '/jpeg-to-pdf': '/image-to-pdf/',
  '/png-to-pdf': '/image-to-pdf/',
  '/pdf-to-img': '/pdf-to-image/',
  '/pdf-to-jpg': '/pdf-to-image/',
  '/pdf-to-jpeg': '/pdf-to-image/',
  '/pdf-to-png': '/pdf-to-image/',
  '/grayscale': '/grayscale-pdf/',
  '/flatten': '/flatten-pdf/',
  '/repair': '/repair-pdf/',
  '/sign': '/sign-pdf/',
  '/ocr': '/ocr-pdf/',
  '/sanitize': '/sanitize-pdf/',
  '/intelligence': '/ai-analyze-pdf/',
  '/switch-from-adobe-acrobat': '/adobe-acrobat-alternative/',
  '/is-it-safe-to-upload-pdf-to-online-tools': '/blog/is-it-safe-to-upload-pdf-to-online-tools/',
  '/merge': '/merge-pdf/',
  '/split': '/split-pdf/',
  '/rotate': '/rotate-pdf/',
  '/pdfminty-vs-smallpdf': '/compare/pdfminty-vs-smallpdf/',
  '/pdfminty-vs-ilovepdf': '/compare/pdfminty-vs-ilovepdf/',
  '/blog/best-free-pdf-compressor-without-losing-quality':
    '/blog/how-to-compress-a-pdf-without-losing-quality-2026/',
  '/blog/how-to-compress-pdf-without-losing-quality-locally':
    '/blog/how-to-compress-a-pdf-without-losing-quality-2026/',
  '/blog/how-to-protect-a-pdf-with-password-in-3-easy-steps':
    '/blog/how-to-password-protect-a-pdf-offline/',
  '/blog/how-to-edit-a-pdf-offline-without-uploading-it':
    '/blog/secure-pdf-editing-without-uploading/',
  '/blog/why-offline-pdf-editors-are-the-future-of-privacy':
    '/blog/why-privacy-first-pdf-tools-matter-in-2026/',
};

// Static pages that are always valid
const STATIC_VALID_ROUTES = new Set([
  'blog',
  'about-us',
  'contact',
  'privacy-policy',
  'terms-of-service',
  'adobe-acrobat-alternative',
]);

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'bn', 'hi', 'zh'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const NON_DEFAULT_LOCALES = new Set<SupportedLocale>(
  SUPPORTED_LOCALES.filter((loc): loc is Exclude<SupportedLocale, 'en'> => loc !== 'en')
);

// Localized subpaths that actually exist as pre-rendered pages or valid routes
// Currently, only 'merge-pdf' has dedicated localized pages across supported non-default locales
const LOCALIZED_VALID_SUBROUTES = new Set([
  'merge-pdf',
]);

function checkValidRoute(cleanPath: string): boolean {
  if (cleanPath === '' || STATIC_VALID_ROUTES.has(cleanPath)) {
    return true;
  }

  // Check localized routes (e.g. "de", "de/merge-pdf", "fr/merge-pdf", "bn/merge-pdf")
  const segments = cleanPath.split('/');
  const firstSegment = segments[0] as SupportedLocale;

  if (NON_DEFAULT_LOCALES.has(firstSegment)) {
    // Localized homepages (e.g. /de/, /fr/, /es/, /bn/, /hi/, /zh/)
    if (segments.length === 1) {
      return true;
    }
    // Only pre-rendered / supported localized subpaths (e.g. "de/merge-pdf")
    const subPath = segments.slice(1).join('/');
    return LOCALIZED_VALID_SUBROUTES.has(subPath);
  }

  // Default English tool pages, blog articles, compare pages (e.g. "merge-pdf", "blog/...", "compare/...")
  return TOOLS.some((item) => item.slug === cleanPath);
}

export const onRequest: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const rawPath = url.pathname;

    // Safe redirect helper that strictly prevents self-redirect loops and CDN cache-poisoning
    const createRedirectResponse = (targetUrl: string, status: 301 | 302 = 301): Response | null => {
      try {
        // Strictly prevent redirecting to the exact same URL (infinite loop guard)
        const currentCanonical = `${url.origin}${url.pathname}${url.search}`;
        if (
          targetUrl === url.href ||
          targetUrl === context.request.url ||
          targetUrl === currentCanonical
        ) {
          return null;
        }

        // Note: Response.redirect(url, status) creates a Response with immutable headers (guard = "immutable"),
        // which throws a fatal TypeError ("Headers are immutable") in Cloudflare Workers / workerd runtime
        // when attempting headers.set().
        // Constructing directly via new Response ensures full header mutability and zero runtime exceptions.
        return new Response(null, {
          status,
          headers: {
            Location: targetUrl,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      } catch (redirectErr) {
        console.error('[Middleware] Error creating redirect response:', redirectErr);
        return null;
      }
    };

  // Determine effective client protocol using x-forwarded-proto header (protect against Cloudflare Flexible SSL loop)
  const forwardedProto =
    context.request.headers.get('x-forwarded-proto') ||
    (url.protocol ? url.protocol.replace(':', '') : 'https');
  const isPlainHttp = forwardedProto === 'http';

  // 1. Canonical Hostname (www -> non-www) & Protocol (http -> https) normalization
  if (url.hostname === 'www.pdfminty.com' || (url.hostname === 'pdfminty.com' && isPlainHttp)) {
    const targetUrl = `https://pdfminty.com${rawPath}${url.search}`;
    const redirect = createRedirectResponse(targetUrl, 301);
    if (redirect) return redirect;
  }

  // Guaranteed immediate handler for Google AdSense ads.txt
  if (rawPath === '/ads.txt') {
    return new Response('google.com, pub-3862038139324053, DIRECT, f08c47fec0942fa0\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  if (rawPath === '/ads.txt/') {
    const redirect = createRedirectResponse('https://pdfminty.com/ads.txt', 301);
    if (redirect) return redirect;
  }

  // Fast bypass for static assets: Vite chunks, CSS, fonts, images, wasm, etc.
  // Static assets must be served directly with their exact case-sensitive filenames and without page-level redirects.
  const isStaticAsset =
    rawPath.startsWith('/assets/') ||
    rawPath.startsWith('/fonts/') ||
    rawPath.startsWith('/icons/') ||
    /\.(js|css|png|jpe?g|svg|gif|ico|webp|woff2?|ttf|wasm|webmanifest|xml|txt|map|json)$/i.test(
      rawPath
    );

  if (isStaticAsset) {
    return context.next();
  }

  const lowerPath = rawPath.toLowerCase();

  // Normalize slashes and dot-segments early for non-API routes to avoid multi-hop redirect chains
  const normalizedLower = lowerPath.startsWith('/api')
    ? lowerPath
    : lowerPath
        .replace(/\/{2,}/g, '/')
        .replace(/\/\.\//g, '/')
        .replace(/\/\.$/, '/');

  // 1. Check legacy redirects first (with or without trailing slash)
  const strippedPath = normalizedLower.replace(/\/+$/, '') || '/';
  if (LEGACY_REDIRECTS[strippedPath]) {
    const destination = LEGACY_REDIRECTS[strippedPath];
    // Prevent self-redirect loops: only redirect if destination is different from normalized path
    if (destination !== normalizedLower && destination !== rawPath) {
      const targetHost = url.hostname === 'www.pdfminty.com' ? 'pdfminty.com' : url.hostname;
      const targetProtocol =
        url.hostname === 'pdfminty.com' || url.hostname === 'www.pdfminty.com'
          ? 'https:'
          : isPlainHttp
            ? 'https:'
            : url.protocol;
      const targetUrl = `${targetProtocol}//${targetHost}${destination}${url.search}`;
      const redirect = createRedirectResponse(targetUrl, 301);
      if (redirect) return redirect;
    }
  }

  // 2. Canonical URL Normalization: Hostname (www -> non-www) & Protocol (http -> https)
  let shouldRedirect = false;
  let targetHost = url.hostname;
  let targetProtocol = isPlainHttp ? 'https:' : url.protocol;
  let targetPathname = rawPath;

  if (url.hostname === 'www.pdfminty.com') {
    targetHost = 'pdfminty.com';
    targetProtocol = 'https:';
    shouldRedirect = true;
  } else if (url.hostname === 'pdfminty.com' && isPlainHttp) {
    targetProtocol = 'https:';
    shouldRedirect = true;
  }

  // 3. Dot-segment, trailing punctuation (e.g. from markdown link typos like /privacy-policy/)), and consecutive slash collapsing for non-API paths
  if (!targetPathname.startsWith('/api')) {
    const cleanedPunctuation = targetPathname.replace(/[)\]}>,;]+$/, '');
    if (cleanedPunctuation !== targetPathname) {
      targetPathname = cleanedPunctuation;
      shouldRedirect = true;
    }
    const cleanedDots = targetPathname.replace(/\/\.\//g, '/').replace(/\/\.$/, '/');
    if (cleanedDots !== targetPathname) {
      targetPathname = cleanedDots;
      shouldRedirect = true;
    }
    if (/\/{2,}/.test(targetPathname)) {
      targetPathname = targetPathname.replace(/\/{2,}/g, '/');
      shouldRedirect = true;
    }
  }

  // 4. Strip index.html / index.htm to directory trailing slash
  if (targetPathname === '/index.html' || targetPathname === '/index.htm') {
    targetPathname = '/';
    shouldRedirect = true;
  } else if (targetPathname.endsWith('/index.html') || targetPathname.endsWith('/index.htm')) {
    targetPathname = targetPathname.replace(/\/index\.html?$/, '/');
    shouldRedirect = true;
  }

  // 5. Lowercase path enforcement for non-API routes
  const lowerCandidate = targetPathname.toLowerCase();
  if (!targetPathname.startsWith('/api') && targetPathname !== lowerCandidate) {
    targetPathname = lowerCandidate;
    shouldRedirect = true;
  }

  // 6. Trailing slash enforcement for valid directory/HTML routes (not files, not /api)
  if (
    !targetPathname.startsWith('/api') &&
    !targetPathname.includes('.') &&
    !targetPathname.endsWith('/')
  ) {
    const cleanCandidate = targetPathname.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
    // Only redirect valid routes to slash, so non-existent URLs 404 directly without chain
    if (checkValidRoute(cleanCandidate)) {
      targetPathname = `${targetPathname}/`;
      shouldRedirect = true;
    }
  }

  if (shouldRedirect) {
    const targetUrl = `${targetProtocol}//${targetHost}${targetPathname}${url.search}`;
    const redirect = createRedirectResponse(targetUrl, 301);
    if (redirect) return redirect;
  }

  const pathname = lowerPath;

  // Define valid API endpoints
  const validApiEndpoints = [
    '/api/contact',
    '/api/error',
    '/api/feedback',
    '/api/gemini-proxy',
    '/api/health',
    '/api/subscribe',
  ];

  // Helper to check if a path is invalid/needs to be blocked with a 404 JSON response
  const isInvalidEndpoint = (path: string): boolean => {
    // 1. Is it an invalid API path?
    if (path === '/api' || path.startsWith('/api/')) {
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
      return !validApiEndpoints.includes(cleanPath);
    }

    // 2. Is it a GraphQL path?
    if (
      path === '/graphql' ||
      path.startsWith('/graphql/') ||
      path.endsWith('/graphql') ||
      path.includes('/graphql')
    ) {
      return true;
    }

    // 3. Is it an internal systems path?
    if (path === '/_internal' || path.startsWith('/_internal/') || path.includes('/_internal')) {
      return true;
    }

    return false;
  };

  if (isInvalidEndpoint(pathname)) {
    const origin = getCorsOrigin(context.request);
    const corsHeaders = getCorsHeaders(origin, 'application/json', 'GET, POST, OPTIONS');

    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders as HeadersInit,
      });
    }

    return new Response(
      JSON.stringify({
        error: 'Not found',
        status: 404,
        message: `Endpoint ${url.pathname} does not exist.`,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'X-Robots-Tag': 'noindex, nofollow',
        } as HeadersInit,
      }
    );
  }

  const response = await context.next();

  // Handle responses with 304, 204 or 1xx statuses which cannot have a body per HTTP spec.
  const hasNoBody =
    response.status === 204 ||
    response.status === 304 ||
    (response.status >= 100 && response.status < 200);

  const contentType = response.headers.get('Content-Type') || '';
  const newResponse = new Response(hasNoBody ? null : response.body, response);

  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');

  // Explicitly tell search engines to index and follow links on all valid 200 OK HTML pages.
  // For non-HTML responses (API, assets) or non-200 responses (404, 410, 5xx), use noindex to prevent indexing.
  const isHtml = contentType.includes('text/html');
  const isOkStatus = response.status >= 200 && response.status < 300;

  if (url.pathname === '/sw.js' || url.pathname.endsWith('/sw.js')) {
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (isHtml) {
    newResponse.headers.set('Cache-Control', 'no-cache, must-revalidate');

    // General route check for ALL HTML routes (including localized and blog/compare routes)
    const cleanPath = pathname.replace(/^\//, '').replace(/\/$/, '');

    // Set correct Content-Language header based on route prefix
    const pathSegments = cleanPath.split('/');
    const firstSegment = pathSegments[0] as SupportedLocale;
    const detectedLocale = NON_DEFAULT_LOCALES.has(firstSegment) ? firstSegment : 'en';
    newResponse.headers.set('Content-Language', detectedLocale);

    const isValidRoute = checkValidRoute(cleanPath);

    // CRITICAL SEO FIX:
    // If route is NOT valid OR upstream response status is not 2xx OK (e.g. 404, 410, 500, 502):
    // X-Robots-Tag MUST ALWAYS be 'noindex, nofollow' (NEVER index, follow on 404 or error pages)
    if (!isValidRoute || !isOkStatus) {
      newResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
      // If the route was invalid and Cloudflare Pages returned a 200 status (e.g. SPA fallback), force 404
      if (!isValidRoute && isOkStatus) {
        return new Response(hasNoBody ? null : response.body, {
          status: 404,
          statusText: 'Not Found',
          headers: newResponse.headers,
        });
      }
      return newResponse;
    }

    // Only valid routes with 2xx status codes get index, follow
    newResponse.headers.set('X-Robots-Tag', 'index, follow');
  } else if (contentType.includes('application/json') || url.pathname.startsWith('/api/')) {
    newResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (!isOkStatus) {
    // Non-200 responses on any other resource must also have noindex, nofollow
    newResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  newResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  newResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Content-Security-Policy — supports Google AdSense, GA4/GTM analytics, and font resources
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://static.cloudflareinsights.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://ep2.adtrafficquality.google https://googleads.g.doubleclick.net https://*.doubleclick.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' blob: data: https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://launchbuff.com https://launchstag.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://tpc.googlesyndication.com",
    "connect-src 'self' blob: https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.doubleclick.net https://static.cloudflareinsights.com https://generativelanguage.googleapis.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://ep2.adtrafficquality.google https://googleads.g.doubleclick.net",
    "frame-src 'self' https://googleads.g.doubleclick.net https://*.doubleclick.net https://tpc.googlesyndication.com https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://*.googlesyndication.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];
  newResponse.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return newResponse;
  } catch (fatalErr) {
    console.error('[Middleware] Unhandled exception in middleware, falling back to context.next():', fatalErr);
    return context.next();
  }
};
