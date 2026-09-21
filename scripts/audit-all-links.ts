import fs from 'fs';
import path from 'path';
import { ROUTES } from '../src/config/routes';
import { TOOLS } from '../src/config/seo-data';
import { SUPPORTED_LOCALES } from '../src/i18n/config';

console.log('🔍 Running Comprehensive Website Link Audit...');

// Build a set of all valid route paths in the application
const validPaths = new Set<string>();

// 1. All fixed routes
Object.values(ROUTES).forEach((route) => {
  const clean = route.startsWith('/') ? route : `/${route}`;
  validPaths.add(clean);
  if (!clean.endsWith('/')) validPaths.add(`${clean}/`);
  // Also localized paths for all supported locales
  SUPPORTED_LOCALES.forEach((locale) => {
    if (locale !== 'en') {
      const locClean = `/${locale}${clean.startsWith('/') ? clean : `/${clean}`}`;
      validPaths.add(locClean);
      if (!locClean.endsWith('/')) validPaths.add(`${locClean}/`);
    }
  });
});

// 2. All items from TOOLS
TOOLS.forEach((item) => {
  const slug = item.slug.startsWith('/') ? item.slug : `/${item.slug}`;
  validPaths.add(slug);
  validPaths.add(`${slug}/`);
  SUPPORTED_LOCALES.forEach((locale) => {
    if (locale !== 'en') {
      validPaths.add(`/${locale}${slug}`);
      validPaths.add(`/${locale}${slug}/`);
    }
  });
});

// 3. Root paths for all locales
SUPPORTED_LOCALES.forEach((locale) => {
  if (locale === 'en') {
    validPaths.add('/');
  } else {
    validPaths.add(`/${locale}/`);
    validPaths.add(`/${locale}`);
  }
});

// 4. Legacy redirects
const legacyRedirects = [
  '/about', '/about/', '/contact-us', '/contact-us/', '/privacy', '/privacy/',
  '/terms', '/terms/', '/tos', '/tos/', '/edit-metadata', '/edit-metadata/',
  '/intelligence', '/intelligence/', '/protect', '/protect/', '/unlock', '/unlock/',
  '/compress', '/compress/', '/compress-pdf', '/compress-pdf/', '/delete-pages', '/delete-pages/',
  '/extract-pages', '/extract-pages/', '/reorder', '/reorder/', '/watermark', '/watermark/',
  '/page-numbers', '/page-numbers/', '/add-blank', '/add-blank/', '/img-to-pdf', '/img-to-pdf/',
  '/pdf-to-img', '/pdf-to-img/', '/grayscale', '/grayscale/', '/flatten', '/flatten/',
  '/repair', '/repair/', '/sign', '/sign/', '/ocr', '/ocr/', '/sanitize', '/sanitize/',
  '/merge', '/merge/', '/split', '/split/', '/rotate', '/rotate/',
  '/jpg-to-pdf', '/jpg-to-pdf/', '/jpeg-to-pdf', '/jpeg-to-pdf/', '/png-to-pdf', '/png-to-pdf/',
  '/pdf-to-jpg', '/pdf-to-jpg/', '/pdf-to-jpeg', '/pdf-to-jpeg/', '/pdf-to-png', '/pdf-to-png/',
  '/pdfminty-vs-smallpdf', '/pdfminty-vs-smallpdf/', '/pdfminty-vs-ilovepdf', '/pdfminty-vs-ilovepdf/',
  '/switch-from-adobe-acrobat', '/switch-from-adobe-acrobat/',
  '/is-it-safe-to-upload-pdf-to-online-tools', '/is-it-safe-to-upload-pdf-to-online-tools/',
];
legacyRedirects.forEach((r) => validPaths.add(r));

console.log(`✅ Total valid URL paths registered: ${validPaths.size}`);

// Scan all files in src/ and public/ for internal hrefs and 'to' props
const scannedFiles: string[] = [];
function getFiles(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
        getFiles(full);
      }
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js|html)$/.test(entry.name)) {
      scannedFiles.push(full);
    }
  }
}

getFiles('src');
getFiles('public');

console.log(`📁 Scanning ${scannedFiles.length} source files for internal links...`);

const linkRegex = /(?:href|to)=["']([^"']+)["']/g;
const foundLinks = new Map<string, string[]>();
const brokenLinks: { file: string; link: string; reason: string }[] = [];
const workingLinks = new Set<string>();

for (const file of scannedFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const link = match[1];
    if (
      link.startsWith('/') &&
      !link.startsWith('//') &&
      !link.startsWith('/api') &&
      !link.startsWith('/logo') &&
      !link.startsWith('/og-') &&
      !link.startsWith('/icon') &&
      !link.startsWith('/manifest') &&
      !link.startsWith('/favicon') &&
      !link.endsWith('.svg') &&
      !link.endsWith('.png') &&
      !link.endsWith('.xml') &&
      !link.endsWith('.txt') &&
      !link.endsWith('.json') &&
      !link.endsWith('.webp')
    ) {
      if (!foundLinks.has(link)) {
        foundLinks.set(link, []);
      }
      foundLinks.get(link)!.push(file);
    }
  }
}

console.log(`🔗 Found ${foundLinks.size} unique internal link references.`);

for (const [link, files] of foundLinks.entries()) {
  const cleanLink = link.split('?')[0].split('#')[0];
  if (!cleanLink || cleanLink === '/') {
    workingLinks.add(link);
    continue;
  }
  const normalizedWithSlash = cleanLink.endsWith('/') ? cleanLink : `${cleanLink}/`;
  const normalizedWithoutSlash = cleanLink.replace(/\/$/, '');

  if (validPaths.has(normalizedWithSlash) || validPaths.has(normalizedWithoutSlash) || validPaths.has(cleanLink)) {
    workingLinks.add(link);
  } else {
    brokenLinks.push({
      file: files[0],
      link,
      reason: 'Path does not match any registered route, tool, article, or redirect',
    });
  }
}

console.log(`\n========================================`);
console.log(`📊 LINK AUDIT RESULTS`);
console.log(`========================================`);
console.log(`✅ Working links verified: ${workingLinks.size}`);
console.log(`❌ Broken links detected: ${brokenLinks.length}`);

if (brokenLinks.length > 0) {
  console.log('\nList of broken links:');
  brokenLinks.forEach((b) => {
    console.log(` - [${b.file}] -> "${b.link}" (${b.reason})`);
  });
} else {
  console.log('🎉 100% of internal links are verified and working!');
}

// Check sitemap files
console.log('\n🗺️ Checking sitemap files in public/ and dist/...');
const sitemapDir = fs.existsSync('dist') ? 'dist' : 'public';
const sitemaps = ['sitemap.xml', 'sitemap-tools.xml', 'sitemap-blog.xml', 'sitemap-static.xml', 'sitemap-translations.xml'];
let totalSitemapUrls = 0;
sitemaps.forEach((sm) => {
  const filePath = path.join(sitemapDir, sm);
  if (fs.existsSync(filePath)) {
    const xml = fs.readFileSync(filePath, 'utf8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    totalSitemapUrls += urls.length;
    console.log(` - ${sm}: ${urls.length} URLs found.`);
  } else {
    console.log(` - ${sm}: FILE MISSING!`);
  }
});
console.log(`Total indexed URLs across sitemaps: ${totalSitemapUrls}`);
