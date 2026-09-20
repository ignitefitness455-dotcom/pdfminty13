import fs from 'fs';
import path from 'path';

const seoDataPath = path.resolve('src/config/seo-data.ts');
const content = fs.readFileSync(seoDataPath, 'utf8');

const regex = /{[\s]*id:\s*'blog-how-to-convert-pdf-to-word-for-free-2026'[\s\S]*?(?=},\s*{[\s]*id:|$)/;
const match = content.match(regex);
if (match) {
  console.log(match[0]);
}
