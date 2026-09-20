import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { HOMEPAGE_H1 } from '../src/config/homeConfig';
import { SITE_URL, SITE_NAME, TOOLS, ToolSEOInfo, RELATED_TOOL_MAPPING } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_TOOL_SLUGS, getHreflangs, getCanonicalUrl } from '../src/i18n/config';
import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Ensure favicons, touch-icons, and OG sharing images are generated on every build
async function generateAllAssets(publicDir: string, distDir: string): Promise<void> {
  const iconSource: string = path.join(publicDir, 'logo.svg');
  if (!fs.existsSync(iconSource)) {
    logger.warn('Warning: Source logo.svg not found in public directory. Unable to generate assets.');
    return;
  }

  logger.info('Generating website logos, favicons, and metadata graphics...');
  try {
    // Ensure both output targets exist
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    const targets: string[] = [publicDir, distDir];

    for (const target of targets) {
      if (!fs.existsSync(target)) continue;

      // 1. logo-192.png (PWA asset)
      await sharp(iconSource)
        .resize(192, 192)
        .png()
        .toFile(path.join(target, 'logo-192.png'));

      // 2. logo-512.png (PWA asset)
      await sharp(iconSource)
        .resize(512, 512)
        .png()
        .toFile(path.join(target, 'logo-512.png'));

      // 3. apple-touch-icon.png (Apple web device card)
      await sharp(iconSource)
        .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(target, 'apple-touch-icon.png'));

      // 4. favicon.ico / favicon.png (Browser tabs)
      await sharp(iconSource)
        .resize(32, 32)
        .png()
        .toFile(path.join(target, 'favicon.ico'));

      // 5. og-image.png (Rich social share preview, custom high-fidelity banner composition!)
      const ogSvgMarkup = `
        <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0b1329;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#grad)" />
          
          <circle cx="1100" cy="100" r="300" fill="#00FFC2" fill-opacity="0.04" />
          <circle cx="100" cy="530" r="200" fill="#059669" fill-opacity="0.06" />

          <g transform="translate(480, 110) scale(4.8)">
            <rect x="6" y="11" width="26" height="33" rx="6" fill="#0E0E0E" />
            <rect x="7" y="12" width="24" height="31" rx="5" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" fill="none" />
            <rect x="15" y="4" width="27" height="33" rx="6" fill="#00FFC2" />
            <rect x="16" y="5" width="25" height="31" rx="5" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.3" fill="none" />
            <path d="M35 4L42 11H39C36.7909 11 35 9.20914 35 7V4Z" fill="#131313" />
            <rect x="21" y="15" width="15" height="2.2" rx="1.1" fill="#131313" />
            <rect x="21" y="21" width="15" height="2.2" rx="1.1" fill="#131313" />
            <rect x="21" y="27" width="9" height="2.2" rx="1.1" fill="#131313" fill-opacity="0.8" />
          </g>

          <text x="600" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2px">
            PDFMinty
          </text>
          
          <text x="600" y="490" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="4px">
            PRIVACY-FIRST FREE PDF TOOLKIT
          </text>

          <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#00FFC2" text-anchor="middle" letter-spacing="1px">
            100% Client-Side • Secure Offline Calculations • No Server Uploads
          </text>
        </svg>
      `;

      await sharp(Buffer.from(ogSvgMarkup))
        .png()
        .toFile(path.join(target, 'og-image.png'));
    }

    logger.info('Successfully completed generateAllAssets procedure.');
  } catch (err: unknown) {
    logger.error('Error during asset generation pipeline:', err);
  }
}

async function run(): Promise<void> {
  const distDir: string = path.join(__dirname, "../dist");
  const publicDir: string = path.join(__dirname, "../public");
  
  // Create logos & icons first on every build dynamically
  await generateAllAssets(publicDir, distDir);

  const distIndexHtmlPath: string = path.join(distDir, "index.html");
  const rootIndexHtmlPath: string = path.join(__dirname, "../index.html");
  
  let baseHtml = "";
  if (fs.existsSync(distIndexHtmlPath)) {
    baseHtml = fs.readFileSync(distIndexHtmlPath, "utf8");
    logger.info("Reading template from compiled dist/index.html");
  } else if (fs.existsSync(rootIndexHtmlPath)) {
    baseHtml = fs.readFileSync(rootIndexHtmlPath, "utf8");
    logger.info("Reading template from root index.html");
  } else {
    throw new Error("Unable to locate any base index.html template file for static generation.");
  }
  
  // Clean base HTML to avoid double definitions (purging titles, descriptions, canonicals, OGs, Twitters, and JSON-LD markup)
  function cleanBaseTemplate(html: string): string {
    let clean: string = html;
    clean = clean.replace(/<title>[^<]*<\/title>/gi, "");
    clean = clean.replace(/<meta\s+name="description"[^>]*>/gi, "");
    clean = clean.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
    clean = clean.replace(/<meta\s+property="og:[^>]*>/gi, ""); // Purge all og: properties
    clean = clean.replace(/<meta\s+name="twitter:[^>]*>/gi, ""); // Purge all twitter: properties
    
    // Purge any homepage-only JSON-LD structured script elements to avoid duplication
    clean = clean.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
    
    // Reset #root container thoroughly
    clean = clean.replace(/<div\s+id="root"[\s\S]*?(?=\s*(?:<script|<!--|<footer>|<\/body>))/i, '<div id="root"></div>');

    return clean;
  }
  
  const optimizedBase: string = cleanBaseTemplate(baseHtml);
  
  TOOLS.forEach((item: ToolSEOInfo) => {
    const pageUrl: string = `${SITE_URL}/${item.slug}/`;
    const targetFolder: string = path.join(distDir, item.slug);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    // Construct route-specific JSON-LD blocks
    const schemas: Record<string, unknown>[] = [];
    
    if (item.type === 'tool') {
      // 1. WebApplication Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": `PdfMinty - ${item.name}`,
        "url": `https://pdfminty.com/${item.slug}/`,
        "description": item.metaDescription || item.shortDescription,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires HTML5, WebAssembly",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock"},
        "featureList": [
          "100% client-side processing for standard tools",
          "Zero file uploads for our standard PDF tools",
          "The AI Analyze tool only sends extracted text to Google Gemini after you explicitly check a consent box",
          "Free to use",
          "No registration required"
        ]
      });
      
      // 2. HowTo Schema
      if (item.howTo) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": item.howTo.name,
          "totalTime": item.howTo.totalTime,
          "step": item.howTo.steps.map((stepText: string, index: number) => ({
            "@type": "HowToStep",
            "url": `${pageUrl}#step${index + 1}`,
            "name": stepText,
            "itemListElement": [{ "@type": "HowToDirection", "text": stepText }]
          }))
        });
      }

      // 3. BreadcrumbList Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://pdfminty.com/"},
          {"@type": "ListItem", "position": 2, "name": item.name, "item": `https://pdfminty.com/${item.slug}/`}
        ]
      });

      // 4. FAQPage Schema
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((f: { q: string; a: string }) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        });
      }
    } else if (item.slug === 'about-us') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/about-us/`,
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": `${SITE_URL}/`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "About Us", "item": `${SITE_URL}/about-us/`}
          ]
        }
      );
    } else if (item.slug === 'contact') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/contact/`,
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": `${SITE_URL}/`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "Contact Us", "item": `${SITE_URL}/contact/`}
          ]
        }
      );
    } else if (item.slug === 'privacy-policy' || item.slug === 'terms-of-service') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/${item.slug}/`
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": item.name, "item": `${SITE_URL}/${item.slug}/`}
          ]
        }
      );
    } else if (item.slug === 'blog') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "PdfMinty Knowledge Hub",
          "url": `${SITE_URL}/blog/`,
          "description": "Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.",
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": `${SITE_URL}/logo-192.png`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "Knowledge Hub", "item": `${SITE_URL}/blog/`}
          ]
        }
      );
    } else if (item.type === 'article') {
      // 1. Article Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": item.h1 || item.name,
        "description": item.metaDescription,
        "url": pageUrl,
        "datePublished": item.datePublished || "2026-07-16",
        "dateModified": item.dateModified || item.datePublished || "2026-08-08",
        "author": {
          "@type": "Organization",
          "name": "PdfMinty Editorial Team",
          "url": `${SITE_URL}/`
        },
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo-192.png`
          }
        },
        "image": {
          "@type": "ImageObject",
          "url": item.ogImage ? `${SITE_URL}${item.ogImage}` : `${SITE_URL}/og-image.png`,
          "width": 1200,
          "height": 630
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": pageUrl
        }
      });

      // 2. BreadcrumbList Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
          {"@type": "ListItem", "position": 2, "name": "Knowledge Hub", "item": `${SITE_URL}/blog/`},
          {"@type": "ListItem", "position": 3, "name": item.name, "item": pageUrl}
        ]
      });

      // 3. FAQPage Schema
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((f: { q: string; a: string }) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        });
      }
    }
    
    // Generate JSON-LD Script tag bundle
    const jsonLdMarkup: string = schemas
      .map((schema: Record<string, unknown>) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
      .join('\n  ');

    const isI18n = (I18N_TOOL_SLUGS as readonly string[]).includes(item.slug);
    const hreflangMarkup = isI18n
      ? getHreflangs(item.slug, SITE_URL)
          .map((entry) => `  <link rel="alternate" hreflang="${entry.hreflang}" href="${entry.href}">`)
          .join('\n')
      : '';

    const pageKeywords = item.keywords
      ? (Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords)
      : `${item.name.toLowerCase()}, ${item.slug.replace(/-/g, ' ')}, pdf tools`;

    // Set custom page head meta tags
    const headMeta: string = `
  <title>${item.metaTitle}</title>
  <meta name="description" content="${item.metaDescription}">
  <meta name="keywords" content="${pageKeywords}">
  <link rel="canonical" href="${pageUrl}">
${hreflangMarkup ? `${hreflangMarkup}\n` : ''}  <meta property="og:type" content="${item.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${item.metaTitle}">
  <meta property="og:description" content="${item.metaDescription}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${item.metaTitle}">
  <meta name="twitter:description" content="${item.metaDescription}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  ${jsonLdMarkup}
  `;
  
    // Inject metadata immediately inside the head element and replace sitewide default keywords
    let preRenderedHtml: string = optimizedBase.replace("</head>", `${headMeta}\n</head>`);
    if (preRenderedHtml.match(/<meta\s+name="keywords"[^>]*\/?>/i)) {
      // Remove any duplicate keywords tag from base template so only the per-page tag remains
      const firstKwRegex = /<meta\s+name="keywords"[^>]*\/?>/i;
      preRenderedHtml = preRenderedHtml.replace(firstKwRegex, '');
    }
    
    // Helper function to build related tools list using contextual subset (4-6 tools)
    const getRelatedToolsHtml = (currentSlug: string): string => {
      const relatedSlugs = RELATED_TOOL_MAPPING[currentSlug] || [];
      const relatedTools = relatedSlugs
        .map((slug: string) => TOOLS.find((t: ToolSEOInfo) => t.slug === slug && t.type === 'tool'))
        .filter((t): t is ToolSEOInfo => !!t);

      if (relatedTools.length === 0) return '';

      return `
<h2>Related PDF Tools</h2>
<p>Explore logically related, privacy-first PDF tools:</p>
<ul>
${relatedTools.map((t: ToolSEOInfo) => `  <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription || t.description}</li>`).join('\n')}
</ul>
`;
    };

    let finalBody: string = item.longFormBody;
    // Strip any existing <h1> in body and convert to <h2> so there is strictly no duplicate H1
    finalBody = finalBody.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>');

    // Prepend the page's exact, canonical <h1> tag
    finalBody = `<h1>${item.h1 || item.name}</h1>\n${finalBody}`;

    if (item.type !== 'article') {
      finalBody += getRelatedToolsHtml(item.slug);
    }

    // Pre-inject longFormBody directly inside the React root element (#root) for bot/crawler visibility without duplicate noscript block
    const preRenderedContent: string = `
    <div id="root">
      <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
        ${finalBody}
      </article>
    </div>
    `;
    
    // Replace empty #root mount tag with populated static HTML
    preRenderedHtml = preRenderedHtml.replace(/<div\s+id="root"\s*><\/div>/i, preRenderedContent);
    preRenderedHtml = preRenderedHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, preRenderedContent);
    
    fs.writeFileSync(path.join(targetFolder, "index.html"), preRenderedHtml, "utf8");
    logger.info(`Pre-rendered static HTML created for ${item.name} at: ${targetFolder}/index.html`);

    // If tool is localized, generate pre-rendered static HTML for configured non-default locales
    if (isI18n) {
      for (const locLang of SUPPORTED_LOCALES) {
        if (locLang !== DEFAULT_LOCALE) {
          const locTargetFolder = path.join(distDir, locLang, item.slug);
          if (!fs.existsSync(locTargetFolder)) {
            fs.mkdirSync(locTargetFolder, { recursive: true });
          }
          const locPageUrl = getCanonicalUrl(item.slug, locLang, SITE_URL);
          const locMetaTitle = locLang === 'bn' && item.slug === 'merge-pdf'
            ? 'বিনামূল্যে PDF মার্জ করুন — একাধিক ফাইল যুক্ত করুন | PDFMinty'
            : item.metaTitle;
          const locMetaDesc = locLang === 'bn' && item.slug === 'merge-pdf'
            ? 'সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ফাইলে যুক্ত করুন। ১০০% ব্রাউজার প্রসেসিং, কোনো ফাইল সার্ভারে আপলোড হয় না।'
            : item.metaDescription;

          let locPreRenderedContent = preRenderedContent;
          if (locLang === 'bn' && item.slug === 'merge-pdf') {
            locPreRenderedContent = `
    <div id="root">
      <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
        <h1>বিনামূল্যে PDF ফাইল মার্জ করুন — একাধিক PDF এক ডকুমেন্টে যুক্ত করুন (১০০% ব্রাউজার প্রসেসিং)</h1>
        <p class="lead text-lg font-medium text-slate-700 dark:text-slate-300">
          অনলাইনে সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ডকুমেন্টে মার্জ বা একত্রিত করুন। কোনো সফটওয়্যার ইন্সটল করার প্রয়োজন নেই এবং আপনার ফাইল কখনোই কোনো রিমোট সার্ভারে আপলোড করা হয় না।
        </p>

        <h2>কীভাবে একাধিক PDF ফাইল মার্জ করবেন?</h2>
        <ol>
          <li><strong>ফাইল নির্বাচন করুন:</strong> 'ফাইল বাছুন' বোতামে ক্লিক করুন অথবা আপনার ডিভাইস থেকে PDF ফাইলগুলো ড্র্যাগ ও ড্রপ করুন।</li>
          <li><strong>ক্রম সাজান:</strong> ড্র্যাগ কন্ট্রোল বা তীর বোতাম ব্যবহার করে ফাইলগুলো আপনার পছন্দমতো ক্রমানুসারে সাজান।</li>
          <li><strong>মার্জ বোতামে চাপুন:</strong> 'PDF মার্জ করুন' বোতামে ক্লিক করলেই ব্রাউজারের ভেতর মেমোরিতে ফাইলগুলো একত্রিত হবে।</li>
          <li><strong>ডাউনলোড করুন:</strong> মার্জ সম্পন্ন হলে স্বয়ংক্রিয়ভাবে আপনার নতুন একক PDF ফাইলটি ডাউনলোড হয়ে যাবে।</li>
        </ol>

        <h2>কেন PdfMinty-এর PDF মার্জার সেরা?</h2>
        <ul>
          <li><strong>১০০% ক্লায়েন্ট-সাইড প্রাইভেসি:</strong> ফাইলগুলো WebAssembly প্রযুক্তিতে সরাসরি আপনার ডিভাইসে প্রসেস হয়।</li>
          <li><strong>কোনো সীমা বা ওয়াটারমার্ক নেই:</strong> সম্পূর্ণ ফ্রি এবং কোনো জলছাপ যুক্ত করা হয় না।</li>
          <li><strong>লিপিবদ্ধ কোয়ালিটি অক্ষত:</strong> টেক্সট, হাই-রেজোলিউশন ছবি ও ভেক্টর ড্রয়িং মূল কোয়ালিটিতে বজায় থাকে।</li>
          <li><strong>অফলাইন সাপোর্ট:</strong> একবার লোড হওয়ার পর ইন্টারনেট সংযোগ ছাড়াও টুলটি কাজ করতে সক্ষম।</li>
        </ul>

        <h2>সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)</h2>
        <h3>আমার PDF ফাইলগুলো কি কোনো সার্ভারে সেভ হয়?</h3>
        <p>না, একদমই না। PdfMinty একটি জিরো-আপলোড আর্কিটেকচার অনুসরণ করে। ফাইল প্রসেসিং সম্পূর্ণ আপনার ডিভাইসের র‍্যামে ঘটে।</p>

        <h3>একসাথে কতগুলো PDF ফাইল মার্জ করা যায়?</h3>
        <p>আপনার ডিভাইসের মেমোরি অনুযায়ী যতগুলো প্রয়োজন আপনি মার্জ করতে পারবেন। প্রতিটি ফাইল সর্বোচ্চ 100MB পর্যন্ত হতে পারে।</p>

        <h3>PDF মার্জ করলে কি কোয়ালিটি হ্রাস পায়?</h3>
        <p>না, মার্জিং প্রক্রিয়াটি সম্পূর্ণ লসলেস (lossless)। মূল ফন্ট, মেটাডাটা এবং ছবির রেজোলিউশন পুরোপুরি অক্ষত থাকে।</p>

        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3>অন্যান্য প্রয়োজনীয় PDF টুলস</h3>
          <ul>
            <li><a href="/split-pdf/">PDF স্প্লিট করুন</a> — বড় PDF থেকে পেজ আলাদা করুন</li>
            <li><a href="/protect-pdf/">PDF পাসওয়ার্ড দিয়ে সুরক্ষিত করুন</a> — অফলাইনে শক্তিশালী এনক্রিপশন</li>
            <li><a href="/blog/how-to-compress-a-pdf-without-losing-quality-2026/">PDF সাইজ অপ্টিমাইজ করুন</a> — গুণমান বজায় রেখে ফাইল সাইজ কমান</li>
            <li><a href="/rotate-pdf/">PDF রোটেট করুন</a> — উল্টো বা বাঁকা পেজ সোজা করুন</li>
          </ul>
        </div>
      </article>
    </div>
            `;
          }

          const locHeadMeta: string = `
  <title>${locMetaTitle}</title>
  <meta name="description" content="${locMetaDesc}">
  <link rel="canonical" href="${locPageUrl}">
${hreflangMarkup ? `${hreflangMarkup}\n` : ''}  <meta property="og:type" content="${item.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${locMetaTitle}">
  <meta property="og:description" content="${locMetaDesc}">
  <meta property="og:url" content="${locPageUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${locPageUrl}">
  <meta name="twitter:title" content="${locMetaTitle}">
  <meta name="twitter:description" content="${locMetaDesc}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  ${jsonLdMarkup}
  `;
          let locHtml: string = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${locLang}"`);
          if (!locHtml.includes(`lang="${locLang}"`)) {
            locHtml = locHtml.replace('<html', `<html lang="${locLang}"`);
          }
          locHtml = locHtml.replace("</head>", `${locHeadMeta}\n</head>`);
          locHtml = locHtml.replace(/<div\s+id="root"\s*><\/div>/i, locPreRenderedContent);
          locHtml = locHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, locPreRenderedContent);
          fs.writeFileSync(path.join(locTargetFolder, "index.html"), locHtml, "utf8");
          logger.info(`Pre-rendered static HTML created for ${item.name} [${locLang}] at: ${locTargetFolder}/index.html`);
        }
      }
    }
  });

  // ----------------------------------------------------
  // Pre-render the Blog Index Page (dist/blog/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Blog Index (/blog)...");
  const blogTargetFolder = path.join(distDir, "blog");
  if (!fs.existsSync(blogTargetFolder)) {
    fs.mkdirSync(blogTargetFolder, { recursive: true });
  }

  const articles = TOOLS.filter((t: ToolSEOInfo) => t.type === 'article');
  const articlesListHtml = articles
    .map(
      (a: ToolSEOInfo) => `
      <article class="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm">
        <div class="flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
          <span>${a.category || 'Guide'}</span>
          <span>•</span>
          <time datetime="${a.datePublished || '2026-01-01'}">${a.datePublished || '2026-01-01'}</time>
        </div>
        <h2 class="text-xl font-bold mb-2">
          <a href="/${a.slug}/" class="hover:text-emerald-600 transition-colors">${a.h1 || a.name}</a>
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">${a.metaDescription || a.shortDescription || ''}</p>
        <a href="/${a.slug}/" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hover:underline">Read Full Article →</a>
      </article>`
    )
    .join('\n');

  const blogHeadMeta = `
  <title>PdfMinty Knowledge Hub — Free Guides & PDF Tutorials</title>
  <meta name="description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <link rel="canonical" href="${SITE_URL}/blog/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="PdfMinty Knowledge Hub — Free Guides & PDF Tutorials">
  <meta property="og:description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <meta property="og:url" content="${SITE_URL}/blog/">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_URL}/blog/">
  <meta name="twitter:title" content="PdfMinty Knowledge Hub — Free Guides & PDF Tutorials">
  <meta name="twitter:description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "PdfMinty Knowledge Hub",
    "description": "Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.",
    "url": "${SITE_URL}/blog/",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/og-image.png"
      }
    }
  }
  </script>
  `;

  let blogHtml = optimizedBase.replace("</head>", `${blogHeadMeta}\n</head>`);

  const blogPreRenderedContent = `
    <div id="root">
      <main class="max-w-5xl mx-auto py-12 px-6 font-sans">
        <header class="text-center max-w-3xl mx-auto mb-12">
          <h1 class="text-3xl font-black mb-4">PdfMinty Knowledge Hub</h1>
          <p class="text-base text-slate-600 dark:text-slate-300">
            Free, privacy-first guides, tutorials, and deep-dives on PDF security, formatting, and offline workflows.
          </p>
        </header>

        <section class="grid gap-6 md:grid-cols-2">
          ${articlesListHtml}
        </section>
      </main>
    </div>
  `;

  blogHtml = blogHtml.replace(/<div\s+id="root"\s*><\/div>/i, blogPreRenderedContent);
  blogHtml = blogHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, blogPreRenderedContent);

  fs.writeFileSync(path.join(blogTargetFolder, "index.html"), blogHtml, "utf8");
  logger.info("Successfully pre-rendered static HTML for Blog Index at dist/blog/index.html");

  // ----------------------------------------------------
  // Pre-render the Homepage (dist/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Homepage...");

  const toolsCount = TOOLS.filter((t: ToolSEOInfo) => t.type === 'tool').length;
  const toolsListHtml = TOOLS
    .filter((t: ToolSEOInfo) => t.type === 'tool')
    .map((t: ToolSEOInfo) => `      <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription || t.description}</li>`)
    .join('\n');
  
  const homepageContent = `
  <main class="prose max-w-6xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
    <h1>${HOMEPAGE_H1}</h1>
    <p>PDFMinty is a free, privacy-first PDF toolkit with ${toolsCount} powerful tools that run entirely in your browser. Your files never leave your device — no server uploads, no sign-ups, no daily quotas. Merge, split, protect, convert, and edit PDFs with complete confidentiality.</p>
 
    <h2>All PDF Tools</h2>
    <ul>
${toolsListHtml}
    </ul>
 
    <h2>Why Choose PDFMinty?</h2>
    <p>Unlike other online PDF tools that upload your files to remote servers, PDFMinty processes everything locally in your browser using WebAssembly. This means:</p>
    <ul>
      <li><strong>Complete Privacy:</strong> Your documents never touch our servers</li>
      <li><strong>No File Limits:</strong> Process files up to 100MB each, 150MB total</li>
      <li><strong>Fast Processing:</strong> WebAssembly-powered operations complete in seconds</li>
      <li><strong>No Registration:</strong> All tools are 100% free with no sign-up</li>
      <li><strong>Works Offline:</strong> PWA-enabled — install and use without internet</li>
    </ul>
 
    <h2>How PDFMinty Protects Your Privacy</h2>
    <p>Every PDF operation in PDFMinty happens client-side using JavaScript and WebAssembly. When you upload a file, it's loaded into your browser's memory, processed locally, and the result is generated on your device. The file is never transmitted over the network. This is fundamentally different from traditional online PDF tools that require you to upload files to their servers.</p>
 
    <p>Our privacy-first architecture makes PDFMinty ideal for processing sensitive documents like tax returns, medical records, financial statements, legal contracts, and any file containing personal information.</p>
 
    <h2>Frequently Asked Questions</h2>
    <h3>Is PDFMinty really free?</h3>
    <p>Yes, PDFMinty is 100% free to use. All ${toolsCount} tools are available without subscription, payment, or registration.</p>
 
    <h3>Are my files uploaded to your server?</h3>
    <p>For our standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exception is the AI Analyze tool, which only sends extracted text to Google Gemini after you explicitly check a consent box.</p>
 
    <h3>What is the maximum file size?</h3>
    <p>PDFMinty can handle individual PDF files up to 100MB and combined operations up to 150MB total. Performance depends on your device's memory and processing power.</p>
 
    <h3>Do I need to install any software?</h3>
    <p>No installation required. PDFMinty runs in any modern browser (Chrome, Firefox, Safari, Edge). You can also install it as a PWA for offline access.</p>
 
    <h2>Start Processing Your PDFs Now</h2>
    <p>Browse our complete collection of PDF tools above. All tools are free, private, and work instantly in your browser.</p>

    <div style="margin-top: 2.5rem; text-align: center;">
      <p style="font-weight: 600; margin-bottom: 1rem;">Recognized &amp; Featured On</p>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.5rem;">
        <a href="https://launchbuff.com/products/pdfminty-8g15b8" target="_blank" rel="noopener noreferrer" title="Featured on LaunchBuff">
          <img src="https://launchbuff.com/badge-featured-dark.svg" alt="Featured on LaunchBuff" width="256" height="80" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
        <a href="https://launchstag.com/p/pdfminty" target="_blank" rel="noopener" title="Featured on Launchstag">
          <img src="https://launchstag.com/badge-light.svg" alt="Featured on Launchstag" width="198" height="62" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
      </div>
    </div>
  </main>
`;

  const homepageFaqSchema = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is PDFMinty really free?",
        "acceptedAnswer": {"@type": "Answer", "text": "Yes, PDFMinty is 100% free to use. All ${toolsCount} tools are available without subscription, payment, or registration."}
      },
      {
        "@type": "Question",
        "name": "Are my files uploaded to your server?",
        "acceptedAnswer": {"@type": "Answer", "text": "For our standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exception is the AI Analyze tool, which only sends extracted text to Google Gemini after you explicitly check a consent box."}
      },
      {
        "@type": "Question",
        "name": "What is the maximum file size?",
        "acceptedAnswer": {"@type": "Answer", "text": "PDFMinty can handle individual PDF files up to 100MB and combined operations up to 150MB total. Performance depends on your device's memory and processing power."}
      },
      {
        "@type": "Question",
        "name": "Do I need to install any software?",
        "acceptedAnswer": {"@type": "Answer", "text": "No installation required. PDFMinty runs in any modern browser. You can also install it as a PWA for offline access."}
      }
    ]
  }
  </script>
`;

  let homepageHtml: string = cleanBaseTemplate(baseHtml);

  const homepageHreflangs = SUPPORTED_LOCALES.map(loc => 
    `  <link rel="alternate" hreflang="${loc}" href="${SITE_URL}${loc === 'en' ? '/' : `/${loc}/`}">`
  ).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`;

  const homepageHead = `
  <title>PDFMinty — Free Privacy-First PDF Toolkit</title>
  <meta name="description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <link rel="canonical" href="${SITE_URL}/">
${homepageHreflangs}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta property="og:description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_URL}/">
  <meta name="twitter:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta name="twitter:description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebApplication",
    "name": "PDFMinty", "url": "${SITE_URL}/",
    "description": "Free, privacy-first online PDF toolkit. Merge, split, compress, rotate, watermark, and analyze PDFs entirely in your browser.",
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "PDF Software",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "author": { "@type": "Organization", "name": "PDFMinty", "url": "${SITE_URL}/" },
    "publisher": { "@type": "Organization", "name": "PDFMinty", "logo": { "@type": "ImageObject", "url": "${SITE_URL}/logo-512.png", "width": 512, "height": 512 } },
    "image": { "@type": "ImageObject", "url": "${SITE_URL}/og-image.png", "width": 1200, "height": 630 },
    "featureList": [
      "Merge multiple PDF files", "Split PDF into separate pages", "Compress PDF file size",
      "Rotate PDF pages", "Delete pages from PDF", "Add watermarks to PDF", "Add page numbers",
      "Insert blank pages", "Password protect PDF", "Unlock password-protected PDF",
      "Convert images to PDF", "Convert PDF to images", "AI-powered PDF analysis"
    ]
  }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "Organization",
    "@id": "${SITE_URL}/#organization",
    "name": "PDFMinty", "url": "${SITE_URL}/",
    "logo": { "@type": "ImageObject", "url": "${SITE_URL}/logo-512.png", "width": 512, "height": 512 },
    "image": "${SITE_URL}/og-image.png",
    "description": "Privacy-first, client-side PDF toolkit with 23 free tools.",
    "foundingDate": "2025",
    "contactPoint": {
      "@type": "ContactPoint", "contactType": "customer support",
      "email": "support@pdfminty.com",
      "url": "${SITE_URL}/contact/",
      "availableLanguage": ["English"]
    }
  }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebSite",
    "@id": "${SITE_URL}/#website",
    "url": "${SITE_URL}/", "name": "PDFMinty",
    "publisher": { "@id": "${SITE_URL}/#organization" },
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": "${SITE_URL}/?q={search_term_string}" },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  ${homepageFaqSchema}
  `;

  // 1. Inject Head meta and FAQ schema before </head>
  homepageHtml = homepageHtml.replace("</head>", `${homepageHead}\n</head>`);

  // 2. Inject pre-rendered content into #root
  const homepageRootContent = `
    <div id="root">
      ${homepageContent}
    </div>
  `;
  homepageHtml = homepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, homepageRootContent.trim());

  fs.writeFileSync(distIndexHtmlPath, homepageHtml, "utf8");
  logger.info("Successfully pre-rendered static HTML for the Homepage at dist/index.html");

  // ----------------------------------------------------
  // Pre-render Localized Homepages
  // ----------------------------------------------------
  const localizedHomepages = [
    {
      code: 'de',
      title: 'PdfMinty — Kostenlose datenschutzfreundliche PDF-Werkzeuge (100% im Browser)',
      desc: 'Kostenlose PDF-Tools direkt im Browser. PDF zusammenfügen, teilen, komprimieren und schützen. Keine Uploads, keine Registrierung, 100% Datenschutz.',
    },
    {
      code: 'fr',
      title: 'PdfMinty — Outils PDF gratuits et confidentiels (100% dans le navigateur)',
      desc: 'Suite d’outils PDF gratuits dans votre navigateur. Fusionnez, divisez, compressez et protégez vos fichiers PDF sans téléversement et en toute confidentialité.',
    },
    {
      code: 'es',
      title: 'PdfMinty — Herramientas PDF gratis y privadas (100% en el navegador)',
      desc: 'Herramientas PDF gratuitas en tu navegador. Une, divide, comprime y protege PDFs sin subir archivos a servidores. 100% privado y seguro.',
    },
    {
      code: 'bn',
      title: 'PdfMinty — বিনামূল্যে গোপনীয়তা-বান্ধব পিডিএফ টুলস (১০০% ব্রাউজারে)',
      desc: 'ব্রাউজারেই বিনামূল্যে পিডিএফ টুলস। কোনো সার্ভার আপলোড বা নিবন্ধন ছাড়া পিডিএফ যুক্ত করুন, ভাগ করুন, সংকুচিত করুন এবং সুরক্ষিত করুন। ১০০% গোপনীয়তা।',
    },
    {
      code: 'hi',
      title: 'PdfMinty — मुफ्त प्राइवेसी-फर्स्ट पीडीएफ टूल्स (100% ब्राउज़र में)',
      desc: 'आपके ब्राउज़र में मुफ्त पीडीएफ टूल्स। सर्वर अपलोड या रजिस्ट्रेशन के बिना पीडीएफ मर्ज, स्प्लिट, कंप्रेस और प्रोटेक्ट करें। 100% प्राइवेसी।',
    },
    {
      code: 'zh',
      title: 'PdfMinty — 免费的隐私优先PDF工具（100%在浏览器中运行）',
      desc: '直接在浏览器中使用的免费PDF工具。无需服务器上传或注册，即可合并、拆分、压缩和保护PDF。100%隐私安全。',
    },
  ];

  const cleanSiteUrl = SITE_URL.replace(/\/+$/, '');

  for (const eu of localizedHomepages) {
    const euHomepageDir = path.join(distDir, eu.code);
    if (!fs.existsSync(euHomepageDir)) {
      fs.mkdirSync(euHomepageDir, { recursive: true });
    }

    const euCanonical = `${cleanSiteUrl}/${eu.code}/`;
    const hreflangLinks = SUPPORTED_LOCALES.map(loc => 
      `  <link rel="alternate" hreflang="${loc}" href="${cleanSiteUrl}${loc === 'en' ? '/' : `/${loc}/`}">`
    ).join('\n');

    const euHeadMeta = `
  <title>${eu.title}</title>
  <meta name="description" content="${eu.desc}">
  <link rel="canonical" href="${euCanonical}">
${hreflangLinks}
  <link rel="alternate" hreflang="x-default" href="${cleanSiteUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${eu.title}">
  <meta property="og:description" content="${eu.desc}">
  <meta property="og:url" content="${euCanonical}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${euCanonical}">
  <meta name="twitter:title" content="${eu.title}">
  <meta name="twitter:description" content="${eu.desc}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  `;

    let euHomepageHtml = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${eu.code}"`);
    if (!euHomepageHtml.includes(`lang="${eu.code}"`)) {
      euHomepageHtml = euHomepageHtml.replace('<html', `<html lang="${eu.code}"`);
    }
    euHomepageHtml = euHomepageHtml.replace("</head>", `${euHeadMeta}\n</head>`);
    euHomepageHtml = euHomepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, homepageRootContent.trim());
    fs.writeFileSync(path.join(euHomepageDir, 'index.html'), euHomepageHtml, 'utf8');
    logger.info(`Successfully pre-rendered static HTML for ${eu.code.toUpperCase()} Homepage at dist/${eu.code}/index.html`);
  }

  // Generate static redirect pages for high search-volume aliases
  const aliasRoutes = [
    { alias: 'jpg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'jpeg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'png-to-pdf', target: 'image-to-pdf', title: 'PNG to PDF — Convert PNG Images to PDF Free | PDFMinty' },
    { alias: 'pdf-to-jpg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-jpeg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-png', target: 'pdf-to-image', title: 'PDF to PNG — Convert PDF to High Quality PNG Images Free | PDFMinty' },
  ];

  for (const { alias, target, title } of aliasRoutes) {
    const aliasDir = path.join(distDir, alias);
    if (!fs.existsSync(aliasDir)) {
      fs.mkdirSync(aliasDir, { recursive: true });
    }
    const targetUrl = `${cleanSiteUrl}/${target}/`;
    const aliasHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/${target}/">
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="Redirecting to ${title}">
  <link rel="canonical" href="${targetUrl}">
  <title>${title}</title>
</head>
<body>
  <p>Redirecting to <a href="/${target}/">${title}</a>...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(aliasDir, 'index.html'), aliasHtml, 'utf8');
    logger.info(`Generated search-intent alias redirect at: dist/${alias}/index.html -> /${target}/`);
  }
}

run().catch((err: unknown) => {
  logger.error("FATAL: Failed to pre-render static HTML pages:", err);
  process.exit(1);
});
