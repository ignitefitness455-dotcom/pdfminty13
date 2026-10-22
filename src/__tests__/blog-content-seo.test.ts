import fs from 'fs';
import path from 'path';

import { describe, it, expect } from 'vitest';

import { TOOLS } from '../config/seo-data';

const STATIC_INFO_SLUGS = new Set([
  'blog',
  'about-us',
  'contact',
  'privacy-policy',
  'terms-of-service',
  'adobe-acrobat-alternative',
]);

describe('Blog & Informational Content SEO & Governance Audit (Prompt 5)', () => {
  const allArticleItems = TOOLS.filter((item) => item.type === 'article');
  const blogAndCompareArticles = allArticleItems.filter(
    (item) => !STATIC_INFO_SLUGS.has(item.slug)
  );

  it('contains all 37 published blog/comparison articles and 6 static informational pages', () => {
    expect(allArticleItems.length).toBe(43);
    expect(blogAndCompareArticles.length).toBe(37);
  });

  it('ensures every article has non-empty metaTitle, metaDescription, h1, and longFormBody without raw JSX className', () => {
    for (const item of allArticleItems) {
      expect(item.metaTitle, `${item.id} metaTitle`).toBeTruthy();
      expect(item.metaDescription, `${item.id} metaDescription`).toBeTruthy();
      expect(item.h1, `${item.id} h1`).toBeTruthy();
      expect(item.longFormBody.trim().length, `${item.id} longFormBody`).toBeGreaterThan(100);
      expect(item.longFormBody, `${item.id} raw JSX className`).not.toContain('className=');
      expect(item.longFormBody, `${item.id} leaked editorial note`).not.toContain(
        'Before publishing this article, verify every product capability'
      );
    }
  });

  it('ensures no article uses fabricated reviewer personas or pre-launch review/publish dates', () => {
    for (const item of allArticleItems) {
      expect(item.author || '', `${item.id} author`).not.toContain('Alex Mercer');
      expect(item.reviewedBy || '', `${item.id} reviewedBy`).not.toContain('Alex Mercer');
      expect(item.lastReviewedDate || '', `${item.id} lastReviewedDate`).not.toMatch(
        /August \d+, 2026|September 4, 2026/i
      );
      if (item.datePublished) {
        expect(
          item.datePublished >= '2026-09-21',
          `${item.id} datePublished ${item.datePublished}`
        ).toBe(true);
      }
    }
  });

  it('ensures all internal links in article longFormBody and relatedLinks maintain canonical trailing slashes', () => {
    const hrefRegex = /href="(\/[^"#?]*)"/g;
    for (const item of allArticleItems) {
      let match: RegExpExecArray | null;
      while ((match = hrefRegex.exec(item.longFormBody)) !== null) {
        const href = match[1];
        if (href !== '/' && !/\.[a-z0-9]+$/i.test(href)) {
          expect(href.endsWith('/'), `${item.id} internal link ${href} must end with /`).toBe(true);
        }
      }
      if (item.relatedLinks) {
        for (const link of item.relatedLinks) {
          if (
            link.url.startsWith('/') &&
            link.url !== '/' &&
            !link.url.startsWith('/#') &&
            !/\.[a-z0-9]+$/i.test(link.url)
          ) {
            expect(
              link.url.endsWith('/'),
              `${item.id} relatedLink ${link.url} must end with /`
            ).toBe(true);
          }
        }
      }
    }
  });

  it('keeps en/common.json articles in 100% parity with seo-data.ts to prevent hydration cloaking', () => {
    const enCommonPath = path.resolve(__dirname, '../locales/en/common.json');
    const enCommon = JSON.parse(fs.readFileSync(enCommonPath, 'utf8'));
    expect(enCommon.articles).toBeDefined();

    for (const [id, entry] of Object.entries<Record<string, string>>(enCommon.articles)) {
      const seoItem = TOOLS.find((t) => t.id === id || t.slug === id);
      expect(seoItem, `seo-data.ts entry for ${id}`).toBeDefined();
      if (seoItem) {
        if ('name' in entry) {
          expect(entry.name, `${id} name parity`).toBe(seoItem.name);
        }
        if ('shortDesc' in entry) {
          expect(entry.shortDesc, `${id} shortDesc parity`).toBe(seoItem.shortDescription);
        }
        if ('body' in entry) {
          expect(entry.body, `${id} body parity`).toBe(seoItem.longFormBody);
        }
      }
    }
  });

  it('maintains accurate privacy and feature claims for OCR, AI Analyze, and competitor comparisons', () => {
    const ocrGuide = TOOLS.find((t) => t.id === 'how-to-make-a-scanned-pdf-searchable')!;
    expect(ocrGuide.longFormBody).not.toContain('What languages are supported by in-browser OCR?');
    expect(ocrGuide.longFormBody).not.toContain(
      'Processing occurred entirely in local browser RAM without cloud server transmission.'
    );

    const cantCopy = TOOLS.find((t) => t.id === 'cant-copy-text-from-pdf')!;
    expect(cantCopy.metaDescription).not.toContain('OCR that works without uploading your file');

    const smallpdf = TOOLS.find((t) => t.id === 'compare-pdfminty-vs-smallpdf')!;
    expect(smallpdf.longFormBody).toContain('opt-in AI Analyze');

    const ilovepdf = TOOLS.find((t) => t.id === 'compare-pdfminty-vs-ilovepdf')!;
    expect(ilovepdf.longFormBody).toContain('Sign PDF');
    expect(ilovepdf.longFormBody).toContain('Opt-in AI Vision OCR');

    const rankingGuide = TOOLS.find((t) => t.id === 'best-offline-pdf-tools-sensitive-documents')!;
    expect(rankingGuide.metaDescription).not.toContain('PDFMinty ranks #1');
  });
});
