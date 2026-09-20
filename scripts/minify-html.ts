import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';

const distDir = path.resolve(process.cwd(), 'dist');

async function minifyHtmlFiles(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await minifyHtmlFiles(fullPath);
    } else if (fullPath.endsWith('.html')) {
      const html = fs.readFileSync(fullPath, 'utf-8');
      const scriptRegex = /<script(?:\s+[^>]*?)?>(.*?)<\/script>/gs;
      let minifiedHtml = html;
      let modified = false;

      for (const match of html.matchAll(scriptRegex)) {
        const fullMatch = match[0];
        const scriptContent = match[1];
        if (
          scriptContent.trim() &&
          !fullMatch.includes('type="application/ld+json"') &&
          !fullMatch.includes('type="module"')
        ) {
          try {
            const result = await esbuild.transform(scriptContent, { minify: true, loader: 'js' });
            // Use replace with string replacement to avoid regex issues with large strings
            const minifiedScript = fullMatch.replace(scriptContent, result.code);
            minifiedHtml = minifiedHtml.replace(fullMatch, minifiedScript);
            modified = true;
          } catch (e) {
            console.error(`Failed to minify script in ${fullPath}:`, e);
          }
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, minifiedHtml, 'utf-8');
      }
    }
  }
}

async function run() {
  console.log('Minifying inline scripts in HTML files...');
  await minifyHtmlFiles(distDir);
  console.log('Finished minifying HTML inline scripts.');
}

run().catch(console.error);
