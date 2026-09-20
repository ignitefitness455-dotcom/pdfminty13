import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { TOOLS } from '../src/config/seo-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SUPPORTED_LOCALES = ['bn', 'de', 'es', 'fr', 'hi', 'zh'] as const;
type TargetLocale = typeof SUPPORTED_LOCALES[number];

const LOCALE_NAMES: Record<TargetLocale, string> = {
  bn: 'Bengali (বাংলা)',
  de: 'German (Deutsch)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  hi: 'Hindi (हिन्दी)',
  zh: 'Simplified Chinese (简体中文)',
};

async function generateWithRetry(prompt: string, retries = 5): Promise<string> {
  const models = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'];
  for (let attempt = 0; attempt < retries; attempt++) {
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        const text = response.text || '';
        if (text) return text;
      } catch (err: any) {
        // Sleep before trying next model
        await new Promise((r) => setTimeout(r, 1000 + attempt * 1500));
      }
    }
  }
  throw new Error('Failed to generate content after all model retries');
}

// 1. Synchronize UI Keys in Batches
async function syncMissingUIKeys() {
  console.log('--- Step 1: Synchronizing Missing UI Keys Across Locales ---');
  const enCommonPath = path.join(localesDir, 'en', 'common.json');
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));

  for (const lang of SUPPORTED_LOCALES) {
    const langPath = path.join(localesDir, lang, 'common.json');
    let langData: any = {};
    if (fs.existsSync(langPath)) {
      langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }

    const missingTopKeys: string[] = [];
    for (const key of Object.keys(enData)) {
      if (key === 'articles') continue;
      if (!langData[key] || (typeof langData[key] === 'object' && Object.keys(langData[key]).length === 0)) {
        missingTopKeys.push(key);
      }
    }

    if (missingTopKeys.length > 0) {
      console.log(`[${lang}] Translating ${missingTopKeys.length} missing UI sections in batches...`);
      // Batch in chunks of 5 sections
      const chunkSize = 5;
      for (let i = 0; i < missingTopKeys.length; i += chunkSize) {
        const batchKeys = missingTopKeys.slice(i, i + chunkSize);
        const batchObj: Record<string, any> = {};
        for (const k of batchKeys) {
          batchObj[k] = enData[k];
        }

        const prompt = `You are an expert localization engineer.
Translate the following JSON UI dictionary containing multiple sections into ${LOCALE_NAMES[lang]}.
Rules:
- Keep all top-level keys and nested keys EXACTLY identical.
- Translate only user-facing string values accurately and naturally.
- Keep brand name "PDFMinty" unchanged.
- Preserve {{variables}} like {{count}} exactly.
- Return ONLY valid JSON within \`\`\`json ... \`\`\` code fence.

Input JSON:
${JSON.stringify(batchObj, null, 2)}`;

        try {
          const raw = await generateWithRetry(prompt);
          const cleanJson = raw.replace(/^```json/m, '').replace(/```$/m, '').trim();
          const translatedBatch = JSON.parse(cleanJson);
          for (const k of batchKeys) {
            langData[k] = translatedBatch[k] || enData[k];
          }
          fs.writeFileSync(langPath, JSON.stringify(langData, null, 2), 'utf8');
          console.log(`  -> Saved [${lang}] batch: ${batchKeys.join(', ')}`);
        } catch (err: any) {
          console.error(`  -> Failed batch ${batchKeys.join(', ')} for ${lang}: ${err.message}`);
          for (const k of batchKeys) {
            langData[k] = enData[k];
          }
          fs.writeFileSync(langPath, JSON.stringify(langData, null, 2), 'utf8');
        }
      }
    } else {
      console.log(`[${lang}] All UI sections are present.`);
    }
  }
}

// 2. Synchronize and Translate All Blog Articles
async function syncAndTranslateArticles() {
  console.log('\n--- Step 2: Translating All 39 Blog Articles Across Locales ---');

  const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
  const articles = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));
  console.log(`Found ${articles.length} blog articles to check/translate.`);

  // Ensure en/common.json has all articles
  const enCommonPath = path.join(localesDir, 'en', 'common.json');
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
  if (!enData.articles) enData.articles = {};

  for (const article of articles) {
    const articlePayload = {
      name: article.h1 || article.name,
      shortDesc: article.shortDescription,
      body: article.longFormBody || article.shortDescription || '',
    };
    enData.articles[article.id] = articlePayload;
    if (article.slug && article.slug !== article.id) {
      enData.articles[article.slug] = articlePayload;
    }
  }
  fs.writeFileSync(enCommonPath, JSON.stringify(enData, null, 2), 'utf8');

  // Helper concurrency runner
  async function runConcurrent<T>(items: T[], fn: (item: T, index: number) => Promise<void>, concurrency = 3) {
    let index = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (index < items.length) {
        const currentIndex = index++;
        await fn(items[currentIndex], currentIndex);
      }
    });
    await Promise.all(workers);
  }

  for (const lang of SUPPORTED_LOCALES) {
    console.log(`\n=== Processing Locale: ${lang} (${LOCALE_NAMES[lang]}) ===`);
    const langPath = path.join(localesDir, lang, 'common.json');
    let langData: any = {};
    if (fs.existsSync(langPath)) {
      langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }
    if (!langData.articles) langData.articles = {};

    const articlesToTranslate = articles.filter((a) => {
      const existing = langData.articles[a.id];
      return !(existing && existing.name && existing.body && existing.body.length > 100);
    });

    console.log(`[${lang}] ${articlesToTranslate.length} articles need translation.`);

    await runConcurrent(articlesToTranslate, async (article, idx) => {
      console.log(`[${lang}] (${idx + 1}/${articlesToTranslate.length}) Translating: "${article.name}"...`);

      const prompt = `You are a professional multilingual translator and technical writer.
Translate the following PDF technical guide/article from English into ${LOCALE_NAMES[lang]}.

Source Metadata:
Title: ${article.h1 || article.name}
Summary: ${article.shortDescription}

Source HTML Content Body:
${article.longFormBody || article.shortDescription || ''}

TRANSLATION INSTRUCTIONS:
1. Translate the Title, Summary, and the entire HTML Content Body into fluent, natural, grammatically pristine ${LOCALE_NAMES[lang]}.
2. CRITICAL: Preserve all HTML tags (<h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <div>, etc.) and class attributes EXACTLY.
3. Keep the brand name "PDFMinty" or "PdfMinty" as is.
4. Keep internal links (e.g. href="/merge-pdf/", href="/compress-pdf/", href="/blog/...") intact without altering URLs.
5. Translate table headings and bullet points thoroughly.
6. Return output in valid JSON matching this schema:
\`\`\`json
{
  "name": "Translated Article Title",
  "shortDesc": "Translated Short Summary",
  "body": "Translated Full HTML Body"
}
\`\`\``;

      try {
        const raw = await generateWithRetry(prompt);
        const cleanJson = raw.replace(/^```json/m, '').replace(/```$/m, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.name && parsed.body) {
          // Read latest data to avoid race condition on write
          const currentData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
          if (!currentData.articles) currentData.articles = {};
          currentData.articles[article.id] = {
            name: parsed.name,
            shortDesc: parsed.shortDesc || article.shortDescription,
            body: parsed.body,
          };
          if (article.slug) {
            currentData.articles[article.slug] = currentData.articles[article.id];
          }
          fs.writeFileSync(langPath, JSON.stringify(currentData, null, 2), 'utf8');
          console.log(`  ✓ [${lang}] Saved: ${article.id}`);
        }
      } catch (err: any) {
        console.error(`  ✗ [${lang}] Error translating ${article.id}: ${err.message}`);
      }
    }, 3);
  }
}

async function main() {
  await syncMissingUIKeys();
  await syncAndTranslateArticles();
  console.log('\n========================================');
  console.log('🎉 ALL TRANSLATIONS COMPLETED & SAVED!');
  console.log('========================================');
}

main().catch((err) => {
  console.error('Fatal translation error:', err);
  process.exit(1);
});
