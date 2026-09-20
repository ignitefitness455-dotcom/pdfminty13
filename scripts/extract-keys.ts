import fs from 'fs';
import path from 'path';

function findTranslations(dir: string, result: Record<string, string> = {}) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTranslations(fullPath, result);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/t\(['"]([^'"]+)['"]\s*,\s*\{\s*([\s\S]*?)defaultValue:\s*(['"`])([\s\S]*?)\3/g);
      for (const match of matches) {
        result[match[1]] = match[4];
      }
      
      const simpleMatches = content.matchAll(/t\(['"]([^'"]+)['"]\)/g);
      for (const match of simpleMatches) {
        if (!result[match[1]]) {
          result[match[1]] = ''; // We don't have default value
        }
      }
    }
  }
  return result;
}

const keys = findTranslations('./src');
fs.writeFileSync('extracted-keys.json', JSON.stringify(keys, null, 2));
console.log('Extracted ' + Object.keys(keys).length + ' keys.');
