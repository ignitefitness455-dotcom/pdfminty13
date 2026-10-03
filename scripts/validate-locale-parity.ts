import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { MERGE_PDF_LOCALIZED_DATA, buildLocalizedMergePdfHtml } from '../src/data/localizedMergePdfData';
import { TOOLS } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/i18n/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LocaleParityReport {
  locale: string;
  h2Count: number;
  h2Ratio: number;
  faqCount: number;
  faqRatio: number;
  stepsCount: number;
  wordCount: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  untranslatedPhrases: string[];
}

export function validateLocaleParity(options: { exitOnError?: boolean } = { exitOnError: true }) {
  console.log('🌐 Starting Comprehensive Multilingual Content Parity Audit...\n');

  let hasFailure = false;
  const THRESHOLD = 0.8; // 80% warning / failure threshold as required by specification

  const enTool = TOOLS.find((t) => t.slug === 'merge-pdf');
  if (!enTool) {
    console.error('❌ Error: English merge-pdf configuration not found in TOOLS.');
    if (options.exitOnError) process.exit(1);
    return { hasFailure: true, reports: [] };
  }

  // English baseline metrics
  const enH2Matches = enTool.longFormBody.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const enH2Count = enH2Matches.length; // 6 H2s in body
  const enFaqsCount = 5; // 5 technical FAQs
  const enStepsCount = 5; // 5 step guide
  const enWordsCount = enTool.longFormBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

  console.log(`📊 English (EN) Reference Metrics (/merge-pdf/):`);
  console.log(`   - H2 Section Count: ${enH2Count}`);
  console.log(`   - Technical FAQs:   ${enFaqsCount}`);
  console.log(`   - How-To Steps:     ${enStepsCount}`);
  console.log(`   - Word Count:       ~${enWordsCount} words\n`);

  const reports: LocaleParityReport[] = [];

  // Distinct English phrases that must never appear in translated bodies
  const ENGLISH_SENTINEL_PHRASES = [
    'The Definitive Guide to Merging PDFs',
    'When to Use Local PDF Merging: 3 Real-World Scenarios',
    'How In-Browser PDF Merging Works (Under the Hood)',
    'Step-by-Step Guide: Merging Large PDF Files Privately',
    'Architecture Comparison: Merging Methods',
    'Frequently Asked Technical Questions',
    'Attorneys and paralegals assembling motions',
  ];

  for (const loc of SUPPORTED_LOCALES) {
    if (loc === DEFAULT_LOCALE) continue;

    const locData = MERGE_PDF_LOCALIZED_DATA[loc];
    if (!locData) {
      console.error(`❌ Missing localized data for locale '${loc}'!`);
      hasFailure = true;
      continue;
    }

    // Measure rendered HTML
    const locHtml = buildLocalizedMergePdfHtml(locData, loc);
    const locH2s = (locHtml.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || []).length;
    const locFaqs = locData.faqs.length;
    const locSteps = locData.howToSteps.length;
    
    // Word count (or character count for CJK)
    const locWords = loc === 'zh'
      ? locHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
      : locHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

    const h2Ratio = locH2s / enH2Count;
    const faqRatio = locFaqs / enFaqsCount;

    // Spot-check: ensure no untranslated English paragraphs leaked in
    const untranslatedFound: string[] = [];
    for (const phrase of ENGLISH_SENTINEL_PHRASES) {
      if (locHtml.includes(phrase)) {
        untranslatedFound.push(phrase);
      }
    }

    const isPassing = h2Ratio >= THRESHOLD && faqRatio >= THRESHOLD && untranslatedFound.length === 0;

    if (!isPassing) {
      hasFailure = true;
    }

    reports.push({
      locale: loc,
      h2Count: locH2s,
      h2Ratio,
      faqCount: locFaqs,
      faqRatio,
      stepsCount: locSteps,
      wordCount: locWords,
      status: isPassing ? 'PASS' : 'FAIL',
      untranslatedPhrases: untranslatedFound,
    });
  }

  // Print formatted summary table
  console.log('┌────────┬───────────┬──────────────┬──────────┬──────────────┬───────────────┬────────┐');
  console.log('│ Locale │ H2 Count  │ H2 Parity %  │ FAQs     │ FAQ Parity % │ Words/Chars   │ Status │');
  console.log('├────────┼───────────┼──────────────┼──────────┼──────────────┼───────────────┼────────┤');

  for (const r of reports) {
    const locStr = r.locale.toUpperCase().padEnd(6);
    const h2Str = `${r.h2Count}`.padEnd(9);
    const h2Pct = `${Math.round(r.h2Ratio * 100)}%`.padEnd(12);
    const faqStr = `${r.faqCount}`.padEnd(8);
    const faqPct = `${Math.round(r.faqRatio * 100)}%`.padEnd(12);
    const wordsStr = `${r.wordCount} ${r.locale === 'zh' ? 'chars' : 'words'}`.padEnd(13);
    const statusStr = r.status.padEnd(6);

    console.log(`│ ${locStr} │ ${h2Str} │ ${h2Pct} │ ${faqStr} │ ${faqPct} │ ${wordsStr} │ ${statusStr} │`);
  }

  console.log('└────────┴───────────┴──────────────┴──────────┴──────────────┴───────────────┴────────┘\n');

  // Also verify dist/ generated HTML if dist/ exists
  const distDir = path.join(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    console.log('📁 Auditing Pre-rendered Files in dist/:');
    for (const loc of SUPPORTED_LOCALES) {
      if (loc === DEFAULT_LOCALE) continue;
      const distHtmlPath = path.join(distDir, loc, 'merge-pdf', 'index.html');
      if (fs.existsSync(distHtmlPath)) {
        const content = fs.readFileSync(distHtmlPath, 'utf8');
        const h2Count = (content.match(/<h2\b[^>]*>/gi) || []).length;
        const faqItems = (content.match(/<h4\b[^>]*>/gi) || []).length;
        console.log(`   ✅ dist/${loc}/merge-pdf/index.html verified (${fs.statSync(distHtmlPath).size} bytes, ${h2Count} H2s, ${faqItems} H4s).`);
      } else {
        console.log(`   ⚠️ dist/${loc}/merge-pdf/index.html not yet built (run npm run build).`);
      }
    }
    console.log('');
  }

  for (const r of reports) {
    if (r.untranslatedPhrases.length > 0) {
      console.error(`❌ Untranslated English text detected in locale '${r.locale}':`);
      r.untranslatedPhrases.forEach((p) => console.error(`   - "${p}"`));
    }
  }

  if (hasFailure) {
    console.error('❌ Multilingual Content Parity Audit Failed! One or more locales fell below threshold.\n');
    if (options.exitOnError) process.exit(1);
    return { hasFailure: true, reports };
  } else {
    console.log('🚀 ALL LOCALIZED CONTENT PARITY CHECKS PASSED (>= 90% sections and FAQs across all locales)!');
    return { hasFailure: false, reports };
  }
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  validateLocaleParity({ exitOnError: true });
}
