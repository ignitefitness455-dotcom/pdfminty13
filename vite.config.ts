import { visualizer } from 'rollup-plugin-visualizer';
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
    configureServer(server: {
      middlewares: {
        use: (
          route: string,
          handler: (
            req: import('node:http').IncomingMessage,
            res: import('node:http').ServerResponse,
            next: () => void
          ) => void | Promise<void>
        ) => void;
      };
    }) {
      server.middlewares.use('/api/subscribe', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { email, name } = JSON.parse(body || '{}') as { email?: string; name?: string };
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
                      body: JSON.stringify({
                        email,
                        first_name: name || undefined,
                        unsubscribed: false,
                      }),
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
              console.log(
                '[dev-api] /api/subscribe received (Set RESEND_API_KEY in .env to send via Resend)'
              );
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

      server.middlewares.use('/api/gemini-proxy', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { textContent, query, mode, messages, imagesBase64, language } = JSON.parse(
              body || '{}'
            ) as {
              textContent?: string;
              query?: string;
              mode?: string;
              messages?: { role?: string; content?: string }[];
              imagesBase64?: unknown[];
              language?: string;
            };
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: 'Server Gemini API key is not configured. Please set GEMINI_API_KEY.',
                })
              );
              return;
            }

            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            let systemInstruction =
              'You are PdfMinty AI Assistant, an elite document intelligence and PDF chat system powered by Gemini. You analyze uploaded PDF documents accurately to answer user questions, explain specific clauses, summarize key points, extract structured data and financial tables into Markdown format, and provide clear explanations. If asked in Bengali (বাংলা), answer naturally in Bengali. Always cite page numbers or sections when available. When extracting data or numbers, format them cleanly as Markdown tables.';

            let promptContent:
              | string
              | { parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] } =
              '';

            if (mode === 'ocr') {
              const langHint =
                typeof language === 'string' && language.trim() && language !== 'auto'
                  ? ` Primary document language hint: ${language.trim().slice(0, 16)}.`
                  : '';
              systemInstruction =
                `You are an expert Document Parsing & OCR engine. Your sole task is to transcribe the provided scanned PDF page image into high-fidelity, cleanly structured Markdown. Preserve headers (#, ##), lists, bold, italics, and format all tables accurately as Markdown tables (| col |). Do not include conversational introductory or concluding text.${langHint}`;
              const parts: (
                | { text: string }
                | { inlineData: { mimeType: string; data: string } }
              )[] = [
                {
                  text: `Transcribe this document image accurately into well-formatted Markdown:${langHint}`,
                },
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
              promptContent = { parts };
            } else if (mode === 'summary') {
              const truncated = typeof textContent === 'string' ? textContent.slice(0, 40000) : '';
              promptContent = `Please analyze and summarize the following document content. Provide an Executive Summary, Key Highlights, Crucial Sections/Clauses, and Important Data/Deadlines:\n\nDOCUMENT CONTENT:\n${truncated}`;
            } else if (mode === 'chat' && Array.isArray(messages) && messages.length > 0) {
              const truncated = typeof textContent === 'string' ? textContent.slice(0, 40000) : '';
              const historyText = messages
                .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || ''}`)
                .join('\n\n');
              promptContent = `DOCUMENT CONTEXT:\n${truncated}\n\nCONVERSATION HISTORY:\n${historyText}\n\nLATEST USER QUERY:\n${query || messages[messages.length - 1]?.content || ''}\n\nPlease respond directly to the latest query based on the document context and conversation history:`;
            } else {
              // 'qa' or standard query
              const truncated = typeof textContent === 'string' ? textContent.slice(0, 40000) : '';
              promptContent = `Use the provided document text to answer the user's specific query.\n\nUSER SPECIFIC QUERY:\n${query}\n\nDOCUMENT TEXT CONTEXT:\n${truncated}`;
            }

            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            const response = await ai.models.generateContent({
              model: modelName,
              contents: promptContent,
              config: {
                systemInstruction,
                temperature: mode === 'ocr' ? 0.1 : 0.3,
              },
            });

            const resultText = response.text || '';
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                result: resultText,
              })
            );
          } catch (apiErr: unknown) {
            const rawErrMsg =
              apiErr instanceof Error ? apiErr.message : 'Failed to process AI document query.';
            const configuredKey = process.env.GEMINI_API_KEY;
            const safeErrMsg =
              configuredKey && configuredKey.length >= 6
                ? rawErrMsg.split(configuredKey).join('[REDACTED_API_KEY]')
                : rawErrMsg;
            console.error('[dev-api] Gemini proxy error:', safeErrMsg);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: safeErrMsg,
              })
            );
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
        const { generateSitemapXml } = await import('./scripts/generate-sitemap.ts');
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

export default defineConfig(({ command, mode }) => {
  const isProdBuild = command === 'build' || mode === 'production';
  if (isProdBuild) {
    process.env.NODE_ENV = 'production';
  }

  return {
    define: isProdBuild
      ? {
          'process.env.NODE_ENV': JSON.stringify('production'),
        }
      : undefined,
    esbuild: isProdBuild
      ? {
          jsxDev: false,
        }
      : undefined,
    plugins: [
      react(),
      injectSwVersion(),
      devApiPlugin(),
      generateSitemapPlugin(),
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
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
        resolveDependencies: (_filename, deps) => {
          // Prevent preloading non-critical chunks on initial load (PDF engines, Firebase, heavy SEO data, non-English locales)
          return deps.filter((dep) => {
            if (
              dep.includes('vendor-pdf') ||
              dep.includes('vendor-fontkit') ||
              dep.includes('vendor-jszip') ||
              dep.includes('vendor-firebase') ||
              dep.includes('app-seo-data') ||
              dep.includes('locales-de') ||
              dep.includes('locales-fr') ||
              dep.includes('locales-es') ||
              dep.includes('locales-bn') ||
              dep.includes('locales-hi') ||
              dep.includes('locales-zh') ||
              dep.includes('-articles')
            ) {
              return false;
            }
            return true;
          });
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Granular PDF processing engines
              if (id.includes('@pdf-lib/fontkit')) {
                return 'vendor-fontkit';
              }
              if (id.includes('pdfjs-dist')) {
                return 'vendor-pdfjs';
              }
              if (id.includes('jszip')) {
                return 'vendor-jszip';
              }
              if (id.includes('@cantoo/pdf-lib') || id.includes('pdf-lib')) {
                return 'vendor-pdf-lib';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('i18next') || id.includes('react-i18next')) {
                return 'vendor-i18n';
              }
              if (id.includes('firebase') || id.includes('@firebase')) {
                return 'vendor-firebase';
              }
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router') ||
                id.includes('scheduler')
              ) {
                return 'vendor-react';
              }
              if (id.includes('signature_pad')) {
                return 'vendor-sigpad';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
            }

          // Separate article bodies from general UI localization so initial common.json stays <115KB
          if (id.includes('articles-body.json')) {
            const match = id.match(/\/locales\/([a-z]{2})\//);
            return match ? `locales-${match[1]}-articles` : 'locales-articles';
          }

          // Per-locale chunking so users only download the language they need
          if (id.includes('/locales/de/')) return 'locales-de';
          if (id.includes('/locales/fr/')) return 'locales-fr';
          if (id.includes('/locales/es/')) return 'locales-es';
          if (id.includes('/locales/bn/')) return 'locales-bn';
          if (id.includes('/locales/hi/')) return 'locales-hi';
          if (id.includes('/locales/zh/')) return 'locales-zh';
          if (id.includes('/locales/en/')) return 'locales-en';

          // Separate lightweight catalog from heavy longFormBody SEO data
          if (id.includes('/src/config/seo-catalog')) {
            return 'app-seo-catalog';
          }
          if (id.includes('/src/config/seo-data')) {
            return 'app-seo-data';
          }
          return undefined;
        },
      },
    },
  },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: false,
      watch: {
        ignored: ['**/dist/**', '**/public/sitemap*.xml', '**/public/og-*.png'],
      },
    },
    worker: {
      format: 'es',
    },
  };
});
