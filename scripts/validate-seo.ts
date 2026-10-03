import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let hasError = false;
const publicDir = path.join(__dirname, '../public');
const srcDir = path.join(__dirname, '../src');

console.log('🔍 Starting Comprehensive Production Technical SEO & Canonical Validation...\n');

// 1. Validate _redirects for chains, loops, non-trailing slashes, status codes, and valid destinations
import { TOOLS } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, I18N_TOOL_SLUGS, DEFAULT_LOCALE } from '../src/i18n/config';
import { validateLocaleParity } from './validate-locale-parity';

const validCanonicalRoutes = new Set<string>([
  '/',
  '/about-us/',
  '/contact/',
  '/privacy-policy/',
  '/terms-of-service/',
  '/adobe-acrobat-alternative/',
  '/blog/',
  '/index.html',
]);

// Add all supported localized homepages
SUPPORTED_LOCALES.forEach((loc) => {
  if (loc !== DEFAULT_LOCALE) {
    validCanonicalRoutes.add(`/${loc}/`);
  }
});

// Add all tools and localized tools
TOOLS.forEach((t) => {
  const slug = t.slug.replace(/^\//, '').replace(/\/$/, '');
  validCanonicalRoutes.add(`/${slug}/`);
  if ((I18N_TOOL_SLUGS as readonly string[]).includes(slug)) {
    SUPPORTED_LOCALES.forEach((loc) => {
      if (loc !== DEFAULT_LOCALE) {
        validCanonicalRoutes.add(`/${loc}/${slug}/`);
      }
    });
  }
});

const redirectMap = new Map<string, string>();
let totalRedirectsTested = 0;
let healthyRedirects = 0;
let brokenRedirects = 0;
let chainedRedirects = 0;
let loopingRedirects = 0;
let misconfiguredRedirects = 0;

try {
  const redirectsPath = path.join(publicDir, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const content = fs.readFileSync(redirectsPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    lines.forEach((line) => {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const [source, target, status] = parts;
        totalRedirectsTested++;
        let isMisconfigured = false;

        if (target.startsWith('/') && !target.includes('.') && !target.endsWith('/') && target !== '/') {
          console.error(`❌ Redirect Target Missing Trailing Slash: ${source} -> ${target}`);
          hasError = true;
          isMisconfigured = true;
          misconfiguredRedirects++;
        }
        if (status && status !== '301' && status !== '302' && status !== '404' && status !== '200') {
          console.error(`❌ Unexpected redirect status code in line: "${line}"`);
          hasError = true;
          isMisconfigured = true;
          misconfiguredRedirects++;
        }
        if (source === target) {
          console.error(`❌ Redirect Loop Detected: ${source} -> ${target}`);
          hasError = true;
          loopingRedirects++;
        }

        // Verify target exists and is a valid canonical route for 301s
        if (status === '301' || !status) {
          if (!validCanonicalRoutes.has(target)) {
            console.error(`❌ Broken Redirect Destination (404/Unknown target): ${source} -> ${target}`);
            hasError = true;
            brokenRedirects++;
          }
        }

        redirectMap.set(source, target);
        if (!isMisconfigured && source !== target && (status === '404' || validCanonicalRoutes.has(target))) {
          healthyRedirects++;
        }
      }
    });

    // Check for redirect chains (e.g. A -> B where B is also a redirect source)
    redirectMap.forEach((target, source) => {
      if (redirectMap.has(target)) {
        console.error(`❌ Redirect Chain Detected: ${source} -> ${target} -> ${redirectMap.get(target)}`);
        hasError = true;
        chainedRedirects++;
      }
    });

    console.log(`✅ Redirect Graph Inventory Audited: ${totalRedirectsTested} rules tested.`);
    console.log(`   Healthy: ${healthyRedirects}, Broken: ${brokenRedirects}, Chained: ${chainedRedirects}, Looping: ${loopingRedirects}, Misconfigured: ${misconfiguredRedirects}`);
  }
} catch (e) {
  console.error('Error checking _redirects:', e);
  hasError = true;
}

// 2. Validate seo-data.ts for broken internal links, non-canonical formatting, and invalid targets
try {
  let totalHrefsScanned = 0;
  let brokenHrefsCount = 0;
  let nonCanonicalHrefsCount = 0;

  const hrefRegex = /href=["']([^"']+)["']/gi;

  // Validate every tool and article body in structured data
  TOOLS.forEach((item) => {
    const fieldsToScan: Array<{ fieldName: string; text: string }> = [
      { fieldName: 'longFormBody', text: item.longFormBody || '' },
      { fieldName: 'shortDescription', text: item.shortDescription || '' },
    ];

    fieldsToScan.forEach(({ fieldName, text }) => {
      let match: RegExpExecArray | null;
      while ((match = hrefRegex.exec(text)) !== null) {
        const rawHref = match[1].trim();
        totalHrefsScanned++;

        // Rule 3: Skip anchors (#section), mailto:, tel:, protocol-relative (//), and absolute external URLs (http://, https://)
        if (
          rawHref.startsWith('#') ||
          rawHref.startsWith('mailto:') ||
          rawHref.startsWith('tel:') ||
          rawHref.startsWith('//') ||
          rawHref.startsWith('http://') ||
          rawHref.startsWith('https://')
        ) {
          continue;
        }

        // Skip static file assets (images, fonts, sitemaps, data files)
        if (/\.(png|jpe?g|svg|webp|gif|ico|xml|txt|json|pdf|ttf|woff2?)$/i.test(rawHref)) {
          continue;
        }

        const [pathOnly] = rawHref.split(/[?#]/);
        const normalizedLeading = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

        // Check canonical trailing slash rule
        if (
          normalizedLeading !== '/' &&
          !normalizedLeading.endsWith('/') &&
          !normalizedLeading.includes('.')
        ) {
          console.error(
            `❌ Non-canonical Internal Link Found (missing trailing slash):\n` +
            `   Containing Item: "${item.name}" [slug: ${item.slug}, id: ${item.id}, field: ${fieldName}]\n` +
            `   Offending href:  "${rawHref}"\n` +
            `   Expected:        "${normalizedLeading}/"`
          );
          hasError = true;
          nonCanonicalHrefsCount++;
        }

        const canonicalTarget = normalizedLeading.endsWith('/') ? normalizedLeading : `${normalizedLeading}/`;

        // Check if destination resolves to (a) TOOLS slug, (b) blog slug, (c) static route, or (d) localized route
        if (!validCanonicalRoutes.has(canonicalTarget)) {
          console.error(
            `❌ Broken Internal Link (404 / Unregistered Route):\n` +
            `   Containing Item: "${item.name}" [slug: ${item.slug}, id: ${item.id}, field: ${fieldName}]\n` +
            `   Offending href:  "${rawHref}"\n` +
            `   Resolved target: "${canonicalTarget}" is not in valid canonical route table.`
          );
          hasError = true;
          brokenHrefsCount++;
        }
      }
    });
  });

  // Check relatedLinks "url": "/..."
  const seoDataPath = path.join(srcDir, 'config', 'seo-data.ts');
  const rawSeoDataContent = fs.readFileSync(seoDataPath, 'utf-8');
  const relatedUrlRegex = /"url":\s*"(\/[^"]+?)"/g;
  let match: RegExpExecArray | null;
  while ((match = relatedUrlRegex.exec(rawSeoDataContent)) !== null) {
    const u = match[1];
    if (!u.endsWith('/') && !u.includes('.') && !u.includes('#') && u !== '/') {
      console.error(`❌ Non-canonical relatedLinks URL (missing trailing slash): ${u}`);
      hasError = true;
      nonCanonicalHrefsCount++;
    }
  }

  console.log(
    `✅ seo-data.ts internal link guard audited: ${totalHrefsScanned} links checked across ${TOOLS.length} items.\n` +
    `   Broken: ${brokenHrefsCount}, Non-canonical: ${nonCanonicalHrefsCount}`
  );
} catch (e) {
  console.error('Error checking seo-data.ts:', e);
  hasError = true;
}

// 3. Validate Sitemaps
try {
  const sitemaps = ['sitemap.xml', 'sitemap-tools.xml', 'sitemap-blog.xml', 'sitemap-pages.xml'];
  const sitemapUrls = new Set<string>();

  sitemaps.forEach((sm) => {
    const smPath = path.join(publicDir, sm);
    if (!fs.existsSync(smPath)) {
      console.error(`❌ Sitemap file missing: ${sm}`);
      hasError = true;
      return;
    }

    const content = fs.readFileSync(smPath, 'utf-8');
    const locRegex = /<loc>(https:\/\/pdfminty\.com\/[^<]+)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(content)) !== null) {
      const url = match[1];
      // Check canonical protocol and host
      if (!url.startsWith('https://pdfminty.com/')) {
        console.error(`❌ Non-canonical Sitemap URL host/protocol: ${url} in ${sm}`);
        hasError = true;
      }
      // Check trailing slash (excluding files like .xml, .png, etc.)
      if (!url.endsWith('/') && !url.includes('.')) {
        console.error(`❌ Sitemap URL missing trailing slash: ${url} in ${sm}`);
        hasError = true;
      }
      // Check if sitemap URL is listed in redirects
      const pathPart = url.replace('https://pdfminty.com', '');
      if (redirectMap.has(pathPart)) {
        console.error(`❌ Sitemap contains redirected URL: ${url} -> ${redirectMap.get(pathPart)}`);
        hasError = true;
      }

      // Check if sitemap URL actually exists
      if (!url.includes('.') && !validCanonicalRoutes.has(pathPart)) {
        console.error(`❌ Sitemap contains non-existent or 404 URL: ${url}`);
        hasError = true;
      }

      if (sitemapUrls.has(url)) {
        console.error(`❌ Duplicate Sitemap URL found: ${url}`);
        hasError = true;
      }
      sitemapUrls.add(url);
    }
  });
  console.log(`✅ Sitemaps validated: all ${sitemapUrls.size} URLs are canonical, non-redirecting, HTTPS, trailing-slash.`);
} catch (e) {
  console.error('Error checking sitemaps:', e);
  hasError = true;
}

// 4. Validate 404 Pages
try {
  const notFoundHtmlPath = path.join(publicDir, '404.html');
  if (fs.existsSync(notFoundHtmlPath)) {
    const html = fs.readFileSync(notFoundHtmlPath, 'utf-8');
    if (html.includes('rel="canonical"')) {
      console.error('❌ 404.html contains a canonical tag! 404 pages must not have canonical tags.');
      hasError = true;
    }
    if (!html.includes('noindex')) {
      console.error('❌ 404.html is missing robots noindex directive.');
      hasError = true;
    }
  }

  const notFoundTsxPath = path.join(srcDir, 'pages', 'NotFoundPage.tsx');
  if (fs.existsSync(notFoundTsxPath)) {
    const tsx = fs.readFileSync(notFoundTsxPath, 'utf-8');
    if (tsx.includes('rel="canonical"')) {
      console.error('❌ NotFoundPage.tsx contains a canonical tag! 404 pages must not have canonical tags.');
      hasError = true;
    }
    if (!tsx.includes('noindex')) {
      console.error('❌ NotFoundPage.tsx is missing robots noindex directive.');
      hasError = true;
    }
  }
  console.log('✅ 404 pages validated: zero canonical tags present, proper noindex set.');
} catch (e) {
  console.error('Error checking 404 pages:', e);
  hasError = true;
}

// 5. Validate robots.txt
try {
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf-8');
    if (!robots.includes('Sitemap: https://pdfminty.com/sitemap.xml')) {
      console.error('❌ robots.txt is missing reference to primary sitemap.xml');
      hasError = true;
    }
    console.log('✅ robots.txt validated: canonical sitemap index referenced.');
  }
} catch (e) {
  console.error('Error checking robots.txt:', e);
  hasError = true;
}

// 6. Validate Trailing Slash Normalization & Single-Hop Resolution
try {
  // Test simulated normalization outcomes
  const simulateNormalize = (rawUrl: string): { status: number; destination?: string } => {
    const url = new URL(rawUrl);
    const rawPath = url.pathname;
    const lowerPath = rawPath.toLowerCase();

    // Normalize slashes and dot-segments early for non-API routes to avoid multi-hop redirect chains
    const normalizedLower = lowerPath.startsWith('/api')
      ? lowerPath
      : lowerPath.replace(/\/{2,}/g, '/').replace(/\/\.\//g, '/').replace(/\/\.$/, '/');

    // Check legacy redirects first
    const strippedPath = normalizedLower.replace(/\/+$/, '') || '/';
    if (redirectMap.has(strippedPath) || redirectMap.has(strippedPath + '/')) {
      const target = redirectMap.get(strippedPath) || redirectMap.get(strippedPath + '/');
      return { status: 301, destination: `https://pdfminty.com${target}${url.search}` };
    }

    let targetHost = url.hostname;
    let targetProtocol = url.protocol;
    let targetPathname = rawPath;
    let shouldRedirect = false;

    if (url.hostname === 'www.pdfminty.com') {
      targetHost = 'pdfminty.com';
      targetProtocol = 'https:';
      shouldRedirect = true;
    } else if (url.hostname === 'pdfminty.com' && url.protocol === 'http:') {
      targetProtocol = 'https:';
      shouldRedirect = true;
    }

    if (!targetPathname.startsWith('/api')) {
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

    if (targetPathname === '/index.html' || targetPathname === '/index.htm') {
      targetPathname = '/';
      shouldRedirect = true;
    } else if (targetPathname.endsWith('/index.html') || targetPathname.endsWith('/index.htm')) {
      targetPathname = targetPathname.replace(/\/index\.html?$/, '/');
      shouldRedirect = true;
    }

    const lowerCandidate = targetPathname.toLowerCase();
    if (!targetPathname.startsWith('/api') && targetPathname !== lowerCandidate) {
      targetPathname = lowerCandidate;
      shouldRedirect = true;
    }

    if (
      !targetPathname.startsWith('/api') &&
      !targetPathname.includes('.') &&
      !targetPathname.endsWith('/')
    ) {
      // Valid routes get trailing slash
      targetPathname = `${targetPathname}/`;
      shouldRedirect = true;
    }

    if (shouldRedirect) {
      return { status: 301, destination: `${targetProtocol}//${targetHost}${targetPathname}${url.search}` };
    }

    return { status: 200, destination: rawUrl };
  };

  const testCases = [
    { input: 'https://pdfminty.com/merge-pdf', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'https://pdfminty.com/MERGE-PDF', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'https://pdfminty.com/merge-pdf//', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'https://pdfminty.com//merge-pdf/', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'http://www.pdfminty.com/merge-pdf', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'https://pdfminty.com/merge-pdf/index.html', expected: 'https://pdfminty.com/merge-pdf/' },
    { input: 'https://pdfminty.com/index.html', expected: 'https://pdfminty.com/' },
    { input: 'https://pdfminty.com/merge-pdf/?page=2', expected: 'https://pdfminty.com/merge-pdf/?page=2' },
    { input: 'https://pdfminty.com/merge-pdf?ref=test', expected: 'https://pdfminty.com/merge-pdf/?ref=test' },
    { input: 'https://pdfminty.com/about', expected: 'https://pdfminty.com/about-us/' },
    { input: 'https://pdfminty.com/about/', expected: 'https://pdfminty.com/about-us/' },
    { input: 'http://www.pdfminty.com/split', expected: 'https://pdfminty.com/split-pdf/' },
    { input: 'http://www.pdfminty.com//about', expected: 'https://pdfminty.com/about-us/' },
    { input: 'https://pdfminty.com/reorder', expected: 'https://pdfminty.com/reorder-pdf/' },
    { input: 'https://pdfminty.com/watermark', expected: 'https://pdfminty.com/watermark-pdf/' },
    { input: 'https://pdfminty.com/img-to-pdf', expected: 'https://pdfminty.com/image-to-pdf/' },
    { input: 'https://pdfminty.com/pdf-to-img', expected: 'https://pdfminty.com/pdf-to-image/' },
    { input: 'https://pdfminty.com/grayscale', expected: 'https://pdfminty.com/grayscale-pdf/' },
    { input: 'https://pdfminty.com/flatten', expected: 'https://pdfminty.com/flatten-pdf/' },
    { input: 'https://pdfminty.com/repair', expected: 'https://pdfminty.com/repair-pdf/' },
    { input: 'https://pdfminty.com/sign', expected: 'https://pdfminty.com/sign-pdf/' },
    { input: 'https://pdfminty.com/ocr', expected: 'https://pdfminty.com/ocr-pdf/' },
    { input: 'https://pdfminty.com/sanitize', expected: 'https://pdfminty.com/sanitize-pdf/' },
  ];

  testCases.forEach(({ input, expected }) => {
    const res = simulateNormalize(input);
    const dest = res.destination;
    if (dest !== expected) {
      console.error(`❌ Trailing slash normalization failed for ${input}: got ${dest}, expected ${expected}`);
      hasError = true;
    }
  });

  console.log('✅ Trailing-slash normalization validated across all simulated edge cases (casing, slashes, protocol, www, legacy).');
} catch (e) {
  console.error('Error during normalization test:', e);
  hasError = true;
}

// 7. Validate Multilingual Content Parity (CONT-002)
try {
  const parityResult = validateLocaleParity({ exitOnError: false });
  if (parityResult.hasFailure) {
    hasError = true;
  }
} catch (e) {
  console.error('Error during locale parity validation:', e);
  hasError = true;
}

if (hasError) {
  console.error('\n⚠️ SEO Validation Failed!');
  process.exit(1);
} else {
  console.log('\n🚀 ALL ARCHITECTURAL SEO & CANONICAL AUDIT CHECKS PASSED!');
}
