import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

import { HOMEPAGE_H1 } from '../src/config/homeConfig';
import { PRIMARY_AUTHOR } from '../src/config/author';
import { SITE_URL, SITE_NAME, TOOLS, ToolSEOInfo, RELATED_TOOL_MAPPING } from '../src/config/seo-data';
import { MERGE_PDF_LOCALIZED_DATA, buildLocalizedMergePdfHtml } from '../src/data/localizedMergePdfData';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_TOOL_SLUGS, isI18nToolSlug, getHreflangs, getCanonicalUrl } from '../src/i18n/config';
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

      // 4. favicon.ico (True ICO binary containing 16x16 and 32x32 frames) & favicon.png
      const png16 = await sharp(iconSource).resize(16, 16).png().toBuffer();
      const png32 = await sharp(iconSource).resize(32, 32).png().toBuffer();
      const icoBuffer = await pngToIco([png16, png32]);
      await fs.promises.writeFile(path.join(target, 'favicon.ico'), icoBuffer);
      await fs.promises.writeFile(path.join(target, 'favicon.png'), png32);

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
  
  // Clean base HTML to avoid double definitions (purging titles, descriptions, keywords, canonicals, OGs, Twitters, and JSON-LD markup)
  function cleanBaseTemplate(html: string): string {
    let clean: string = html;
    clean = clean.replace(/<title>[^<]*<\/title>/gi, "");
    clean = clean.replace(/<meta\s+name="description"[^>]*>/gi, "");
    clean = clean.replace(/<meta\s+name="keywords"[^>]*>/gi, "");
    clean = clean.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
    clean = clean.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, "");
    clean = clean.replace(/<meta\s+property="og:[^>]*>/gi, ""); // Purge all og: properties
    clean = clean.replace(/<meta\s+name="twitter:[^>]*>/gi, ""); // Purge all twitter: properties
    
    // Purge any homepage-only JSON-LD structured script elements to avoid duplication
    clean = clean.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
    
    // Reset #root container thoroughly
    clean = clean.replace(/<div\s+id="root"[\s\S]*?(?=\s*(?:<script|<!--|<\/body>))/i, '<div id="root"></div>');

    return clean;
  }
  
  const optimizedBase: string = cleanBaseTemplate(baseHtml);

  // Complete PDF tool links ordered by global user popularity for rich crawlable static footer
  const STATIC_FOOTER_TOOL_LINKS = [
    { slug: 'merge-pdf', name: 'Merge PDF' },
    { slug: 'compress-pdf', name: 'Compress PDF' },
    { slug: 'split-pdf', name: 'Split PDF' },
    { slug: 'pdf-to-image', name: 'PDF to Image' },
    { slug: 'image-to-pdf', name: 'Image to PDF' },
    { slug: 'sign-pdf', name: 'Sign PDF' },
    { slug: 'ocr-pdf', name: 'OCR PDF' },
    { slug: 'rotate-pdf', name: 'Rotate PDF' },
    { slug: 'delete-pages-pdf', name: 'Delete PDF Pages' },
    { slug: 'extract-pages-pdf', name: 'Extract PDF Pages' },
    { slug: 'reorder-pdf', name: 'Reorder PDF Pages' },
    { slug: 'unlock-pdf', name: 'Unlock PDF' },
    { slug: 'protect-pdf', name: 'Protect PDF' },
    { slug: 'add-page-numbers', name: 'Add Page Numbers' },
    { slug: 'watermark-pdf', name: 'Watermark PDF' },
    { slug: 'ai-analyze-pdf', name: 'AI Analyze PDF' },
    { slug: 'repair-pdf', name: 'Repair PDF' },
    { slug: 'flatten-pdf', name: 'Flatten PDF' },
    { slug: 'compare-pdf', name: 'Compare PDF' },
    { slug: 'grayscale-pdf', name: 'Grayscale PDF' },
    { slug: 'pdf-to-markdown', name: 'PDF to Markdown' },
    { slug: 'edit-pdf-metadata', name: 'Edit PDF Metadata' },
    { slug: 'sanitize-pdf', name: 'Sanitize PDF' },
    { slug: 'add-blank-page', name: 'Add Blank Page' },
  ];

  interface StaticShellLocaleStrings {
    navAria: string;
    home: string;
    allTools: string;
    pricing: string;
    blog: string;
    compare: string;
    about: string;
    contact: string;
    pdfToolsHeading: string;
    companyHeading: string;
    aboutUs: string;
    pricingPlans: string;
    contactUs: string;
    adobeAlt: string;
    legalHeading: string;
    privacyPolicy: string;
    termsOfService: string;
    resourcesHeading: string;
    knowledgeHub: string;
    vsSmallpdf: string;
    vsIlovepdf: string;
    isOnlineSafe: string;
    adobeSecurity: string;
    compressGuide: string;
    copyrightTagline: string;
  }

  const STATIC_SHELL_STRINGS: Record<string, StaticShellLocaleStrings> = {
    en: {
      navAria: 'Main Navigation',
      home: 'Home',
      allTools: 'All Tools',
      pricing: 'Pricing',
      blog: 'Blog',
      compare: 'Compare',
      about: 'About',
      contact: 'Contact',
      pdfToolsHeading: 'PDF Tools',
      companyHeading: 'Company',
      aboutUs: 'About Us',
      pricingPlans: 'Pricing Plans',
      contactUs: 'Contact Us',
      adobeAlt: 'Adobe Acrobat Alternative',
      legalHeading: 'Legal',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      resourcesHeading: 'Blog & Resources',
      knowledgeHub: 'Knowledge Hub',
      vsSmallpdf: 'PDFMinty vs Smallpdf',
      vsIlovepdf: 'PDFMinty vs iLovePDF',
      isOnlineSafe: 'Is Online PDF Safe?',
      adobeSecurity: 'Adobe vs Browser Security',
      compressGuide: 'How to Compress PDF Without Losing Quality',
      copyrightTagline: 'Free Privacy-First Browser PDF Toolkit. 100% Local Processing.',
    },
    de: {
      navAria: 'Hauptnavigation',
      home: 'Startseite',
      allTools: 'Alle Werkzeuge',
      pricing: 'Preise',
      blog: 'Ratgeber',
      compare: 'Vergleich',
      about: 'Über uns',
      contact: 'Kontakt',
      pdfToolsHeading: 'PDF-Werkzeuge',
      companyHeading: 'Unternehmen',
      aboutUs: 'Über uns',
      pricingPlans: 'Preise & Tarife',
      contactUs: 'Kontakt',
      adobeAlt: 'Adobe Acrobat Alternative',
      legalHeading: 'Rechtliches',
      privacyPolicy: 'Datenschutzerklärung',
      termsOfService: 'Nutzungsbedingungen',
      resourcesHeading: 'Blog & Ressourcen',
      knowledgeHub: 'Wissensdatenbank',
      vsSmallpdf: 'PDFMinty vs. Smallpdf',
      vsIlovepdf: 'PDFMinty vs. iLovePDF',
      isOnlineSafe: 'Sind Online-PDF-Tools sicher?',
      adobeSecurity: 'Adobe vs. Browser-Sicherheit',
      compressGuide: 'PDF komprimieren ohne Qualitätsverlust',
      copyrightTagline: 'Kostenloses datenschutzorientiertes Browser-PDF-Toolkit. 100% lokale Verarbeitung.',
    },
    fr: {
      navAria: 'Navigation principale',
      home: 'Accueil',
      allTools: 'Tous les outils',
      pricing: 'Tarifs',
      blog: 'Blog',
      compare: 'Comparer',
      about: 'À propos',
      contact: 'Contact',
      pdfToolsHeading: 'Outils PDF',
      companyHeading: 'Entreprise',
      aboutUs: 'À propos de nous',
      pricingPlans: 'Forfaits et tarifs',
      contactUs: 'Nous contacter',
      adobeAlt: 'Alternative à Adobe Acrobat',
      legalHeading: 'Mentions légales',
      privacyPolicy: 'Politique de confidentialité',
      termsOfService: 'Conditions d’utilisation',
      resourcesHeading: 'Blog et ressources',
      knowledgeHub: 'Centre de connaissances',
      vsSmallpdf: 'PDFMinty vs Smallpdf',
      vsIlovepdf: 'PDFMinty vs iLovePDF',
      isOnlineSafe: 'Les outils PDF en ligne sont-ils sûrs ?',
      adobeSecurity: 'Sécurité Adobe vs navigateur',
      compressGuide: 'Compresser un PDF sans perte de qualité',
      copyrightTagline: 'Boîte à outils PDF gratuite et confidentielle dans le navigateur. Traitement 100 % local.',
    },
    es: {
      navAria: 'Navegación principal',
      home: 'Inicio',
      allTools: 'Todas las herramientas',
      pricing: 'Precios',
      blog: 'Blog',
      compare: 'Comparar',
      about: 'Nosotros',
      contact: 'Contacto',
      pdfToolsHeading: 'Herramientas PDF',
      companyHeading: 'Empresa',
      aboutUs: 'Sobre nosotros',
      pricingPlans: 'Planes y precios',
      contactUs: 'Contacto',
      adobeAlt: 'Alternativa a Adobe Acrobat',
      legalHeading: 'Legal',
      privacyPolicy: 'Política de privacidad',
      termsOfService: 'Términos de servicio',
      resourcesHeading: 'Blog y recursos',
      knowledgeHub: 'Centro de conocimiento',
      vsSmallpdf: 'PDFMinty vs Smallpdf',
      vsIlovepdf: 'PDFMinty vs iLovePDF',
      isOnlineSafe: '¿Es seguro usar herramientas PDF en línea?',
      adobeSecurity: 'Seguridad de Adobe vs navegador',
      compressGuide: 'Cómo comprimir un PDF sin perder calidad',
      copyrightTagline: 'Kit de herramientas PDF gratuito y privado en el navegador. Procesamiento 100 % local.',
    },
    bn: {
      navAria: 'প্রধান নেভিগেশন',
      home: 'হোম',
      allTools: 'সকল টুলস',
      pricing: 'মূল্য তালিকা',
      blog: 'ব্লগ',
      compare: 'তুলনা',
      about: 'আমাদের সম্পর্কে',
      contact: 'যোগাযোগ',
      pdfToolsHeading: 'পিডিএফ টুলস',
      companyHeading: 'প্রতিষ্ঠান',
      aboutUs: 'আমাদের সম্পর্কে',
      pricingPlans: 'প্রাইসিং প্ল্যান',
      contactUs: 'যোগাযোগ করুন',
      adobeAlt: 'অ্যাডোবি অ্যাক্রোব্যাট বিকল্প',
      legalHeading: 'আইনি তথ্য',
      privacyPolicy: 'গোপনীয়তা নীতি',
      termsOfService: 'ব্যবহারের শর্তাবলী',
      resourcesHeading: 'ব্লগ ও রিসোর্স',
      knowledgeHub: 'নলেজ হাব',
      vsSmallpdf: 'PDFMinty বনাম Smallpdf',
      vsIlovepdf: 'PDFMinty বনাম iLovePDF',
      isOnlineSafe: 'অনলাইন পিডিএফ টুল কি নিরাপদ?',
      adobeSecurity: 'অ্যাডোবি বনাম ব্রাউজার নিরাপত্তা',
      compressGuide: 'মান না কমিয়ে পিডিএফ কমপ্রেস করার উপায়',
      copyrightTagline: 'বিনামূল্যে প্রাইভেসি-ফার্স্ট ব্রাউজার পিডিএফ টুলকিট। ১০০% লোকাল প্রসেসিং।',
    },
    hi: {
      navAria: 'मुख्य नेविगेशन',
      home: 'होम',
      allTools: 'सभी टूल्स',
      pricing: 'मूल्य निर्धारण',
      blog: 'ब्लॉग',
      compare: 'तुलना करें',
      about: 'हमारे बारे में',
      contact: 'संपर्क करें',
      pdfToolsHeading: 'पीडीएफ टूल्स',
      companyHeading: 'कंपनी',
      aboutUs: 'हमारे बारे में',
      pricingPlans: 'प्राइसिंग प्लान',
      contactUs: 'संपर्क करें',
      adobeAlt: 'Adobe Acrobat का विकल्प',
      legalHeading: 'कानूनी जानकारी',
      privacyPolicy: 'गोपनीयता नीति',
      termsOfService: 'सेवा की शर्तें',
      resourcesHeading: 'ब्लॉग और संसाधन',
      knowledgeHub: 'नॉलेज हब',
      vsSmallpdf: 'PDFMinty बनाम Smallpdf',
      vsIlovepdf: 'PDFMinty बनाम iLovePDF',
      isOnlineSafe: 'क्या ऑनलाइन पीडीएफ सुरक्षित है?',
      adobeSecurity: 'Adobe बनाम ब्राउज़र सुरक्षा',
      compressGuide: 'बिना गुणवत्ता खोए पीडीएफ कंप्रेस कैसे करें',
      copyrightTagline: 'मुफ़्त प्राइवेसी-फर्स्ट ब्राउज़र पीडीएफ टूलकिट। 100% लोकल प्रोसेसिंग।',
    },
    zh: {
      navAria: '主导航',
      home: '首页',
      allTools: '所有工具',
      pricing: '价格方案',
      blog: '技术博客',
      compare: '功能对比',
      about: '关于我们',
      contact: '联系我们',
      pdfToolsHeading: 'PDF 工具箱',
      companyHeading: '关于公司',
      aboutUs: '关于我们',
      pricingPlans: '订阅与终身方案',
      contactUs: '联系客服',
      adobeAlt: 'Adobe Acrobat 免费替代方案',
      legalHeading: '法律与隐私',
      privacyPolicy: '隐私政策',
      termsOfService: '服务条款',
      resourcesHeading: '知识库与指南',
      knowledgeHub: 'PDF 知识中心',
      vsSmallpdf: 'PDFMinty 对比 Smallpdf',
      vsIlovepdf: 'PDFMinty 对比 iLovePDF',
      isOnlineSafe: '在线 PDF 工具安全吗？',
      adobeSecurity: '本地浏览器与传统软件安全性对比',
      compressGuide: '如何无损压缩 PDF 文件大小',
      copyrightTagline: '免费隐私优先的浏览器端 PDF 工具箱。100% 本地 WebAssembly 处理。',
    },
  };

  // Helper to build semantic lightweight static header for pre-rendered pages
  function buildStaticHeader(locale: string = DEFAULT_LOCALE): string {
    const homeHref = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
    const s = STATIC_SHELL_STRINGS[locale] || STATIC_SHELL_STRINGS.en;
    return `      <header data-prerender="true" class="site-header">
        <div class="site-header-inner">
          <a href="${homeHref}" class="brand-logo" aria-label="PDFMinty home">
            <img src="/logo.svg" alt="PDFMinty" width="28" height="28" />
            <span>PDFMinty</span>
          </a>
          <nav aria-label="${s.navAria}">
            <ul>
              <li><a href="${homeHref}">${s.home}</a></li>
              <li><a href="${homeHref}#all-tools">${s.allTools}</a></li>
              <li><a href="/pricing/">${s.pricing}</a></li>
              <li><a href="/blog/">${s.blog}</a></li>
              <li><a href="/compare/pdfminty-vs-smallpdf/">${s.compare}</a></li>
              <li><a href="/about-us/">${s.about}</a></li>
              <li><a href="/contact/">${s.contact}</a></li>
            </ul>
          </nav>
        </div>
      </header>`;
  }

  interface LocaleCommonJson {
    header?: { siteName?: string; nav?: { home?: string; allTools?: string } };
    footer?: { badges?: { privacyFirst?: string } };
    toolCommon?: {
      selectPdfFile?: string;
      selectPdfFiles?: string;
      selectPdf?: string;
      processLocally?: string;
      process?: string;
      downloadResult?: string;
      download?: string;
    };
    fileUploader?: { dropFilesHere?: string; upToSize?: string; dragDrop?: string };
    relatedTools?: { title?: string };
    tools?: Record<string, { name?: string; desc?: string }>;
  }

  const localeCommonCache: Record<string, LocaleCommonJson> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const commonPath = path.join(__dirname, `../src/locales/${loc}/common.json`);
    if (fs.existsSync(commonPath)) {
      try {
        localeCommonCache[loc] = JSON.parse(fs.readFileSync(commonPath, 'utf8')) as LocaleCommonJson;
      } catch {
        // Ignore parse error
      }
    }
  }

  // Helper to build semantic lightweight static footer with 4 rich columns
  function buildStaticFooter(locale: string = DEFAULT_LOCALE): string {
    const homeHref = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
    const locDict = localeCommonCache[locale];
    const s = STATIC_SHELL_STRINGS[locale] || STATIC_SHELL_STRINGS.en;
    const toolsListHtml = STATIC_FOOTER_TOOL_LINKS.map((t) => {
      const isLocTool = isI18nToolSlug(t.slug);
      const toolHref = locale === DEFAULT_LOCALE || !isLocTool ? `/${t.slug}/` : `/${locale}/${t.slug}/`;
      const toolName =
        locale === DEFAULT_LOCALE ? t.name : locDict?.tools?.[t.slug]?.name || t.name;
      return `              <li><a href="${toolHref}">${toolName}</a></li>`;
    }).join('\n');

    return `      <footer data-prerender="true" class="site-footer">
        <div class="site-footer-inner">
          <div>
            <h3>${s.pdfToolsHeading}</h3>
            <ul>
${toolsListHtml}
            </ul>
          </div>
          <div>
            <h3>${s.companyHeading}</h3>
            <ul>
              <li><a href="/about-us/">${s.aboutUs}</a></li>
              <li><a href="/pricing/">${s.pricingPlans}</a></li>
              <li><a href="/contact/">${s.contactUs}</a></li>
              <li><a href="/adobe-acrobat-alternative/">${s.adobeAlt}</a></li>
            </ul>
          </div>
          <div>
            <h3>${s.legalHeading}</h3>
            <ul>
              <li><a href="/privacy-policy/">${s.privacyPolicy}</a></li>
              <li><a href="/terms-of-service/">${s.termsOfService}</a></li>
            </ul>
          </div>
          <div>
            <h3>${s.resourcesHeading}</h3>
            <ul>
              <li><a href="/blog/">${s.knowledgeHub}</a></li>
              <li><a href="/compare/pdfminty-vs-smallpdf/">${s.vsSmallpdf}</a></li>
              <li><a href="/compare/pdfminty-vs-ilovepdf/">${s.vsIlovepdf}</a></li>
              <li><a href="/blog/is-it-safe-to-upload-pdf-to-online-tools/">${s.isOnlineSafe}</a></li>
              <li><a href="/blog/adobe-security-vulnerabilities-offline-pdf-tools/">${s.adobeSecurity}</a></li>
              <li><a href="/blog/how-to-compress-a-pdf-without-losing-quality-2026/">${s.compressGuide}</a></li>
            </ul>
          </div>
        </div>
        <div>
          <p>&copy; ${new Date().getFullYear()} <a href="${homeHref}" aria-label="PDFMinty home">PDFMinty</a>. ${s.copyrightTagline}</p>
        </div>
      </footer>`;
  }

  // Wrap pre-rendered tool/page content with semantic header, main, and footer inside #root
  function wrapInPrerenderedShell(innerArticleHtml: string, locale: string = DEFAULT_LOCALE): string {
    const headerHtml = buildStaticHeader(locale);
    const footerHtml = buildStaticFooter(locale);

    return `
    <div id="root">
${headerHtml}
      <main data-prerender="true">
${innerArticleHtml}
      </main>
${footerHtml}
    </div>
    `;
  }
  
  function clampMetaDesc(desc: string, maxLen = 160): string {
    const clean = (desc || '').trim();
    if (clean.length <= maxLen) return clean;
    return `${clean.slice(0, maxLen - 3).replace(/\s+\S*$/, '')}...`;
  }

  TOOLS.forEach((item: ToolSEOInfo) => {
    const itemMetaDesc = clampMetaDesc(item.metaDescription || item.shortDescription);
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
        "name": `PDFMinty - ${item.name}`,
        "url": `https://pdfminty.com/${item.slug}/`,
        "inLanguage": "en",
        "description": item.metaDescription || item.shortDescription,
        "applicationCategory": "UtilitiesApplication",
        "applicationSubCategory": "PDF Software",
        "operatingSystem": "Any",
        "browserRequirements": "Requires HTML5, WebAssembly",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        "author": {
          "@type": "Organization",
          "name": SITE_NAME,
          "url": `${SITE_URL}/`
        },
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME,
          "url": `${SITE_URL}/`,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo-512.png`,
            "width": 512,
            "height": 512
          }
        },
        "featureList": [
          "100% client-side processing for our 22 standard PDF tools",
          "Zero file uploads for standard browser PDF operations",
          "Opt-in AI Analyze and OCR PDF tools only send extracted text or page images to Google Gemini after explicit user consent",
          "Free tier available (5 tasks/day for guests up to 100MB, 10 tasks/day for free accounts up to 150MB)",
          "No mandatory registration required"
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
            "position": index + 1,
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
          "mainEntity": {
            "@type": "Person",
            "name": PRIMARY_AUTHOR.name,
            "jobTitle": PRIMARY_AUTHOR.jobTitle,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": PRIMARY_AUTHOR.city,
              "addressCountry": PRIMARY_AUTHOR.country
            },
            "url": `${SITE_URL}/about-us/#creator`,
            "sameAs": [
              PRIMARY_AUTHOR.github
            ]
          },
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": `${SITE_URL}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${SITE_URL}/logo-512.png`,
              "width": 512,
              "height": 512
            },
            "sameAs": [
              PRIMARY_AUTHOR.github
            ]
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
            "url": `${SITE_URL}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${SITE_URL}/logo-512.png`,
              "width": 512,
              "height": 512
            },
            "sameAs": [
              PRIMARY_AUTHOR.github
            ]
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
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        });
      }
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
            "url": `${SITE_URL}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${SITE_URL}/logo-512.png`,
              "width": 512,
              "height": 512
            },
            "sameAs": [
              PRIMARY_AUTHOR.github
            ]
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
          "@type": "Person",
          "name": PRIMARY_AUTHOR.name,
          "jobTitle": PRIMARY_AUTHOR.jobTitle,
          "url": `${SITE_URL}/about-us/#creator`,
          "sameAs": [
            PRIMARY_AUTHOR.github
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": PRIMARY_AUTHOR.city,
            "addressCountry": PRIMARY_AUTHOR.country
          }
        },
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME,
          "url": `${SITE_URL}/`,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo-512.png`,
            "width": 512,
            "height": 512
          },
          "sameAs": [
            PRIMARY_AUTHOR.github
          ]
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
      : `${item.name.toLowerCase()}, ${item.slug.replace(/^(?:blog|compare)\//, '').replace(/-/g, ' ')}, pdf tools`;

    const pageOgImage = `${SITE_URL}${item.ogImage || '/og-image.png'}`;

    // Set custom page head meta tags
    const headMeta: string = `
  <title>${item.metaTitle}</title>
  <meta name="description" content="${itemMetaDesc}">
  <meta name="keywords" content="${pageKeywords}">
  <link rel="canonical" href="${pageUrl}">
${hreflangMarkup ? `${hreflangMarkup}\n` : ''}  <meta property="og:type" content="${item.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${item.metaTitle}">
  <meta property="og:description" content="${itemMetaDesc}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${pageOgImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${item.metaTitle}">
  <meta name="twitter:description" content="${itemMetaDesc}">
  <meta name="twitter:image" content="${pageOgImage}">
  ${jsonLdMarkup}
  `;
  
    // Inject metadata immediately inside the head element
    let preRenderedHtml: string = optimizedBase.replace("</head>", `${headMeta}\n</head>`);
    
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
${relatedTools.map((t: ToolSEOInfo) => `  <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription}</li>`).join('\n')}
</ul>
`;
    };

    // Helper function to render structured tool data (problemSolved, howTo, supportedFormats, technicalNotes, privacyNote, troubleshooting, faqs)
    // so static HTML matches ToolContentSection.tsx and eliminates low word-count / low text-to-HTML ratio issues.
    const buildToolStructuredSectionsHtml = (tool: ToolSEOInfo, existingBody: string): string => {
      if (tool.type !== 'tool') return '';
      const blocks: string[] = [];

      if (tool.problemSolved && !existingBody.includes(tool.problemSolved.slice(0, 32))) {
        blocks.push(`
<section aria-label="Problem Solved">
  <h2>Why Use ${tool.name}?</h2>
  <p>${tool.problemSolved}</p>
</section>`);
      }

      if (tool.howTo && tool.howTo.steps.length > 0 && !existingBody.includes(tool.howTo.steps[0].slice(0, 32))) {
        blocks.push(`
<section aria-label="Step-by-Step Guide">
  <h2>${tool.howTo.name}</h2>
  <ol>
${tool.howTo.steps.map((step, idx) => `    <li id="step${idx + 1}"><strong>Step ${idx + 1}:</strong> ${step}</li>`).join('\n')}
  </ol>
</section>`);
      }

      if (tool.supportedFormats) {
        blocks.push(`
<section aria-label="Supported Formats and File Limits">
  <h2>Supported Formats &amp; Processing Limits</h2>
  <ul>
    <li><strong>Input Format:</strong> ${tool.supportedFormats.input}</li>
    <li><strong>Output Format:</strong> ${tool.supportedFormats.output}</li>
    <li><strong>File Size &amp; Daily Quota:</strong> ${tool.supportedFormats.limits} (Guest: 5 free tasks/day up to 100MB; Free Account: 10 tasks/day up to 150MB; Pro $2.49/mo &amp; Lifetime $50: unlimited daily tasks up to 500MB).</li>
  </ul>
</section>`);
      }

      if (tool.technicalNotes) {
        blocks.push(`
<section aria-label="Technical Specifications">
  <h2>Technical Architecture &amp; Browser Execution</h2>
  <ul>
    <li><strong>Device &amp; Browser Compatibility:</strong> ${tool.technicalNotes.deviceBrowser}</li>
    <li><strong>File Size &amp; Memory Management:</strong> ${tool.technicalNotes.fileSizeMemory}</li>
    <li><strong>Accessibility &amp; Standards:</strong> ${tool.technicalNotes.accessibility}</li>
  </ul>
</section>`);
      }

      if (tool.privacyNote && !existingBody.includes(tool.privacyNote.slice(0, 32))) {
        blocks.push(`
<section aria-label="Privacy and Data Security">
  <h2>100% Privacy-First Architecture</h2>
  <p>${tool.privacyNote}</p>
</section>`);
      }

      if (tool.troubleshooting && tool.troubleshooting.length > 0) {
        blocks.push(`
<section aria-label="Troubleshooting Guide">
  <h2>Common Troubleshooting &amp; Tips for ${tool.name}</h2>
  <div>
${tool.troubleshooting.map((ts) => `    <div>\n      <h3>${ts.issue}</h3>\n      <p>${ts.resolution}</p>\n    </div>`).join('\n')}
  </div>
</section>`);
      }

      if (tool.faqs && tool.faqs.length > 0) {
        const firstQuestionProbe = tool.faqs[0].q.slice(0, 28).toLowerCase();
        if (!existingBody.toLowerCase().includes(firstQuestionProbe)) {
          blocks.push(`
<section aria-label="Frequently Asked Questions">
  <h2>Frequently Asked Questions About ${tool.name}</h2>
  <div>
${tool.faqs.map((f) => `    <div>\n      <h3>${f.q}</h3>\n      <p>${f.a}</p>\n    </div>`).join('\n')}
  </div>
</section>`);
        }
      }

      return blocks.join('\n');
    };

    let finalBody: string = item.longFormBody;
    // Strip any existing <h1> in body completely to avoid duplicate title headings
    finalBody = finalBody.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');
    if (item.type === 'article') {
      finalBody = finalBody.replace(/^\s*<h2\b[^>]*>[\s\S]*?<\/h2>\s*(?=<p\b)/i, '');
    }

    // Prepend the page's exact, canonical <h1> tag
    finalBody = `<h1>${item.h1 || item.name}</h1>\n${finalBody}`;

    if (item.type !== 'article') {
      finalBody += buildToolStructuredSectionsHtml(item, finalBody);
      finalBody += getRelatedToolsHtml(item.slug);
    } else {
      if (item.faqs && item.faqs.length > 0) {
        const firstQuestionProbe = item.faqs[0].q.slice(0, 28).toLowerCase();
        const hasExistingFaqHeading = /<h2[^>]*>\s*(?:\d+\.\s*)?(?:Frequently Asked(?: Technical)? Questions|FAQ)\b/i.test(finalBody);
        if (!hasExistingFaqHeading && !finalBody.toLowerCase().includes(firstQuestionProbe)) {
          finalBody += `
<section aria-label="Frequently Asked Questions" class="my-10 space-y-4">
  <h2>Frequently Asked Questions</h2>
  ${item.faqs
    .map(
      (f) => `
  <div>
    <h3>${f.q}</h3>
    <p>${f.a}</p>
  </div>`
    )
    .join('\n')}
</section>
`;
        }
      }
      // Append Rich Author Bio box in pre-rendered static HTML for AdSense and search engine crawlers
      finalBody += `
<div class="not-prose my-10 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
  <div class="flex items-center gap-4 mb-4">
    <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
      TM
    </div>
    <div>
      <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Article Author & Founder</div>
      <div class="text-lg font-black text-slate-900 dark:text-white">${PRIMARY_AUTHOR.name}</div>
      <div class="text-xs text-slate-500 dark:text-slate-400">${PRIMARY_AUTHOR.jobTitle} • ${PRIMARY_AUTHOR.location} 🇧🇩</div>
    </div>
  </div>
  <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">${PRIMARY_AUTHOR.bio}</p>
  <div class="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center gap-4">
    <a href="/about-us/#creator" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Meet the Creator →</a>
    <a href="mailto:${PRIMARY_AUTHOR.email}" class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Contact Author</a>
    <a href="${PRIMARY_AUTHOR.github}" target="_blank" rel="noopener noreferrer" class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">GitHub Profile</a>
  </div>
</div>
`;
    }

    // Pre-inject longFormBody directly inside the React root element (#root) with semantic header and footer
    const articleHtml = `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          ${finalBody}
        </article>`;
    const preRenderedContent: string = wrapInPrerenderedShell(articleHtml, DEFAULT_LOCALE);
    
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
          const locCommon = localeCommonCache[locLang];
          const locMergeFallback = MERGE_PDF_LOCALIZED_DATA[locLang];
          const locToolEntry = locCommon?.tools?.[item.slug];
          const locToolName = locToolEntry?.name || item.name;
          const locToolDesc = locToolEntry?.desc || item.metaDescription;
          const locPrivacyBadge =
            locCommon?.footer?.badges?.privacyFirst || 'In-Browser Privacy First';

          // Retrieve localized content for merge-pdf or build localized content for other tools
          const locData = item.slug === 'merge-pdf' ? MERGE_PDF_LOCALIZED_DATA[locLang] : undefined;
          const locMetaTitle = locData
            ? locData.metaTitle
            : `${locToolName} — ${locPrivacyBadge} | ${SITE_NAME}`;
          const locMetaDesc = clampMetaDesc(
            locData
              ? locData.metaDescription
              : locToolDesc.length >= 60
                ? locToolDesc
                : `${locToolDesc} — ${locPrivacyBadge}.`
          );

          let locPreRenderedContent = preRenderedContent;
          let locStepsForSchema: { title: string; desc: string }[] = [];
          let locFaqsForSchema: { q: string; a: string }[] = [];
          let locHowToTitleForSchema = locToolName;

          if (locData) {
            const locArticleHtml = buildLocalizedMergePdfHtml(locData, locLang);
            locPreRenderedContent = wrapInPrerenderedShell(locArticleHtml, locLang);
          } else {
            const relatedSlugs = RELATED_TOOL_MAPPING[item.slug] || [];
            const relatedToolsHtml = relatedSlugs
              .map((relSlug: string) => {
                const relTool = TOOLS.find((t: ToolSEOInfo) => t.slug === relSlug && t.type === 'tool');
                if (!relTool) return '';
                const relName = locCommon?.tools?.[relSlug]?.name || relTool.name;
                const relDesc = locCommon?.tools?.[relSlug]?.desc || relTool.shortDescription;
                return `              <li><a href="/${locLang}/${relSlug}/">${relName}</a> — ${relDesc}</li>`;
              })
              .filter(Boolean)
              .join('\n');

            interface LocalizedToolRichTemplate {
              howToHeading: string;
              overviewHeading: string;
              overviewP1: string;
              overviewP2: string;
              steps: { title: string; desc: string }[];
              specsHeading: string;
              specsItems: string[];
              privacyHeading: string;
              privacyText: string;
              extraFaqs: { q: string; a: string }[];
              keywords: string;
            }

            const locTemplates: Record<string, LocalizedToolRichTemplate> = {
              de: {
                howToHeading: `So funktioniert ${locToolName} Schritt für Schritt im Browser`,
                overviewHeading: `Überblick: ${locToolName} ohne Server-Upload`,
                overviewP1: `${locToolName} von PDFMinty ermöglicht es Ihnen, vertrauliche PDF-Dokumente direkt in Ihrem Webbrowser zu bearbeiten. Dank moderner WebAssembly- und HTML5-Technologie werden alle 22 Standard-PDF-Werkzeuge zu 100 % lokal im Arbeitsspeicher Ihres Endgeräts ausgeführt. Ihre sensiblen Verträge, Rechnungen, Steuerunterlagen oder Personalakten werden niemals auf externe Server hochgeladen.`,
                overviewP2: `Sie können sofort ohne Registrierung starten: Als Gast stehen Ihnen täglich 5 kostenlose Aufgaben mit bis zu 100 MB pro Datei zur Verfügung. Mit einem kostenlosen PDFMinty-Konto erhöhen Sie Ihr Kontingent auf 10 Aufgaben pro Tag und 150 MB Dateigröße. Für professionelle Workflows bieten der Pro-Tarif ($2,49/Monat) und der Lifetime-Tarif ($50 einmalig) unbegrenzte tägliche Aufgaben und 500 MB Dateigröße.`,
                steps: [
                  { title: '1. PDF-Datei im Browser auswählen', desc: `${locCommon?.fileUploader?.dragDrop || 'Ziehen Sie Ihre PDF-Datei per Drag-and-Drop in das Auswahlfeld'} oder klicken Sie auf die Schaltfläche, um ein Dokument bis zu 100 MB (Gast), 150 MB (Konto) bzw. 500 MB (Pro) direkt von Ihrem Gerät zu laden.` },
                  { title: '2. Einstellungen & Optionen anpassen', desc: `Konfigurieren Sie die gewünschten Parameter für ${locToolName} direkt in der übersichtlichen Vorschau. Alle Seiten- und Dokumenteigenschaften werden verzögerungsfrei in Ihrem Browser berechnet.` },
                  { title: '3. Lokale WebAssembly-Verarbeitung starten', desc: `Klicken Sie auf „${locCommon?.toolCommon?.process || 'Verarbeiten'}“. Die Berechnung erfolgt vollständig lokal auf Ihrem Computer oder Smartphone ohne Datenübertragung ins Internet.` },
                  { title: '4. Fertiges PDF sofort herunterladen', desc: `Speichern Sie das bearbeitete PDF-Dokument ohne Wasserzeichen direkt auf Ihrem Gerät. Nach dem Schließen des Tabs wird der Browser-Speicher automatisch bereinigt.` },
                ],
                specsHeading: 'Technische Spezifikationen & Kontingente',
                specsItems: [
                  'Verarbeitungsarchitektur: 100 % clientseitiges WebAssembly (@cantoo/pdf-lib & PDF.js) für alle 22 Standard-Tools',
                  'Optionale Cloud-KI: Nur die 2 Werkzeuge „AI Analyze PDF“ und „OCR PDF“ senden nach ausdrücklicher Zustimmung Daten an Google Gemini',
                  'Maximale Dateigröße: 100 MB (Gast ohne Login) • 150 MB (Kostenloses Konto) • 500 MB (Pro & Lifetime)',
                  'Tägliches Aufgabenlimit: 5 Aufgaben/Tag (Gast) • 10 Aufgaben/Tag (Kostenloses Konto) • Unbegrenzt (Pro $2,49/Monat & Lifetime $50)',
                  'Kompatibilität: Windows, macOS, Linux, iOS und Android in Chrome, Firefox, Safari und Edge (auch offline als PWA)',
                ],
                privacyHeading: 'Datenschutz & DSGVO-Konformität',
                privacyText: `Da ${locToolName} als Teil unserer 22 Standard-PDF-Werkzeuge lokal im Browser arbeitet, verlassen Ihre Dateien Ihr Gerät zu keinem Zeitpunkt. Dies erfüllt höchste Anforderungen an den Datenschutz gemäß DSGVO für Kanzleien, Arztpraxen, Behörden und Unternehmen.`,
                extraFaqs: [
                  { q: `Werden meine Dateien bei der Nutzung von ${locToolName} gespeichert?`, a: 'Nein. Bei unseren 22 Standard-PDF-Tools findet keinerlei Upload auf unsere Server statt. Die gesamte Verarbeitung läuft lokal im RAM Ihres Browsers.' },
                  { q: `Fügt ${locToolName} ein Wasserzeichen in mein Dokument ein?`, a: 'Nein. Alle mit PDFMinty erstellten oder bearbeiteten PDF-Dateien sind auch im kostenlosen Tarif vollständig frei von Wasserzeichen oder Werbestempeln.' },
                ],
                keywords: `${locToolName}, PDF online bearbeiten, PDF Werkzeug kostenlos, PDF im Browser, Datenschutz PDF, PDFMinty Deutsch`,
              },
              fr: {
                howToHeading: `Comment utiliser ${locToolName} étape par étape dans votre navigateur`,
                overviewHeading: `Présentation : ${locToolName} 100 % local sans téléversement`,
                overviewP1: `L’outil ${locToolName} de PDFMinty vous permet de traiter vos documents PDF confidentiels directement dans votre navigateur web. Grâce à la technologie WebAssembly et HTML5, nos 22 outils PDF standard s’exécutent à 100 % localement dans la mémoire vive de votre appareil. Vos contrats, factures, relevés bancaires et dossiers médicaux ne quittent jamais votre ordinateur ou votre smartphone.`,
                overviewP2: `Aucune inscription n’est requise pour commencer : les visiteurs invités bénéficient de 5 tâches gratuites par jour jusqu’à 100 Mo par fichier. En créant un compte gratuit, vous disposez de 10 tâches quotidiennes et d’une limite de 150 Mo par fichier. Les formules Pro (2,49 $/mois) et Lifetime (50 $ en paiement unique) débloquent des tâches illimitées et des fichiers jusqu’à 500 Mo.`,
                steps: [
                  { title: '1. Sélectionnez votre fichier PDF', desc: `${locCommon?.fileUploader?.dragDrop || 'Glissez-déposez votre document PDF dans la zone dédiée'} ou sélectionnez un fichier depuis votre appareil (jusqu’à 100 Mo en invité, 150 Mo avec compte gratuit, 500 Mo en Pro).` },
                  { title: '2. Configurez vos options de traitement', desc: `Ajustez les paramètres de ${locToolName} grâce à l’aperçu interactif instantané. Toutes les pages sont analysées localement sans latence réseau.` },
                  { title: '3. Lancez l’exécution locale WebAssembly', desc: `Cliquez sur « ${locCommon?.toolCommon?.process || 'Traiter'} ». Le moteur client-side transforme votre PDF en quelques secondes directement dans votre navigateur.` },
                  { title: '4. Téléchargez votre PDF finalisé', desc: `Enregistrez immédiatement votre fichier PDF modifié sans aucun filigrane. La mémoire temporaire du navigateur est automatiquement purgée après l’opération.` },
                ],
                specsHeading: 'Spécifications techniques et limites d’utilisation',
                specsItems: [
                  'Moteur d’exécution : WebAssembly 100 % côté client (@cantoo/pdf-lib et PDF.js) pour les 22 outils PDF standard',
                  'Outils IA optionnels : Seuls les 2 outils Analyse IA et OCR PDF transmettent des données à Google Gemini après votre consentement explicite',
                  'Taille maximale par fichier : 100 Mo (Invité) • 150 Mo (Compte gratuit) • 500 Mo (Pro et Lifetime)',
                  'Quota quotidien : 5 tâches/jour (Invité) • 10 tâches/jour (Compte gratuit) • Illimité (Pro 2,49 $/mois et Lifetime 50 $)',
                  'Systèmes supportés : Windows, macOS, Linux, iOS et Android sur Chrome, Firefox, Safari et Edge (compatible PWA hors ligne)',
                ],
                privacyHeading: 'Confidentialité absolue et conformité RGPD',
                privacyText: `Avec ${locToolName}, vos documents sensibles restent strictement sur votre appareil pour l’ensemble des 22 outils standard. Cette architecture zéro-serveur garantit une conformité optimale avec le RGPD pour les professionnels du droit, de la santé et de la finance.`,
                extraFaqs: [
                  { q: `Mes fichiers sont-ils envoyés sur un serveur lors de l’utilisation de ${locToolName} ?`, a: 'Non. Pour nos 22 outils PDF standard, aucun fichier n’est téléversé sur un serveur distant. Tout le traitement s’effectue localement dans votre navigateur.' },
                  { q: `L’outil ${locToolName} ajoute-t-il un filigrane sur mes documents ?`, a: 'Jamais. Tous les fichiers générés sur PDFMinty sont propres, professionnels et garantis sans filigrane publicitaire, même sur l’offre gratuite.' },
                ],
                keywords: `${locToolName}, outil PDF gratuit, modifier PDF en ligne, PDF sans téléversement, confidentialité PDF, PDFMinty Français`,
              },
              es: {
                howToHeading: `Cómo usar ${locToolName} paso a paso en tu navegador`,
                overviewHeading: `Descripción general: ${locToolName} sin subir archivos al servidor`,
                overviewP1: `La herramienta ${locToolName} de PDFMinty te permite procesar documentos PDF confidenciales directamente en tu navegador web. Mediante motores WebAssembly y HTML5 de última generación, nuestras 22 herramientas PDF estándar funcionan al 100 % de manera local en la memoria de tu dispositivo. Tus contratos legales, declaraciones fiscales, historiales médicos y facturas nunca se suben a servidores externos.`,
                overviewP2: `Puedes empezar gratis sin registro: los usuarios invitados cuentan con 5 tareas diarias gratuitas para archivos de hasta 100 MB. Al crear una cuenta gratuita, obtienes 10 tareas al día y soporte para archivos de hasta 150 MB. Además, los planes Pro ($2.49/mes) y Lifetime ($50 pago único) ofrecen tareas diarias ilimitadas y archivos de hasta 500 MB.`,
                steps: [
                  { title: '1. Selecciona tu documento PDF', desc: `${locCommon?.fileUploader?.dragDrop || 'Arrastra y suelta tu archivo PDF en el panel'} o selecciónalo desde tu dispositivo (hasta 100 MB como invitado, 150 MB con cuenta gratuita o 500 MB en Pro).` },
                  { title: '2. Ajusta las opciones de la herramienta', desc: `Personaliza la configuración de ${locToolName} con vista previa instantánea. El documento se carga directamente en la memoria local del navegador.` },
                  { title: '3. Procesa el archivo localmente con WebAssembly', desc: `Haz clic en «${locCommon?.toolCommon?.process || 'Procesar'}». La operación se ejecuta en segundos dentro de tu navegador sin enviar datos por internet.` },
                  { title: '4. Descarga tu archivo PDF listo', desc: `Guarda el documento resultante en tu equipo sin marcas de agua. Al cerrar la pestaña, la memoria temporal del navegador se limpia automáticamente.` },
                ],
                specsHeading: 'Especificaciones técnicas y límites del servicio',
                specsItems: [
                  'Arquitectura de procesamiento: 100 % del lado del cliente con WebAssembly (@cantoo/pdf-lib y PDF.js) en las 22 herramientas estándar',
                  'IA en la nube opcional: Solo las 2 herramientas de Análisis IA y OCR PDF envían datos a Google Gemini tras tu consentimiento explícito',
                  'Tamaño máximo de archivo: 100 MB (Invitado) • 150 MB (Cuenta gratuita) • 500 MB (Pro y Lifetime)',
                  'Límite diario de tareas: 5 tareas/día (Invitado) • 10 tareas/día (Cuenta gratuita) • Ilimitado (Pro $2.49/mes y Lifetime $50)',
                  'Compatibilidad multiplataforma: Windows, macOS, Linux, iOS y Android en Chrome, Firefox, Safari y Edge (funciona sin conexión vía PWA)',
                ],
                privacyHeading: 'Privacidad garantizada y seguridad de datos',
                privacyText: `Con ${locToolName}, tus documentos privados nunca abandonan tu dispositivo en las 22 utilidades estándar. Este diseño sin servidor protege tu información confidencial frente a filtraciones y cumple con los estándares europeos e internacionales de protección de datos.`,
                extraFaqs: [
                  { q: `¿Se guardan mis archivos en algún servidor al usar ${locToolName}?`, a: 'No. En nuestras 22 herramientas estándar de PDF, los documentos se procesan exclusivamente en la memoria RAM de tu navegador sin subirse a ningún servidor.' },
                  { q: `¿${locToolName} añade marcas de agua al PDF descargado?`, a: 'No. Todos los documentos procesados con PDFMinty se exportan limpios y sin marcas de agua tanto en el plan gratuito como en los planes Pro.' },
                ],
                keywords: `${locToolName}, herramientas PDF gratis, editar PDF en el navegador, PDF privado sin subir archivos, PDFMinty Español`,
              },
              bn: {
                howToHeading: `ব্রাউজারে ধাপে ধাপে ${locToolName} ব্যবহারের নিয়ম`,
                overviewHeading: `সংক্ষিপ্ত পরিচিতি: কোনো সার্ভার আপলোড ছাড়াই ${locToolName}`,
                overviewP1: `PDFMinty-এর ${locToolName} টুলটি আপনাকে সম্পূর্ণ গোপনীয়তা বজায় রেখে সরাসরি ওয়েব ব্রাউজারের ভেতর পিডিএফ ফাইল প্রসেস করার সুবিধা দেয়। আধুনিক WebAssembly এবং HTML5 প্রযুক্তির সাহায্যে আমাদের ২২টি স্ট্যান্ডার্ড পিডিএফ টুল ১০০% আপনার ডিভাইসের র‍্যামে (RAM) লোকালভাবে কাজ করে। আপনার সংবেদনশীল অফিসিয়াল ডকুমেন্ট, ব্যাংক স্টেটমেন্ট, মেডিকেল রিপোর্ট বা আইনি চুক্তিপত্র কখনোই কোনো সার্ভারে আপলোড হয় না।`,
                overviewP2: `কোনো অ্যাকাউন্ট ছাড়াই গেস্ট হিসেবে প্রতিদিন ৫টি ফ্রি কাজ (প্রতি ফাইল সর্বোচ্চ ১০০ মেগাবাইট) সম্পন্ন করতে পারবেন। ফ্রি অ্যাকাউন্টে লগইন করলে প্রতিদিন ১০টি কাজ এবং ১৫০ মেগাবাইট পর্যন্ত ফাইল প্রসেস করা যায়। এছাড়া পেশাদার কাজের জন্য Pro ($2.49/মাস) এবং Lifetime ($50 এককালীন) প্ল্যানে রয়েছে আনলিমিটেড দৈনিক কাজ ও ৫০০ মেগাবাইট ফাইল সাপোর্ট।`,
                steps: [
                  { title: '১. আপনার পিডিএফ ফাইল নির্বাচন করুন', desc: `${locCommon?.fileUploader?.dragDrop || 'আপনার পিডিএফ ফাইলটি ড্র্যাগ অ্যান্ড ড্রপ করে আপলোড বক্সে রাখুন'} অথবা ডিভাইস থেকে সিলেক্ট করুন (গেস্ট ১০০MB, ফ্রি অ্যাকাউন্ট ১৫০MB, প্রো ৫০০MB পর্যন্ত)।` },
                  { title: '২. প্রয়োজনীয় অপশন ও সেটিংস নির্ধারণ করুন', desc: `${locToolName} টুলের প্রিভিউ প্যানেলে আপনার পছন্দমতো পেজ বা সেটিংস সাজিয়ে নিন। সবকিছু তাৎক্ষণিকভাবে ব্রাউজারে লোড হয়।` },
                  { title: '৩. লোকাল WebAssembly প্রসেসিং শুরু করুন', desc: `“${locCommon?.toolCommon?.process || 'প্রসেস করুন'}” বাটনে ক্লিক করুন। কোনো ইন্টারনেট ডেটা ট্রান্সফার ছাড়াই কয়েক সেকেন্ডের মধ্যে আপনার ডিভাইসেই ফাইলটি প্রস্তুত হয়ে যাবে।` },
                  { title: '৪. ওয়াটারমার্ক ছাড়া ফাইল ডাউনলোড করুন', desc: `প্রসেস শেষ হলে সাথে সাথে আপনার নতুন পিডিএফ ফাইলটি ডাউনলোড করে নিন। ট্যাব বন্ধ করার সাথে সাথে ব্রাউজারের অস্থায়ী মেমরি মুছে যায়।` },
                ],
                specsHeading: 'প্রযুক্তিগত বৈশিষ্ট্য ও ব্যবহারের সীমা',
                specsItems: [
                  'প্রসেসিং ইঞ্জিন: ২২টি স্ট্যান্ডার্ড টুলের জন্য ১০০% ক্লায়েন্ট-সাইড WebAssembly (@cantoo/pdf-lib ও PDF.js)',
                  'ঐচ্ছিক ক্লাউড এআই: শুধুমাত্র AI Analyze PDF এবং OCR PDF টুল দুটি আপনার সুস্পষ্ট সম্মতির পর Google Gemini ব্যবহার করে',
                  'সর্বোচ্চ ফাইল সাইজ: ১০০ মেগাবাইট (গেস্ট) • ১৫০ মেগাবাইট (ফ্রি অ্যাকাউন্ট) • ৫০০ মেগাবাইট (Pro ও Lifetime)',
                  'দৈনিক কাজের কোটা: ৫টি কাজ/দিন (গেস্ট) • ১০টি কাজ/দিন (ফ্রি অ্যাকাউন্ট) • আনলিমিটেড (Pro $2.49/মাস ও Lifetime $50)',
                  'ডিভাইস সাপোর্ট: Windows, macOS, Linux, Android ও iOS-এর যেকোনো আধুনিক ব্রাউজারে এবং অফলাইন PWA মোডে কার্যকর',
                ],
                privacyHeading: '১০০% ডেটা গোপনীয়তা ও নিরাপত্তা নিশ্চয়তা',
                privacyText: `${locToolName} আমাদের ২২টি লোকাল ব্রাউজার টুলের অন্তর্ভুক্ত হওয়ায় আপনার ফাইল কখনোই আপনার কম্পিউটার বা মোবাইল ফোন ছেড়ে বাইরে যায় না। ফলে ব্যক্তিগত ও প্রাতিষ্ঠানিক গোপনীয়তা শতভাগ সুরক্ষিত থাকে।`,
                extraFaqs: [
                  { q: `${locToolName} ব্যবহারের সময় আমার ফাইল কি কোনো সার্ভারে জমা থাকে?`, a: 'না। আমাদের ২২টি স্ট্যান্ডার্ড পিডিএফ টুল সম্পূর্ণভাবে আপনার ব্রাউজারের ভেতর লোকাল মেমরিতে কাজ করে, তাই কোনো সার্ভারে ফাইল আপলোড বা সংরক্ষণ করা হয় না।' },
                  { q: `ফ্রি প্ল্যানে ${locToolName} ব্যবহার করলে কি পিডিএফে ওয়াটারমার্ক থাকবে?`, a: 'একেবারেই না। PDFMinty-তে ফ্রি কিংবা প্রো—সকল টিয়ারেই সম্পূর্ণ ওয়াটারমার্কমুক্ত ও পরিচ্ছন্ন পিডিএফ ফাইল পাওয়া যায়।' },
                ],
                keywords: `${locToolName}, ফ্রি পিডিএফ টুল, ব্রাউজার পিডিএফ এডিটর, নিরাপদ পিডিএফ প্রসেসিং, PDFMinty বাংলা`,
              },
              hi: {
                howToHeading: `ब्राउज़र में ${locToolName} का उपयोग कैसे करें (चरण-दर-चरण मार्गदर्शिका)`,
                overviewHeading: `परिचय: बिना सर्वर अपलोड के ${locToolName}`,
                overviewP1: `PDFMinty का ${locToolName} टूल आपको पूर्ण गोपनीयता के साथ सीधे अपने वेब ब्राउज़र में पीडीएफ दस्तावेज़ों को प्रोसेस करने की सुविधा देता है। आधुनिक WebAssembly और HTML5 तकनीक की मदद से हमारे सभी 22 मानक पीडीएफ उपकरण 100% आपके डिवाइस की मेमोरी (RAM) में स्थानीय रूप से चलते हैं। आपके संवेदनशील अनुबंध, बैंक स्टेटमेंट, टैक्स रिकॉर्ड या मेडिकल दस्तावेज़ कभी भी किसी बाहरी सर्वर पर अपलोड नहीं होते हैं।`,
                overviewP2: `बिना किसी पंजीकरण के तुरंत शुरुआत करें: अतिथि (Guest) उपयोगकर्ताओं को प्रतिदिन 5 मुफ़्त कार्य और 100 MB तक की फ़ाइल सीमा मिलती है। मुफ़्त खाते में साइन-इन करने पर प्रतिदिन 10 कार्य और 150 MB फ़ाइल आकार की सुविधा मिलती है। असीमित दैनिक कार्यों और 500 MB फ़ाइलों के लिए Pro ($2.49/माह) और Lifetime ($50 एकबारगी भुगतान) प्लान उपलब्ध हैं।`,
                steps: [
                  { title: '1. अपनी पीडीएफ फ़ाइल चुनें', desc: `${locCommon?.fileUploader?.dragDrop || 'अपनी पीडीएफ फ़ाइल को अपलोड बॉक्स में ड्रैग और ड्रॉप करें'} या अपने डिवाइस से चुनें (अतिथि: 100MB, मुफ़्त खाता: 150MB, Pro: 500MB तक)।` },
                  { title: '2. टूल विकल्प और सेटिंग्स समायोजित करें', desc: `${locToolName} के इंटरैक्टिव प्रीव्यू में अपनी आवश्यकता के अनुसार पेज और विकल्प सेट करें। सभी गणनाएँ तुरंत ब्राउज़र में होती हैं।` },
                  { title: '3. लोकल WebAssembly प्रोसेसिंग शुरू करें', desc: `“${locCommon?.toolCommon?.process || 'प्रोसेस करें'}” बटन पर क्लिक करें। आपकी फ़ाइल बिना इंटरनेट अपलोड के कुछ ही सेकंड में आपके डिवाइस पर प्रोसेस हो जाती है।` },
                  { title: '4. बिना वॉटरमार्क के अपनी पीडीएफ डाउनलोड करें', desc: `तैयार पीडीएफ दस्तावेज़ को तुरंत अपने कंप्यूटर या मोबाइल में सेव करें। टैब बंद करते ही ब्राउज़र मेमोरी अपने आप साफ़ हो जाती है।` },
                ],
                specsHeading: 'तकनीकी विशेषताएँ और उपयोग सीमाएँ',
                specsItems: [
                  'प्रोसेसिंग तकनीक: सभी 22 मानक पीडीएफ टूल्स के लिए 100% क्लाइंट-साइड WebAssembly (@cantoo/pdf-lib और PDF.js)',
                  'वैकल्पिक क्लाउड AI: केवल 2 टूल्स (AI Analyze PDF और OCR PDF) आपकी स्पष्ट सहमति के बाद Google Gemini का उपयोग करते हैं',
                  'अधिकतम फ़ाइल आकार: 100 MB (अतिथि) • 150 MB (मुफ़्त खाता) • 500 MB (Pro और Lifetime)',
                  'दैनिक कार्य सीमा: 5 कार्य/दिन (अतिथि) • 10 कार्य/दिन (मुफ़्त खाता) • असीमित (Pro $2.49/माह और Lifetime $50)',
                  'संगतता: Windows, macOS, Linux, Android और iOS के सभी आधुनिक ब्राउज़रों में और ऑफ़लाइन PWA मोड में काम करता है',
                ],
                privacyHeading: '100% डेटा गोपनीयता और सुरक्षा गारंटी',
                privacyText: `चूँकि ${locToolName} हमारे 22 स्थानीय ब्राउज़र उपकरणों का हिस्सा है, इसलिए आपकी फ़ाइलें कभी भी आपके डिवाइस से बाहर नहीं जाती हैं। यह व्यक्तिगत, कानूनी और व्यावसायिक दस्तावेज़ों के लिए उच्चतम सुरक्षा सुनिश्चित करता है।`,
                extraFaqs: [
                  { q: `क्या ${locToolName} का उपयोग करते समय मेरी फ़ाइलें किसी सर्वर पर अपलोड होती हैं?`, a: 'नहीं। हमारे 22 मानक पीडीएफ टूल्स पूरी तरह से आपके ब्राउज़र की लोकल मेमोरी में काम करते हैं, इसलिए कोई भी फ़ाइल सर्वर पर अपलोड या सेव नहीं होती है।' },
                  { q: `क्या मुफ़्त प्लान में ${locToolName} से आउटपुट पीडीएफ पर वॉटरमार्क आता है?`, a: 'बिल्कुल नहीं। PDFMinty के मुफ़्त और Pro दोनों प्लान्स में बिना किसी वॉटरमार्क के साफ़ और प्रोफेशनल पीडीएफ फ़ाइल मिलती है।' },
                ],
                keywords: `${locToolName}, मुफ़्त पीडीएफ टूल्स, ऑनलाइन पीडीएफ एडिटर, प्राइवेसी पीडीएफ टूल, PDFMinty हिंदी`,
              },
              zh: {
                howToHeading: `如何在浏览器中分步使用 ${locToolName}`,
                overviewHeading: `工具概述：零服务器上传的 ${locToolName} 本地处理方案`,
                overviewP1: `PDFMinty 提供的 ${locToolName} 工具让您能够直接在网页浏览器中私密、高效地处理 PDF 文档。依托先进的 WebAssembly 与 HTML5 客户端架构，我们的 22 款标准 PDF 工具 100% 在您设备的本地内存（RAM）中运行。您的机密合同、财务报表、税务文件、医疗记录或个人证件绝不会上传到任何远程服务器。`,
                overviewP2: `无需注册即可立即免费使用：访客模式每天可免费执行 5 次任务，单文件最高支持 100 MB；注册并登录免费账户后，每天可享 10 次免费任务，单文件上限提升至 150 MB。如果您需要处理超大文档或高频办公，可选的 Pro 订阅方案（$2.49/月）与终身买断方案（$50 一次性付费）提供无限次每日任务及高达 500 MB 的文件支持。`,
                steps: [
                  { title: '1. 在浏览器中选择或拖拽 PDF 文件', desc: `${locCommon?.fileUploader?.dragDrop || '将需要处理的 PDF 文件直接拖拽到上传区域'}，或点击按钮从本地设备中选择文件（访客最高 100MB，免费账户 150MB，Pro 版高达 500MB）。` },
                  { title: '2. 预览文档并配置处理参数', desc: `在 ${locToolName} 的交互式预览界面中调整页面范围或工具参数。所有解析与渲染均在本地浏览器内存中即时完成，无需等待网络传输。` },
                  { title: '3. 启动本地 WebAssembly 引擎高速处理', desc: `点击“${locCommon?.toolCommon?.process || '开始处理'}”按钮，浏览器内置的 WebAssembly 引擎将在数秒内完成文档计算与转换，全程零数据外传。` },
                  { title: '4. 立即下载无水印的生成文件', desc: `处理完成后即可将生成的 PDF 文件直接保存到您的电脑或手机中，导出文档绝无任何水印。关闭标签页后，浏览器会自动清空临时内存缓存。` },
                ],
                specsHeading: '技术规格与账户额度说明',
                specsItems: [
                  '核心运行架构：全部 22 款标准 PDF 工具均采用 100% 客户端 WebAssembly（@cantoo/pdf-lib 与 PDF.js）本地运算',
                  '可选云端 AI 工具：仅“AI 智能分析 PDF”与“OCR 识别 PDF”2 款可选工具会在您明确勾选授权同意后向 Google Gemini 发送提取文本或页面图像',
                  '单文件大小上限：访客模式 100 MB • 免费注册账户 150 MB • Pro 与终身版高达 500 MB（批量操作最高 1,000 MB）',
                  '每日免费任务额度：访客每日 5 次 • 免费账户每日 10 次 • Pro（$2.49/月）与终身版（$50 一次付清）无限次使用',
                  '跨平台与离线支持：完美兼容 Windows、macOS、Linux、iOS 与 Android 上的 Chrome、Firefox、Safari、Edge 浏览器，支持安装 PWA 离线使用',
                ],
                privacyHeading: '100% 隐私保护与数据安全承诺',
                privacyText: `由于 ${locToolName} 属于 PDFMinty 的 22 款标准本地工具之一，您的原始 PDF 文件和生成结果始终保留在您的本地设备上，绝不经过第三方服务器。这一零上传设计为律所、金融机构、医疗单位及注重隐私的企业提供了最高等级的数据安全保障。`,
                extraFaqs: [
                  { q: `使用 ${locToolName} 处理文档时，我的文件会被上传或保存在服务器上吗？`, a: '绝不会。我们的 22 款标准 PDF 工具完全在您浏览器的本地内存中运行，文件不会离开您的电脑或手机，服务器不会接收或存储您的任何文档。' },
                  { q: `免费使用 ${locToolName} 导出的 PDF 文件会带有水印吗？`, a: '没有任何水印。无论您是未登录访客、免费注册用户还是 Pro 会员，通过 PDFMinty 处理并导出的所有文档均保持原始清晰度且完全无水印。' },
                ],
                keywords: `${locToolName}, 免费PDF工具, 在线处理PDF, 浏览器本地PDF工具, 隐私安全PDF, PDFMinty 中文版`,
              },
            };

            const richTpl = locTemplates[locLang] || locTemplates.de;
            locStepsForSchema = richTpl.steps;
            locHowToTitleForSchema = richTpl.howToHeading;

            const combinedFaqs = [...(locMergeFallback?.faqs || []), ...richTpl.extraFaqs];
            locFaqsForSchema = combinedFaqs;

            const featuresHtml = (locMergeFallback?.features || [])
              .map((f) => `              <li><strong>${f.title}</strong> ${f.desc}</li>`)
              .join('\n');

            const stepsHtml = richTpl.steps
              .map(
                (st) => `            <li><strong>${st.title}：</strong> ${st.desc}</li>`
              )
              .join('\n');

            const specsHtml = richTpl.specsItems
              .map((sp) => `              <li>${sp}</li>`)
              .join('\n');

            const faqsHtml = combinedFaqs
              .map(
                (faq) => `            <div>
              <h3 class="font-bold text-slate-900 dark:text-white mb-1">${faq.q}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-300">${faq.a}</p>
            </div>`
              )
              .join('\n');

            const relatedHeading =
              locCommon?.relatedTools?.title || locMergeFallback?.relatedTitle || 'Related PDF Tools';
            const whyHeading = locMergeFallback?.whyTitle || `${locToolName} — PDFMinty`;
            const faqHeading = locMergeFallback?.faqTitle || 'FAQ';

            const locArticleHtml = `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          <h1>${locToolName}</h1>
          <p class="lead text-lg font-medium text-slate-700 dark:text-slate-300">
            ${locToolDesc}
          </p>
          <section aria-label="${richTpl.overviewHeading}">
            <h2>${richTpl.overviewHeading}</h2>
            <p>${richTpl.overviewP1}</p>
            <p>${richTpl.overviewP2}</p>
          </section>
          <section aria-label="${richTpl.howToHeading}">
            <h2>${richTpl.howToHeading}</h2>
            <ol class="space-y-2 my-4">
${stepsHtml}
            </ol>
          </section>
          <section aria-label="${whyHeading}">
            <h2>${whyHeading}</h2>
            <ul class="space-y-2 my-4">
${featuresHtml}
            </ul>
          </section>
          <section aria-label="${richTpl.specsHeading}">
            <h2>${richTpl.specsHeading}</h2>
            <ul class="space-y-2 my-4">
${specsHtml}
            </ul>
          </section>
          <section aria-label="${richTpl.privacyHeading}">
            <h2>${richTpl.privacyHeading}</h2>
            <p>${richTpl.privacyText}</p>
          </section>
          <section aria-label="${faqHeading}">
            <h2>${faqHeading}</h2>
            <div class="space-y-4 my-6">
${faqsHtml}
            </div>
          </section>
          <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h2>${relatedHeading}</h2>
            <ul>
${relatedToolsHtml}
            </ul>
          </div>
        </article>`;
            locPreRenderedContent = wrapInPrerenderedShell(locArticleHtml, locLang);
          }

          let locJsonLdMarkup = jsonLdMarkup;
          if (locData) {
            const locSchemas: Record<string, unknown>[] = [
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": `PDFMinty - ${locMetaTitle.split('—')[0].trim()}`,
                "url": locPageUrl,
                "description": locMetaDesc,
                "applicationCategory": "UtilitiesApplication",
                "applicationSubCategory": "PDF Software",
                "operatingSystem": "Any",
                "browserRequirements": "Requires HTML5, WebAssembly",
                "inLanguage": locLang,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                "author": {
                  "@type": "Organization",
                  "name": SITE_NAME,
                  "url": `${SITE_URL}/`
                },
                "publisher": {
                  "@type": "Organization",
                  "name": SITE_NAME,
                  "url": `${SITE_URL}/`,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${SITE_URL}/logo-512.png`,
                    "width": 512,
                    "height": 512
                  }
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": locCommon?.header?.nav?.home || STATIC_SHELL_STRINGS[locLang]?.home || "Home",
                    "item": `${SITE_URL}/${locLang}/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": locData.h1,
                    "item": locPageUrl
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": locData.faqs.map(f => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.a
                  }
                }))
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": locData.howToTitle,
                "step": locData.howToSteps.map((step, idx) => ({
                  "@type": "HowToStep",
                  "position": idx + 1,
                  "name": step.title.replace(':', ''),
                  "text": step.desc
                }))
              }
            ];
            locJsonLdMarkup = locSchemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
          } else {
            const locSchemas: Record<string, unknown>[] = [
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": `PDFMinty - ${locToolName}`,
                "url": locPageUrl,
                "description": locMetaDesc,
                "applicationCategory": "UtilitiesApplication",
                "applicationSubCategory": "PDF Software",
                "operatingSystem": "Any",
                "browserRequirements": "Requires HTML5, WebAssembly",
                "inLanguage": locLang,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                },
                "author": {
                  "@type": "Organization",
                  "name": SITE_NAME,
                  "url": `${SITE_URL}/`
                },
                "publisher": {
                  "@type": "Organization",
                  "name": SITE_NAME,
                  "url": `${SITE_URL}/`,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${SITE_URL}/logo-512.png`,
                    "width": 512,
                    "height": 512
                  }
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": locCommon?.header?.nav?.home || STATIC_SHELL_STRINGS[locLang]?.home || "Home",
                    "item": `${SITE_URL}/${locLang}/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": locToolName,
                    "item": locPageUrl
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": locFaqsForSchema.map(f => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.a
                  }
                }))
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": locHowToTitleForSchema,
                "step": locStepsForSchema.map((step, idx) => ({
                  "@type": "HowToStep",
                  "position": idx + 1,
                  "name": step.title,
                  "text": step.desc
                }))
              }
            ];
            locJsonLdMarkup = locSchemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
          }

          const locKeywords = `${locToolName}, ${locPrivacyBadge}, PDFMinty`;
          const locHeadMeta: string = `
  <title>${locMetaTitle}</title>
  <meta name="description" content="${locMetaDesc}">
  <meta name="keywords" content="${locKeywords}">
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
  ${locJsonLdMarkup}
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

  const staticPageIds = [
    'blog',
    'about-us',
    'contact',
    'privacy-policy',
    'terms-of-service',
    'adobe-acrobat-alternative',
  ];
  const articles = TOOLS.filter(
    (t: ToolSEOInfo) => t.type === 'article' && !staticPageIds.includes(t.id)
  );
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
  <meta name="keywords" content="pdf guides, pdf security tutorials, privacy-first pdf tools, offline pdf workflow, pdfminty blog">
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
      "url": "${SITE_URL}/",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/logo-512.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "${PRIMARY_AUTHOR.github}"
      ]
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
  // Pre-render the Pricing Page (dist/pricing/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Pricing Page (/pricing/)...");
  const pricingTargetFolder = path.join(distDir, "pricing");
  if (!fs.existsSync(pricingTargetFolder)) {
    fs.mkdirSync(pricingTargetFolder, { recursive: true });
  }

  const pricingTitle = "Pricing Plans — $2.49/mo Pro & $50 Lifetime Deal | PDFMinty";
  const pricingDesc =
    "Simple, affordable pricing for PDFMinty. 100% free core browser PDF tools, plus upgrades for 500MB batch processing, Gemini 2.5 AI analysis, and batch OCR.";
  const pricingUrl = `${SITE_URL}/pricing/`;

  const pricingFaqs = [
    {
      q: "Is the Free Forever tier really free without a credit card?",
      a: "Yes. Every visitor can use all 24 PDFMinty tools immediately without registering or entering a credit card. Guest users receive 5 free daily tasks with a 100 MB per-file limit, and creating a free account unlocks 10 daily tasks and a 150 MB per-file limit with zero watermarks."
    },
    {
      q: "What is the difference between Monthly Pro ($2.49/mo) and the Lifetime Pro Deal ($50)?",
      a: "Both Pro Monthly ($2.49 per month) and Lifetime Pro ($50 one-time payment) unlock identical premium capabilities: unlimited daily PDF tasks, up to 500 MB per file (1,000 MB batch limit), priority Google Gemini AI document analysis and batch OCR quotas, and commercial usage rights. Monthly Pro bills recurringly until canceled, whereas Lifetime Pro is a single one-time payment for permanent account access."
    },
    {
      q: "Are my PDF files uploaded to servers on the Free or Pro plans?",
      a: "For all 22 standard PDF tools (merge, split, compress, protect, unlock, sign, rotate, watermark, sanitize, grayscale, and page organization), your files are processed 100% locally in your browser using WebAssembly on every tier—they never touch our servers. The only exceptions are our 2 opt-in Cloud AI tools (AI Analyze PDF and OCR PDF), which require your explicit consent before transmitting extracted text or rendered page images to Google Gemini."
    },
    {
      q: "Can I cancel my $2.49/month Pro subscription at any time?",
      a: "Yes, you can cancel your monthly subscription at any time with a single click from your Account Dashboard or by contacting support@pdfminty.com. You will retain full Pro access through the end of your current billing period with no cancellation fees."
    },
    {
      q: "Does PDFMinty add watermarks to documents processed on the Free tier?",
      a: "Never. Whether you are a guest user, a free registered account holder, or a Pro subscriber, every PDF exported by PDFMinty is 100% free of branding stamps or watermarks."
    },
    {
      q: "Do the PDF tools work offline after upgrading or installing the app?",
      a: "Yes. PDFMinty is a Progressive Web App (PWA). Once loaded or installed on your desktop or mobile browser, all 22 client-side WebAssembly PDF utilities operate completely offline without an active internet connection."
    }
  ];

  const pricingHeadMeta = `
  <title>${pricingTitle}</title>
  <meta name="description" content="${pricingDesc}">
  <meta name="keywords" content="pdfminty pricing, privacy-first pdf tools pricing, $2.49 pdf pro plan, $50 lifetime pdf toolkit, offline browser pdf tools">
  <link rel="canonical" href="${pricingUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${pricingTitle}">
  <meta property="og:description" content="${pricingDesc}">
  <meta property="og:url" content="${pricingUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pricingUrl}">
  <meta name="twitter:title" content="${pricingTitle}">
  <meta name="twitter:description" content="${pricingDesc}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${pricingTitle}",
    "description": "${pricingDesc}",
    "url": "${pricingUrl}",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}/",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/logo-512.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "${PRIMARY_AUTHOR.github}"
      ]
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}/"},
      {"@type": "ListItem", "position": 2, "name": "Pricing Plans", "item": "${pricingUrl}"}
    ]
  }
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pricingFaqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  })}
  </script>
  `;

  const pricingArticleHtml = `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          <h1>Pick the plan that fits your PDF workflow</h1>
          <p>Start 100% free across all 24 PDFMinty tools (22 client-side WebAssembly tools that run locally in your browser with zero server uploads + 2 opt-in Cloud AI tools powered by Google Gemini only with your explicit consent). Upgrade to Monthly Pro ($2.49/month) or our Lifetime Pro Deal ($50 one-time payment) when you need 500 MB large file support, unlimited daily operations, and priority AI &amp; OCR quotas.</p>

          <section aria-label="Pricing Tiers">
            <h2>1. Free Forever Plan ($0 / Forever)</h2>
            <p>Designed for everyday document tasks with strict in-browser privacy and no credit card required:</p>
            <ul>
              <li><strong>All 24 PDF Tools Included:</strong> Full access to 22 local WebAssembly PDF tools plus 2 opt-in AI Analyze and OCR PDF tools</li>
              <li><strong>Guest Access (No Login Required):</strong> Up to 100 MB per file and 5 free tasks per day immediately in your browser</li>
              <li><strong>Free Registered Account:</strong> Up to 150 MB per file (and 150 MB batch operations) with 10 free tasks per day</li>
              <li><strong>Zero Watermarks:</strong> Clean, professional PDF exports with no branding stamps</li>
              <li><strong>Offline PWA Support:</strong> Install once and run all 22 standard PDF tools without an internet connection</li>
            </ul>

            <h2>2. PDFMinty Pro Monthly ($2.49 / month)</h2>
            <p>Built for professionals, legal teams, accountants, and researchers handling heavy document workloads:</p>
            <ul>
              <li><strong>Unlimited Daily PDF Tasks:</strong> Remove all daily task counters across every browser-based PDF tool</li>
              <li><strong>Up to 500 MB Per File:</strong> Process large scanned books, blueprints, and multi-hundred-page legal bundles (up to 1,000 MB combined batch limit)</li>
              <li><strong>Priority Gemini AI &amp; Batch OCR Quotas:</strong> Higher daily limits for opt-in AI document summaries, Q&amp;A, and multilingual optical character recognition</li>
              <li><strong>Commercial Usage Rights &amp; Priority Support:</strong> Dedicated email support and flexible monthly billing you can cancel anytime</li>
            </ul>

            <h2>3. PDFMinty Lifetime Pro Deal ($50 One-Time Payment)</h2>
            <p>Pay once and own permanent Pro access forever without recurring subscriptions:</p>
            <ul>
              <li><strong>Everything in Monthly Pro Included Forever:</strong> Unlimited daily tasks, 500 MB file size limit, and 1,000 MB batch processing</li>
              <li><strong>One-Time $50 USD Payment:</strong> No recurring monthly or annual charges—ideal for independent consultants and privacy-conscious power users</li>
              <li><strong>All Future Tool Updates Included:</strong> Immediate access to new client-side WebAssembly utilities and priority support</li>
            </ul>
          </section>

          <section aria-label="Feature Comparison Table">
            <h2>Complete Plan Comparison: Guest vs. Free Account vs. Pro &amp; Lifetime</h2>
            <table>
              <thead>
                <tr>
                  <th>Feature / Quota</th>
                  <th>Guest (No Login)</th>
                  <th>Free Account ($0)</th>
                  <th>Pro ($2.49/mo) &amp; Lifetime ($50)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>22 Standard Local WebAssembly PDF Tools</td>
                  <td>Included (100% Local)</td>
                  <td>Included (100% Local)</td>
                  <td>Included (100% Local)</td>
                </tr>
                <tr>
                  <td>2 Opt-In Gemini AI &amp; OCR Tools (With Consent)</td>
                  <td>Standard Quota</td>
                  <td>Expanded Free Quota</td>
                  <td>Priority High-Volume Quota</td>
                </tr>
                <tr>
                  <td>Maximum Single File Size</td>
                  <td>100 MB</td>
                  <td>150 MB</td>
                  <td>500 MB (1,000 MB Batch)</td>
                </tr>
                <tr>
                  <td>Daily Task Limit</td>
                  <td>5 tasks / day</td>
                  <td>10 tasks / day</td>
                  <td>Unlimited tasks / day</td>
                </tr>
                <tr>
                  <td>Watermarks on Exported PDFs</td>
                  <td>None</td>
                  <td>None</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td>Offline PWA Mode (Standard Tools)</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Commercial Use &amp; Priority Support</td>
                  <td>Community</td>
                  <td>Standard</td>
                  <td>Full Commercial + Priority Support</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section aria-label="Privacy Architecture Guarantee">
            <h2>How Your Privacy Is Protected Across Every Plan</h2>
            <p>Unlike cloud-heavy PDF suites that upload every file to remote servers, PDFMinty executes all 22 standard PDF tools directly inside your device's browser memory using WebAssembly (<code>@cantoo/pdf-lib</code> and <code>pdfjs-dist</code>). Whether you use the Free tier or Lifetime Pro, your tax returns, contracts, medical records, and financial statements never leave your computer or phone during standard operations. Our 2 opt-in AI tools (<a href="/ai-analyze-pdf/">AI Analyze PDF</a> and <a href="/ocr-pdf/">OCR PDF</a>) are strictly separated and require you to check an explicit consent box before sending extracted text or page images to Google Gemini.</p>
          </section>

          <section aria-label="Pricing Frequently Asked Questions">
            <h2>Frequently Asked Questions About Pricing &amp; Billing</h2>
            ${pricingFaqs.map((f) => `<div>\n              <h3>${f.q}</h3>\n              <p>${f.a}</p>\n            </div>`).join('\n            ')}
          </section>

          <p><a href="/sign-up/">Create a Free Account or Upgrade to Pro</a> • <a href="/sign-in/">Sign In to Your Account</a> • <a href="/">Explore All 24 Free PDF Tools</a> • <a href="/contact/">Contact Customer Support</a> for team and enterprise licensing inquiries.</p>
        </article>`;

  let pricingHtml = optimizedBase.replace("</head>", `${pricingHeadMeta}\n</head>`);
  const pricingPreRendered = wrapInPrerenderedShell(pricingArticleHtml, DEFAULT_LOCALE);
  pricingHtml = pricingHtml.replace(/<div\s+id="root"\s*><\/div>/i, pricingPreRendered);
  pricingHtml = pricingHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, pricingPreRendered);

  fs.writeFileSync(path.join(pricingTargetFolder, "index.html"), pricingHtml, "utf8");
  logger.info("Successfully pre-rendered static HTML for Pricing Page at dist/pricing/index.html");

  // ----------------------------------------------------
  // Generate SPA Entry HTML for Auth & Account Routes
  // (/login/, /sign-in/, /signup/, /sign-up/, /dashboard/) so Cloudflare Pages
  // never falls through to dist/404.html on direct navigation
  // ----------------------------------------------------
  const noindexSpaRoutes = [
    {
      slug: "login",
      title: "Sign In — PDFMinty",
      desc: "Sign in to your PDFMinty account to manage your PDF workflow and preferences.",
    },
    {
      slug: "sign-in",
      title: "Sign In — PDFMinty",
      desc: "Sign in to your PDFMinty account to manage your PDF workflow and preferences.",
    },
    {
      slug: "signup",
      title: "Create Account — PDFMinty",
      desc: "Create a free PDFMinty account for higher daily task limits and cloud preferences.",
    },
    {
      slug: "sign-up",
      title: "Create Account — PDFMinty",
      desc: "Create a free PDFMinty account for higher daily task limits and cloud preferences.",
    },
    {
      slug: "dashboard",
      title: "Account Dashboard — PDFMinty",
      desc: "Manage your PDFMinty account, usage quotas, and subscription settings.",
    },
  ];

  for (const spaRoute of noindexSpaRoutes) {
    const spaFolder = path.join(distDir, spaRoute.slug);
    if (!fs.existsSync(spaFolder)) {
      fs.mkdirSync(spaFolder, { recursive: true });
    }
    const spaHead = `
  <title>${spaRoute.title}</title>
  <meta name="description" content="${spaRoute.desc}">
  <meta name="robots" content="noindex, nofollow">
  `;
    const spaHtml = optimizedBase.replace("</head>", `${spaHead}\n</head>`);
    fs.writeFileSync(path.join(spaFolder, "index.html"), spaHtml, "utf8");
    logger.info(`Generated SPA entry HTML for /${spaRoute.slug}/ at dist/${spaRoute.slug}/index.html`);
  }

  // ----------------------------------------------------
  // Pre-render the Homepage (dist/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Homepage...");

  const toolsCount = TOOLS.filter((t: ToolSEOInfo) => t.type === 'tool').length;
  const toolsListHtml = TOOLS
    .filter((t: ToolSEOInfo) => t.type === 'tool')
    .map((t: ToolSEOInfo) => `      <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription}</li>`)
    .join('\n');
  
  const homepageContent = `
  <main class="prose max-w-6xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
    <h1>${HOMEPAGE_H1}</h1>
    <p>PDFMinty is a free, privacy-first PDF toolkit with ${toolsCount} powerful tools. Our 22 standard PDF tools run 100% locally in your browser so your files never leave your device — no server uploads and no mandatory sign-up (plus 2 opt-in AI Analyze and OCR PDF tools powered by Google Gemini only with your explicit consent). Merge, split, protect, convert, and edit PDFs with complete confidentiality.</p>
 
    <h2 id="all-tools">All PDF Tools</h2>
    <ul>
${toolsListHtml}
    </ul>
 
    <h2>Why Choose PDFMinty?</h2>
    <p>Unlike traditional online PDF tools that upload every file to remote servers, PDFMinty processes standard PDF operations locally in your browser using WebAssembly. This means:</p>
    <ul>
      <li><strong>Complete Privacy:</strong> Your documents never touch our servers for all 22 standard PDF tools</li>
      <li><strong>Generous File Limits:</strong> Process files up to 100MB as a guest (150MB with a free account, 500MB on Pro)</li>
      <li><strong>Fast Processing:</strong> WebAssembly-powered operations complete in seconds</li>
      <li><strong>No Mandatory Registration:</strong> Guest users get 5 free tasks/day with no sign-up (10/day with a free account, unlimited on Pro)</li>
      <li><strong>Works Offline:</strong> PWA-enabled — install and use standard tools without internet</li>
    </ul>
 
    <h2>How PDFMinty Protects Your Privacy</h2>
    <p>All 22 standard PDF operations in PDFMinty happen client-side using JavaScript and WebAssembly. When you select a file, it is loaded into your browser's memory, processed locally, and the result is generated on your device without transmitting the file over the network. The only exceptions are our 2 opt-in Cloud AI tools (AI Analyze PDF and OCR PDF), which require your explicit consent before sending extracted text or rendered page images to Google Gemini.</p>
 
    <p>Our privacy-first architecture makes PDFMinty ideal for processing sensitive documents like tax returns, medical records, financial statements, legal contracts, and any file containing personal information.</p>
 
    <h2>Frequently Asked Questions</h2>
    <h3>Is PDFMinty really free?</h3>
    <p>Yes — PDFMinty offers a free tier across all ${toolsCount} tools: guests receive 5 free daily tasks (up to 100MB per file) with no account or credit card required, and free registered users receive 10 daily tasks (up to 150MB per file) with zero watermarks. Optional Pro ($2.49/month) and Lifetime ($50 one-time) plans are available for unlimited daily tasks, 500MB files, and higher AI/OCR quotas.</p>
 
    <h3>Are my files uploaded to your server?</h3>
    <p>For our 22 standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exceptions are our 2 opt-in AI Analyze and OCR PDF tools, which only send extracted text or rendered page images to Google Gemini after you explicitly check a consent box.</p>
 
    <h3>What is the maximum file size?</h3>
    <p>PDFMinty handles individual PDF files up to 100MB for guests (150MB for free accounts, 500MB on Pro) and combined batch operations up to 150MB on the free tier (1,000MB on Pro). Performance also depends on your device's available memory.</p>
 
    <h3>Do I need to install any software?</h3>
    <p>No installation required. PDFMinty runs in any modern browser (Chrome, Firefox, Safari, Edge). You can also install it as a PWA for offline access.</p>
 
    <h2>Start Processing Your PDFs Now</h2>
    <p>Browse our complete collection of PDF tools above. Enjoy 5 free daily tasks with no sign-up required (10/day with a free account, or unlimited on Pro) and 100% local browser processing for all 22 standard tools.</p>

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
        "acceptedAnswer": {"@type": "Answer", "text": "Yes — PDFMinty offers a free tier across all ${toolsCount} tools: guests receive 5 free daily tasks (up to 100MB per file) with no account or credit card required, and free registered users receive 10 daily tasks (up to 150MB per file) with zero watermarks. Optional Pro ($2.49/month) and Lifetime ($50 one-time) plans are available for unlimited daily tasks, 500MB files, and higher AI/OCR quotas."}
      },
      {
        "@type": "Question",
        "name": "Are my files uploaded to your server?",
        "acceptedAnswer": {"@type": "Answer", "text": "For our 22 standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exceptions are our 2 opt-in AI Analyze and OCR PDF tools, which only send extracted text or rendered page images to Google Gemini after you explicitly check a consent box."}
      },
      {
        "@type": "Question",
        "name": "What is the maximum file size?",
        "acceptedAnswer": {"@type": "Answer", "text": "PDFMinty handles individual PDF files up to 100MB for guests (150MB for free accounts, 500MB on Pro) and combined batch operations up to 150MB on the free tier (1,000MB on Pro). Performance also depends on your device's available memory."}
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
  <meta name="description" content="Free privacy-first PDF toolkit. Merge, split, protect, sign, OCR, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta name="keywords" content="free pdf tools, merge pdf, split pdf, compress pdf, sign pdf, protect pdf, ocr pdf, privacy-first pdf toolkit, browser pdf editor, pdfminty">
  <link rel="canonical" href="${SITE_URL}/">
${homepageHreflangs}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta property="og:description" content="Free privacy-first PDF toolkit. Merge, split, protect, sign, OCR, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_URL}/">
  <meta name="twitter:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta name="twitter:description" content="Free privacy-first PDF toolkit. Merge, split, protect, sign, OCR, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebApplication",
    "@id": "${SITE_URL}/#webapp",
    "name": "PDFMinty", "url": "${SITE_URL}/",
    "inLanguage": "en",
    "description": "Free, privacy-first online PDF toolkit. Merge, split, protect, sign, rotate, watermark, and OCR PDFs entirely in your browser.",
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "PDF Software",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "author": { "@id": "${SITE_URL}/#organization" },
    "publisher": { "@id": "${SITE_URL}/#organization" },
    "image": { "@type": "ImageObject", "url": "${SITE_URL}/og-image.png", "width": 1200, "height": 630 },
    "featureList": [
      "Merge multiple PDF files", "Split PDF into separate pages", "Grayscale PDF for smaller size",
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
    "description": "Privacy-first PDF toolkit with ${toolsCount} tools (22 client-side standard tools + 2 opt-in AI/OCR tools).",
    "foundingDate": "2025",
    "sameAs": ["${PRIMARY_AUTHOR.github}"],
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
    "inLanguage": "en",
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
  interface LocalizedHomepageContent {
    code: string;
    langName: string;
    title: string;
    desc: string;
    h1: string;
    lead: string;
    toolsTitle: string;
    whyTitle: string;
    whyIntro: string;
    whyFeatures: { title: string; desc: string }[];
    privacyTitle: string;
    privacyP1: string;
    privacyP2: string;
    faqTitle: string;
    faqs: { q: string; a: string }[];
    ctaTitle: string;
    ctaDesc: string;
    featuredOn: string;
    webAppDesc: string;
    orgDesc: string;
    websiteDesc: string;
    features: string[];
    jsonld?: string;
  }

  const localizedHomepagesData: Record<string, LocalizedHomepageContent> = {
    de: {
      code: 'de',
      langName: 'German',
      title: 'Kostenlose PDF-Tools — 100% privat im Browser | PDFMinty',
      desc: 'Kostenlose PDF-Tools direkt im Browser. PDF zusammenfügen, teilen, schützen und bearbeiten. Keine Uploads, keine Registrierung, 100% Datenschutz.',
      h1: 'Kostenlose browserbasierte PDF-Werkzeuge — 100% privat, ohne Uploads',
      lead: `PDFMinty ist ein datenschutzorientiertes PDF-Toolkit mit ${toolsCount} leistungsstarken Werkzeugen. Unsere 22 Standard-PDF-Werkzeuge laufen zu 100% lokal in Ihrem Browser, sodass Ihre Dateien Ihr Gerät niemals verlassen — ohne Server-Uploads und ohne Registrierungspflicht (zuzüglich 2 optionaler KI-Analyse- und OCR-Tools mit Google Gemini nach Ihrer ausdrücklichen Zustimmung).`,
      toolsTitle: 'Alle PDF-Werkzeuge',
      whyTitle: 'Warum PDFMinty wählen?',
      whyIntro: 'Im Gegensatz zu herkömmlichen Online-PDF-Tools, die Ihre Dateien auf entfernte Server hochladen, verarbeitet PDFMinty alle Standardoperationen lokal in Ihrem Browser mittels WebAssembly. Das bedeutet:',
      whyFeatures: [
        { title: 'Vollständige Privatsphäre', desc: 'Ihre Dokumente berühren bei allen 22 Standard-PDF-Tools niemals unsere Server.' },
        { title: 'Großzügige Dateigrößen', desc: 'Verarbeiten Sie Dateien bis zu 100 MB als Gast (150 MB mit kostenlosem Konto, 500 MB mit Pro).' },
        { title: 'Schnelle Verarbeitung', desc: 'WebAssembly-gestützte Operationen werden in Sekundenschnelle abgeschlossen.' },
        { title: 'Keine Registrierungspflicht', desc: 'Gäste erhalten 5 kostenlose Aufgaben pro Tag ohne Anmeldung (10/Tag mit kostenlosem Konto, unbegrenzt mit Pro).' },
        { title: 'Funktioniert offline', desc: 'PWA-fähig — installieren und Standard-Tools auch ohne Internetverbindung nutzen.' }
      ],
      privacyTitle: 'Wie PDFMinty Ihre Privatsphäre schützt',
      privacyP1: 'Alle 22 Standard-PDF-Operationen in PDFMinty erfolgen clientseitig mithilfe von JavaScript und WebAssembly. Wenn Sie eine Datei auswählen, wird sie in den Arbeitsspeicher Ihres Browsers geladen, lokal verarbeitet und das Ergebnis direkt auf Ihrem Gerät generiert. Die einzigen Ausnahmen sind unsere 2 optionalen KI-Analyse- und OCR-Tools, die erst nach Ihrer ausdrücklichen Zustimmung Textauszüge oder Seitenbilder an Google Gemini übermitteln.',
      privacyP2: 'Unsere datenschutzorientierte Architektur macht PDFMinty ideal für die vertrauliche Bearbeitung sensibler Dokumente wie Steuererklärungen, medizinische Unterlagen, Finanzberichte, Verträge und persönliche Dokumente.',
      faqTitle: 'Häufig gestellte Fragen (FAQ)',
      faqs: [
        { q: 'Wie verarbeitet PDFMinty meine PDFs vertraulich?', a: 'PDFMinty führt unsere 22 Standard-PDF-Werkzeuge vollständig clientseitig in Ihrem Webbrowser mithilfe von WebAssembly und JavaScript aus, ohne Dateien auf Server hochzuladen. Die einzigen Ausnahmen sind die 2 optionalen KI-Analyse- und OCR-Tools, die erst nach Ihrer ausdrücklichen Zustimmung Daten an Google Gemini senden.' },
        { q: 'Ist PDFMinty kostenlos nutzbar?', a: `Ja — PDFMinty bietet ein kostenloses Kontingent für alle ${toolsCount} Werkzeuge: Gäste erhalten 5 kostenlose Aufgaben pro Tag (bis zu 100 MB pro Datei) ohne Konto oder Kreditkarte, und registrierte Nutzer erhalten 10 kostenlose Aufgaben pro Tag (bis zu 150 MB) ohne Wasserzeichen. Optionale Pro- ($2,49/Monat) und Lifetime-Tarife ($50 einmalig) bieten unbegrenzte tägliche Aufgaben und 500-MB-Dateien.` },
        { q: 'Verlassen meine Dateien jemals mein Gerät?', a: 'Nein, bei allen 22 Standard-PDF-Werkzeugen verlassen Ihre Dateien niemals Ihren Computer oder Ihr Mobilgerät. Die einzigen optionalen Ausnahmen sind die 2 KI-Analyse- und OCR-Tools, die erst nach Ihrer ausdrücklichen Bestätigung Textauszüge oder Seitenbilder an Google Gemini übermitteln.' },
        { q: 'Wie hoch ist die maximale Dateigröße?', a: 'PDFMinty unterstützt einzelne PDF-Dateien bis zu 100 MB für Gäste (150 MB mit kostenlosem Konto, 500 MB mit Pro) sowie kombinierte Stapeloperationen bis zu 150 MB im kostenlosen Tarif (1.000 MB mit Pro).' }
      ],
      ctaTitle: 'Starten Sie jetzt mit der Bearbeitung Ihrer PDFs',
      ctaDesc: 'Entdecken Sie oben unsere vollständige Sammlung an PDF-Tools. Nutzen Sie 5 kostenlose Aufgaben täglich ohne Anmeldung (10/Tag mit kostenlosem Konto, unbegrenzt mit Pro).',
      featuredOn: 'Vorgestellt & anerkannt auf',
      webAppDesc: 'Kostenloses, datenschutzorientiertes Online-PDF-Toolkit. PDFs zusammenfügen, teilen, drehen, schützen und bearbeiten — 100% lokal in Ihrem Browser ohne Server-Uploads.',
      orgDesc: 'Datenschutzorientiertes, clientseitiges PDF-Toolkit mit 24 Werkzeugen (22 lokale Standard-Tools ohne Server-Uploads + 2 optionale KI-Tools).',
      websiteDesc: 'Kostenlose browserbasierte PDF-Tools — 100% privat, ohne Uploads und ohne Registrierung.',
      features: [
        'Mehrere PDF-Dateien zusammenfügen',
        'PDF in einzelne Seiten teilen',
        'In Graustufen konvertieren',
        'PDF-Seiten drehen',
        'Seiten aus PDF löschen',
        'Wasserzeichen hinzufügen',
        'Seitenzahlen einfügen',
        'Leere Seiten einfügen',
        'PDF mit Passwort schützen',
        'Passwortgeschützte PDFs entsperren',
        'Bilder in PDF umwandeln',
        'PDF in Bilder umwandeln',
        'KI-gestützte PDF-Analyse'
      ]
    },
    fr: {
      code: 'fr',
      langName: 'French',
      title: 'Outils PDF gratuits et confidentiels en ligne | PDFMinty',
      desc: 'Suite d’outils PDF gratuits dans votre navigateur. Fusionnez, divisez, protégez et éditez vos fichiers PDF sans téléversement et en toute confidentialité.',
      h1: 'Outils PDF gratuits dans le navigateur — 100% confidentiels, zéro téléversement',
      lead: `PDFMinty est une boîte à outils PDF axée sur la confidentialité comprenant ${toolsCount} outils puissants. Nos 22 outils PDF standard s'exécutent à 100% localement dans votre navigateur afin que vos fichiers ne quittent jamais votre appareil — sans téléversement serveur ni inscription obligatoire (plus 2 outils optionnels d'analyse IA et d'OCR propulsés par Google Gemini uniquement avec votre consentement explicite).`,
      toolsTitle: 'Tous les outils PDF',
      whyTitle: 'Pourquoi choisir PDFMinty ?',
      whyIntro: 'Contrairement aux outils PDF en ligne traditionnels qui téléversent vos fichiers sur des serveurs distants, PDFMinty traite les opérations standard localement dans votre navigateur grâce à WebAssembly. Cela signifie :',
      whyFeatures: [
        { title: 'Confidentialité totale', desc: 'Vos documents ne touchent jamais nos serveurs pour nos 22 outils PDF standard.' },
        { title: 'Limites de taille généreuses', desc: 'Traitez des fichiers jusqu’à 100 Mo en tant qu’invité (150 Mo avec un compte gratuit, 500 Mo avec Pro).' },
        { title: 'Traitement ultra-rapide', desc: 'Les opérations optimisées par WebAssembly s’exécutent en quelques secondes.' },
        { title: 'Sans inscription obligatoire', desc: 'Les invités bénéficient de 5 tâches gratuites par jour sans inscription (10/jour avec un compte gratuit, illimité avec Pro).' },
        { title: 'Fonctionne hors ligne', desc: 'Compatible PWA — installez et utilisez les outils standard même sans connexion Internet.' }
      ],
      privacyTitle: 'Comment PDFMinty protège votre vie privée',
      privacyP1: 'Les 22 opérations PDF standard sur PDFMinty s’exécutent côté client grâce à JavaScript et WebAssembly. Lorsque vous sélectionnez un fichier, il est chargé dans la mémoire de votre navigateur, traité localement et le résultat est généré sur votre appareil. Les seules exceptions sont nos 2 outils optionnels d’analyse IA et d’OCR PDF, qui ne transmettent le texte extrait ou les images de pages à Google Gemini qu’après votre accord explicite.',
      privacyP2: 'Notre architecture axée sur la confidentialité fait de PDFMinty le choix idéal pour traiter des documents sensibles tels que déclarations fiscales, dossiers médicaux, relevés financiers et contrats juridiques.',
      faqTitle: 'Foire aux questions (FAQ)',
      faqs: [
        { q: 'Comment PDFMinty traite-t-il mes fichiers PDF en toute confidentialité ?', a: 'PDFMinty exécute nos 22 outils PDF standard à 100% localement dans votre navigateur web grâce à WebAssembly et JavaScript sans téléverser vos fichiers sur un serveur. Les seules exceptions sont nos 2 outils optionnels d’analyse IA et d’OCR PDF, qui n’envoient des données à Google Gemini qu’après votre consentement explicite.' },
        { q: 'PDFMinty est-il gratuit ?', a: `Oui — PDFMinty propose une offre gratuite sur l'ensemble des ${toolsCount} outils : les invités disposent de 5 tâches quotidiennes gratuites (jusqu'à 100 Mo par fichier) sans compte ni carte bancaire, et les comptes gratuits bénéficient de 10 tâches par jour (jusqu'à 150 Mo) sans filigrane. Des formules optionnelles Pro (2,49 $/mois) et Lifetime (50 $ en paiement unique) offrent un usage quotidien illimité et des fichiers jusqu'à 500 Mo.` },
        { q: 'Mes fichiers quittent-ils un jour mon appareil ?', a: 'Non, pour nos 22 outils PDF standard, vos fichiers ne quittent jamais votre ordinateur ni votre appareil mobile. Les seules exceptions sont les 2 outils optionnels d’analyse IA et d’OCR PDF, qui ne transmettent d’extraits textuels ou d’images de pages à Google Gemini qu’après votre accord explicite.' },
        { q: 'Quelle est la taille maximale de fichier autorisée ?', a: 'PDFMinty prend en charge des fichiers individuels jusqu’à 100 Mo pour les invités (150 Mo avec un compte gratuit, 500 Mo avec Pro) et des opérations par lot jusqu’à 150 Mo sur l’offre gratuite (1 000 Mo avec Pro).' }
      ],
      ctaTitle: 'Commencez à traiter vos fichiers PDF dès maintenant',
      ctaDesc: 'Parcourez notre collection complète d’outils PDF ci-dessus. Profitez de 5 tâches gratuites par jour sans inscription (10/jour avec un compte gratuit, illimité avec Pro).',
      featuredOn: 'Reconnu et présenté sur',
      webAppDesc: 'Boîte à outils PDF en ligne gratuite et confidentielle. Fusionnez, divisez, faites pivoter, protégez et éditez vos PDF à 100% dans votre navigateur sans téléversement.',
      orgDesc: 'Boîte à outils PDF côté client, axée sur la confidentialité, comprenant 24 outils (22 outils locaux sans serveur distant + 2 outils IA optionnels).',
      websiteDesc: 'Outils PDF gratuits dans le navigateur — 100% confidentiels, zéro téléversement et sans inscription.',
      features: [
        'Fusionner plusieurs fichiers PDF',
        'Diviser un PDF en pages individuelles',
        'Convertir en niveaux de gris',
        'Faire pivoter des pages PDF',
        'Supprimer des pages d’un PDF',
        'Ajouter un filigrane',
        'Numéroter les pages',
        'Insérer des pages vierges',
        'Protéger un PDF par mot de passe',
        'Déverrouiller un PDF protégé',
        'Convertir des images en PDF',
        'Convertir un PDF en images',
        'Analyse PDF par IA'
      ]
    },
    es: {
      code: 'es',
      langName: 'Spanish',
      title: 'PdfMinty — Herramientas PDF gratis y privadas (100% en el navegador)',
      desc: 'Herramientas PDF gratuitas en tu navegador. Une, divide, protege y edita PDFs sin subir archivos a servidores. 100% privado y seguro.',
      h1: 'Herramientas PDF gratuitas en el navegador — 100% privadas, sin subidas',
      lead: `PDFMinty es un conjunto de herramientas PDF centrado en la privacidad con ${toolsCount} potentes herramientas. Nuestras 22 herramientas PDF estándar se ejecutan al 100% localmente en tu navegador para que tus archivos nunca salgan de tu dispositivo: sin subidas a servidores ni registro obligatorio (más 2 herramientas opcionales de análisis IA y OCR con Google Gemini solo bajo tu consentimiento explícito).`,
      toolsTitle: 'Todas las herramientas PDF',
      whyTitle: '¿Por qué elegir PDFMinty?',
      whyIntro: 'A diferencia de las herramientas PDF en línea tradicionales que suben tus archivos a servidores remotos, PDFMinty procesa las operaciones estándar localmente en tu navegador usando WebAssembly. Esto significa:',
      whyFeatures: [
        { title: 'Privacidad completa', desc: 'Tus documentos nunca tocan nuestros servidores en las 22 herramientas PDF estándar.' },
        { title: 'Límites de archivo amplios', desc: 'Procesa archivos de hasta 100 MB como invitado (150 MB con cuenta gratuita, 500 MB en Pro).' },
        { title: 'Procesamiento rápido', desc: 'Las operaciones con tecnología WebAssembly se completan en segundos.' },
        { title: 'Sin registro obligatorio', desc: 'Los invitados disponen de 5 tareas diarias gratis sin registro (10/día con cuenta gratuita, ilimitadas en Pro).' },
        { title: 'Funciona sin conexión', desc: 'Compatible con PWA: instala y usa las herramientas estándar incluso sin conexión a internet.' }
      ],
      privacyTitle: 'Cómo protege PDFMinty tu privacidad',
      privacyP1: 'Las 22 operaciones estándar de PDF en PDFMinty ocurren del lado del cliente utilizando JavaScript y WebAssembly. Cuando cargas un archivo, se almacena en la memoria de tu navegador, se procesa localmente y el resultado se genera en tu dispositivo. Las únicas excepciones son nuestras 2 herramientas opcionales de Análisis IA y OCR PDF, que solo envían texto extraído o imágenes de páginas a Google Gemini tras tu consentimiento explícito.',
      privacyP2: 'Nuestra arquitectura orientada a la privacidad convierte a PDFMinty en la solución ideal para procesar documentos confidenciales como declaraciones de impuestos, registros médicos, estados financieros y contratos legales.',
      faqTitle: 'Preguntas frecuentes (FAQ)',
      faqs: [
        { q: '¿Cómo procesa PDFMinty mis archivos PDF de forma privada?', a: 'PDFMinty ejecuta nuestras 22 herramientas estándar de forma 100% local en su navegador web mediante WebAssembly y JavaScript sin subir archivos a servidores externos. Las únicas excepciones son las 2 herramientas opcionales de Análisis IA y OCR PDF, que requieren su consentimiento explícito antes de enviar datos a Google Gemini.' },
        { q: '¿PDFMinty es gratuito?', a: `Sí — PDFMinty ofrece un nivel gratuito en las ${toolsCount} herramientas: los invitados reciben 5 tareas diarias gratuitas (hasta 100 MB por archivo) sin cuenta ni tarjeta de crédito, y los usuarios con cuenta gratuita reciben 10 tareas diarias (hasta 150 MB) sin marcas de agua. Los planes opcionales Pro ($2.49/mes) y Lifetime ($50 pago único) ofrecen tareas diarias ilimitadas y archivos de hasta 500 MB.` },
        { q: '¿Salen alguna vez mis archivos de mi dispositivo?', a: 'No, en nuestras 22 herramientas estándar de PDF, sus archivos nunca salen de su ordenador o teléfono móvil. Las únicas excepciones opcionales son las 2 herramientas de Análisis IA y OCR PDF, que solo envían texto o imágenes de páginas a Google Gemini tras su consentimiento expreso.' },
        { q: '¿Cuál es el tamaño máximo de archivo permitido?', a: 'PDFMinty admite archivos PDF individuales de hasta 100 MB para invitados (150 MB con cuenta gratuita, 500 MB en Pro) y operaciones por lotes de hasta 150 MB en el nivel gratuito (1,000 MB en Pro).' }
      ],
      ctaTitle: 'Comienza a procesar tus archivos PDF ahora',
      ctaDesc: 'Explora nuestra colección completa de herramientas PDF arriba. Disfruta de 5 tareas diarias gratuitas sin registro (10/día con cuenta gratuita, o ilimitadas en Pro).',
      featuredOn: 'Reconocido y destacado en',
      webAppDesc: 'Herramientas PDF en línea gratuitas y privadas. Une, divide, rota, protege y edita documentos PDF directamente en tu navegador sin subir archivos a servidores.',
      orgDesc: 'Kit de herramientas PDF del lado del cliente, con privacidad garantizada y 24 utilidades (22 herramientas locales + 2 herramientas IA opcionales).',
      websiteDesc: 'Herramientas PDF gratuitas en el navegador — 100% privadas, sin subidas de archivos ni registros.',
      features: [
        'Unir varios archivos PDF',
        'Dividir PDF en páginas individuales',
        'Convertir a escala de grises',
        'Rotar páginas PDF',
        'Eliminar páginas de un PDF',
        'Añadir marcas de agua',
        'Insertar números de página',
        'Insertar páginas en blanco',
        'Proteger PDF con contraseña',
        'Desbloquear PDF protegido',
        'Convertir imágenes a PDF',
        'Convertir PDF a imágenes',
        'Análisis de PDF con IA'
      ]
    },
    bn: {
      code: 'bn',
      langName: 'Bengali',
      title: 'PdfMinty — বিনামূল্যে গোপনীয়তা-বান্ধব পিডিএফ টুলস (১০০% ব্রাউজারে)',
      desc: 'ব্রাউজারেই বিনামূল্যে পিডিএফ টুলস। কোনো সার্ভার আপলোড বা নিবন্ধন ছাড়া পিডিএফ যুক্ত করুন, ভাগ করুন, সংকুচিত করুন এবং সুরক্ষিত করুন। ১০০% গোপনীয়তা।',
      h1: 'ফ্রি ব্রাউজার-ভিত্তিক পিডিএফ টুলস — ১০০% প্রাইভেট, কোনো আপলোড নেই',
      lead: `PDFMinty হলো একটি প্রাইভেসি-ফার্স্ট পিডিএফ টুলকিট যাতে রয়েছে ${toolsCount}টি শক্তিশালী টুল। আমাদের ২২টি স্ট্যান্ডার্ড পিডিএফ টুল ১০০% আপনার ব্রাউজারে লোকালভাবে চলে, ফলে আপনার ফাইল কখনো ডিভাইস থেকে বাইরে যায় না — কোনো সার্ভার আপলোড বা বাধ্যতামূলক সাইন-আপ নেই (সাথে আপনার সুস্পষ্ট সম্মতিতে Google Gemini চালিত ২টি ঐচ্ছিক AI Analyze ও OCR PDF টুল)।`,
      toolsTitle: 'সকল পিডিএফ টুলস',
      whyTitle: 'কেন PDFMinty বেছে নেবেন?',
      whyIntro: 'অন্যান্য অনলাইন পিডিএফ টুলের মতো নয় যা আপনার ফাইলগুলো রিমোট সার্ভারে আপলোড করে, PDFMinty ওয়েবঅ্যাসেম্বলি (WebAssembly) প্রযুক্তি ব্যবহার করে স্ট্যান্ডার্ড অপারেশনগুলো আপনার ব্রাউজারে সম্পূর্ণ লোকালভাবে প্রসেস করে। এর সুবিধা:',
      whyFeatures: [
        { title: 'সম্পূর্ণ গোপনীয়তা', desc: '২২টি স্ট্যান্ডার্ড পিডিএফ টুলের ক্ষেত্রে আপনার ডকুমেন্ট কখনোই আমাদের সার্ভারে যায় না।' },
        { title: 'বড় ফাইল সাপোর্ট', desc: 'গেস্ট হিসেবে ১০০ মেগাবাইট পর্যন্ত ফাইল প্রসেস করুন (ফ্রি অ্যাকাউন্টে ১৫০ মেগাবাইট, প্রো প্ল্যানে ৫০০ মেগাবাইট)।' },
        { title: 'দ্রুত প্রসেসিং', desc: 'ওয়েবঅ্যাসেম্বলি প্রযুক্তির কারণে কয়েক সেকেন্ডে কাজ সম্পন্ন হয়।' },
        { title: 'বাধ্যতামূলক রেজিস্ট্রেশন নেই', desc: 'গেস্ট ব্যবহারকারীরা সাইন-আপ ছাড়াই প্রতিদিন ৫টি ফ্রি টাস্ক পান (ফ্রি অ্যাকাউন্টে ১০টি/দিন, প্রো প্ল্যানে আনলিমিটেড)।' },
        { title: 'অফলাইনে কাজ করে', desc: 'PWA সমৃদ্ধ — ইন্টারনেট সংযোগ ছাড়াই ইন্সটল করে স্ট্যান্ডার্ড টুলগুলো ব্যবহার করুন।' }
      ],
      privacyTitle: 'PDFMinty কীভাবে আপনার গোপনীয়তা রক্ষা করে',
      privacyP1: 'PDFMinty-এর ২২টি স্ট্যান্ডার্ড পিডিএফ অপারেশন জাভাস্ক্রিপ্ট এবং ওয়েবঅ্যাসেম্বলি ব্যবহার করে ক্লায়েন্ট-সাইডে সম্পন্ন হয়। আপনি যখন একটি ফাইল নির্বাচন করেন, এটি সরাসরি ব্রাউজারের মেমরিতে লোড হয়, লোকালভাবে প্রসেস হয় এবং আপনার ডিভাইসেই আউটপুট তৈরি হয়। একমাত্র ব্যতিক্রম আমাদের ২টি ঐচ্ছিক AI Analyze এবং OCR PDF টুল, যা আপনার সুস্পষ্ট সম্মতির পরেই কেবল এক্সট্র্যাক্ট করা টেক্সট বা পেজ ইমেজ Google Gemini-তে পাঠায়।',
      privacyP2: 'আমাদের প্রাইভেসি-ফার্স্ট আর্কিটেকচার ট্যাক্স রিটার্ন, মেডিকেল রেকর্ড, ফিনান্সিয়াল স্টেটমেন্ট, আইনি চুক্তি এবং ব্যক্তিগত যেকোনো সংবেদনশীল ডকুমেন্ট প্রসেস করার জন্য PDFMinty-কে অত্যন্ত নিরাপদ ও বিশ্বস্ত করে তোলে।',
      faqTitle: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)',
      faqs: [
        { q: 'PDFMinty কীভাবে আমার PDF গোপনীয়ভাবে প্রসেস করে?', a: 'PDFMinty আমাদের ২২টি স্ট্যান্ডার্ড পিডিএফ টুল ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট এবং ওয়েবঅ্যাসেম্বলি (WebAssembly) ব্যবহার করে আপনার ব্রাউজারের ভেতর ১০০% লোকালভাবে প্রসেস করে। একমাত্র ব্যতিক্রম ২টি ঐচ্ছিক AI Analyze ও OCR PDF টুল, যা আপনার সুস্পষ্ট সম্মতির পরেই Google Gemini-তে ডেটা পাঠায়।' },
        { q: 'PDFMinty কি বিনামূল্যে ব্যবহার করা যায়?', a: `হ্যাঁ — PDFMinty-এর সকল ${toolsCount}টি টুলে ফ্রি টিয়ার রয়েছে: গেস্ট ব্যবহারকারীরা কোনো অ্যাকাউন্ট বা ক্রেডিট কার্ড ছাড়াই প্রতিদিন ৫টি ফ্রি টাস্ক (প্রতি ফাইল ১০০MB পর্যন্ত) পান এবং ফ্রি রেজিস্টার্ড ব্যবহারকারীরা কোনো ওয়াটারমার্ক ছাড়াই প্রতিদিন ১০টি টাস্ক (প্রতি ফাইল ১৫০MB পর্যন্ত) পান। আনলিমিটেড দৈনিক কাজ ও ৫০০MB ফাইলের জন্য ঐচ্ছিক Pro ($2.49/মাস) এবং Lifetime ($50 এককালীন) প্ল্যান রয়েছে।` },
        { q: 'আমার ফাইল কি কখনো আমার ডিভাইস ছাড়ায়?', a: 'না, আমাদের ২২টি স্ট্যান্ডার্ড পিডিএফ টুলের ক্ষেত্রে আপনার ফাইল কখনোই কম্পিউটার বা মোবাইল ডিভাইস ছেড়ে ইন্টারনেটে যায় না। একমাত্র ব্যতিক্রম ২টি ঐচ্ছিক AI Analyze এবং OCR PDF টুল, যা ব্যবহারকারীর সুস্পষ্ট সম্মতির পরেই টেক্সট বা পেজ ইমেজ পাঠায়।' },
        { q: 'সর্বোচ্চ কত সাইজের ফাইল প্রসেস করা যায়?', a: 'PDFMinty গেস্ট ব্যবহারকারীদের জন্য একক ফাইলে সর্বোচ্চ ১০০ মেগাবাইট (ফ্রি অ্যাকাউন্টে ১৫০ মেগাবাইট, প্রো প্ল্যানে ৫০০ মেগাবাইট) এবং ফ্রি টিয়ারে সম্মিলিত অপারেশনে সর্বোচ্চ ১৫০ মেগাবাইট (প্রো প্ল্যানে ১,০০০ মেগাবাইট) পর্যন্ত ফাইল সাপোর্ট করে।' }
      ],
      ctaTitle: 'এখনই আপনার PDF প্রসেসিং শুরু করুন',
      ctaDesc: 'উপরে আমাদের সম্পূর্ণ পিডিএফ টুলসের তালিকা দেখুন। সাইন-আপ ছাড়াই প্রতিদিন ৫টি ফ্রি টাস্ক উপভোগ করুন (ফ্রি অ্যাকাউন্টে ১০টি/দিন, অথবা প্রো প্ল্যানে আনলিমিটেড)।',
      featuredOn: 'স্বীকৃত ও ফিচার্ড হয়েছে',
      webAppDesc: 'সম্পূর্ণ বিনামূল্যে ও গোপনীয়তাবান্ধব অনলাইন পিডিএফ টুলকিট। ব্রাউজারের ভেতর সরাসরি পিডিএফ মার্জ, স্প্লিট, রোটেট, প্রটেক্ট এবং এডিট করুন কোনো সার্ভার আপলোড ছাড়াই।',
      orgDesc: 'প্রাইভেসি-ফার্স্ট ক্লায়েন্ট-সাইড পিডিএফ টুলকিট যাতে রয়েছে ২৪টি টুল (২২টি লোকাল টুল + ২টি ঐচ্ছিক এআই টুল)।',
      websiteDesc: 'ব্রাউজার-ভিত্তিক ফ্রি পিডিএফ টুলস — ১০০% ব্যক্তিগত, জিরো ফাইল আপলোড এবং কোনো সাইন-আপ ছাড়াই।',
      features: [
        'একাধিক পিডিএফ ফাইল মার্জ বা একত্রিত করা',
        'পিডিএফ পৃথক পেজে স্প্লিট করা',
        'গ্রেস্কেল রূপান্তর করা',
        'পিডিএফ পেজ রোটেট করা',
        'পিডিএফ থেকে পেজ ডিলিট করা',
        'ওয়াটারমার্ক যোগ করা',
        'পৃষ্ঠা নম্বর যুক্ত করা',
        'ফাঁকা পৃষ্ঠা যুক্ত করা',
        'পাসওয়ার্ড দিয়ে পিডিএফ সুরক্ষিত করা',
        'পাসওয়ার্ডযুক্ত পিডিএফ আনলক করা',
        'ছবি থেকে পিডিএফ তৈরি',
        'পিডিএফ থেকে ছবি তৈরি',
        'এআই-চালিত পিডিএফ বিশ্লেষণ'
      ]
    },
    hi: {
      code: 'hi',
      langName: 'Hindi',
      title: 'PdfMinty — मुफ्त प्राइवेसी-फर्स्ट पीडीएफ टूल्स (100% ब्राउज़र में)',
      desc: 'आपके ब्राउज़र में मुफ्त पीडीएफ टूल्स। सर्वर अपलोड या रजिस्ट्रेशन के बिना पीडीएफ मर्ज, स्प्लिट और प्रोटेक्ट करें। 100% प्राइवेसी।',
      h1: 'मुफ़्त ब्राउज़र-आधारित पीडीएफ उपकरण — 100% निजी, कोई अपलोड नहीं',
      lead: `PDFMinty एक प्राइवेसी-फर्स्ट पीडीएफ टूलकिट है जिसमें ${toolsCount} शक्तिशाली उपकरण हैं। हमारे 22 मानक पीडीएफ उपकरण 100% आपके ब्राउज़र में स्थानीय रूप से चलते हैं ताकि आपकी फ़ाइलें कभी भी आपके डिवाइस से बाहर न जाएं — कोई सर्वर अपलोड नहीं और कोई अनिवार्य साइन-अप नहीं (साथ ही आपकी स्पष्ट सहमति से Google Gemini द्वारा संचालित 2 वैकल्पिक AI Analyze और OCR PDF उपकरण)।`,
      toolsTitle: 'सभी पीडीएफ उपकरण',
      whyTitle: 'PDFMinty क्यों चुनें?',
      whyIntro: 'अन्य ऑनलाइन पीडीएफ उपकरणों के विपरीत जो आपकी फ़ाइलों को रिमोट सर्वर पर अपलोड करते हैं, PDFMinty WebAssembly का उपयोग करके मानक कार्यों को आपके ब्राउज़र में स्थानीय रूप से प्रोसेस करता है। इसका मतलब है:',
      whyFeatures: [
        { title: 'पूर्ण गोपनीयता', desc: 'सभी 22 मानक पीडीएफ उपकरणों के लिए आपके दस्तावेज़ कभी भी हमारे सर्वर पर नहीं जाते हैं।' },
        { title: 'बड़ी फ़ाइल सीमा', desc: 'अतिथि के रूप में 100MB तक की फ़ाइलें प्रोसेस करें (मुफ़्त खाते के साथ 150MB, Pro पर 500MB)।' },
        { title: 'तेज़ प्रोसेसिंग', desc: 'WebAssembly-संचालित कार्य कुछ ही सेकंड में पूरे होते हैं।' },
        { title: 'अनिवार्य पंजीकरण नहीं', desc: 'अतिथि उपयोगकर्ताओं को बिना साइन-अप के प्रतिदिन 5 मुफ़्त कार्य मिलते हैं (मुफ़्त खाते में 10/दिन, Pro में असीमित)।' },
        { title: 'ऑफ़लाइन काम करता है', desc: 'PWA-सक्षम — बिना इंटरनेट के इंस्टॉल करें और मानक उपकरणों का उपयोग करें।' }
      ],
      privacyTitle: 'PDFMinty आपकी गोपनीयता की रक्षा कैसे करता है',
      privacyP1: 'PDFMinty में सभी 22 मानक पीडीएफ ऑपरेशन जावास्क्रिप्ट और WebAssembly का उपयोग करके क्लाइंट-साइड पर होते हैं। जब आप कोई फ़ाइल चुनते हैं, तो वह आपके ब्राउज़र की मेमोरी में लोड होती है, स्थानीय रूप से प्रोसेस होती है और परिणाम आपके डिवाइस पर ही तैयार होता है। केवल हमारे 2 वैकल्पिक AI Analyze और OCR PDF टूल्स आपकी स्पष्ट सहमति के बाद ही Google Gemini को टेक्स्ट या पेज इमेज भेजते हैं।',
      privacyP2: 'हमारा प्राइवेसी-फर्स्ट आर्किटेक्चर PDFMinty को टैक्स रिटर्न, मेडिकल रिकॉर्ड, वित्तीय विवरण, कानूनी अनुबंध और व्यक्तिगत जानकारी वाले किसी भी संवेदनशील दस्तावेज़ को प्रोसेस करने के लिए आदर्श बनाता है।',
      faqTitle: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
      faqs: [
        { q: 'PDFMinty मेरी पीडीएफ फाइलों को निजी तौर पर कैसे प्रोसेस करता है?', a: 'PDFMinty हमारे 22 मानक पीडीएफ उपकरणों को WebAssembly और जावास्क्रिप्ट का उपयोग करके पूरी तरह से आपके ब्राउज़र के भीतर प्रोसेस करता है। केवल 2 वैकल्पिक AI Analyze और OCR PDF टूल्स आपकी स्पष्ट सहमति के बाद ही Google Gemini को डेटा भेजते हैं।' },
        { q: 'क्या PDFMinty का उपयोग मुफ़्त है?', a: `हाँ — PDFMinty सभी ${toolsCount} उपकरणों पर मुफ़्त टियर प्रदान करता है: अतिथियों को बिना किसी खाते या क्रेडिट कार्ड के प्रतिदिन 5 मुफ़्त कार्य (प्रति फ़ाइल 100MB तक) मिलते हैं, और मुफ़्त पंजीकृत उपयोगकर्ताओं को बिना किसी वॉटरमार्क के प्रतिदिन 10 कार्य (150MB तक) मिलते हैं। असीमित दैनिक कार्यों और 500MB फ़ाइलों के लिए वैकल्पिक Pro ($2.49/माह) और Lifetime ($50 एकबारगी) प्लान उपलब्ध हैं।` },
        { q: 'क्या मेरी फाइलें कभी मेरे डिवाइस से बाहर जाती हैं?', a: 'नहीं, हमारे सभी 22 मानक पीडीएफ उपकरणों के लिए फाइलें कभी भी आपके कंप्यूटर या मोबाइल को छोड़कर बाहर नहीं जाती हैं। केवल 2 वैकल्पिक AI Analyze और OCR PDF टूल आपकी स्पष्ट सहमति के बाद ही टेक्स्ट या पेज इमेज भेजते हैं।' },
        { q: 'अधिकतम फाइल आकार कितना है?', a: 'PDFMinty अतिथियों के लिए 100MB तक की एकल फाइलों (मुफ़्त खाते के लिए 150MB, Pro पर 500MB) और मुफ़्त टियर में कुल 150MB तक के बैच ऑपरेशन (Pro पर 1,000MB) को प्रोसेस कर सकता है।' }
      ],
      ctaTitle: 'अभी अपनी पीडीएफ प्रोसेस करना शुरू करें',
      ctaDesc: 'ऊपर हमारे पीडीएफ उपकरणों का पूरा संग्रह देखें। बिना साइन-अप के प्रतिदिन 5 मुफ़्त कार्यों का आनंद लें (मुफ़्त खाते के साथ 10/दिन, या Pro पर असीमित)।',
      featuredOn: 'इन मंचों पर प्रदर्शित',
      webAppDesc: 'मुफ़्त और प्राइवेसी-फर्स्ट ऑनलाइन पीडीएफ टूलकिट। अपने ब्राउज़र में सीधे पीडीएफ मर्ज, स्प्लिट, रोटेट, प्रोटेक्ट और एडिट करें — बिना किसी सर्वर अपलोड के।',
      orgDesc: 'प्राइवेसी-फर्स्ट, क्लाइंट-साइड पीडीएफ टूलकिट जिसमें 24 सुरक्षित टूल्स (22 लोकल टूल्स + 2 वैकल्पिक AI टूल्स) उपलब्ध हैं।',
      websiteDesc: 'मुफ़्त ब्राउज़र-आधारित पीडीएफ उपकरण — 100% निजी, कोई सर्वर अपलोड नहीं, कोई पंजीकरण नहीं।',
      features: [
        'कई पीडीएफ फाइलों को एक साथ जोड़ें',
        'पीडीएफ को अलग-अलग पेजों में विभाजित करें',
        'ग्रेस्केल में बदलें',
        'पीडीएफ पेजों को घुमाएं',
        'पीडीएफ से पेज हटाएं',
        'वॉटरमार्क जोड़ें',
        'पेज नंबर डालें',
        'खाली पेज डालें',
        'पासवर्ड से सुरक्षित करें',
        'पासवर्ड वाली पीडीएफ अनलॉक करें',
        'इमेज को पीडीएफ में बदलें',
        'पीडीएफ को इमेज में बदलें',
        'एआई-आधारित पीडीएफ विश्लेषण'
      ]
    },
    zh: {
      code: 'zh',
      langName: 'Chinese',
      title: 'PdfMinty — 免费的隐私优先PDF工具（100%在浏览器中运行）',
      desc: '直接在浏览器中使用的免费PDF工具。无需服务器上传或注册，即可合并、拆分和保护PDF。100%隐私安全。',
      h1: '免费的基于浏览器的 PDF 工具 — 100% 私密，零上传',
      lead: `PDFMinty 是一套注重隐私的 PDF 工具箱，拥有 ${toolsCount} 款强大工具。我们的 22 款标准 PDF 工具 100% 在您的浏览器本地运行，文件绝不会离开您的设备——零服务器上传、无需强制注册（另含 2 款可选的 AI 分析与 OCR PDF 工具，仅在您明确勾选同意后使用 Google Gemini 处理）。`,
      toolsTitle: '所有 PDF 工具',
      whyTitle: '为什么选择 PDFMinty？',
      whyIntro: '与其他将文件上传到远程服务器的传统在线 PDF 工具不同，PDFMinty 使用 WebAssembly 在您的浏览器中本地处理标准 PDF 操作。这意味着：',
      whyFeatures: [
        { title: '完全隐私', desc: '使用全部 22 款标准 PDF 工具时，您的文档绝不会接触我们的服务器。' },
        { title: '大文件支持', desc: '访客单文件最高支持 100MB（免费账户 150MB，Pro 版 500MB）。' },
        { title: '疾速处理', desc: '基于 WebAssembly 技术，数秒内完成处理。' },
        { title: '无需强制注册', desc: '访客无需注册即可每天免费使用 5 次任务（免费账户每日 10 次，Pro 版无限次）。' },
        { title: '离线可用', desc: '支持 PWA — 无需互联网即可安装并使用标准本地工具。' }
      ],
      privacyTitle: 'PDFMinty 如何保护您的隐私',
      privacyP1: 'PDFMinty 中的 22 项标准 PDF 操作均使用 JavaScript 和 WebAssembly 在客户端本地运行。当您载入文件时，它直接加载到您的浏览器内存中进行本地运算，生成的结果也直接保存在您的设备上。唯一的例外是我们 2 款可选的 AI 分析与 OCR PDF 工具，它们仅在您主动勾选同意后才会将提取的文本或页面图像发送至 Google Gemini。',
      privacyP2: '我们的隐私优先架构使 PDFMinty 成为处理敏感机密文件（如纳税申报单、医疗记录、财务报表、法律合同以及包含个人身份信息的任何文件）的理想之选。',
      faqTitle: '常见问题解答 (FAQ)',
      faqs: [
        { q: 'PDFMinty 如何私密安全地处理我的 PDF 文件？', a: 'PDFMinty 利用 WebAssembly 和 JavaScript 技术在您的网页浏览器本地完成全部 22 款标准工具的计算与处理，绝不上传至远程服务器。唯一的例外是 2 款可选的 AI 分析与 OCR 工具，仅在您明确授权后才会将数据发送至 Google Gemini。' },
        { q: 'PDFMinty 是免费的吗？', a: `是的 — PDFMinty 为全部 ${toolsCount} 款工具提供免费额度：访客无需注册或绑定信用卡即可享受每日 5 次免费任务（单文件最高 100MB），免费注册账户每日可享 10 次任务（单文件最高 150MB），且导出绝无水印。此外还提供可选的 Pro（$2.49/月）和终身版（$50 一次性付费）方案，解锁无限次每日任务与 500MB 大文件支持。` },
        { q: '我的文件会离开我的电脑或移动设备吗？', a: '对于全部 22 款常规标准 PDF 工具，您的文件绝不会离开您的设备或浏览器。唯一的例外是 2 款可选的 AI 分析与 OCR 工具，且仅在您主动勾选授权后才会传输提取的文本或页面图像。' },
        { q: '支持的最大文件大小是多少？', a: 'PDFMinty 访客模式支持单个最大 100MB 的 PDF 文件（免费账户 150MB，Pro 版 500MB），免费版批量合并等操作总计支持最高 150MB（Pro 版 1,000MB）。' }
      ],
      ctaTitle: '立即开始处理您的 PDF',
      ctaDesc: '浏览上方我们完整的 PDF 工具合集。无需注册即可每日免费处理 5 次任务（免费账户每日 10 次，Pro 版无限次）。',
      featuredOn: '精选收录平台',
      webAppDesc: '免费、注重隐私的在线 PDF 工具箱。完全在浏览器中合并、拆分、旋转、加密和编辑 PDF，零服务器上传，保护您的数据安全。',
      orgDesc: '隐私优先的客户端 PDF 工具箱，提供 24 款工具（22 款无需服务器上传的本地工具 + 2 款可选 AI 工具）。',
      websiteDesc: '免费基于浏览器的 PDF 工具 — 100% 私密，零文件上传，无需注册账户。',
      features: [
        '合并多个 PDF 文件',
        '将 PDF 拆分为单个页面',
        '转换为灰度文档',
        '旋转 PDF 页面',
        '删除 PDF 中的指定页面',
        '添加水印',
        '插入页码',
        '插入空白页',
        '使用密码加密 PDF',
        '解锁受保护的 PDF',
        '将图片转换为 PDF',
        '将 PDF 转换为图片',
        'AI 智能 PDF 分析'
      ]
    }
  };

  const cleanSiteUrl = SITE_URL.replace(/\/+$/, '');

  for (const [code, locData] of Object.entries(localizedHomepagesData)) {
    const euHomepageDir = path.join(distDir, code);
    if (!fs.existsSync(euHomepageDir)) {
      fs.mkdirSync(euHomepageDir, { recursive: true });
    }

    const euCanonical = `${cleanSiteUrl}/${code}/`;
    const hreflangLinks = SUPPORTED_LOCALES.map(loc => 
      `  <link rel="alternate" hreflang="${loc}" href="${cleanSiteUrl}${loc === 'en' ? '/' : `/${loc}/`}">`
    ).join('\n');

    const locCommonPath = path.join(__dirname, `../src/locales/${code}/common.json`);
    interface LocaleToolEntry {
      name?: string;
      desc?: string;
    }
    let locCommon: { tools?: Record<string, LocaleToolEntry> } | null = null;
    if (fs.existsSync(locCommonPath)) {
      try {
        locCommon = JSON.parse(fs.readFileSync(locCommonPath, 'utf8'));
      } catch (err: unknown) {
        logger.warn(`Could not parse common.json for locale ${code}:`, err);
      }
    }

    const euToolsListHtml = TOOLS
      .filter((t: ToolSEOInfo) => t.type === 'tool')
      .map((t: ToolSEOInfo) => {
        const toolUrl = isI18nToolSlug(t.slug) ? `/${code}/${t.slug}/` : `/${t.slug}/`;
        const toolName = locCommon?.tools?.[t.slug]?.name || t.name;
        const toolDesc = locCommon?.tools?.[t.slug]?.desc || t.shortDescription;
        return `      <li><a href="${toolUrl}">${toolName}</a> — ${toolDesc}</li>`;
      })
      .join('\n');

    const euHomepageContent = `
  <main class="prose max-w-6xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
    <h1>${locData.h1}</h1>
    <p>${locData.lead}</p>
 
    <h2 id="all-tools">${locData.toolsTitle}</h2>
    <ul>
${euToolsListHtml}
    </ul>
 
    <h2>${locData.whyTitle}</h2>
    <p>${locData.whyIntro}</p>
    <ul>
${locData.whyFeatures.map(f => `      <li><strong>${f.title}:</strong> ${f.desc}</li>`).join('\n')}
    </ul>
 
    <h2>${locData.privacyTitle}</h2>
    <p>${locData.privacyP1}</p>
 
    <p>${locData.privacyP2}</p>
 
    <h2>${locData.faqTitle}</h2>
${locData.faqs.map(faq => `    <h3>${faq.q}</h3>\n    <p>${faq.a}</p>`).join('\n\n')}
 
    <h2>${locData.ctaTitle}</h2>
    <p>${locData.ctaDesc}</p>

    <div style="margin-top: 2.5rem; text-align: center;">
      <p style="font-weight: 600; margin-bottom: 1rem;">${locData.featuredOn}</p>
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

    locData.jsonld = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "${euCanonical}#webapp",
    "name": "PDFMinty",
    "url": "${euCanonical}",
    "inLanguage": "${code}",
    "description": ${JSON.stringify(locData.webAppDesc)},
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "PDF Software",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@id": "${cleanSiteUrl}/#organization"
    },
    "publisher": {
      "@id": "${cleanSiteUrl}/#organization"
    },
    "image": {
      "@type": "ImageObject",
      "url": "${cleanSiteUrl}/og-image.png",
      "width": 1200,
      "height": 630
    },
    "featureList": ${JSON.stringify(locData.features)}
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "${cleanSiteUrl}/#organization",
    "name": "PDFMinty",
    "url": "${cleanSiteUrl}/",
    "logo": {
      "@type": "ImageObject",
      "url": "${cleanSiteUrl}/logo-512.png",
      "width": 512,
      "height": 512
    },
    "image": "${cleanSiteUrl}/og-image.png",
    "description": ${JSON.stringify(locData.orgDesc)},
    "foundingDate": "2025",
    "sameAs": [
      "${PRIMARY_AUTHOR.github}"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@pdfminty.com",
      "url": "${cleanSiteUrl}/contact/",
      "availableLanguage": ["English", "${locData.langName}"]
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "${cleanSiteUrl}/#website",
    "url": "${cleanSiteUrl}/",
    "name": "PDFMinty",
    "inLanguage": "${code}",
    "description": ${JSON.stringify(locData.websiteDesc)},
    "publisher": {
      "@id": "${cleanSiteUrl}/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "${cleanSiteUrl}/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "${euCanonical}#faq",
    "inLanguage": "${code}",
    "mainEntity": [
${locData.faqs.map(faq => `      {
        "@type": "Question",
        "name": ${JSON.stringify(faq.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(faq.a)}
        }
      }`).join(',\n')}
    ]
  }
  </script>
`;

    const euKeywords = `${locData.features.slice(0, 6).join(', ')}, PDFMinty`;
    const euHeadMeta = `
  <title>${locData.title}</title>
  <meta name="description" content="${locData.desc}">
  <meta name="keywords" content="${euKeywords}">
  <link rel="canonical" href="${euCanonical}">
${hreflangLinks}
  <link rel="alternate" hreflang="x-default" href="${cleanSiteUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${locData.title}">
  <meta property="og:description" content="${locData.desc}">
  <meta property="og:url" content="${euCanonical}">
  <meta property="og:image" content="${cleanSiteUrl}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${euCanonical}">
  <meta name="twitter:title" content="${locData.title}">
  <meta name="twitter:description" content="${locData.desc}">
  <meta name="twitter:image" content="${cleanSiteUrl}/og-image.png">
  ${locData.jsonld}
  `;

    let euHomepageHtml = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${code}"`);
    if (!euHomepageHtml.includes(`lang="${code}"`)) {
      euHomepageHtml = euHomepageHtml.replace('<html', `<html lang="${code}"`);
    }
    euHomepageHtml = euHomepageHtml.replace("</head>", `${euHeadMeta}\n</head>`);

    const euHomepageRootContent = `
    <div id="root">
      ${euHomepageContent}
    </div>
    `;
    euHomepageHtml = euHomepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, euHomepageRootContent.trim());
    fs.writeFileSync(path.join(euHomepageDir, 'index.html'), euHomepageHtml, 'utf8');
    logger.info(`Successfully pre-rendered static HTML for ${code.toUpperCase()} Homepage at dist/${code}/index.html`);
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
