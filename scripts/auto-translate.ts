import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SUPPORTED_LOCALES = ['de', 'fr', 'es', 'bn', 'hi', 'zh'];

async function translateKeys() {
  console.log('Reading auto-keys.json...');
  const keys = JSON.parse(fs.readFileSync('auto-keys.json', 'utf8'));
  const originalCount = Object.keys(keys).length;
  console.log(`Found ${originalCount} keys to translate.`);

  for (const lang of SUPPORTED_LOCALES) {
    console.log(`\nTranslating for ${lang}...`);
    const localePath = path.join('./src/locales', lang, 'common.json');
    let currentTranslations: any = {};
    if (fs.existsSync(localePath)) {
      currentTranslations = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    }

    if (!currentTranslations.auto) {
      currentTranslations.auto = {};
    }

    // Find keys that are missing in this language
    const missingKeys: Record<string, string> = {};
    for (const [key, value] of Object.entries(keys)) {
      const shortKey = key.replace('auto.', '');
      if (!currentTranslations.auto[shortKey]) {
        missingKeys[shortKey] = value as string;
      }
    }

    const missingCount = Object.keys(missingKeys).length;
    if (missingCount === 0) {
      console.log(`Language ${lang} is up to date.`);
      continue;
    }

    console.log(`Translating ${missingCount} missing keys for ${lang}...`);
    
    // Split into batches to avoid prompt limits
    const entries = Object.entries(missingKeys);
    const batchSize = 40;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = Object.fromEntries(entries.slice(i, i + batchSize));
      const prompt = `Translate the following JSON string values into the language code '${lang}'. Keep the JSON structure exactly the same, only translate the values. Ensure the output is valid JSON.\n\n${JSON.stringify(batch, null, 2)}`;
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
        });
        
        let text = response.text || '';
        // Clean markdown backticks if any
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const translatedBatch = JSON.parse(text);
        
        // Merge batch
        for (const [k, v] of Object.entries(translatedBatch)) {
          currentTranslations.auto[k] = v;
        }
        console.log(`Processed batch ${i / batchSize + 1}`);
      } catch (e) {
        console.error(`Error translating batch for ${lang}:`, e);
      }
    }

    fs.writeFileSync(localePath, JSON.stringify(currentTranslations, null, 2));
    console.log(`Saved translations for ${lang}`);
  }
}

translateKeys().catch(console.error);
