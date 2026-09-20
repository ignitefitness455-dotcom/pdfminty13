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
      const matches = content.matchAll(/t\(['"](auto\.[^'"]+)['"]\s*,\s*\{\s*defaultValue:\s*(['"`])([\s\S]*?)\2\s*\}\)/g);
      for (const match of matches) {
        result[match[1]] = match[3];
      }
    }
  }
  return result;
}

const keys = findTranslations('./src/pages');
fs.writeFileSync('auto-keys.json', JSON.stringify(keys, null, 2));
console.log('Extracted ' + Object.keys(keys).length + ' auto keys.');
