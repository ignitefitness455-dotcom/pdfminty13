import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const urls: string[] = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Regular.ttf',
  'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
  'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
];
const destPath: string = path.join(__dirname, '../public/fonts/NotoSans-Regular.ttf');
fs.mkdirSync(path.dirname(destPath), { recursive: true });

async function download(): Promise<void> {
  for (const fontUrl of urls) {
    try {
      logger.info(`Attempting to download from ${fontUrl}...`);
      const response: Response = await fetch(fontUrl);
      if (!response.ok) {
        logger.error(`Failed with status: ${response.status}`);
        continue;
      }
      const buffer: ArrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(buffer));
      logger.info(`Successfully downloaded to ${destPath}`);
      return;
    } catch (err: unknown) {
      logger.error(`Error downloading from ${fontUrl}:`, err);
    }
  }
  logger.error('All download attempts failed.');
  process.exit(1);
}

download();
