import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const defaultPublicDir: string = path.join(__dirname, '../public');
const assetsDir: string = path.join(defaultPublicDir, 'assets');

async function processDirectory(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) return;
  const files: string[] = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath: string = path.join(dir, file);
    const stat: fs.Stats = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.match(/\.(png|jpe?g)$/i)) {
      const webpPath: string = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
      if (!fs.existsSync(webpPath)) {
        try {
          logger.info(`Optimizing: ${file}`);
          await sharp(fullPath)
            .webp({ quality: 80, effort: 6 })
            .toFile(webpPath);
        } catch (err: unknown) {
          logger.error(`Failed to optimize ${file}, skipping:`, err);
        }
      }
    }
  }
}

async function run(): Promise<void> {
  await processDirectory(defaultPublicDir);
  await processDirectory(assetsDir);
  logger.info('Image optimization complete.');
}

run().catch((err: unknown) => {
  logger.error('Image optimization failed:', err);
});
