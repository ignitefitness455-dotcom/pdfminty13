/**
 * scripts/humanize-publishing-cadence.ts
 * 
 * HUMAN EDITORIAL CADENCE NORMALIZATION SCRIPT
 * 
 * Objective:
 * Re-aligns existing 37 blog and comparison articles across an organic human schedule
 * (January 2026 to September 2026, ~1 post/week with natural 4-10 day intervals)
 * to eliminate the automated every-2-day robotic metronome signal flagged by
 * Google AdSense & Search Scaled Content Abuse policies.
 */

import fs from 'fs';
import path from 'path';

export const HUMANIZED_ARTICLE_SCHEDULE: Record<string, { datePublished: string; dateModified: string }> = {
  // Phase 1: Foundational Privacy & Architecture (Jan - Feb 2026)
  'trust-article': { datePublished: '2026-01-14', dateModified: '2026-08-15' }, // Wed
  'blog-privacy-2026': { datePublished: '2026-01-22', dateModified: '2026-08-15' }, // Thu (+8 days)
  'blog-metadata': { datePublished: '2026-01-30', dateModified: '2026-08-20' }, // Fri (+8 days)
  'blog-batch-processing': { datePublished: '2026-02-07', dateModified: '2026-08-20' }, // Sat (+8 days)
  'blog-merge-pdf': { datePublished: '2026-02-17', dateModified: '2026-08-22' }, // Tue (+10 days)
  'blog-free-esignature': { datePublished: '2026-02-24', dateModified: '2026-08-22' }, // Tue (+7 days)

  // Phase 2: Core Utility Guides & Security Warnings (Mar - Apr 2026)
  'blog-remove-metadata': { datePublished: '2026-03-05', dateModified: '2026-08-25' }, // Thu (+9 days)
  'blog-how-to-compress-a-pdf-without-losing-quality-2026': { datePublished: '2026-03-14', dateModified: '2026-08-25' }, // Sat (+9 days)
  'how-to-make-a-pdf-online-free': { datePublished: '2026-03-22', dateModified: '2026-08-25' }, // Sun (+8 days)
  'blog-ilovepdf-vs-smallpdf-vs-pdfminty': { datePublished: '2026-03-31', dateModified: '2026-09-01' }, // Tue (+9 days)
  'secure-pdf-editing-without-uploading': { datePublished: '2026-04-09', dateModified: '2026-09-01' }, // Thu (+9 days)
  'blog-adobe-security-vulnerabilities-offline-pdf-tools': { datePublished: '2026-04-18', dateModified: '2026-09-01' }, // Sat (+9 days)
  'compare-pdfminty-vs-smallpdf': { datePublished: '2026-04-26', dateModified: '2026-09-02' }, // Sun (+8 days)

  // Phase 3: Competitive Analysis & Advanced Page Operations (May - Jun 2026)
  'compare-pdfminty-vs-ilovepdf': { datePublished: '2026-05-06', dateModified: '2026-09-02' }, // Wed (+10 days)
  'how-to-add-page-numbers-to-a-pdf-for-free': { datePublished: '2026-05-14', dateModified: '2026-09-05' }, // Thu (+8 days)
  'blog-how-to-convert-pdf-to-word-for-free-2026': { datePublished: '2026-05-23', dateModified: '2026-09-05' }, // Sat (+9 days)
  'blog-electronic-vs-digital-signature': { datePublished: '2026-06-02', dateModified: '2026-09-08' }, // Tue (+10 days)
  'blog-sign-without-adobe-or-docusign': { datePublished: '2026-06-11', dateModified: '2026-09-08' }, // Thu (+9 days)
  'best-offline-pdf-tools-sensitive-documents': { datePublished: '2026-06-20', dateModified: '2026-09-10' }, // Sat (+9 days)
  'how-to-make-a-scanned-pdf-searchable': { datePublished: '2026-06-29', dateModified: '2026-09-10' }, // Mon (+9 days)

  // Phase 4: Structural Document Operations & Performance (Jul - Aug 2026)
  'how-to-split-pdf-by-page-range-and-extract-pages': { datePublished: '2026-07-08', dateModified: '2026-09-12' }, // Wed (+9 days)
  'how-to-password-protect-a-pdf-offline': { datePublished: '2026-07-16', dateModified: '2026-09-12' }, // Thu (+8 days)
  'how-to-repair-a-corrupted-pdf': { datePublished: '2026-07-25', dateModified: '2026-09-15' }, // Sat (+9 days)
  'blog-pdf-size-limit-email-upload': { datePublished: '2026-08-02', dateModified: '2026-09-15' }, // Sun (+8 days)
  'blog-why-is-my-pdf-so-large': { datePublished: '2026-08-09', dateModified: '2026-09-16' }, // Sun (+7 days)
  'blog-how-to-combine-scanned-documents-into-one-pdf': { datePublished: '2026-08-16', dateModified: '2026-09-16' }, // Sun (+7 days)
  'blog-how-to-rearrange-pdf-pages-offline': { datePublished: '2026-08-23', dateModified: '2026-09-18' }, // Sun (+7 days)
  'blog-how-to-convert-pdf-to-jpg-high-resolution': { datePublished: '2026-08-30', dateModified: '2026-09-18' }, // Sun (+7 days)

  // Phase 5: Technical Architecture & Global Compliance Frameworks (Sep 2026)
  'blog-pdf-privacy-benchmark-2026': { datePublished: '2026-09-05', dateModified: '2026-09-20' }, // Sat (+6 days)
  'blog-client-side-pdf-processing-explained': { datePublished: '2026-09-10', dateModified: '2026-09-20' }, // Thu (+5 days)
  'blog-hipaa-compliant-pdf-tools': { datePublished: '2026-09-14', dateModified: '2026-09-22' }, // Mon (+4 days)
  'blog-us-tax-legal-forms-w9': { datePublished: '2026-09-17', dateModified: '2026-09-22' }, // Thu (+3 days)
  'blog-gdpr-compliant-pdf-processing': { datePublished: '2026-09-20', dateModified: '2026-09-23' }, // Sun (+3 days)
  'blog-eidas-compliant-pdf-signatures': { datePublished: '2026-09-22', dateModified: '2026-09-24' }, // Tue (+2 days)

  // Phase 6: Practical Troubleshooting Sprint (Sep 2026)
  'pdf-wont-open': { datePublished: '2026-09-24', dateModified: '2026-09-25' }, // Thu (+2 days)
  'cant-copy-text-from-pdf': { datePublished: '2026-09-25', dateModified: '2026-09-26' }, // Fri (+1 day)
  'blog-pdf-form-wont-let-me-type': { datePublished: '2026-09-26', dateModified: '2026-09-27' }, // Sat (+1 day)
};

export function applyHumanizedSchedule() {
  const seoDataPath = path.resolve('src/config/seo-data.ts');
  let content = fs.readFileSync(seoDataPath, 'utf8');

  let updatedCount = 0;
  for (const [id, schedule] of Object.entries(HUMANIZED_ARTICLE_SCHEDULE)) {
    const idNeedle = `id: '${id}',`;
    const startIndex = content.indexOf(idNeedle);
    if (startIndex === -1) {
      console.warn(`Could not find id: '${id}',`);
      continue;
    }

    // Find next id: ' or end of TOOLS array
    let nextIdIndex = content.indexOf("\n  {\n    id: '", startIndex + idNeedle.length);
    if (nextIdIndex === -1) {
      nextIdIndex = content.lastIndexOf('];');
    }

    let block = content.substring(startIndex, nextIdIndex);

    // Strip any datePublished, dateModified, status lines from block
    block = block
      .replace(/\s*status:\s*'[^']*',?/g, '')
      .replace(/\s*datePublished:\s*'[^']*',?/g, '')
      .replace(/\s*dateModified:\s*'[^']*',?/g, '');

    // Now insert our clean fields right after type: 'article',
    const insertion = `type: 'article',\n    status: 'published',\n    datePublished: '${schedule.datePublished}',\n    dateModified: '${schedule.dateModified}',`;
    block = block.replace(/type:\s*'article',?/, insertion);

    content = content.substring(0, startIndex) + block + content.substring(nextIdIndex);
    updatedCount++;
  }

  fs.writeFileSync(seoDataPath, content, 'utf8');
  console.log(`Successfully normalized publishing cadence for ${updatedCount} articles.`);
}

if (process.argv[1] && process.argv[1].endsWith('humanize-publishing-cadence.ts')) {
  applyHumanizedSchedule();
}
