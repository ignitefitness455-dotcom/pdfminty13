import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { TOOLS } from '../src/config/seo-data';
import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);
const publicDir: string = resolve(__dirname, '../public');

interface Tool {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  icon: string;
}

const tools: Tool[] = [
  { slug: 'merge-pdf', name: 'Merge PDF', tagline: 'Combine multiple PDFs into one', color: '#10b981', icon: 'M' },
  { slug: 'split-pdf', name: 'Split PDF', tagline: 'Extract pages or split into files', color: '#f59e0b', icon: 'S' },
  { slug: 'rotate-pdf', name: 'Rotate PDF', tagline: 'Rotate pages 90, 180, or 270 degrees', color: '#06b6d4', icon: 'R' },
  { slug: 'delete-pages-pdf', name: 'Delete PDF Pages', tagline: 'Remove unwanted pages from PDF', color: '#ef4444', icon: 'D' },
  { slug: 'extract-pages-pdf', name: 'Extract PDF Pages', tagline: 'Save specific pages as new PDF', color: '#8b5cf6', icon: 'E' },
  { slug: 'reorder-pdf', name: 'Reorder PDF Pages', tagline: 'Rearrange page order in PDF', color: '#ec4899', icon: 'O' },
  { slug: 'watermark-pdf', name: 'Watermark PDF', tagline: 'Add text watermarks with custom opacity', color: '#a855f7', icon: 'W' },
  { slug: 'add-page-numbers', name: 'Add Page Numbers', tagline: 'Number your PDF pages automatically', color: '#14b8a6', icon: '#' },
  { slug: 'add-blank-page', name: 'Add Blank Page', tagline: 'Insert blank pages into PDF', color: '#0ea5e9', icon: '+' },
  { slug: 'protect-pdf', name: 'Protect PDF', tagline: 'Password-encrypt your PDF documents', color: '#1e40af', icon: 'P' },
  { slug: 'unlock-pdf', name: 'Unlock PDF', tagline: 'Remove password protection from PDF', color: '#0d9488', icon: 'U' },
  { slug: 'image-to-pdf', name: 'Image to PDF', tagline: 'Convert JPG, PNG, WebP to PDF', color: '#d946ef', icon: 'I' },
  { slug: 'pdf-to-image', name: 'PDF to Image', tagline: 'Convert PDF pages to PNG or JPEG', color: '#7c3aed', icon: 'F' },
  { slug: 'ai-analyze-pdf', name: 'AI PDF Analyzer', tagline: 'Chat with your PDF using AI', color: '#f59e0b', icon: 'A' },
];

function buildSvg(tool: Tool, isDefault: boolean = false): string {
  const bgColor: string = tool.color;
  const displayName: string = isDefault ? 'PDFMinty' : tool.name;
  const tagline: string = isDefault ? 'Privacy-First PDF Toolkit' : tool.tagline;
  const url: string = isDefault ? 'pdfminty.com' : `pdfminty.com/${tool.slug}`;
  const iconSize: number = isDefault ? 100 : 90;
  const iconY: number = isDefault ? 260 : 270;
  const nameY: number = isDefault ? 390 : 400;
  const taglineY: number = isDefault ? 445 : 455;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <text x="80" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="bold" fill="white" opacity="0.9">PDFMinty</text>
  <text x="80" y="130" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="white" opacity="0.6">Privacy-First PDF Toolkit</text>

  <circle cx="600" cy="${iconY - 30}" r="${iconSize / 2 + 15}" fill="white" opacity="0.15"/>
  <text x="600" y="${iconY}" font-family="system-ui, -apple-system, sans-serif" font-size="${iconSize}" font-weight="bold" fill="white" text-anchor="middle">${tool.icon}</text>

  <text x="600" y="${nameY}" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">${displayName}</text>

  <text x="600" y="${taglineY}" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="white" opacity="0.85" text-anchor="middle">${tagline}</text>

  <text x="600" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="white" opacity="0.55" text-anchor="middle">${url}</text>

  <text x="80" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="white" opacity="0.5">100% Free • No Upload • Browser-Based</text>
</svg>`;
}

async function generateOGImage(tool: Tool, filename: string): Promise<void> {
  await sharp(Buffer.from(buildSvg(tool, filename === 'og-image.png')))
    .png()
    .toFile(resolve(publicDir, filename));
}

async function generateAll(): Promise<void> {
  // Default homepage OG image
  const toolCount = TOOLS.filter((t) => t.type === 'tool').length;
  await generateOGImage({ slug: '', name: 'PDFMinty', tagline: `${toolCount} Free Privacy-First PDF Tools`, color: '#059669', icon: 'P' }, 'og-image.png');
  logger.info('✓ Generated og-image.png (homepage)');

  for (const tool of tools) {
    await generateOGImage(tool, `og-${tool.slug}.png`);
    logger.info(`✓ Generated og-${tool.slug}.png`);
  }

  // Article OG image
  await generateOGImage(
    { slug: 'is-it-safe-to-upload-pdf-to-online-tools', name: 'Is It Safe?', tagline: 'PDF Security Analysis', color: '#dc2626', icon: '?' },
    'og-is-it-safe-to-upload-pdf-to-online-tools.png'
  );
  logger.info('✓ Generated og-is-it-safe-to-upload-pdf-to-online-tools.png (article)');

  logger.info(`\n✓ Generated ${tools.length + 2} OG images total`);
}

generateAll().catch((err: unknown) => {
  logger.error('OG image generation failed:', err);
  process.exit(1);
});
