import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Custom plugin: inject SW cache version at build time.
 *
 * - In dev: `public/sw.js` is served as-is; the placeholder
 *   `__SW_CACHE_VERSION__` falls back to `'dev-' + Date.now()` so each
 *   page reload gets a fresh cache (acceptable for dev).
 * - In production build: after Vite copies `public/sw.js` to `dist/sw.js`,
 *   the `writeBundle` hook reads the file, replaces the placeholder with a
 *   unique build version (timestamp + short hash), and writes it back.
 *   This guarantees every deploy ships a unique SW cache version without
 *   requiring manual bumping.
 *
 * IMPORTANT: This plugin does NOT emit a separate `sw.js` (which would
 * overwrite the real one). It only transforms the existing copied file
 * in-place via writeBundle.
 */
function injectSwVersion() {
  const BUILD_VERSION = `build-${Date.now()}`;
  return {
    name: 'pdfminty-inject-sw-version',
    apply: 'build' as const,
    async writeBundle(options: { dir?: string }) {
      const outDir = options.dir;
      if (!outDir) return;
      const swPath = resolve(outDir, 'sw.js');
      try {
        const content = readFileSync(swPath, 'utf-8');
        const updated = content.replaceAll('__SW_CACHE_VERSION__', BUILD_VERSION);
        
        try {
          const esbuild = await import('esbuild');
          const minified = await esbuild.transform(updated, { minify: true, loader: 'js' });
          writeFileSync(swPath, minified.code, 'utf-8');
          console.log(`[pdfminty] SW cache version injected and minified: ${BUILD_VERSION}`);
        } catch (e) {
          console.error('[pdfminty] Failed to minify sw.js:', e);
          writeFileSync(swPath, updated, 'utf-8');
        }
      } catch {
        // sw.js may not exist if public/ is empty; safe to ignore.
      }
    },
  };
}

function devApiPlugin() {
  return {
    name: 'pdfminty-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/api/subscribe', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { email, name } = JSON.parse(body || '{}');
            const apiKey = process.env.RESEND_API_KEY;
            const audienceId = process.env.RESEND_AUDIENCE_ID;
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

            if (!email) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Email address is required.' }));
              return;
            }

            let resendSuccess = false;
            if (apiKey) {
              try {
                const contactsBody: Record<string, unknown> = { email, unsubscribed: false };
                if (name) contactsBody.first_name = name;
                if (audienceId) contactsBody.audience_id = audienceId;

                const contactRes = await fetch('https://api.resend.com/contacts', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(contactsBody),
                });

                if (contactRes.ok) {
                  resendSuccess = true;
                } else if (audienceId) {
                  const audRes = await fetch(
                    `https://api.resend.com/audiences/${audienceId}/contacts`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email, first_name: name || undefined, unsubscribed: false }),
                    }
                  );
                  if (audRes.ok) resendSuccess = true;
                }
              } catch (e) {
                console.error('[dev-api] Resend audience error:', e);
              }

              try {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: fromEmail,
                    to: [email],
                    subject: 'Welcome to PDFMinty Newsletter!',
                    html: `<p>Thank you for subscribing to PDFMinty newsletter!</p>`,
                  }),
                });
              } catch (e) {
                console.error('[dev-api] Welcome email error:', e);
              }
            } else {
              console.log('[dev-api] /api/subscribe received:', { email, name }, '(Set RESEND_API_KEY in .env to send via Resend)');
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                message: 'Thank you for joining!',
                delivered: resendSuccess,
              })
            );
          } catch (e) {
            console.error('[dev-api] error:', e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to process subscription.' }));
          }
        });
      });
    },
  };
}

function generateSitemapPlugin() {
  return {
    name: 'pdfminty-generate-sitemap',
    apply: 'build' as const,
    async writeBundle(options: { dir?: string }) {
      const outDir = options.dir || resolve(process.cwd(), 'dist');
      const publicDir = resolve(process.cwd(), 'public');
      try {
        const { generateSitemapXml } = await import('./scripts/generate-sitemap');
        const { sitemaps } = generateSitemapXml();

        [outDir, publicDir].forEach((dir) => {
          try {
            for (const [filename, content] of Object.entries(sitemaps)) {
              writeFileSync(resolve(dir, filename), content, 'utf-8');
            }
          } catch {
            // Ignore if directory doesn't exist
          }
        });
        console.log('[pdfminty] sitemap.xml and child sitemaps successfully generated.');
      } catch (err) {
        console.error('[pdfminty] Failed to generate sitemap during bundle build:', err);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    injectSwVersion(),
    devApiPlugin(),
    generateSitemapPlugin(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    cssMinify: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdf-lib') || id.includes('@cantoo/pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('jszip')) {
              return 'vendor-jszip';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            if (id.includes('fabric')) {
              return 'vendor-fabric';
            }
            if (id.includes('signature_pad')) {
              return 'vendor-sigpad';
            }
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  worker: {
    format: 'es',
  },
});
