import fs from 'node:fs';
import path from 'node:path';

import { render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { generateSitemapXml } from '../../scripts/generate-sitemap';
import { ToolContentSection } from '../components/ToolContentSection';
import { TOOLS } from '../config/seo-data';
import {
  useHero3D,
  detectPerformanceMode,
  HERO_3D_STORAGE_KEY,
} from '../hooks/useHero3D';

describe('Phase 2 Technical SEO, Sitemap Lastmod Determinism & Mobile 3D Performance', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Item 6: generateSitemapXml is 100% deterministic across dates (zero build-time clock stamps) and derives index/blog lastmod from actual max entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-04-15T12:00:00Z'));
    const runFuture = generateSitemapXml();

    vi.setSystemTime(new Date('2028-09-01T12:00:00Z'));
    const runFarFuture = generateSitemapXml();

    // Byte-for-byte identical regardless of build date
    expect(runFuture.sitemaps['sitemap.xml']).toBe(runFarFuture.sitemaps['sitemap.xml']);
    expect(runFuture.sitemaps['sitemap-tools.xml']).toBe(runFarFuture.sitemaps['sitemap-tools.xml']);
    expect(runFuture.sitemaps['sitemap-blog.xml']).toBe(runFarFuture.sitemaps['sitemap-blog.xml']);
    expect(runFuture.sitemaps['sitemap-pages.xml']).toBe(runFarFuture.sitemaps['sitemap-pages.xml']);

    // Must never contain the fake build dates
    for (const content of Object.values(runFuture.sitemaps)) {
      expect(content).not.toContain('2027-04-15');
      expect(content).not.toContain('2028-09-01');
    }

    // sitemap-blog.xml index lastmod and /blog/ page lastmod must match the actual newest blog article date
    const blogDates = [
      ...runFuture.sitemaps['sitemap-blog.xml'].matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g),
    ].map((m) => m[1]);
    expect(blogDates.length).toBeGreaterThan(20);
    const maxBlogDate = [...blogDates].sort().pop();
    expect(maxBlogDate).toBeDefined();

    expect(runFuture.sitemaps['sitemap.xml']).toContain(
      `<loc>https://pdfminty.com/sitemap-blog.xml</loc>\n    <lastmod>${maxBlogDate}</lastmod>`
    );
    expect(runFuture.sitemaps['sitemap-pages.xml']).toContain(
      `<loc>https://pdfminty.com/blog/</loc>\n    <lastmod>${maxBlogDate}</lastmod>`
    );

    // sitemap-tools.xml must have distinct real dates rather than one monolithic build-day stamp
    const toolDates = new Set(
      [
        ...runFuture.sitemaps['sitemap-tools.xml'].matchAll(
          /<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g
        ),
      ].map((m) => m[1])
    );
    expect(toolDates.size).toBeGreaterThanOrEqual(3);
  });

  it('Item 5: ToolContentSection avoids rendering a duplicate FAQ H2 inside longFormBody when interactive FAQs are already shown', () => {
    const mergeTool = TOOLS.find((t) => t.slug === 'merge-pdf');
    expect(mergeTool).toBeDefined();

    const { container } = render(
      <MemoryRouter>
        <ToolContentSection tool={mergeTool} />
      </MemoryRouter>
    );

    const h2Texts = Array.from(container.querySelectorAll('h2')).map((el) =>
      (el.textContent || '').trim()
    );
    const faqHeadings = h2Texts.filter((text) => /frequently asked|faq/i.test(text));
    expect(faqHeadings.length).toBe(1);
  });

  it('Item 5: static generator guards against duplicate HowTo/FAQ sections, uses honest AI privacy heading, and never emits user-scalable=no', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
    const staticGenSrc = fs.readFileSync(
      path.join(repoRoot, 'scripts/generate-static-pages.ts'),
      'utf8'
    );
    const viteConfigSrc = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8');

    expect(indexHtml).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
    expect(staticGenSrc).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
    expect(staticGenSrc).toContain('hasExistingHowToHeading');
    expect(staticGenSrc).toContain('hasExistingFaqHeading');
    expect(staticGenSrc).toContain('Opt-In Cloud AI Privacy &amp; Data Handling');
    expect(viteConfigSrc).not.toContain("filename: 'dist/stats.html'");
  });

  it('Item 7: mobile/narrow viewports activate performance mode, defer stored 3D chunk hydration on load, and flatten CSS 3D layers', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(detectPerformanceMode()).toBe(true);

    // Even if user previously stored 3D enabled, narrow mobile initial paint must not eagerly hydrate the 3D chunk
    window.localStorage.setItem(HERO_3D_STORAGE_KEY, 'true');
    const { result } = renderHook(() => useHero3D());
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.shouldRender3D).toBe(false);

    const repoRoot = path.resolve(__dirname, '../..');
    const indexCss = fs.readFileSync(path.join(repoRoot, 'src/index.css'), 'utf8');
    expect(indexCss).toContain('transform-style: flat !important;');
    expect(indexCss).toContain('perspective: none !important;');
    expect(indexCss).toContain('backdrop-filter: none !important;');
  });
});
