import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { TOOLS } from '../src/config/seo-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bnCommonPath = path.join(__dirname, '../src/locales/bn/common.json');
const enCommonPath = path.join(__dirname, '../src/locales/en/common.json');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

async function translateBengaliArticles() {
  console.log('=== Step 1: Translating All Blog Articles into Bengali (বাংলা) ===');
  
  const bnData = JSON.parse(fs.readFileSync(bnCommonPath, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
  if (!bnData.articles) bnData.articles = {};
  if (!enData.articles) enData.articles = {};

  const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
  const articles = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));

  // Sync English articles first
  for (const a of articles) {
    enData.articles[a.id] = {
      name: a.h1 || a.name,
      shortDesc: a.shortDescription,
      body: a.longFormBody || a.shortDescription || '',
    };
    if (a.slug) enData.articles[a.slug] = enData.articles[a.id];
  }
  fs.writeFileSync(enCommonPath, JSON.stringify(enData, null, 2), 'utf8');

  // Filter articles needing translation
  const pending = articles.filter((a) => {
    const existing = bnData.articles[a.id];
    return !(existing && existing.name && existing.body && existing.body.length > 200);
  });

  console.log(`Found ${articles.length} total articles. ${pending.length} need full Bengali translation.`);

  // Process in parallel with concurrency 4
  let completed = 0;
  const concurrency = 4;
  let cursor = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < pending.length) {
      const idx = cursor++;
      const article = pending[idx];
      console.log(`[BN] (${idx + 1}/${pending.length}) Translating "${article.name}" (${article.id})...`);

      const prompt = `You are a professional Bengali technical translator.
Translate this complete PDF technical guide from English to natural, fluent Bengali (বাংলা).

Title: ${article.h1 || article.name}
Summary: ${article.shortDescription}
HTML Content:
${article.longFormBody || article.shortDescription || ''}

RULES:
1. Translate the Title, Summary, and full HTML Content into clear, professional Bengali.
2. PRESERVE ALL HTML tags (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <a>, <table>, <tr>, <td>, <th>, etc.) exactly.
3. Keep brand name "PDFMinty" unchanged.
4. Keep all link URLs in \`href="..."\` unchanged.
5. Return ONLY a valid JSON object in this format:
\`\`\`json
{
  "name": "বাংলা আর্টিকেল শিরোনাম",
  "shortDesc": "বাংলা সারসংক্ষেপ",
  "body": "সম্পূর্ণ বাংলা HTML বডি"
}
\`\`\``;

      try {
        const raw = await generateWithRetry(prompt);
        const cleanJson = raw.replace(/^```json/m, '').replace(/```$/m, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.name && parsed.body) {
          const currentBn = JSON.parse(fs.readFileSync(bnCommonPath, 'utf8'));
          if (!currentBn.articles) currentBn.articles = {};
          currentBn.articles[article.id] = {
            name: parsed.name,
            shortDesc: parsed.shortDesc || article.shortDescription,
            body: parsed.body,
          };
          if (article.slug) {
            currentBn.articles[article.slug] = currentBn.articles[article.id];
          }
          fs.writeFileSync(bnCommonPath, JSON.stringify(currentBn, null, 2), 'utf8');
          completed++;
          console.log(`  ✓ [BN ${completed}/${pending.length}] Successfully translated & saved: ${article.id}`);
        }
      } catch (err: any) {
        console.error(`  ✗ [BN] Error translating ${article.id}: ${err.message}`);
      }
    }
  });

  await Promise.all(workers);
  console.log('\n🎉 ALL BENGALI BLOG ARTICLES TRANSLATED & SAVED!');
}

translateBengaliArticles().catch((err) => {
  console.error('Fatal Bengali translation error:', err);
  process.exit(1);
});
