import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('Google AdSense & Crawler Content Visibility', () => {
  it('declares static google-adsense-account meta and guards AdSense script off noindex/auth routes in index.html', () => {
    const indexHtml = readRepoFile('index.html');

    expect(indexHtml).toContain(
      '<meta name="google-adsense-account" content="ca-pub-3862038139324053" />'
    );
    expect(indexHtml).toContain('isNonContentRoute');
    expect(indexHtml).toContain('isNoindexPage');
    expect(indexHtml).toMatch(/!isProUser && !isNonContentRoute && !isNoindexPage/);
    expect(indexHtml).toContain('setTimeout(loadAdSenseScript, 300)');
  });

  it('keeps public/ads.txt synced with the active AdSense publisher ID', () => {
    const adsTxt = readRepoFile('public/ads.txt');
    expect(adsTxt).toContain('google.com, pub-3862038139324053, DIRECT, f08c47fec0942fa0');
  });

  it('allows all Google AdSense and AdsBot crawlers to fetch HTML, assets, fonts, and ads.txt', () => {
    const robotsTxt = readRepoFile('public/robots.txt');

    const renderingAdBots = [
      'Mediapartners-Google',
      'Google-Display-Ads-Bot',
      'AdsBot-Google',
      'AdsBot-Google-Mobile',
    ];

    for (const bot of renderingAdBots) {
      const sectionMatch = robotsTxt.match(
        new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?(?=\\n\\nUser-agent:|\\n\\n#|$)`)
      );
      expect(sectionMatch, `Missing robots.txt section for ${bot}`).toBeTruthy();
      const section = sectionMatch![0];
      expect(section).toContain('Allow: /');
      expect(section).toContain('Allow: /assets/');
      expect(section).toContain('Allow: /fonts/');
      expect(section).toContain('Allow: /ads.txt');
      expect(section).not.toMatch(/Disallow:\s*\/\s*$/m);
    }

    const adsTxtBotMatch = robotsTxt.match(
      /User-agent:\s*Google-adstxt[\s\S]*?(?=\n\nUser-agent:|\n\n#|$)/
    );
    expect(adsTxtBotMatch, 'Missing robots.txt section for Google-adstxt').toBeTruthy();
    expect(adsTxtBotMatch![0]).toContain('Allow: /ads.txt');
  });

  it('includes semantic header and footer shells on pre-rendered homepages and /blog/, and strips AdSense meta on noindex auth routes', () => {
    const staticGen = readRepoFile('scripts/generate-static-pages.ts');

    // Homepages (EN + localized) must wrap hero/body with static header & footer
    expect(staticGen).toContain('buildStaticHeader(DEFAULT_LOCALE)');
    expect(staticGen).toContain('buildStaticFooter(DEFAULT_LOCALE)');
    expect(staticGen).toContain('buildStaticHeader(locale)');
    expect(staticGen).toContain('buildStaticFooter(locale)');

    // /blog/ pre-render must be wrapped in full header/footer shell
    expect(staticGen).toMatch(/blogPreRenderedContent\s*=\s*wrapInPrerenderedShell\(/);

    // Auth / dashboard noindex routes must strip google-adsense-account meta
    expect(staticGen).toContain('google-adsense-account');
  });

  it('loads tool editorial content and internal SEO catalog immediately without requestIdleCallback delays', () => {
    const toolContentSrc = readRepoFile('src/components/ToolContentSection.tsx');
    const internalSeoSrc = readRepoFile('src/components/InternalSEO.tsx');

    expect(toolContentSrc).not.toContain('requestIdleCallback');
    expect(toolContentSrc).not.toContain('Verified by Security & Product Architecture Team');
    expect(internalSeoSrc).not.toContain('requestIdleCallback');
  });

  it('uses a short below-the-fold hydration fallback on HomePage so JS crawlers see all sections promptly', () => {
    const homePageSrc = readRepoFile('src/pages/HomePage.tsx');

    expect(homePageSrc).toContain('belowFoldReady');
    expect(homePageSrc).toContain('timeout: 600');
    expect(homePageSrc).not.toContain('timeout: 2200');
  });
});
