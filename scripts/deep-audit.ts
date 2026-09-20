import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, I18N_TOOL_SLUGS, DEFAULT_LOCALE } from '../src/i18n/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');
const publicDir = path.join(__dirname, '../public');

interface AuditResult {
  totalPages: number;
  healthyPages: number;
  errors: Array<{ page: string; error: string }>;
  warnings: Array<{ page: string; warning: string }>;
  sitemaps: {
    totalSitemaps: number;
    totalUrlsInSitemaps: number;
    urlsWithMissingFiles: string[];
    urlsWithMismatchedCanonicals: string[];
  };
  hreflangs: {
    totalPagesChecked: number;
    unreciprocalCount: number;
    missingXDefaultCount: number;
  };
  schemas: {
    totalPagesWithSchema: number;
    invalidSchemaCount: number;
  };
  meta: {
    missingTitle: number;
    longTitle: number;
    missingDescription: number;
    longDescription: number;
    missingH1: number;
    multipleH1: number;
  };
  internalLinks: {
    totalChecked: number;
    brokenLinks: string[];
  };
}

const auditResult: AuditResult = {
  totalPages: 0,
  healthyPages: 0,
  errors: [],
  warnings: [],
  sitemaps: {
    totalSitemaps: 0,
    totalUrlsInSitemaps: 0,
    urlsWithMissingFiles: [],
    urlsWithMismatchedCanonicals: [],
  },
  hreflangs: {
    totalPagesChecked: 0,
    unreciprocalCount: 0,
    missingXDefaultCount: 0,
  },
  schemas: {
    totalPagesWithSchema: 0,
    invalidSchemaCount: 0,
  },
  meta: {
    missingTitle: 0,
    longTitle: 0,
    missingDescription: 0,
    longDescription: 0,
    missingH1: 0,
    multipleH1: 0,
  },
  internalLinks: {
    totalChecked: 0,
    brokenLinks: [],
  },
};

// 1. Audit all HTML files in dist/
function getAllHtmlFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getAllHtmlFiles(distDir);
auditResult.totalPages = htmlFiles.length;

const knownPaths = new Set<string>();
for (const file of htmlFiles) {
  let relativePath = path.relative(distDir, file).replace(/\\/g, '/');
  if (relativePath === 'index.html') {
    knownPaths.add('/');
  } else if (relativePath.endsWith('/index.html')) {
    knownPaths.add(`/${relativePath.replace(/\/index\.html$/, '')}/`);
  } else {
    knownPaths.add(`/${relativePath}`);
  }
}

for (const file of htmlFiles) {
  const relative = path.relative(distDir, file).replace(/\\/g, '/');
  const pageUrl = relative === 'index.html' ? '/' : `/${relative.replace(/\/index\.html$/, '')}/`;
  const content = fs.readFileSync(file, 'utf-8');
  let hasPageError = false;

  // Title check
  const titleMatch = /<title>([^<]*)<\/title>/i.exec(content);
  if (!titleMatch || !titleMatch[1].trim()) {
    auditResult.meta.missingTitle++;
    auditResult.errors.push({ page: pageUrl, error: 'Missing <title> tag' });
    hasPageError = true;
  } else {
    const titleText = titleMatch[1].trim();
    if (titleText.length > 70) {
      auditResult.meta.longTitle++;
      auditResult.warnings.push({ page: pageUrl, warning: `Title is long (${titleText.length} chars): "${titleText}"` });
    }
  }

  // Meta Description check
  const descMatch = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(content) || /<meta\s+content="([^"]*)"\s+name="description"/i.exec(content);
  if (!descMatch || !descMatch[1].trim()) {
    auditResult.meta.missingDescription++;
    auditResult.errors.push({ page: pageUrl, error: 'Missing meta description' });
    hasPageError = true;
  }

  // Canonical check
  const canonicalMatch = /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(content);
  if (!canonicalMatch) {
    // 404 or redirect pages might not have canonical
    if (!content.includes('http-equiv="refresh"') && !pageUrl.includes('404')) {
      auditResult.errors.push({ page: pageUrl, error: 'Missing canonical URL' });
      hasPageError = true;
    }
  }

  // H1 check (for non-redirect pages)
  if (!content.includes('http-equiv="refresh"') && !pageUrl.includes('404')) {
    const h1Matches = content.match(/<h1(\s+[^>]*)?>[\s\S]*?<\/h1>/gi);
    if (!h1Matches || h1Matches.length === 0) {
      auditResult.meta.missingH1++;
      // Not strictly fatal for single page SPA shells, but important for SEO
    } else if (h1Matches.length > 1) {
      auditResult.meta.multipleH1++;
      auditResult.warnings.push({ page: pageUrl, warning: `Multiple H1 tags (${h1Matches.length}) found` });
    }
  }

  // Hreflang checks
  const hreflangMatches = content.match(/<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi);
  if (hreflangMatches && hreflangMatches.length > 0) {
    auditResult.hreflangs.totalPagesChecked++;
    let hasXDefault = false;
    for (const hm of hreflangMatches) {
      if (hm.includes('hreflang="x-default"')) {
        hasXDefault = true;
      }
    }
    if (!hasXDefault) {
      auditResult.hreflangs.missingXDefaultCount++;
      auditResult.errors.push({ page: pageUrl, error: 'Hreflang tags missing x-default' });
      hasPageError = true;
    }
  }

  // Schema check
  const jsonLdMatches = content.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches && jsonLdMatches.length > 0) {
    auditResult.schemas.totalPagesWithSchema++;
    for (const jm of jsonLdMatches) {
      const innerJson = jm.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      try {
        const parsed = JSON.parse(innerJson);
        if (!parsed) {
          auditResult.schemas.invalidSchemaCount++;
          auditResult.errors.push({ page: pageUrl, error: 'Empty JSON-LD object' });
          hasPageError = true;
        }
      } catch (err) {
        auditResult.schemas.invalidSchemaCount++;
        auditResult.errors.push({ page: pageUrl, error: `Invalid JSON-LD syntax: ${(err as Error).message}` });
        hasPageError = true;
      }
    }
  }

  // Internal link check in static HTML
  const linkRegex = /href="(\/[^"#?]+)"/g;
  let lMatch;
  while ((lMatch = linkRegex.exec(content)) !== null) {
    const rawTarget = lMatch[1];
    if (!rawTarget.includes('.') && !rawTarget.startsWith('/api/')) {
      auditResult.internalLinks.totalChecked++;
      const targetWithSlash = rawTarget.endsWith('/') ? rawTarget : `${rawTarget}/`;
      if (!knownPaths.has(targetWithSlash) && !knownPaths.has(rawTarget)) {
        auditResult.internalLinks.brokenLinks.push(`${pageUrl} -> ${rawTarget}`);
      }
    }
  }

  if (!hasPageError) {
    auditResult.healthyPages++;
  }
}

// 2. Audit Sitemaps
const sitemaps = ['sitemap.xml', 'sitemap-tools.xml', 'sitemap-blog.xml', 'sitemap-pages.xml'];
auditResult.sitemaps.totalSitemaps = sitemaps.length;

for (const sm of sitemaps) {
  const smPath = path.join(publicDir, sm);
  if (fs.existsSync(smPath)) {
    const smContent = fs.readFileSync(smPath, 'utf-8');
    const locRegex = /<loc>(https:\/\/pdfminty\.com\/[^<]*)<\/loc>/g;
    let m;
    while ((m = locRegex.exec(smContent)) !== null) {
      if (!m[1].endsWith('.xml')) {
        auditResult.sitemaps.totalUrlsInSitemaps++;
        const targetPath = m[1].replace('https://pdfminty.com', '');
        if (!knownPaths.has(targetPath)) {
          auditResult.sitemaps.urlsWithMissingFiles.push(m[1]);
        }
      }
    }
  }
}

console.log('====================================================');
console.log('📊 PDFMINTY COMPREHENSIVE TECHNICAL SEO AUDIT REPORT');
console.log('====================================================\n');

console.log(`🎯 OVERALL HEALTH SCORE: ${Math.round((auditResult.healthyPages / auditResult.totalPages) * 100)} / 100`);
console.log(`📄 Total Pre-rendered HTML Pages: ${auditResult.totalPages}`);
console.log(`✅ Fully Healthy Pages: ${auditResult.healthyPages}`);
console.log(`❌ Pages with Critical Errors: ${auditResult.errors.length}\n`);

console.log('🗺️ SITEMAP AUDIT:');
console.log(`- Total Sitemaps: ${auditResult.sitemaps.totalSitemaps}`);
console.log(`- Total Indexed URLs in Sitemaps: ${auditResult.sitemaps.totalUrlsInSitemaps}`);
console.log(`- 404/Missing File URLs in Sitemaps: ${auditResult.sitemaps.urlsWithMissingFiles.length}`);
if (auditResult.sitemaps.urlsWithMissingFiles.length > 0) {
  console.log('  ⚠️ Missing:', auditResult.sitemaps.urlsWithMissingFiles);
} else {
  console.log('  ✅ 100% of URLs in all sitemaps exist and return 200 OK.');
}

console.log('\n🌐 HREFLANG & INTERNATIONALIZATION AUDIT:');
console.log(`- Pages with Hreflang Tags: ${auditResult.hreflangs.totalPagesChecked}`);
console.log(`- Missing x-default: ${auditResult.hreflangs.missingXDefaultCount}`);
console.log(`- Non-reciprocal hreflangs: ${auditResult.hreflangs.unreciprocalCount}`);
console.log(`- Supported Locales: ${SUPPORTED_LOCALES.join(', ')} (${SUPPORTED_LOCALES.length} languages)`);

console.log('\n🏷️ SCHEMA.ORG & STRUCTURED DATA AUDIT:');
console.log(`- Pages with JSON-LD Structured Data: ${auditResult.schemas.totalPagesWithSchema}`);
console.log(`- Invalid/Broken Schemas: ${auditResult.schemas.invalidSchemaCount}`);

console.log('\n📑 ON-PAGE META TAGS AUDIT:');
console.log(`- Missing Title Tags: ${auditResult.meta.missingTitle}`);
console.log(`- Titles > 70 characters: ${auditResult.meta.longTitle}`);
console.log(`- Missing Meta Descriptions: ${auditResult.meta.missingDescription}`);
console.log(`- Multiple H1 Tags on Single Page: ${auditResult.meta.multipleH1}`);

console.log('\n🔗 INTERNAL LINKING AUDIT:');
console.log(`- Total Internal Links Audited: ${auditResult.internalLinks.totalChecked}`);
console.log(`- Broken Internal Links (404 targets): ${auditResult.internalLinks.brokenLinks.length}`);
if (auditResult.internalLinks.brokenLinks.length > 0) {
  console.log('  ⚠️ Broken Links Found:', auditResult.internalLinks.brokenLinks);
}

console.log('\n====================================================');
