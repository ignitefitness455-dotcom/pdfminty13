import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const publicDir: string = path.join(__dirname, '../public');

const iconSource: string | null = fs.existsSync(path.join(publicDir, 'logo.svg'))
  ? path.join(publicDir, 'logo.svg')
  : fs.existsSync(path.join(publicDir, 'logo.png'))
    ? path.join(publicDir, 'logo.png')
    : null;

async function generateFavicons(): Promise<void> {
  if (!iconSource) {
    logger.warn('No logo.svg or logo.png found in public directory. Skipping favicon generation.');
    return;
  }

  logger.info(`Generating favicons from ${iconSource}...`);
  try {
    // 192x192
    await sharp(iconSource)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'logo-192.png'));

    // 512x512
    await sharp(iconSource)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo-512.png'));

    // Apple touch icon (180x180 with white background)
    await sharp(iconSource)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // favicon.ico (32x32)
    await sharp(iconSource)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    logger.info('Favicon generation complete.');
  } catch (error: unknown) {
    logger.error('Failed to generate favicons:', error);
  }
}

generateFavicons();
