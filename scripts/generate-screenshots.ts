import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const publicDir: string = resolve(__dirname, '../public');

/**
 * Generate PWA screenshots for the Chrome install dialog.
 * These are simple branded placeholders — replace with real screenshots
 * captured from the deployed app for production use.
 */
async function generateScreenshots(): Promise<void> {
  const brand: string = '#059669'; // emerald-600

  // Desktop screenshot: 1280x720 (16:9)
  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 }, // slate-50
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="1280" height="720" fill="#f8fafc"/>
            <rect x="0" y="0" width="1280" height="120" fill="${brand}"/>
            <text x="640" y="80" font-family="sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">PDFMinty — Privacy-First PDF Toolkit</text>
            <text x="640" y="400" font-family="sans-serif" font-size="36" fill="#475569" text-anchor="middle">13 PDF tools, 100% local processing</text>
            <text x="640" y="460" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">Merge • Split • Compress • Protect • Convert</text>
          </svg>
        `),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(resolve(publicDir, 'screenshot-desktop.png'));

  // Mobile screenshot: 390x844 (iPhone 14 dimensions)
  await sharp({
    create: {
      width: 390,
      height: 844,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="390" height="844" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="390" height="844" fill="#f8fafc"/>
            <rect x="0" y="0" width="390" height="100" fill="${brand}"/>
            <text x="195" y="60" font-family="sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">PDFMinty</text>
            <text x="195" y="450" font-family="sans-serif" font-size="24" fill="#475569" text-anchor="middle">Privacy-First PDF Tools</text>
            <text x="195" y="490" font-family="sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">100% local, no uploads</text>
          </svg>
        `),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(resolve(publicDir, 'screenshot-mobile.png'));

  logger.info('✓ Generated screenshot-desktop.png and screenshot-mobile.png');
}

generateScreenshots().catch((err: unknown) => {
  logger.error('Screenshot generation failed:', err);
  process.exit(1);
});
