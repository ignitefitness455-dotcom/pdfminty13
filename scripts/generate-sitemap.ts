import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL, TOOLS, ToolSEOInfo } from '../src/config/seo-data';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  I18N_TOOL_SLUGS,
  isI18nToolSlug,
  getHreflangs,
  HreflangEntry,
} from '../src/i18n/config';
import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
  imageLoc?: string;
  title?: string;
  caption?: string;
  hreflangs?: HreflangEntry[];
}

function buildUrlsetXml(entries: SitemapUrlEntry[]): string {
  const xmlUrls = entries
    .map((entry) => {
      const xhtmlLinks =
        entry.hreflangs && entry.hreflangs.length > 0
          ? entry.hreflangs
              .map(
                (h) =>
                  `    <xhtml:link rel="alternate" hreflang="${escapeXml(h.hreflang)}" href="${escapeXml(h.href)}"/>`
              )
              .join('\n') + '\n'
          : '';

      const imageXml = entry.imageLoc
        ? `    <image:image>
      <image:loc>${escapeXml(entry.imageLoc)}</image:loc>
      <image:title>${escapeXml(entry.title || 'PdfMinty')}</image:title>
      <image:caption>${escapeXml(entry.caption || '')}</image:caption>
    </image:image>`
        : '';

      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
${xhtmlLinks}${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''}    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imageXml ? '\n' + imageXml : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlUrls}
</urlset>`;
}

function buildSitemapIndexXml(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const sitemapElements = sitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>${s.lastmod ? `\n    <lastmod>${s.lastmod}</lastmod>` : ''}
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
}

export interface SitemapGenerationResult {
  sitemapXml: string;
  sitemaps: Record<string, string>;
}

export function generateSitemapXml(): SitemapGenerationResult {
  const baseUrl = SITE_URL.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD at build time

  // 1. Static Core Pages (sitemap-pages.xml)
  const staticRoutes: Array<{ path: string; priority: string; changefreq: string; lastmod?: string; isI18n?: boolean }> = [
    { path: '/', priority: '1.0', changefreq: 'daily', isI18n: true, lastmod: today },
    { path: '/blog/', priority: '0.9', changefreq: 'daily', lastmod: today },
    { path: '/adobe-acrobat-alternative/', priority: '0.8', changefreq: 'weekly', lastmod: '2026-08-08' },
    { path: '/about-us/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-08-08' },
    { path: '/contact/', priority: '0.5', changefreq: 'monthly', lastmod: '2026-08-08' },
    { path: '/privacy-policy/', priority: '0.3', changefreq: 'monthly', lastmod: '2026-08-08' },
    { path: '/terms-of-service/', priority: '0.3', changefreq: 'monthly', lastmod: '2026-08-08' },
  ];

  const homepageHreflangs = getHreflangs('', baseUrl);

  const pageEntries: SitemapUrlEntry[] = [];
  
  for (const route of staticRoutes) {
    const slashedPath = route.path === '' ? '/' : (route.path.endsWith('/') ? route.path : `${route.path}/`);
    const loc = `${baseUrl}${slashedPath.startsWith('/') ? slashedPath : `/${slashedPath}`}`;
    
    pageEntries.push({
      loc,
      lastmod: route.lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
      imageLoc: `${baseUrl}/og-image.png`,
      title: 'PdfMinty — Free Privacy-First PDF Toolkit',
      caption: 'Free in-browser PDF utilities with zero server uploads',
      hreflangs: route.isI18n ? homepageHreflangs : undefined,
    });

    // Add localized versions of homepage to sitemap-pages.xml
    if (route.isI18n) {
      for (const locLang of SUPPORTED_LOCALES) {
        if (locLang !== DEFAULT_LOCALE) {
          pageEntries.push({
            loc: `${baseUrl}/${locLang}/`,
            lastmod: route.lastmod,
            changefreq: route.changefreq,
            priority: route.priority,
            imageLoc: `${baseUrl}/og-image.png`,
            title: `PdfMinty [${locLang.toUpperCase()}] — Free Privacy-First PDF Toolkit`,
            caption: 'Free in-browser PDF utilities with zero server uploads',
            hreflangs: homepageHreflangs,
          });
        }
      }
    }
  }

  // 2. Tools and localized tools (sitemap-tools.xml)
  // 3. Blog articles and comparison guides (sitemap-blog.xml)
  const toolEntries: SitemapUrlEntry[] = [];
  const blogEntries: SitemapUrlEntry[] = [];

  const addedPaths = new Set<string>();
  staticRoutes.forEach((r) => {
    const clean = r.path.replace(/^\//, '').replace(/\/$/, '');
    addedPaths.add(clean ? `/${clean}/` : '/');
  });

  for (const item of TOOLS as ToolSEOInfo[]) {
    const rawSlug = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
    const cleanSlug = item.slug.replace(/^\//, '').replace(/\/$/, '');

    // Skip static pages handled in sitemap-pages
    const isStaticPage = ['about-us', 'contact', 'privacy-policy', 'terms-of-service', 'blog', 'adobe-acrobat-alternative'].includes(cleanSlug);
    if (isStaticPage) {
      continue;
    }

    const slashedSlug = rawSlug.endsWith('/') ? rawSlug : `${rawSlug}/`;
    const loc = `${baseUrl}${slashedSlug}`;
    const isBlogOrCompare = cleanSlug.startsWith('blog/') || cleanSlug.startsWith('compare/') || item.category === 'blog' || item.category === 'compare';

    const priority = isBlogOrCompare ? '0.8' : '0.9';
    const changefreq = 'weekly';
    const lastmod = item.dateModified || item.datePublished;
    const ogImage = item.ogImage
      ? (item.ogImage.startsWith('http') ? item.ogImage : `${baseUrl}${item.ogImage.startsWith('/') ? item.ogImage : `/${item.ogImage}`}`)
      : `${baseUrl}/og-image.png`;

    const toolHreflangs = isI18nToolSlug(cleanSlug) ? getHreflangs(cleanSlug, baseUrl) : undefined;

    const entry: SitemapUrlEntry = {
      loc,
      lastmod,
      changefreq,
      priority,
      imageLoc: ogImage,
      title: item.metaTitle || item.name || item.h1 || 'PdfMinty Tool',
      caption: item.shortDescription || `${item.name} PDF tool`,
      hreflangs: toolHreflangs,
    };

    if (!addedPaths.has(rawSlug)) {
      addedPaths.add(rawSlug);
      if (isBlogOrCompare) {
        blogEntries.push(entry);
      } else {
        toolEntries.push(entry);
      }
    }

    // Add localized tool versions (e.g. /bn/merge-pdf/)
    if ((I18N_TOOL_SLUGS as readonly string[]).includes(cleanSlug)) {
      for (const locLang of SUPPORTED_LOCALES) {
        if (locLang !== DEFAULT_LOCALE) {
          const localizedPath = `/${locLang}/${cleanSlug}`;
          if (!addedPaths.has(localizedPath)) {
            addedPaths.add(localizedPath);
            const localizedLoc = `${baseUrl}${localizedPath}/`;
            toolEntries.push({
              loc: localizedLoc,
              lastmod,
              changefreq,
              priority,
              imageLoc: ogImage,
              title: item.metaTitle || item.name || item.h1 || 'PdfMinty Tool',
              caption: item.shortDescription || `${item.name} PDF tool`,
              hreflangs: toolHreflangs,
            });
          }
        }
      }
    }
  }

  const sitemapPagesXml = buildUrlsetXml(pageEntries);
  const sitemapToolsXml = buildUrlsetXml(toolEntries);
  const sitemapBlogXml = buildUrlsetXml(blogEntries);

  // Master Sitemap Index
  const sitemapIndexXml = buildSitemapIndexXml([
    { loc: `${baseUrl}/sitemap-tools.xml` },
    { loc: `${baseUrl}/sitemap-blog.xml` },
    { loc: `${baseUrl}/sitemap-pages.xml` },
  ]);

  const sitemaps: Record<string, string> = {
    'sitemap.xml': sitemapIndexXml,
    'sitemap-tools.xml': sitemapToolsXml,
    'sitemap-blog.xml': sitemapBlogXml,
    'sitemap-pages.xml': sitemapPagesXml,
  };

  return {
    sitemapXml: sitemapIndexXml,
    sitemaps,
  };
}

async function run(): Promise<void> {
  const publicDir = path.join(__dirname, '../public');
  const distDir = path.join(__dirname, '../dist');

  const { sitemaps } = generateSitemapXml();

  const targets = [publicDir, distDir];

  for (const dir of targets) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (const [filename, content] of Object.entries(sitemaps)) {
      fs.writeFileSync(path.join(dir, filename), content, 'utf8');
      logger.info(`Generated ${filename} in ${dir}`);
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.ts')) {
  run().catch((err) => {
    logger.error('Failed to generate sitemaps:', err);
    process.exit(1);
  });
}


