import fs from 'fs';
import path from 'path';

function scan(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('Page.tsx')) {
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for <span>Some text</span> or <p>Some text</p> without {t(
      const matches = content.matchAll(/<(span|p|h[1-6]|div|button)[^>]*>\s*([A-Z][a-zA-Z0-9\s.,!?'"-]+)\s*<\/\1>/g);
      let found = false;
      for (const m of matches) {
        if (!m[2].includes('{t') && !m[2].includes('t(')) {
          if (!found) {
            console.log(`\n--- ${file} ---`);
            found = true;
          }
          console.log(`  ${m[2].trim()}`);
        }
      }
    }
  }
}

scan('./src/pages');
