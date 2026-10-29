import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TOOLS,
  SITE_NAME,
  HOMEPAGE_META,
  FAQS,
  RELATED_TOOL_MAPPING,
} from '../src/config/seo-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

// Comprehensive article translations dictionary
import { BN_ARTICLES } from './translations/bn-articles';
import { DE_ARTICLES } from './translations/de-articles';
import { ES_ARTICLES } from './translations/es-articles';
import { FR_ARTICLES } from './translations/fr-articles';
import { HI_ARTICLES } from './translations/hi-articles';
import { ZH_ARTICLES } from './translations/zh-articles';

// UI translations dictionaries
import { UI_TRANSLATIONS } from './translations/ui-translations';

function generateSeoCatalog() {
  const catalogPath = path.join(__dirname, '../src/config/seo-catalog.ts');
  const heavyKeys = new Set([
    'longFormBody',
    'howTo',
    'faqs',
    'supportedFormats',
    'technicalNotes',
    'troubleshooting',
    'relatedLinks',
  ]);
  const catalog = TOOLS.map((t) => {
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(t)) {
      if (!heavyKeys.has(k) && v !== undefined) {
        copy[k] = v;
      }
    }
    const text = (t.longFormBody || '').replace(/<[^>]*>/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    copy.readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return copy;
  });

  const code = `import type { ToolSEOInfo } from './seo-data';

export const SITE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SITE_URL) ||
  'https://pdfminty.com'
).replace(/\\/+$/, '');
export const SITE_NAME = ${JSON.stringify(SITE_NAME)};

export const HOMEPAGE_META = ${JSON.stringify(HOMEPAGE_META, null, 2)};

export const FAQS = ${JSON.stringify(FAQS, null, 2)};

export const RELATED_TOOL_MAPPING: Record<string, string[]> = ${JSON.stringify(RELATED_TOOL_MAPPING, null, 2)};

export type ToolCatalogItem = Omit<
  ToolSEOInfo,
  | 'longFormBody'
  | 'howTo'
  | 'faqs'
  | 'supportedFormats'
  | 'technicalNotes'
  | 'troubleshooting'
  | 'relatedLinks'
> & {
  readingTimeMinutes?: number;
};

export const TOOLS_CATALOG: ToolCatalogItem[] = ${JSON.stringify(catalog, null, 2)};
`;

  fs.writeFileSync(catalogPath, code, 'utf8');
  console.log(`✓ Generated src/config/seo-catalog.ts (${catalog.length} items)`);
}

function main() {
  console.log('Building full 7-locale translations and SEO catalog...');
  generateSeoCatalog();

  const enCommonPath = path.join(localesDir, 'en', 'common.json');
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));

  const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
  const articles = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));

  // Populate EN articles (name + shortDesc only; body is served directly from seo-data.ts)
  if (!enData.articles) enData.articles = {};
  for (const a of articles) {
    const payload = {
      name: a.name,
      shortDesc: a.shortDescription,
    };
    enData.articles[a.id] = payload;
    if (a.slug) enData.articles[a.slug] = payload;
  }
  fs.writeFileSync(enCommonPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');

  const localeArticleMaps: Record<string, Record<string, { name: string; shortDesc: string; body: string }>> = {
    bn: BN_ARTICLES,
    de: DE_ARTICLES,
    es: ES_ARTICLES,
    fr: FR_ARTICLES,
    hi: HI_ARTICLES,
    zh: ZH_ARTICLES,
  };

  for (const loc of ['bn', 'de', 'es', 'fr', 'hi', 'zh']) {
    const locPath = path.join(localesDir, loc, 'common.json');
    const locBodyPath = path.join(localesDir, loc, 'articles-body.json');
    let locData: any = {};
    if (fs.existsSync(locPath)) {
      locData = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    }
    let existingBodies: Record<string, string> = {};
    if (fs.existsSync(locBodyPath)) {
      existingBodies = JSON.parse(fs.readFileSync(locBodyPath, 'utf8'));
    }

    // Merge UI translations
    const uiData = UI_TRANSLATIONS[loc] || {};
    for (const [sectionKey, sectionObj] of Object.entries(uiData)) {
      locData[sectionKey] = {
        ...(enData[sectionKey] || {}),
        ...(locData[sectionKey] || {}),
        ...(sectionObj as any),
      };
    }

    // Ensure any missing top-level UI key from EN is present
    for (const k of Object.keys(enData)) {
      if (k === 'articles') continue;
      if (!locData[k]) {
        locData[k] = enData[k];
      }
    }

    // Populate localized articles (name + shortDesc in common.json, body in articles-body.json)
    if (!locData.articles) locData.articles = {};
    const articleMap = localeArticleMaps[loc] || {};
    const newBodies: Record<string, string> = {};

    for (const a of articles) {
      const translation = articleMap[a.id] || articleMap[a.slug || ''];
      const existing = locData.articles[a.id];
      const nameVal = translation?.name || existing?.name || a.name;
      const shortDescVal = translation?.shortDesc || existing?.shortDesc || a.shortDescription;
      const bodyVal =
        translation?.body ||
        existing?.body ||
        existingBodies[a.id] ||
        (a.slug ? existingBodies[a.slug] : '') ||
        a.longFormBody ||
        a.shortDescription;

      const metaPayload = {
        name: nameVal,
        shortDesc: shortDescVal,
      };
      locData.articles[a.id] = metaPayload;
      if (a.slug) locData.articles[a.slug] = metaPayload;

      if (bodyVal) {
        newBodies[a.id] = bodyVal;
        if (a.slug) newBodies[a.slug] = bodyVal;
      }
    }

    fs.writeFileSync(locPath, JSON.stringify(locData, null, 2) + '\n', 'utf8');
    fs.writeFileSync(locBodyPath, JSON.stringify(newBodies, null, 2) + '\n', 'utf8');
    console.log(`✓ Synchronized ${loc} (${Object.keys(locData).length} UI sections, ${Object.keys(locData.articles).length} article entries)`);
  }

  console.log('🎉 Successfully built complete translations across all languages!');
}

main();
