/**
 * scripts/add-new-guides.ts
 * 
 * HUMAN EDITORIAL SCAFFOLDING UTILITY
 * 
 * Policy Compliance:
 * - Adheres strictly to docs/EDITORIAL_PUBLISHING_POLICY.md
 * - Automatically assigns status: 'draft'
 * - Does NOT auto-populate datePublished with run-time timestamps
 * - Decoupled from automated AI translation scripts
 * - Enforces author attribution to Mohammed Tanveer Munshi
 */

import fs from 'fs';
import path from 'path';

export interface GuideDraftInput {
  slug: string;
  name: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  problemSolved: string;
  leadParagraph: string;
  h2Sections: { title: string; body: string }[];
  faqs?: { q: string; a: string }[];
  relatedTools?: { title: string; url: string }[];
}

/**
 * Generates a draft template adhering to human editorial guidelines.
 */
export function scaffoldNewGuideDraft(input: GuideDraftInput): string {
  const cleanSlug = input.slug.replace(/^\//, '').replace(/\/$/, '');
  const id = `blog-${cleanSlug.replace(/^blog\//, '').replace(/[^a-z0-9-]/g, '-')}`;

  const relatedLinksStr = (input.relatedTools || [
    { title: 'Merge PDF Tool', url: '/merge-pdf/' },
    { title: 'Grayscale PDF Tool', url: '/grayscale-pdf/' },
  ])
    .map(
      (l) => `      {
        title: ${JSON.stringify(l.title)},
        url: ${JSON.stringify(l.url)},
        type: 'tool',
      }`
    )
    .join(',\n');

  const faqsStr = (input.faqs || [
    {
      q: 'Does this guide require uploading files to a cloud server?',
      a: 'No. PdfMinty executes all operations locally in your browser memory using WebAssembly. Your files never leave your device.',
    },
  ])
    .map(
      (f) => `      {
        q: ${JSON.stringify(f.q)},
        a: ${JSON.stringify(f.a)},
      }`
    )
    .join(',\n');

  const sectionsHtml = input.h2Sections
    .map(
      (sec) => `      <h2>${sec.title}</h2>
      <p>
        ${sec.body}
      </p>`
    )
    .join('\n\n');

  return `
  {
    id: '${id}',
    slug: '${cleanSlug}',
    name: ${JSON.stringify(input.name)},
    ogImage: '/og-image.png',
    shortDescription: ${JSON.stringify(input.shortDescription)},
    metaTitle: ${JSON.stringify(input.metaTitle)},
    metaDescription: ${JSON.stringify(input.metaDescription)},
    h1: ${JSON.stringify(input.name)},
    icon: 'FileText',
    category: ${JSON.stringify(input.category)},
    priority: 0.7,
    changefreq: 'monthly',
    type: 'article',
    author: 'Mohammed Tanveer Munshi',
    // Editorial Governance:
    // Every new guide starts as 'draft'.
    // Do NOT set datePublished until testing on local browsers, adding 2+ real examples,
    // and completing the checklist in docs/EDITORIAL_PUBLISHING_POLICY.md.
    status: 'draft',
    datePublished: '', // Assigned manually by human editor upon approval
    dateModified: '',
    problemSolved: ${JSON.stringify(input.problemSolved)},
    relatedLinks: [
${relatedLinksStr}
    ],
    faqs: [
${faqsStr}
    ],
    longFormBody: \`
      <h1>${input.name}</h1>

      <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        ${input.leadParagraph}
      </p>

${sectionsHtml}
    \`,
  },
`;
}

// Scaffolding CLI demonstration & safety check
if (process.argv[1] && process.argv[1].endsWith('add-new-guides.ts')) {
  console.log('=====================================================');
  console.log('  PdfMinty Human Editorial Scaffolding Helper');
  console.log('=====================================================');
  console.log('Status: Safety Gate Active');
  console.log('- Automatically sets status: "draft"');
  console.log('- datePublished is left empty until human sign-off');
  console.log('- Author set to: Mohammed Tanveer Munshi');
  console.log('- Decoupled from automated translation scripts');
  console.log('Please see docs/EDITORIAL_PUBLISHING_POLICY.md for the full pre-publish checklist.');
  console.log('=====================================================\n');
}
