/**
 * Annual December SEO Refresh Automation Script for PDFMinty
 * 
 * Usage:
 *   npx tsx scripts/annual-seo-refresh.ts --audit
 *   npx tsx scripts/annual-seo-refresh.ts --target-year=2027
 *   npx tsx scripts/annual-seo-refresh.ts --target-year=2027 --dry-run
 */

import fs from 'fs';
import path from 'path';

interface AuditItem {
  file: string;
  line: number;
  content: string;
  context: string;
}

const TARGET_FILES = [
  'src/config/seo-data.ts',
  'src/config/homeConfig.ts',
  'src/pages/AdobeAlternativePage.tsx',
  'src/components/ToolContentSection.tsx',
  'src/components/InternalSEO.tsx',
  'index.html',
];

function runAudit(targetYear = '2026'): AuditItem[] {
  const results: AuditItem[] = [];
  const rootDir = process.cwd();

  for (const relPath of TARGET_FILES) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes(targetYear)) {
        // Categorize context
        let context = 'body/text';
        if (/metaTitle|metaDescription|name:|h1:|title:/i.test(line)) {
          context = 'title/meta/h1';
        } else if (/lastReviewedDate|dateModified|datePublished/i.test(line)) {
          context = 'review-date';
        }

        results.push({
          file: relPath,
          line: idx + 1,
          content: line.trim(),
          context,
        });
      }
    });
  }

  return results;
}

function runRefresh(fromYear: string, toYear: string, dryRun: boolean): void {
  console.log(`\n🔄 Running Annual SEO Refresh: ${fromYear} -> ${toYear} ${dryRun ? '(DRY RUN)' : ''}`);
  const rootDir = process.cwd();

  let totalUpdatedLines = 0;

  for (const relPath of TARGET_FILES) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    let fileModified = false;

    const updatedLines = lines.map((line) => {
      // We safely update titles, headings, and review dates
      // BUT do NOT break URL slugs, IDs, or permalinks
      const isSlugOrRoute = /slug:|id:|path:|href:|route|ROUTES\./i.test(line);
      if (isSlugOrRoute && !/metaTitle|metaDescription|name:|h1:|title:/i.test(line)) {
        return line;
      }

      if (line.includes(fromYear)) {
        fileModified = true;
        totalUpdatedLines++;
        return line.replaceAll(fromYear, toYear);
      }
      return line;
    });

    if (fileModified && !dryRun) {
      fs.writeFileSync(fullPath, updatedLines.join('\n'), 'utf8');
      console.log(`  ✅ Updated ${relPath}`);
    } else if (fileModified && dryRun) {
      console.log(`  [Dry Run] Would update ${relPath}`);
    }
  }

  console.log(`\n✨ Refresh complete! ${totalUpdatedLines} lines ${dryRun ? 'identified for update' : 'successfully updated'}.\n`);
}

// CLI Argument Parsing
const args = process.argv.slice(2);
const isAudit = args.includes('--audit');
const isDryRun = args.includes('--dry-run');

const targetYearArg = args.find((a) => a.startsWith('--target-year='));
const targetYear = targetYearArg ? targetYearArg.split('=')[1] : '2027';
const fromYearArg = args.find((a) => a.startsWith('--from-year='));
const fromYear = fromYearArg ? fromYearArg.split('=')[1] : '2026';

if (isAudit) {
  console.log(`\n🔍 Auditing all SEO titles and meta tags referencing year "${fromYear}"...\n`);
  const items = runAudit(fromYear);
  console.log(`Found ${items.length} occurrences in target files:`);

  const byContext: Record<string, AuditItem[]> = {};
  for (const item of items) {
    byContext[item.context] = byContext[item.context] || [];
    byContext[item.context].push(item);
  }

  for (const [ctx, list] of Object.entries(byContext)) {
    console.log(`\n📌 Context: ${ctx.toUpperCase()} (${list.length} occurrences)`);
    for (const item of list.slice(0, 10)) {
      console.log(`   ${item.file}:${item.line} -> ${item.content}`);
    }
    if (list.length > 10) {
      console.log(`   ... and ${list.length - 10} more.`);
    }
  }
} else {
  runRefresh(fromYear, targetYear, isDryRun);
}
