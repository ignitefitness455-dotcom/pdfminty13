/**
 * PdfMinty Service Worker.
 *
 * Strategy:
 * - Static hashed assets (JS/CSS/fonts/images with /assets/* path or hashed filenames):
 *   cache-first, stale-while-revalidate. These are immutable so safe to cache.
 * - HTML navigations: network-first with cached /index.html fallback. This
 *   gives users up-to-date HTML on reload while still working offline.
 * - Everything else (including PDFs, blob:, data:): bypass cache entirely.
 *   PDF blobs must NEVER be cached — they can be hundreds of MB and would
 *   blow the cache quota.
 *
 * Cache version is bumped on every build via the VITE_SW_VERSION env var.
 * In development this defaults to 'dev'.
 */

/**
 * @typedef {undefined} __SW_CACHE_VERSION__
 * Injected at build time by vite.config.ts injectSwVersion plugin.
 * Falls back to 'dev-' + Date.now() in development.
 */

// SW cache version. In production builds, vite.config.ts injects a unique
// build timestamp via the `injectSwVersion` plugin (writeBundle hook).
// In dev, the placeholder falls back to 'dev' to prevent constant worker updates.
const SW_CACHE_VERSION = '__SW_CACHE_VERSION__'.startsWith('__')
  ? 'dev'
  : '__SW_CACHE_VERSION__';
const STATIC_CACHE = `pdfminty-static-${SW_CACHE_VERSION}`;
const RUNTIME_CACHE = `pdfminty-runtime-${SW_CACHE_VERSION}`;

// Only cache GET requests to same-origin assets that match these patterns.
// Note: .map (source maps) intentionally excluded — don't cache them in production.
const STATIC_ASSET_PATTERN = /\.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|avif|gif|ico)$/i;
const STATIC_PATH_PATTERN = /^\/(?:assets|fonts|icons)\//i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Use allSettled so a single 404 doesn't fail the entire install.
      await Promise.allSettled([
        cache.add('/index.html'),
        cache.add('/manifest.json'),
        cache.add('/logo.svg'),
      ]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.endsWith(SW_CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Bypass Service Worker completely in development to avoid caching or stale dynamic import bugs
  if (SW_CACHE_VERSION.startsWith('dev')) return;

  // Only handle GET. POST/PUT/etc always go to network.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only. Cross-origin (e.g. googleapis.com) bypasses SW.
  if (url.origin !== self.location.origin) return;

  // Never cache blob: or data: URLs (these include PDF blob URLs created
  // for download links — caching them would blow the quota).
  if (url.protocol === 'blob:' || url.protocol === 'data:') return;

  // Never cache API requests.
  if (url.pathname.startsWith('/api/')) return;

  // Never cache PDF responses — critical for a PDF-tool site.
  if (url.pathname.toLowerCase().endsWith('.pdf')) return;

  // Navigation requests (HTML page loads): network-first with app-shell fallback.
  // Cache each navigation URL under its own key (not all under '/index.html')
  // so pre-rendered per-route HTML (from generate-static-pages.js) is preserved.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Cache the response under the request URL so each route has its own entry.
          const runtimeCache = await caches.open(RUNTIME_CACHE);
          runtimeCache.put(request.url, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          // Offline: try the exact URL first (pre-rendered or previously visited).
          const runtimeCache = await caches.open(RUNTIME_CACHE);
          const exactMatch = await runtimeCache.match(request.url);
          if (exactMatch) return exactMatch;

          // Fall back to the app shell from STATIC_CACHE (installed at SW install).
          const staticCache = await caches.open(STATIC_CACHE);
          const shellMatch = await staticCache.match('/index.html');
          if (shellMatch) return shellMatch;

          // Last resort: any cached navigation response.
          const anyNav = await runtimeCache.match('/index.html');
          if (anyNav) return anyNav;

          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static hashed assets: cache-first, revalidate in background.
  const isStaticAsset =
    STATIC_ASSET_PATTERN.test(url.pathname) || STATIC_PATH_PATTERN.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          try {
            const response = await fetch(request);
            const contentType = response?.headers?.get('Content-Type') || '';
            if (response && response.status === 200 && !contentType.toLowerCase().includes('text/html')) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          } catch (fetchErr) {
            // Fallback: fetch using just the URL string to bypass sandboxed/iframe request constraints
            const response = await fetch(request.url);
            const contentType = response?.headers?.get('Content-Type') || '';
            if (response && response.status === 200 && !contentType.toLowerCase().includes('text/html')) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          }
        } catch (error) {
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Everything else: just go to network.
});

// Allow page to trigger immediate activation on update.
// Accept both string ('SKIP_WAITING') and object ({ type: 'SKIP_WAITING' })
// message formats for backwards compatibility.
self.addEventListener('message', (event) => {
  const data = event.data;
  const isSkipWaiting =
    data === 'SKIP_WAITING' ||
    (typeof data === 'object' && data !== null && data.type === 'SKIP_WAITING');
  if (isSkipWaiting) {
    self.skipWaiting();
  }
});
