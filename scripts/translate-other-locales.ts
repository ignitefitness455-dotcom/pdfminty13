import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { TOOLS } from '../src/config/seo-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');
const enCommonPath = path.join(localesDir, 'en', 'common.json');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TARGET_LOCALES = ['de', 'es', 'fr', 'hi', 'zh'] as const;
type Locale = typeof TARGET_LOCALES[number];

const LOCALE_NAMES: Record<Locale, string> = {
  de: 'German (Deutsch)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  hi: 'Hindi (हिन्दी)',
  zh: 'Simplified Chinese (简体中文)',
};

async function generateWithRetry(prompt: string, retries = 3): Promise<string> {
  const models = ['gemini-3.7-flash', 'gemini-3.6-flash'];
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
        await new Promise((r) => setTimeout(r, 1000 + attempt * 1000));
      }
    }
  }
  throw new Error('Failed generation');
}

async function syncAll() {
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
  const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
  const articles = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));

  for (const lang of TARGET_LOCALES) {
    console.log(`\n=== Processing ${lang} (${LOCALE_NAMES[lang]}) ===`);
    const langPath = path.join(localesDir, lang, 'common.json');
    let langData: any = {};
    if (fs.existsSync(langPath)) {
      langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }

    // 1. Ensure all UI keys exist (copy from EN as default if missing to ensure zero broken keys)
    for (const k of Object.keys(enData)) {
      if (k === 'articles') continue;
      if (!langData[k]) {
        langData[k] = enData[k];
      }
    }
    if (!langData.articles) langData.articles = {};

    // 2. Filter articles needing body
    const pendingArticles = articles.filter((a) => {
      const existing = langData.articles[a.id];
      return !(existing && existing.name && existing.body && existing.body.length > 200);
    });

    console.log(`[${lang}] ${pendingArticles.length} articles need translation.`);

    let cursor = 0;
    const concurrency = 4;
    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < pendingArticles.length) {
        const idx = cursor++;
        const article = pendingArticles[idx];
        console.log(`[${lang}] (${idx + 1}/${pendingArticles.length}) Translating "${article.name}"...`);

        const prompt = `You are a professional translator and technical editor.
Translate this complete PDF technical guide from English into ${LOCALE_NAMES[lang]}.

Title: ${article.h1 || article.name}
Summary: ${article.shortDescription}
HTML Content:
${article.longFormBody || article.shortDescription || ''}

RULES:
1. Translate the Title, Summary, and full HTML Content into natural, grammatically correct ${LOCALE_NAMES[lang]}.
2. PRESERVE ALL HTML tags (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <a>, <table>, <tr>, <td>, <th>, etc.) exactly.
3. Keep brand name "PDFMinty" unchanged.
4. Keep all link URLs in \`href="..."\` unchanged.
5. Return ONLY a valid JSON object in this format:
\`\`\`json
{
  "name": "Translated Article Title",
  "shortDesc": "Translated Summary",
  "body": "Translated HTML Body"
}
\`\`\``;

        try {
          const raw = await generateWithRetry(prompt);
          const cleanJson = raw.replace(/^```json/m, '').replace(/```$/m, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed.name && parsed.body) {
            const curData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
            if (!curData.articles) curData.articles = {};
            curData.articles[article.id] = {
              name: parsed.name,
              shortDesc: parsed.shortDesc || article.shortDescription,
              body: parsed.body,
            };
            if (article.slug) {
              curData.articles[article.slug] = curData.articles[article.id];
            }
            fs.writeFileSync(langPath, JSON.stringify(curData, null, 2), 'utf8');
            console.log(`  ✓ [${lang}] Saved: ${article.id}`);
          }
        } catch (err: any) {
          console.error(`  ✗ [${lang}] Error translating ${article.id}: ${err.message}`);
          const curData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
          if (!curData.articles) curData.articles = {};
          curData.articles[article.id] = {
            name: article.h1 || article.name,
            shortDesc: article.shortDescription,
            body: article.longFormBody || article.shortDescription,
          };
          if (article.slug) curData.articles[article.slug] = curData.articles[article.id];
          fs.writeFileSync(langPath, JSON.stringify(curData, null, 2), 'utf8');
        }
      }
    });

    await Promise.all(workers);
    console.log(`✓ Completed all translations for ${lang}`);
  }

  console.log('\n🎉 ALL LOCALES TRANSLATED & FULLY SYNCED!');
}

syncAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
