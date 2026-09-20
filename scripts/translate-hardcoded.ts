import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Ensure useTranslation is imported
  if (!content.includes('useTranslation')) {
    content = content.replace(
      "import React",
      "import { useTranslation } from 'react-i18next';\nimport React"
    );
  }

  // 2. Ensure const { t } = useTranslation('common'); is in the main component
  const componentMatch = content.match(/export const [A-Za-z0-9_]+: React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{/);
  if (componentMatch && !content.includes('const { t } = useTranslation')) {
    content = content.replace(
      componentMatch[0],
      `${componentMatch[0]}\n  const { t } = useTranslation('common');`
    );
  }

  // Regex for <span>Text</span>, <p>Text</p>, <div>Text</div>
  const tagRegex = /<(span|p|h[1-6]|div|button)([^>]*)>\s*([A-Z][a-zA-Z0-9\s.,!?'"()-]+)\s*<\/\1>/g;
  
  content = content.replace(tagRegex, (match, tag, attrs, text) => {
    // If it already contains {t( or { or }, skip it
    if (text.includes('{') || text.includes('}') || text.includes('t(')) {
      return match;
    }
    
    // Clean text and generate a simple key
    const cleanText = text.trim();
    if (cleanText.length < 3 || cleanText.length > 100) return match; // skip too short or too long
    if (!/^[a-zA-Z]/.test(cleanText)) return match; // must start with letter
    
    const keyPart = cleanText.split(' ').slice(0, 3).map((w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).join('_');
    const key = `auto.${tag}_${keyPart}_${Math.floor(Math.random()*1000)}`;
    
    return `<${tag}${attrs}>{t('${key}', { defaultValue: \`${cleanText.replace(/`/g, '\\`')}\` })}</${tag}>`;
  });

  fs.writeFileSync(filePath, content);
}

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('Page.tsx'));
for (const file of files) {
  processFile(path.join(pagesDir, file));
}
console.log('Processed all pages.');
