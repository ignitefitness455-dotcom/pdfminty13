import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from '../src/config/seo-data';

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

const ALL_LOCALES = ['bn', 'de', 'es', 'fr', 'hi', 'zh', 'en'] as const;

function main() {
  console.log('Building full 7-locale translations...');

  const enCommonPath = path.join(localesDir, 'en', 'common.json');
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));

  const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
  const articles = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));

  // Populate EN articles
  if (!enData.articles) enData.articles = {};
  for (const a of articles) {
    const payload = {
      name: a.h1 || a.name,
      shortDesc: a.shortDescription,
      body: a.longFormBody || a.shortDescription || '',
    };
    enData.articles[a.id] = payload;
    if (a.slug) enData.articles[a.slug] = payload;
  }
  fs.writeFileSync(enCommonPath, JSON.stringify(enData, null, 2), 'utf8');

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
    let locData: any = {};
    if (fs.existsSync(locPath)) {
      locData = JSON.parse(fs.readFileSync(locPath, 'utf8'));
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

    // Populate localized articles
    if (!locData.articles) locData.articles = {};
    const articleMap = localeArticleMaps[loc] || {};

    for (const a of articles) {
      const translation = articleMap[a.id] || articleMap[a.slug || ''];
      if (translation && translation.name && translation.body) {
        locData.articles[a.id] = translation;
        if (a.slug) locData.articles[a.slug] = translation;
      } else {
        // Fallback or keep existing
        const existing = locData.articles[a.id];
        if (existing && existing.name && existing.body) {
          if (a.slug) locData.articles[a.slug] = existing;
        } else {
          // If no translation yet, provide title and description
          const fallbackPayload = {
            name: (existing && existing.name) || translation?.name || a.name,
            shortDesc: (existing && existing.shortDesc) || translation?.shortDesc || a.shortDescription,
            body: (existing && existing.body) || translation?.body || a.longFormBody || a.shortDescription,
          };
          locData.articles[a.id] = fallbackPayload;
          if (a.slug) locData.articles[a.slug] = fallbackPayload;
        }
      }
    }

    fs.writeFileSync(locPath, JSON.stringify(locData, null, 2), 'utf8');
    console.log(`✓ Synchronized ${loc} (${Object.keys(locData).length} UI sections, ${Object.keys(locData.articles).length} article entries)`);
  }

  console.log('🎉 Successfully built complete translations across all languages!');
}

main();
