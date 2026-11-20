import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS, SITE_URL } from '../src/config/seo-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const INDEXNOW_KEY = 'f7c2e94a8b1d4e6093a5c8f12d4b7e3a';
export const INDEXNOW_HOST = new URL(SITE_URL).hostname;
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const NON_ARTICLE_STATIC_SLUGS = new Set([
  'blog',
  'about-us',
  'contact',
  'privacy-policy',
  'terms-of-service',
]);

/**
 * Builds the exact list of 43 changed canonical URLs:
 * - 38 Article schema pages (35 /blog/* + 2 /compare/* + /adobe-acrobat-alternative/)
 * - 1 Compress PDF primary workspace route (/compress-pdf/)
 * - 2 Localized homepages with translated bottom sections (/es/, /fr/)
 * - 2 Localized Compress PDF routes (/es/compress-pdf/, /fr/compress-pdf/)
 */
export function buildChangedUrls(): string[] {
  const articleUrls = TOOLS.filter(
    (item) => item.type === 'article' && !NON_ARTICLE_STATIC_SLUGS.has(item.slug)
  ).map((item) => `${SITE_URL}/${item.slug}/`);

  const extraChangedUrls = [
    `${SITE_URL}/compress-pdf/`,
    `${SITE_URL}/es/`,
    `${SITE_URL}/fr/`,
    `${SITE_URL}/es/compress-pdf/`,
    `${SITE_URL}/fr/compress-pdf/`,
  ];

  return Array.from(new Set([...articleUrls, ...extraChangedUrls]));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const keyFilePath = path.join(__dirname, `../public/${INDEXNOW_KEY}.txt`);
  if (!fs.existsSync(keyFilePath)) {
    console.error(`❌ IndexNow key verification file missing at: ${keyFilePath}`);
    process.exit(1);
  }
  const keyContent = fs.readFileSync(keyFilePath, 'utf8').trim();
  if (keyContent !== INDEXNOW_KEY) {
    console.error(`❌ IndexNow key file content mismatch.`);
    process.exit(1);
  }

  const urlList = buildChangedUrls();
  console.log(`📋 Prepared ${urlList.length} changed URLs for IndexNow submission.`);

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  };

  if (dryRun) {
    console.log('🧪 Dry run mode enabled. Payload preview:');
    console.log(JSON.stringify({ ...payload, urlCount: urlList.length }, null, 2));
    return;
  }

  // Verify live key file is accessible before submitting to IndexNow
  let keyCheckRes = await fetch(INDEXNOW_KEY_LOCATION);
  let liveKeyBody = (await keyCheckRes.text()).trim();
  if ((!keyCheckRes.ok || liveKeyBody !== INDEXNOW_KEY) && keyCheckRes.headers.get('cf-cache-status') === 'HIT') {
    // Bypass stale local edge negative cache after a fresh Pages deployment
    keyCheckRes = await fetch(`${INDEXNOW_KEY_LOCATION}?_verify=${Date.now()}`);
    liveKeyBody = (await keyCheckRes.text()).trim();
  }
  if (!keyCheckRes.ok || liveKeyBody !== INDEXNOW_KEY) {
    console.error(
      `❌ Live key file verification failed (${keyCheckRes.status}) at ${INDEXNOW_KEY_LOCATION}. Deploy public/${INDEXNOW_KEY}.txt to production before submitting.`
    );
    process.exit(1);
  }
  console.log(`✅ Verified live IndexNow key at ${INDEXNOW_KEY_LOCATION}`);

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (response.status === 200 || response.status === 202) {
    console.log(
      `🚀 IndexNow submission accepted (HTTP ${response.status}) for ${urlList.length} URLs.`
    );
    if (responseText) console.log(`Response: ${responseText}`);
  } else {
    console.error(
      `❌ IndexNow submission failed (HTTP ${response.status}): ${responseText || response.statusText}`
    );
    process.exit(1);
  }
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  main().catch((err) => {
    console.error('IndexNow submission error:', err);
    process.exit(1);
  });
}
