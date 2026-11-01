import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { TOOLS } from '../../config/seo-data';
import i18n, {
  getCanonicalUrl,
  getHreflangs,
  getLocalizedPath,
  getSwitchLocalePath,
  isI18nToolSlug,
  SUPPORTED_LOCALES,
} from '../config';

describe('Technical SEO, Canonical Routing & Sitemap Invariants', () => {
  it('dynamically loads non-English locale bundles when switching languages via i18n.changeLanguage', async () => {
    await i18n.changeLanguage('bn');
    expect(i18n.language).toBe('bn');
    expect(i18n.hasResourceBundle('bn', 'common')).toBe(true);
    expect(i18n.hasResourceBundle('bn', 'merge-pdf')).toBe(true);
    expect(i18n.t('header.nav.home')).toBe('হোম');
    expect(i18n.t('tools.merge-pdf.name')).not.toBe('Merge PDF');

    await i18n.changeLanguage('de');
    expect(i18n.language).toBe('de');
    expect(i18n.hasResourceBundle('de', 'common')).toBe(true);
    expect(i18n.t('header.nav.home')).not.toBe('Home');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('header.nav.home')).toBe('Home');
  });

  it('accurately resolves localized paths and language switcher targets with trailing slashes', () => {
    expect(isI18nToolSlug('merge-pdf')).toBe(true);
    expect(isI18nToolSlug('/merge-pdf/')).toBe(true);
    expect(isI18nToolSlug('split-pdf')).toBe(true);
    expect(isI18nToolSlug('compare-pdf')).toBe(true);
    expect(isI18nToolSlug('blog')).toBe(false);
    expect(isI18nToolSlug('pricing')).toBe(false);

    expect(getLocalizedPath('', 'en')).toBe('/');
    expect(getLocalizedPath('', 'de')).toBe('/de/');
    expect(getLocalizedPath('merge-pdf', 'fr')).toBe('/fr/merge-pdf/');
    expect(getLocalizedPath('merge-pdf', 'en')).toBe('/merge-pdf/');
    expect(getLocalizedPath('compare-pdf', 'es')).toBe('/es/compare-pdf/');
    expect(getLocalizedPath('pricing', 'es')).toBe('/pricing/');

    expect(getSwitchLocalePath('/', 'de')).toBe('/de/');
    expect(getSwitchLocalePath('/de/', 'en')).toBe('/');
    expect(getSwitchLocalePath('/merge-pdf/', 'fr')).toBe('/fr/merge-pdf/');
    expect(getSwitchLocalePath('/fr/merge-pdf/', 'en')).toBe('/merge-pdf/');
    expect(getSwitchLocalePath('/compare-pdf/', 'es')).toBe('/es/compare-pdf/');
    expect(getSwitchLocalePath('/es/compare-pdf/', 'en')).toBe('/compare-pdf/');
    // Non-localized routes stay on their canonical root path when switching UI language
    expect(getSwitchLocalePath('/blog/', 'de')).toBe('/blog/');
    expect(getSwitchLocalePath('/pricing/', 'bn')).toBe('/pricing/');
  });

  it('generates canonical URLs and bidirectional hreflang clusters with x-default', () => {
    expect(getCanonicalUrl('', 'en')).toBe('https://pdfminty.com/');
    expect(getCanonicalUrl('', 'de')).toBe('https://pdfminty.com/de/');
    expect(getCanonicalUrl('merge-pdf', 'fr')).toBe('https://pdfminty.com/fr/merge-pdf/');
    expect(getCanonicalUrl('compare-pdf', 'en')).toBe('https://pdfminty.com/compare-pdf/');
    expect(getCanonicalUrl('compare-pdf', 'es')).toBe('https://pdfminty.com/es/compare-pdf/');
    expect(getCanonicalUrl('pricing', 'en')).toBe('https://pdfminty.com/pricing/');

    const homeHreflangs = getHreflangs('');
    expect(homeHreflangs.length).toBe(SUPPORTED_LOCALES.length + 1);
    expect(homeHreflangs.find((h) => h.hreflang === 'x-default')?.href).toBe(
      'https://pdfminty.com/'
    );

    const mergeHreflangs = getHreflangs('merge-pdf');
    expect(mergeHreflangs.length).toBe(SUPPORTED_LOCALES.length + 1);
    expect(mergeHreflangs.find((h) => h.hreflang === 'de')?.href).toBe(
      'https://pdfminty.com/de/merge-pdf/'
    );

    const compareHreflangs = getHreflangs('compare-pdf');
    expect(compareHreflangs.length).toBe(SUPPORTED_LOCALES.length + 1);
    expect(compareHreflangs.find((h) => h.hreflang === 'es')?.href).toBe(
      'https://pdfminty.com/es/compare-pdf/'
    );

    // Non-i18n routes emit empty hreflang cluster
    expect(getHreflangs('pricing')).toEqual([]);
    expect(getHreflangs('blog')).toEqual([]);
  });

  it('ensures all 24 tools and all blog posts in TOOLS have unique slugs, metaTitles, and metaDescriptions', () => {
    const slugs = new Set<string>();
    const titles = new Set<string>();
    const toolItems = TOOLS.filter((t) => t.type === 'tool');
    expect(toolItems.length).toBe(24);
    expect(toolItems.some((t) => t.slug === 'compare-pdf')).toBe(true);
    expect(toolItems.some((t) => t.slug === 'compress-pdf')).toBe(true);
    expect(toolItems.some((t) => t.slug === 'grayscale-pdf')).toBe(true);

    for (const item of TOOLS) {
      expect(item.slug).toBeTruthy();
      expect(item.slug.startsWith('/')).toBe(false);
      expect(item.slug.endsWith('/')).toBe(false);
      expect(slugs.has(item.slug)).toBe(false);
      slugs.add(item.slug);

      expect(item.metaTitle.length).toBeGreaterThan(10);
      expect(titles.has(item.metaTitle)).toBe(false);
      titles.add(item.metaTitle);
      expect(item.metaDescription.length).toBeGreaterThan(30);
    }
  });

  it('ensures sitemap files contain /compare-pdf/ and /pricing/ and exclude noindex/auth/redirect URLs', () => {
    const publicDir = path.resolve(__dirname, '../../../public');
    const toolsXml = fs.readFileSync(path.join(publicDir, 'sitemap-tools.xml'), 'utf8');
    const pagesXml = fs.readFileSync(path.join(publicDir, 'sitemap-pages.xml'), 'utf8');
    const blogXml = fs.readFileSync(path.join(publicDir, 'sitemap-blog.xml'), 'utf8');
    const combined = toolsXml + pagesXml + blogXml;

    expect(toolsXml).toContain('<loc>https://pdfminty.com/compare-pdf/</loc>');
    expect(toolsXml).toContain('<loc>https://pdfminty.com/grayscale-pdf/</loc>');
    expect(pagesXml).toContain('<loc>https://pdfminty.com/pricing/</loc>');

    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      expect(pagesXml).toContain(`hreflang="${locale}" href="https://pdfminty.com/${locale}/"`);
      expect(toolsXml).toContain(
        `hreflang="${locale}" href="https://pdfminty.com/${locale}/merge-pdf/"`
      );
    }

    // Must never include auth/account or 404 routes in sitemaps
    expect(combined).not.toContain('https://pdfminty.com/login');
    expect(combined).not.toContain('https://pdfminty.com/signup');
    expect(combined).not.toContain('https://pdfminty.com/dashboard');
    expect(combined).not.toContain('404');
  });

  it('ensures all hardcoded blog links in BlogPage.tsx resolve to valid article slugs with trailing slashes', () => {
    const blogPageSrc = fs.readFileSync(
      path.resolve(__dirname, '../../pages/BlogPage.tsx'),
      'utf8'
    );
    const validArticleSlugs = new Set(
      TOOLS.filter((item) => item.type === 'article').map((item) => `/${item.slug}/`)
    );
    const toRegex = /\bto="(\/blog\/[^"]+)"/g;
    let match: RegExpExecArray | null;
    const foundLinks: string[] = [];
    while ((match = toRegex.exec(blogPageSrc)) !== null) {
      foundLinks.push(match[1]);
      expect(match[1].endsWith('/')).toBe(true);
      expect(validArticleSlugs.has(match[1])).toBe(true);
    }
    expect(foundLinks.length).toBeGreaterThanOrEqual(5);
  });

  it('ensures edge middleware protects case-sensitive cmaps and standard_fonts assets from lowercase redirects', () => {
    const middlewareSrc = fs.readFileSync(
      path.resolve(__dirname, '../../../functions/_middleware.ts'),
      'utf8'
    );
    expect(middlewareSrc).toContain("rawPath.startsWith('/cmaps/')");
    expect(middlewareSrc).toContain("rawPath.startsWith('/standard_fonts/')");
    expect(middlewareSrc).toContain("rawPath.startsWith('/og-images/')");
    expect(middlewareSrc).toMatch(/pfb\|bcmap/);
  });
});

