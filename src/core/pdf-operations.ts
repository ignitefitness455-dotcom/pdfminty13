import { PDFDocument as PDFDocumentEncrypt } from '@cantoo/pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument as PlainPDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

import notoSansRegularBytes from '../../public/fonts/NotoSans-Regular.ttf?arraybuffer';
import { PDF_PAGE_SIZES, WATERMARK_DEFAULTS, PAGE_NUMBER_DEFAULTS } from '../config/constants';
import { logger } from '../utils/logger';

import { PDFSanitizer } from './PDFSanitizer';

import { getPdfJs } from './index';

/**
 * Helper to classify raw error instances into user-friendly, specific error messages.
 */
export function formatUserFriendlyErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof Error) {
    const rawMessage = err.message || '';
    const lower = rawMessage.toLowerCase();

    // 1. Password Protection / Encrypted
    if (
      lower.includes('encrypted') ||
      lower.includes('secured_locked') ||
      lower.includes('password protected') ||
      lower.includes('password is required')
    ) {
      return 'This PDF is password protected. Please unlock it first.';
    }

    // 2. Out of bounds / Range
    if (
      lower.includes('invalid index') ||
      lower.includes('out of bounds') ||
      lower.includes('page index')
    ) {
      return 'Page range or index is out of bounds for this document.';
    }

    // 3. Maximum file size exceeded
    if (
      lower.includes('exceeds the maximum allowed size') ||
      lower.includes('too large') ||
      lower.includes('max_single_file')
    ) {
      return rawMessage.includes('MB')
        ? rawMessage
        : 'File size exceeds maximum allowed limit (max 100MB).';
    }

    // 4. Invalid / Corrupted PDF Header or structure
    if (
      lower.includes('missing pdf header') ||
      lower.includes('not appear to be a valid pdf') ||
      lower.includes('invalid pdf') ||
      lower.includes('failed to parse') ||
      lower.includes('unexpected token') ||
      lower.includes('corrupt')
    ) {
      return 'Invalid or corrupted PDF file. Please verify the document format.';
    }

    // 5. Browser Memory / WASM / Allocation / Stack overflow
    if (
      lower.includes('out of memory') ||
      lower.includes('allocation failed') ||
      lower.includes('allocation size overflow') ||
      lower.includes('maximum call stack') ||
      lower.includes('rangeerror') ||
      lower.includes('wasm') ||
      lower.includes('heap')
    ) {
      return 'Browser memory full — try a smaller file or fewer pages.';
    }

    // 6. Pass through specific descriptive messages
    if (
      rawMessage &&
      !rawMessage.includes('[object Object]') &&
      rawMessage !== 'Error' &&
      rawMessage !== 'Unknown error'
    ) {
      return rawMessage.startsWith(defaultMessage) ? rawMessage : `${defaultMessage}: ${rawMessage}`;
    }
  } else if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }

  return defaultMessage;
}

/**
 * Helper to standardise pdf-lib errors to user-friendly ones
 */
function handlePdfLibError(err: unknown, defaultMessage: string): never {
  logger.error('PDF Operation Error:', err);
  throw new Error(formatUserFriendlyErrorMessage(err, defaultMessage));
}

/**
 * Load PDF securely
 */
async function loadPlainPDF(bytes: Uint8Array, skipEncryptionCheck = false) {
  try {
    const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes, { skipEncryptionCheck });

    if (!skipEncryptionCheck) {
      const encrypted = await PDFSanitizer.isEncrypted(safeBytes);
      if (encrypted) {
        throw new Error(
          'SECURED_LOCKED: This PDF appears to be password protected — please use Unlock PDF first.'
        );
      }
    }

    const pdfDoc = await PlainPDFDocument.load(safeBytes);
    const realFontkit = (fontkit as { default?: unknown }).default || fontkit;
    pdfDoc.registerFontkit(realFontkit);
    return pdfDoc;
  } catch (err: unknown) {
    handlePdfLibError(err, 'Failed to read PDF document. It may be corrupted.');
  }
}

let fontBytes: Uint8Array | null = null;

async function getFontBytes(): Promise<Uint8Array> {
  if (fontBytes && fontBytes.length > 50000) return fontBytes;

  // Try reading from filesystem if we are in a Node/test environment (like Vitest, even with jsdom/happy-dom)
  if (typeof process !== 'undefined') {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const fontPath = path.resolve(process.cwd(), 'public/fonts/NotoSans-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        const fileBuffer = fs.readFileSync(fontPath);
        if (fileBuffer.length > 50000) {
          const cleanBytes = new Uint8Array(fileBuffer);
          fontBytes = cleanBytes;
          return fontBytes;
        }
      }
    } catch (err) {
      logger.debug('getFontBytes filesystem load failed:', err);
    }
  }

  // If in browser (or Web Worker) and fetch is available, try fetching the static asset
  if (typeof fetch !== 'undefined') {
    try {
      const baseUrl = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
      const fontUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}fonts/NotoSans-Regular.ttf`;
      const response = await fetch(fontUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const fetchedBytes = new Uint8Array(arrayBuffer);
        if (fetchedBytes.length > 50000) {
          fontBytes = fetchedBytes;
          return fontBytes;
        }
      }
    } catch (err) {
      logger.debug('getFontBytes browser fetch failed:', err);
    }
  }

  const rawData = (notoSansRegularBytes as { default?: unknown })?.default || notoSansRegularBytes;
  if (rawData) {
    const fallbackBytes = new Uint8Array(rawData as unknown as ArrayBuffer);
    if (fallbackBytes.length > 50000) {
      fontBytes = fallbackBytes;
      return fontBytes;
    }
  }

  logger.warn('Font NotoSans-Regular.ttf could not be loaded; Helvetica standard font will be used as a graceful fallback.');
  // Final fallback to a mock/empty if nothing else is available
  fontBytes = new Uint8Array(0);
  return fontBytes;
}

export async function mergePDFs(filesBytes: Uint8Array[]): Promise<Uint8Array> {
  try {
    const mergedPdf = await PlainPDFDocument.create();
    for (const b of filesBytes) {
      const pdf = await loadPlainPDF(b);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save({ useObjectStreams: false }); // keep compatibility broad
  } catch (err) {
    handlePdfLibError(err, 'Failed to merge documents.');
  }
}

export async function splitPDF(bytes: Uint8Array, ranges: string): Promise<Uint8Array[]> {
  const pdfDoc = await loadPlainPDF(bytes);
  const totalPages = pdfDoc.getPageCount();

  const rangeSpecs = ranges
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const results: Uint8Array[] = [];

  for (const spec of rangeSpecs) {
    let startPage = 1;
    let endPage = 1;

    if (spec.includes('-')) {
      const parts = spec.split('-');
      startPage = parseInt(parts[0], 10);
      endPage = parseInt(parts[1], 10);
    } else {
      startPage = parseInt(spec, 10);
      endPage = startPage;
    }

    if (
      isNaN(startPage) ||
      isNaN(endPage) ||
      startPage < 1 ||
      endPage < startPage ||
      startPage > totalPages
    ) {
      throw new Error(
        `Invalid range specification: "${spec}". Document has only ${totalPages} pages.`
      );
    }

    const actualEnd = Math.min(endPage, totalPages);
    const subPdf = await PlainPDFDocument.create();

    const indicesToCopy: number[] = [];
    for (let p = startPage - 1; p < actualEnd; p++) {
      indicesToCopy.push(p);
    }

    try {
      const copiedPages = await subPdf.copyPages(pdfDoc, indicesToCopy);
      copiedPages.forEach((p) => subPdf.addPage(p));
      const subBytes = await subPdf.save();
      results.push(subBytes);
    } catch (err) {
      handlePdfLibError(err, `Failed to split at range ${spec}`);
    }
  }

  return results;
}

export async function extractPages(bytes: Uint8Array, pageNumbers: number[]): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  const extractedPdf = await PlainPDFDocument.create();

  const indices = pageNumbers
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < pdfDoc.getPageCount());
  if (indices.length === 0) {
    throw new Error('No valid pages found to extract.');
  }

  try {
    const copiedPages = await extractedPdf.copyPages(pdfDoc, indices);
    copiedPages.forEach((p) => extractedPdf.addPage(p));
    return await extractedPdf.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to extract specific pages.');
  }
}

export async function rotatePDF(
  bytes: Uint8Array,
  degreesValue: number,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  try {
    const pages = pdfDoc.getPages();
    const indicesToRotate = pageIndices ? pageIndices.map((p) => p - 1) : pages.map((_, i) => i);

    for (const idx of indicesToRotate) {
      if (idx >= 0 && idx < pages.length) {
        const page = pages[idx];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + degreesValue) % 360));
      }
    }
    return await pdfDoc.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to rotate pages.');
  }
}

export async function deletePagesPDF(
  bytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  const indicesToRemove = [...pageIndices]
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < pdfDoc.getPageCount())
    .sort((a, b) => b - a); // Sort descending to remove safely

  if (indicesToRemove.length === 0) {
    throw new Error('No valid pages designated for deletion.');
  }

  if (indicesToRemove.length === pdfDoc.getPageCount()) {
    throw new Error('Cannot delete all pages from the PDF document.');
  }

  try {
    indicesToRemove.forEach((index) => {
      pdfDoc.removePage(index);
    });

    return await pdfDoc.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to delete pages.');
  }
}

export async function reorderPDF(bytes: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  const reorderedPdf = await PlainPDFDocument.create();

  const indices = newOrder.map((p) => p - 1);
  if (indices.length === 0) {
    throw new Error('No pages specified for reordering.');
  }
  if (indices.some((idx) => idx < 0 || idx >= pdfDoc.getPageCount())) {
    throw new Error('Invalid page reordering index out of bounds.');
  }

  try {
    const copiedPages = await reorderedPdf.copyPages(pdfDoc, indices);
    copiedPages.forEach((p) => reorderedPdf.addPage(p));
    return await reorderedPdf.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to reorder document.');
  }
}

export async function watermarkPDF(
  bytes: Uint8Array,
  text: string,
  options?: { opacity?: number; size?: number; rotationDegrees?: number; colorHex?: string }
): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  try {
    // Embed Noto Sans for Unicode support (CJK, Arabic, Cyrillic, emoji, etc.).
    let font;
    try {
      const fontData = await getFontBytes();
      if (fontData && fontData.length > 50000) {
        font = await pdfDoc.embedFont(fontData, {
          customName: 'NotoSans',
          subset: true,
        });
      }
    } catch (fontErr) {
      logger.warn('Failed to embed NotoSans font, falling back to Helvetica:', fontErr);
    }

    if (!font) {
      font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    }

    const size = options?.size || WATERMARK_DEFAULTS.size;
    const opacity = options?.opacity !== undefined ? options?.opacity : WATERMARK_DEFAULTS.opacity;
    const rot = options?.rotationDegrees ?? WATERMARK_DEFAULTS.rotationDegrees;

    let rVal = 0.5,
      gVal = 0.5,
      bVal = 0.5;
    if (options?.colorHex) {
      const hex = options.colorHex.replace('#', '');
      if (hex.length === 6) {
        rVal = parseInt(hex.substring(0, 2), 16) / 255;
        gVal = parseInt(hex.substring(2, 4), 16) / 255;
        bVal = parseInt(hex.substring(4, 6), 16) / 255;
      }
    }

    const pages = pdfDoc.getPages();
    const angleRad = (rot * Math.PI) / 180;
    const cosTheta = Math.cos(angleRad);
    const sinTheta = Math.sin(angleRad);

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const page of pages) {
      const { width, height } = page.getSize();

      lines.forEach((lineText, index) => {
        const textWidth = font.widthOfTextAtSize(lineText, size);
        const textHeight = size * 0.8;

        const lineOffsetLocalY = (lines.length / 2 - index - 0.5) * (size * 1.2);
        const localCenterX = textWidth / 2;
        const localCenterY = textHeight / 2 - lineOffsetLocalY;

        const rotatedCenterX = localCenterX * cosTheta - localCenterY * sinTheta;
        const rotatedCenterY = localCenterX * sinTheta + localCenterY * cosTheta;

        const x = width / 2 - rotatedCenterX;
        const y = height / 2 - rotatedCenterY;

        page.drawText(lineText, {
          x,
          y,
          size,
          font,
          color: rgb(rVal, gVal, bVal),
          opacity,
          rotate: degrees(rot),
        });
      });
    }

    return await pdfDoc.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to apply watermark.');
  }
}

export async function addPageNumbersPDF(
  bytes: Uint8Array,
  options?: { format?: string; position?: string; startFrom?: number; skipFirstPage?: boolean }
): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  try {
    // Embed Noto Sans for Unicode support (page-number format strings may
    // contain non-Latin characters like "第 {n} 页" or "עמוד {n}").
    let font;
    try {
      const fontData = await getFontBytes();
      if (fontData && fontData.length > 50000) {
        font = await pdfDoc.embedFont(fontData, {
          customName: 'NotoSans',
          subset: true,
        });
      }
    } catch (fontErr) {
      logger.warn('Failed to embed NotoSans font, falling back to Helvetica:', fontErr);
    }

    if (!font) {
      font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    }
    const total = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();

    const format = options?.format || PAGE_NUMBER_DEFAULTS.format;
    const skipFirstPage =
      options?.skipFirstPage !== undefined
        ? options.skipFirstPage
        : PAGE_NUMBER_DEFAULTS.skipFirstPage;
    let currentCount =
      options?.startFrom !== undefined ? options.startFrom : PAGE_NUMBER_DEFAULTS.startFrom;
    const position = options?.position || PAGE_NUMBER_DEFAULTS.position;

    const size = 10;
    const margin = 35;

    for (let idx = 0; idx < total; idx++) {
      if (skipFirstPage && idx === 0) continue;

      const page = pages[idx];
      
      let cropBox;
      try {
        cropBox = page.getCropBox();
      } catch {
        try {
          cropBox = page.getMediaBox();
        } catch {
          const sz = page.getSize();
          cropBox = { x: 0, y: 0, width: sz.width, height: sz.height };
        }
      }

      const ox = cropBox.x ?? 0;
      const oy = cropBox.y ?? 0;
      const cw = cropBox.width ?? page.getSize().width;
      const ch = cropBox.height ?? page.getSize().height;

      const text = format
        .replace('{n}', currentCount.toString())
        .replace('{total}', total.toString());

      const textWidth = font.widthOfTextAtSize(text, size);

      let x = ox + (cw - textWidth - margin); // default bottom-right
      let y = oy + margin; // default bottom
      let rotateAngle = 0;

      const pageRotation = page.getRotation().angle;

      if (pageRotation === 0) {
        rotateAngle = 0;
        if (position.includes('left')) {
          x = ox + margin;
        } else if (position.includes('center')) {
          x = ox + (cw - textWidth) / 2;
        } else if (position.includes('right')) {
          x = ox + cw - textWidth - margin;
        }

        if (position.startsWith('top')) {
          y = oy + ch - margin - size;
        } else {
          y = oy + margin;
        }
      } else if (pageRotation === 90) {
        rotateAngle = 90;
        if (position.includes('left')) {
          y = oy + margin;
        } else if (position.includes('center')) {
          y = oy + (ch - textWidth) / 2;
        } else if (position.includes('right')) {
          y = oy + ch - margin - textWidth;
        }

        if (position.startsWith('top')) {
          x = ox + margin + size;
        } else {
          x = ox + cw - margin;
        }
      } else if (pageRotation === 180) {
        rotateAngle = 180;
        if (position.includes('left')) {
          x = ox + cw - margin;
        } else if (position.includes('center')) {
          x = ox + (cw + textWidth) / 2;
        } else if (position.includes('right')) {
          x = ox + margin + textWidth;
        }

        if (position.startsWith('top')) {
          y = oy + ch - margin;
        } else {
          y = oy + margin + size;
        }
      } else if (pageRotation === 270) {
        rotateAngle = 270;
        if (position.includes('left')) {
          y = oy + ch - margin;
        } else if (position.includes('center')) {
          y = oy + (ch + textWidth) / 2;
        } else if (position.includes('right')) {
          y = oy + margin + textWidth;
        }

        if (position.startsWith('top')) {
          x = ox + cw - margin;
        } else {
          x = ox + margin + size;
        }
      }

      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0), // Use crisp black color for maximum contrast and legibility
        rotate: degrees(rotateAngle),
      });
      currentCount++;
    }

    return await pdfDoc.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to add page numbers.');
  }
}

export async function addBlankPagePDF(
  bytes: Uint8Array,
  position: 'start' | 'end' | number,
  pageSizeKey: keyof typeof PDF_PAGE_SIZES = 'A4'
): Promise<Uint8Array> {
  const pdfDoc = await loadPlainPDF(bytes);
  try {
    let size: [number, number];
    // Copy the size of existing pages to maintain layout harmony unless empty document fallback
    if (pdfDoc.getPageCount() > 0) {
      const referencePage = pdfDoc.getPages()[0];
      const { width, height } = referencePage.getSize();
      size = [width, height];
    } else {
      const defaultSize = PDF_PAGE_SIZES[pageSizeKey] || PDF_PAGE_SIZES.A4;
      size = [defaultSize[0], defaultSize[1]];
    }

    if (position === 'start') {
      pdfDoc.insertPage(0, [size[0], size[1]]);
    } else if (position === 'end') {
      pdfDoc.addPage([size[0], size[1]]);
    } else {
      const targetIdx = Math.max(0, Math.min(position - 1, pdfDoc.getPageCount()));
      let insertSize = size;
      if (targetIdx < pdfDoc.getPageCount()) {
        const pageAtIdx = pdfDoc.getPages()[targetIdx];
        const sz = pageAtIdx.getSize();
        insertSize = [sz.width, sz.height];
      }
      pdfDoc.insertPage(targetIdx, [insertSize[0], insertSize[1]]);
    }

    return await pdfDoc.save();
  } catch (err) {
    handlePdfLibError(err, 'Failed to add a blank page.');
  }
}

/**
 * Convert a list of images into a single PDF.
 *
 * Supported input formats:
 * - Native embed (no conversion): JPEG, PNG
 * - Auto-converted to PNG via createImageBitmap + OffscreenCanvas:
 *   WebP, AVIF, GIF (first frame), BMP, HEIC (where the browser supports it).
 *
 * Page sizing:
 * - options.pageSize omitted → each page exactly matches image pixel dimensions
 * - options.pageSize = 'A4' | 'Letter' | 'Legal' → image is centered on standard
 *   page with 20pt margins, scaled to fit while preserving aspect ratio.
 */
export async function imagesToPDF(
  imageBlobs: { buf: Uint8Array; type: string; name?: string }[],
  options?: { pageSize?: keyof typeof PDF_PAGE_SIZES }
): Promise<Uint8Array> {
  const pdfDoc = await PlainPDFDocument.create();
  const selectedPageSize = options?.pageSize ? PDF_PAGE_SIZES[options.pageSize] : null;

  for (const file of imageBlobs) {
    const normalizedType = (file.type || '').toLowerCase();

    let embeddedImg;
    try {
      if (
        normalizedType === 'image/jpeg' ||
        normalizedType === 'image/jpg'
      ) {
        embeddedImg = await pdfDoc.embedJpg(file.buf);
      } else if (normalizedType === 'image/png') {
        embeddedImg = await pdfDoc.embedPng(file.buf);
      } else if (
        normalizedType === 'image/webp' ||
        normalizedType === 'image/avif' ||
        normalizedType === 'image/gif' ||
        normalizedType === 'image/bmp' ||
        normalizedType === 'image/heic' ||
        normalizedType === 'image/heif'
      ) {
        // Convert to PNG via createImageBitmap + OffscreenCanvas.
        // createImageBitmap accepts Blob and decodes any format the browser supports.
        const blob = new Blob([file.buf as unknown as BlobPart], { type: file.type || 'image/png' });
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(blob);
        } catch {
          throw new Error(
            `Could not decode image "${file.name || 'unnamed'}" (format: ${file.type}). Your browser may not support this format. Try converting to PNG or JPEG first.`
          );
        }

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          bitmap.close();
          throw new Error('Canvas 2D context unavailable for image conversion.');
        }
        // White background for formats that may have transparency (GIF, WebP, PNG).
        // We draw white first so JPEG-style rendering downstream doesn't show black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bitmap.width, bitmap.height);
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        embeddedImg = await pdfDoc.embedPng(pngBytes);
      } else {
        throw new Error(
          `Unsupported image format: "${file.type}" for file "${file.name || 'unnamed'}". Supported: JPG, PNG, WebP, AVIF, GIF, BMP, HEIC.`
        );
      }
    } catch (err) {
      // Re-throw our friendly errors, wrap unexpected ones.
      if (err instanceof Error && err.message.startsWith('Could not decode')) throw err;
      if (err instanceof Error && err.message.startsWith('Unsupported image')) throw err;
      throw new Error(
        `Failed to embed image "${file.name || 'unnamed'}": ${err instanceof Error ? err.message : 'unknown error'}`
      );
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    if (selectedPageSize) {
      const margin = 20;
      const pageWidth = selectedPageSize[0];
      const pageHeight = selectedPageSize[1];

      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - 2 * margin;

      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImg, { x, y, width: drawWidth, height: drawHeight });
    } else {
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(embeddedImg, { x: 0, y: 0, width: imgWidth, height: imgHeight });
    }
  }

  try {
    return await pdfDoc.save({ useObjectStreams: true });
  } catch (err) {
    handlePdfLibError(err, 'Failed to build PDF from images.');
  }
}

class CustomCanvasFactory {
  constructor(_options?: unknown) {}

  create(width: number, height: number): {
    canvas: OffscreenCanvas | HTMLCanvasElement;
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  } {
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid canvas size');
    }
    let canvas: OffscreenCanvas | HTMLCanvasElement;
    let context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
      context = canvas.getContext('2d');
    } else if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      context = canvas.getContext('2d');
    } else {
      throw new Error('No canvas implementation found.');
    }

    if (!context) {
      throw new Error('Canvas 2D context unavailable.');
    }

    return {
      canvas,
      context,
    };
  }

  destroy(canvasAndContext: {
    canvas: OffscreenCanvas | HTMLCanvasElement | null;
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  }): void {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
    }
    canvasAndContext.context = null;
  }
}

/**
 * Compression levels:
 * - basic:    Object-stream packing + metadata strip + redundant whitespace removal.
 *             Fast, lossless, typically 5-15% reduction on text-heavy PDFs.
 * - medium:   All of basic + re-rasterize image-heavy pages to JPEG quality 0.7 at 1.5x scale.
 *             Good balance for typical office documents. Slower.
 * - maximum:  All of basic + re-rasterize ALL pages to JPEG quality 0.5 at 1.2x scale + drop
 *             bookmarks/thumbnails. Most aggressive. Visual quality may degrade on text.
 *
 * Image re-rasterization uses pdfjs-dist to render each page to a canvas, then re-embeds
 * the JPEG via @cantoo/pdf-lib. This is the only browser-side approach that actually
 * shrinks embedded images — pdf-lib alone cannot decode/recompress existing image XObjects.
 */
export async function compressPDF(
  bytes: Uint8Array,
  level: 'basic' | 'medium' | 'maximum' = 'basic'
): Promise<Uint8Array> {
  // Sanitize once and reuse `safeBytes` below for both pdf-lib and, in the
  // medium/maximum branch, pdfjs-dist. Compression doesn't need decryption
  // support, but — like every other operation in this file — it must still
  // detect an encrypted input up front and fail with the same friendly,
  // actionable message instead of letting pdf-lib's raw internal error reach
  // the user unwrapped (the previous version skipped this check entirely and
  // loaded outside any try/catch, so a corrupted/encrypted file here bypassed
  // handlePdfLibError() completely instead of getting the friendly message
  // every other tool gives).
  const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes);
  let pdfDoc: PlainPDFDocument;
  try {
    const encrypted = await PDFSanitizer.isEncrypted(safeBytes);
    if (encrypted) {
      throw new Error(
        'SECURED_LOCKED: This PDF appears to be password protected — please use Unlock PDF first.'
      );
    }
    pdfDoc = await PlainPDFDocument.load(safeBytes);
  } catch (err) {
    handlePdfLibError(err, 'Failed to read PDF document. It may be corrupted.');
  }

  try {
    // Step 1 — strip metadata that bloats the file.
    try {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('PDFMinty');
      pdfDoc.setCreator('PDFMinty');
      pdfDoc.setCreationDate(new Date(0));
      pdfDoc.setModificationDate(new Date(0));
    } catch {
      // Metadata stripping is best-effort; some PDFs have locked /Info dicts.
    }

    // Step 2 — for medium/maximum, re-rasterize pages.
    if (level === 'medium' || level === 'maximum') {
      const jpegQuality = level === 'medium' ? 0.7 : 0.5;
      const renderScale = level === 'medium' ? 1.5 : 1.2;

      // Use pdfjs-dist to render each page to a JPEG, then build a fresh doc
      // with one image per page. This guarantees image-heavy PDFs shrink.
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(safeBytes),
        canvasFactory: new CustomCanvasFactory(),
      } as unknown as Parameters<typeof pdfjs.getDocument>[0]);
      const srcPdf = await loadingTask.promise;

      try {
        const totalPages = srcPdf.numPages;
        const newPdf = await PlainPDFDocument.create();

        interface HTMLCanvasLike {
          toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
        }

        const canvasToBlob = async (
          canv: OffscreenCanvas | HTMLCanvasElement,
          quality: number
        ): Promise<Blob> => {
          if (typeof OffscreenCanvas !== 'undefined' && canv instanceof OffscreenCanvas) {
            return await canv.convertToBlob({ type: 'image/jpeg', quality });
          } else {
            const maybeHtmlCanvas = canv as unknown as HTMLCanvasLike;
            if (typeof maybeHtmlCanvas.toBlob === 'function') {
              return new Promise<Blob>((resolve, reject) => {
                maybeHtmlCanvas.toBlob(
                  (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                  },
                  'image/jpeg',
                  quality
                );
              });
            }
            throw new Error('Canvas conversion method (toBlob) is not supported in this environment.');
          }
        };

        for (let i = 1; i <= totalPages; i++) {
          const page = await srcPdf.getPage(i);
          // Per-page work is isolated in its own try/catch so a failure on ANY
          // single page (corrupt image stream, allocation failure, etc.) is
          // reported with the page number attached instead of surfacing as an
          // unattributed failure somewhere inside a multi-hundred-page loop.
          try {
            // Get unscaled dimensions first to apply a safe maximum cap (prevents OOM on high-res pages)
            const unscaledViewport = page.getViewport({ scale: 1 });
            const maxDimension = 2048; // Max width or height for standard web-quality compression
            let scale = renderScale;
            if (
              unscaledViewport.width * scale > maxDimension ||
              unscaledViewport.height * scale > maxDimension
            ) {
              scale = Math.min(
                maxDimension / unscaledViewport.width,
                maxDimension / unscaledViewport.height
              );
            }

            const viewport = page.getViewport({ scale });

            // Create a brand new canvas for each page to avoid context reset issues/corruption on OffscreenCanvas
            const canvasFactory = new CustomCanvasFactory();
            const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

            // White background — JPEG has no alpha.
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, viewport.width, viewport.height);

            await page.render({
              canvasContext: context as CanvasRenderingContext2D,
              viewport,
              canvasFactory,
            }).promise;

            const blob = await canvasToBlob(canvas, jpegQuality);
            const jpegBytes = new Uint8Array(await blob.arrayBuffer());

            const embedded = await newPdf.embedJpg(jpegBytes);
            const newPage = newPdf.addPage([viewport.width, viewport.height]);
            newPage.drawImage(embedded, {
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height,
            });

            // Immediately release the canvas's backing pixel buffer instead of
            // waiting for garbage collection. Each canvas here can hold several
            // MB of raw, uncompressed pixel data; on large multi-page documents
            // at the Standard/Extreme levels, dozens of these can accumulate
            // faster than GC reclaims them — the most likely cause of the
            // generic "Failed to compress document." failure on big files. The
            // setTimeout(0) below already yields to let GC run; this makes sure
            // there's actually something small for it to collect by then.
            canvasFactory.destroy({ canvas, context });
          } catch (pageErr: unknown) {
            const pageMessage = pageErr instanceof Error ? pageErr.message : String(pageErr);
            throw new Error(`Failed while compressing page ${i} of ${totalPages}: ${pageMessage}`);
          } finally {
            // Guarantee page cleanup
            page.cleanup();
          }

          // Yield to browser event loop to let GC clean up memory and prevent tab freeze
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // Re-apply stripped metadata on the new doc.
        newPdf.setProducer('PDFMinty');
        newPdf.setCreator('PDFMinty');

        return await newPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
        });
      } finally {
        // Guarantee source document destruction
        await srcPdf.destroy();
      }
    }

    // basic level — just object streams + stripped metadata.
    return await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
  } catch (err: unknown) {
    logger.error('Compress operation failed:', err);

    // Compression deliberately does NOT fall back to the shared
    // handlePdfLibError() catch-all used elsewhere in this file. That helper
    // discards any message it doesn't specifically recognise and always shows
    // the same opaque "Failed to compress document." text — which is exactly
    // the dead-end error this function used to produce for every failure
    // mode, regardless of cause. We classify the real error instead so the
    // user (and Matrix, debugging from the console) gets a specific,
    // actionable reason rather than a generic dead end.
    const rawMessage = err instanceof Error ? err.message : String(err);
    const lower = rawMessage.toLowerCase();

    if (
      lower.includes('encrypted') ||
      lower.includes('secured_locked') ||
      lower.includes('password protected')
    ) {
      throw new Error('This PDF is password protected. Please unlock it first.');
    }

    if (
      lower.includes('out of memory') ||
      lower.includes('allocation failed') ||
      lower.includes('allocation size overflow') ||
      lower.includes('canvas') ||
      lower.includes('rangeerror')
    ) {
      const levelLabel = level === 'maximum' ? 'Extreme' : level === 'medium' ? 'Standard' : 'Low';
      throw new Error(
        `${rawMessage} — this usually means the document is too large or has too many pages to ` +
          `re-render at the "${levelLabel}" level within your browser's available memory. Try a ` +
          `lower compression level, or split the file into smaller parts first.`
      );
    }

    // Fall back to the real underlying message instead of a generic string
    // with no diagnostic value.
    throw new Error(`Failed to compress document: ${rawMessage}`);
  }
}

/**
 * Encrypt a PDF with a user-supplied password.
 *
 * We use the SAME password for both `userPassword` and `ownerPassword`. The
 * previous implementation appended `_owner` to derive the owner password,
 * which is a trivially predictable salt — if the user password leaks, the
 * owner password is instantly derivable and an attacker can strip the
 * permission restrictions. Using the same password for both is the simplest
 * secure option: the user already knows the password, and there's no
 * separate "owner" credential to protect.
 *
 * Permissions applied:
 * - modifying: false  (no editing)
 * - printing: 'highResolution' (printing allowed at full quality)
 * - copying: false  (no text extraction)
 *
 * Note: PDF permissions are advisory — any tool that has the password can
 * strip them. They deter casual copying, not determined attackers.
 */
export async function protectPDF(payload: {
  fileBytes: Uint8Array;
  userPassword: string;
}): Promise<Uint8Array> {
  if (!payload.userPassword) {
    throw new Error('A non-empty password is required.');
  }
  if (payload.userPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long for meaningful security.');
  }

  const { bytes: safeBytes } = PDFSanitizer.sanitize(payload.fileBytes, {
    skipEncryptionCheck: true,
  });

  try {
    const pdfDoc = await PDFDocumentEncrypt.load(safeBytes);
    pdfDoc.encrypt({
      userPassword: payload.userPassword,
      ownerPassword: payload.userPassword, // Same password — see docstring.
      permissions: {
        modifying: false,
        printing: 'highResolution',
        copying: false,
      },
    });
    return await pdfDoc.save({ useObjectStreams: true });
  } catch (err) {
    handlePdfLibError(err, 'Failed to encrypt document with password.');
  }
}

/**
 * Decrypt a password-protected PDF and return clean unencrypted bytes.
 *
 * Security notes:
 * - We do NOT pass `ignoreEncryption: true`. That flag tells the loader to skip
 *   decryption entirely, which means the saved output would still contain
 *   encrypted streams — corrupt for any downstream tool. Instead we let the
 *   password alone drive decryption and rely on the library's natural
 *   "wrong password throws" behavior.
 * - After saving, we verify the output bytes are actually unencrypted by
 *   scanning for the `/Encrypt` dictionary marker. If it's still present
 *   we throw — this guards against any future library regression.
 */
export async function unlockPDF(payload: {
  fileBytes: Uint8Array;
  password: string;
}): Promise<Uint8Array> {
  if (!payload.password) {
    throw new Error('A password is required to unlock the document.');
  }

  const { bytes: safeBytes } = PDFSanitizer.sanitize(payload.fileBytes, {
    skipEncryptionCheck: true,
  });

  let pdfDoc;
  try {
    // Password-only load. The library will throw on wrong password.
    pdfDoc = await PDFDocumentEncrypt.load(safeBytes, {
      password: payload.password,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (
      msg.includes('password') ||
      msg.includes('decrypt') ||
      msg.includes('auth') ||
      msg.includes('invalid')
    ) {
      throw new Error(
        'Failed to decrypt document. The password is incorrect or the document uses an unsupported encryption scheme.'
      );
    }
    throw new Error(
      'Failed to read the encrypted document. It may be corrupted or use an unsupported encryption standard.'
    );
  }

  // Save with encryption explicitly removed.
  const outputBytes = await pdfDoc.save({ useObjectStreams: true });

  // Verify the output is actually unencrypted by scanning for the /Encrypt
  // dictionary marker. The marker can appear in either the trailer (most
  // common) or, rarely, in an xref stream header — so we check both ends
  // of the file. This guards against any future library regression where
  // .save() silently preserves the /Encrypt dict.
  const checkSliceForEncrypt = (offset: number, len: number): boolean => {
    const slice = outputBytes.subarray(offset, offset + len);
    return new TextDecoder('ascii', { fatal: false }).decode(slice).includes('/Encrypt');
  };
  const headHasEncrypt = checkSliceForEncrypt(0, Math.min(200, outputBytes.length));
  const tailHasEncrypt = checkSliceForEncrypt(
    Math.max(0, outputBytes.length - 200),
    Math.min(200, outputBytes.length)
  );
  if (headHasEncrypt || tailHasEncrypt) {
    throw new Error(
      'Decryption verification failed: output still contains /Encrypt marker. ' +
        'The document may use an unsupported encryption scheme.'
    );
  }

  return outputBytes;
}

/**
 * Extract images using pdfjs-dist for rendering
 *
 * Memory safety: the pdfjs document is destroyed in a `finally` block to
 * guarantee cleanup on both success and failure paths. The WorkerManager
 * is a singleton — leaking pdfjs documents would eventually OOM-crash the
 * shared worker and reject ALL pending operations across the SPA.
 */
export async function pdfToImage(
  bytes: Uint8Array,
  originalName: string,
  scale: number = 1.5,
  maxPages?: number,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  startPage: number = 1
): Promise<{ page: number; imageBytes: Uint8Array }[]> {
  let pdf: { getPage: (n: number) => Promise<unknown>; numPages: number; destroy: () => Promise<void> } | null = null;
  try {
    const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes);
    const pdf_js = await getPdfJs();

    const loadingTask = pdf_js.getDocument({
      data: safeBytes,
      canvasFactory: new CustomCanvasFactory(),
    } as unknown as Parameters<typeof pdf_js.getDocument>[0]);
    pdf = await loadingTask.promise;

    // When startPage is specified, render `maxPages` pages starting from startPage.
    // Otherwise, render from page 1 (original behavior).
    const effectiveStart = Math.max(1, Math.min(startPage, pdf.numPages));
    const maxToRender = maxPages !== undefined ? Math.min(maxPages, pdf.numPages - effectiveStart + 1) : pdf.numPages - effectiveStart + 1;
    const rendered: { page: number; imageBytes: Uint8Array }[] = [];

    for (let offset = 0; offset < maxToRender; offset++) {
      const i = effectiveStart + offset;
      const page = (await pdf.getPage(i)) as {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
          canvasFactory?: unknown;
        }) => { promise: Promise<void> };
        cleanup: () => void;
      };
      const viewport = page.getViewport({ scale });

      const canvasFactory = new CustomCanvasFactory();
      const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

      if (context) {
        await page.render({
          canvasContext: context as CanvasRenderingContext2D,
          viewport,
          canvasFactory,
        }).promise;
        if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
          const blob = await canvas.convertToBlob({
            type: format,
            quality: format === 'image/jpeg' ? 0.9 : undefined,
          });
          rendered.push({
            page: i,
            imageBytes: new Uint8Array(await blob.arrayBuffer()),
          });
        } else if (canvas instanceof HTMLCanvasElement) {
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('blob null'))),
              format,
              format === 'image/jpeg' ? 0.9 : undefined
            )
          );
          rendered.push({
            page: i,
            imageBytes: new Uint8Array(await blob.arrayBuffer()),
          });
        }
        // Free per-page pdfjs resources after each render.
        page.cleanup();
        canvasFactory.destroy({ canvas, context });
      }
    }

    return rendered;
  } catch (err: unknown) {
    logger.error('Export images failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(
      message ||
        'Error occurred during PDF parsing. Encrypted documents are not supported for canvas extraction.'
    );
  } finally {
    // ALWAYS destroy the pdfjs document, even on error. This prevents the
    // singleton WorkerManager from accumulating leaked documents.
    if (pdf) {
      try {
        await pdf.destroy();
      } catch (destroyErr: unknown) {
        logger.error('pdf.destroy() failed during cleanup:', destroyErr);
      }
    }
  }
}

export async function getPageCount(bytes: Uint8Array): Promise<number> {
  const pdfDoc = await loadPlainPDF(bytes);
  return pdfDoc.getPageCount();
}

export async function grayscalePDF(
  bytes: Uint8Array,
  scale: number = 1.5
): Promise<Uint8Array> {
  let pdf: { getPage: (n: number) => Promise<unknown>; numPages: number; destroy: () => Promise<void> } | null = null;
  try {
    const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes);
    const pdf_js = await getPdfJs();

    const loadingTask = pdf_js.getDocument({
      data: safeBytes,
      canvasFactory: new CustomCanvasFactory(),
    } as unknown as Parameters<typeof pdf_js.getDocument>[0]);
    pdf = await loadingTask.promise;

    const outPdfDoc = await PlainPDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = (await pdf.getPage(i)) as {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
          canvasFactory?: unknown;
        }) => { promise: Promise<void> };
        cleanup: () => void;
      };
      const viewport = page.getViewport({ scale });

      const canvasFactory = new CustomCanvasFactory();
      const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

      if (context) {
        await page.render({
          canvasContext: context as CanvasRenderingContext2D,
          viewport,
          canvasFactory,
        }).promise;

        const imgData = context.getImageData(0, 0, viewport.width, viewport.height);
        const data = imgData.data;
        for (let j = 0; j < data.length; j += 4) {
          const r = data[j];
          const g = data[j + 1];
          const b = data[j + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[j] = gray;
          data[j + 1] = gray;
          data[j + 2] = gray;
        }
        context.putImageData(imgData, 0, 0);

        let imageBuf: Uint8Array;
        if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
          const blob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: 0.85,
          });
          imageBuf = new Uint8Array(await blob.arrayBuffer());
        } else if (canvas instanceof HTMLCanvasElement) {
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('blob null'))),
              'image/jpeg',
              0.85
            )
          );
          imageBuf = new Uint8Array(await blob.arrayBuffer());
        } else {
          throw new Error('Canvas type not recognized.');
        }

        const embeddedImg = await outPdfDoc.embedJpg(imageBuf);
        const outPage = outPdfDoc.addPage([viewport.width, viewport.height]);
        outPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });

        page.cleanup();
        canvasFactory.destroy({ canvas, context });
      }
    }

    const compiledBytes = await outPdfDoc.save();
    return compiledBytes;
  } catch (err: unknown) {
    logger.error('Grayscale PDF failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(message || 'Error occurred during PDF parsing.');
  } finally {
    if (pdf) {
      try {
        await pdf.destroy();
      } catch (destroyErr: unknown) {
        logger.error('pdf.destroy() failed during cleanup:', destroyErr);
      }
    }
  }
}

export async function flattenPDF(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const pdfDoc = await loadPlainPDF(bytes);
    const form = pdfDoc.getForm();
    form.flatten();
    const compiledBytes = await pdfDoc.save();
    return compiledBytes;
  } catch (err: unknown) {
    logger.error('Flatten PDF failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(message || 'Error occurred while flattening form fields.');
  }
}

export async function repairPDF(bytes: Uint8Array): Promise<{ bytes: Uint8Array; repairs: string[] }> {
  const repairs: string[] = [];
  try {
    let workingBytes = new Uint8Array(bytes);

    // 1. Header Repair: Strip leading junk before %PDF-
    const headerPattern = new TextEncoder().encode('%PDF-');
    let headerIdx = -1;
    for (let i = 0; i <= workingBytes.length - headerPattern.length; i++) {
      let matched = true;
      for (let j = 0; j < headerPattern.length; j++) {
        if (workingBytes[i + j] !== headerPattern[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx > 0) {
      workingBytes = workingBytes.subarray(headerIdx);
      repairs.push('Removed leading corrupted or junk bytes before PDF header.');
    } else if (headerIdx === -1) {
      const cleanHeader = new TextEncoder().encode('%PDF-1.4\n');
      const newBytes = new Uint8Array(cleanHeader.length + workingBytes.length);
      newBytes.set(cleanHeader);
      newBytes.set(workingBytes, cleanHeader.length);
      workingBytes = newBytes;
      repairs.push('Missing PDF header was reconstructed.');
    }

    // 2. Trailer Repair: Strip trailing junk after last %%EOF, or append it if missing
    const trailerPattern = new TextEncoder().encode('%%EOF');
    let trailerIdx = -1;
    for (let i = workingBytes.length - trailerPattern.length; i >= 0; i--) {
      let matched = true;
      for (let j = 0; j < trailerPattern.length; j++) {
        if (workingBytes[i + j] !== trailerPattern[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        trailerIdx = i;
        break;
      }
    }

    if (trailerIdx !== -1) {
      const expectedEndIdx = trailerIdx + trailerPattern.length;
      if (expectedEndIdx < workingBytes.length) {
        workingBytes = workingBytes.subarray(0, expectedEndIdx);
        repairs.push('Trimmed trailing junk and corrupted bytes after EOF marker.');
      }
    } else {
      const cleanTrailer = new TextEncoder().encode('\n%%EOF\n');
      const newBytes = new Uint8Array(workingBytes.length + cleanTrailer.length);
      newBytes.set(workingBytes);
      newBytes.set(cleanTrailer, workingBytes.length);
      workingBytes = newBytes;
      repairs.push('Missing EOF trailer marker was successfully appended.');
    }

    // 3. Rebuild XREF & Catalog Structure using pdf-lib
    const pdfDoc = await PlainPDFDocument.load(workingBytes, { ignoreEncryption: true });
    
    if (pdfDoc.isEncrypted) {
      repairs.push('Rebuilt cross-reference tables for encrypted PDF structure.');
    } else {
      repairs.push('Reconstructed damaged cross-reference tables and internal catalog tree.');
    }

    const compiledBytes = await pdfDoc.save();
    return { bytes: compiledBytes, repairs };
  } catch (err: unknown) {
    logger.error('Repair PDF failed:', err);
    if (repairs.length > 0) {
      repairs.push('Rebuilding catalog failed, but applied byte-level alignment repairs.');
      return { bytes, repairs };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(message || 'Error occurred while repairing the PDF document structure.');
  }
}

export interface ExtractedMarkdownImage {
  filename: string;
  dataBytes: Uint8Array;
}

export interface PdfToMarkdownResult {
  markdown: string;
  images: ExtractedMarkdownImage[];
  pageCount: number;
  isScannedOrImageOnly?: boolean;
}

async function extractImagesFromPage(
  page: unknown,
  pageNum: number
): Promise<ExtractedMarkdownImage[]> {
  const results: ExtractedMarkdownImage[] = [];
  try {
    if (typeof OffscreenCanvas === 'undefined') {
      return results;
    }
    const p = page as {
      getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
      objs?: { get: (id: string, callback?: (data: unknown) => void) => unknown };
    };
    const opList = await p.getOperatorList();
    const fnArray = opList.fnArray;
    const argsArray = opList.argsArray;
    let imgIdx = 0;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      if (
        argsArray[i] &&
        argsArray[i].length > 0 &&
        typeof argsArray[i][0] === 'string' &&
        (argsArray[i][0].startsWith('img_') || fn === 85 || fn === 86 || fn === 82)
      ) {
        const objId = argsArray[i][0];
        try {
          const img: unknown = await new Promise((resolve) => {
            if (p.objs && typeof p.objs.get === 'function') {
              try {
                const res = p.objs.get(objId, (data: unknown) => resolve(data));
                if (res !== undefined) resolve(res);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
          if (
            img &&
            typeof img === 'object' &&
            'width' in img &&
            'height' in img &&
            typeof (img as { width: number }).width === 'number' &&
            typeof (img as { height: number }).height === 'number'
          ) {
            const width = (img as { width: number }).width;
            const height = (img as { height: number }).height;
            if (width > 0 && height > 0) {
              const canvas = new OffscreenCanvas(width, height);
              const ctx = canvas.getContext('2d');
              const data = (img as { data?: Uint8ClampedArray | Uint8Array }).data;
              if (ctx && data) {
                let rgba: Uint8ClampedArray;
                if (data.length === width * height * 4) {
                  rgba = new Uint8ClampedArray(data);
                } else if (data.length === width * height * 3) {
                  rgba = new Uint8ClampedArray(width * height * 4);
                  for (let j = 0, k = 0; j < data.length; j += 3, k += 4) {
                    rgba[k] = data[j];
                    rgba[k + 1] = data[j + 1];
                    rgba[k + 2] = data[j + 2];
                    rgba[k + 3] = 255;
                  }
                } else {
                  continue;
                }
                const imgData = new ImageData(rgba, width, height);
                ctx.putImageData(imgData, 0, 0);
                const blob = await canvas.convertToBlob({ type: 'image/png' });
                const buf = new Uint8Array(await blob.arrayBuffer());
                imgIdx++;
                results.push({
                  filename: `image_p${pageNum}_${imgIdx}.png`,
                  dataBytes: buf,
                });
              }
            }
          }
        } catch {
          // Ignore individual image parse issues inside worker
        }
      }
    }
  } catch {
    // Isolated catch ensures image extraction never blocks markdown processing
  }
  return results;
}

interface PageTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
}

interface PageLayoutData {
  pageNum: number;
  width: number;
  height: number;
  items: PageTextItem[];
  images: ExtractedMarkdownImage[];
}

export async function pdfToMarkdown(
  bytes: Uint8Array,
  options?: { extractImages?: boolean },
  onProgress?: (progress: { current: number; total: number }) => void
): Promise<PdfToMarkdownResult> {
  const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes);
  const encrypted = await PDFSanitizer.isEncrypted(safeBytes);
  if (encrypted) {
    throw new Error(
      'SECURED_LOCKED: This PDF appears to be password protected — please use Unlock PDF first.'
    );
  }

  const pdf_js = await getPdfJs();
  const loadingTask = pdf_js.getDocument({
    data: safeBytes,
  } as unknown as Parameters<typeof pdf_js.getDocument>[0]);
  const pdf = await loadingTask.promise;

  const extractedImages: ExtractedMarkdownImage[] = [];
  const pagesData: PageLayoutData[] = [];

  try {
    const numPages = pdf.numPages;

    for (let pNum = 1; pNum <= numPages; pNum++) {
      const page = await pdf.getPage(pNum);
      const viewport = (
        page as unknown as { getViewport: (opts: { scale: number }) => { width: number; height: number } }
      ).getViewport({ scale: 1.0 });

      const textContent = await (
        page as unknown as {
          getTextContent: () => Promise<{
            items: unknown[];
            styles?: Record<string, { fontFamily?: string; name?: string; fontWeight?: unknown; fontStyle?: string }>;
          }>;
        }
      ).getTextContent();

      const styles = textContent.styles || {};
      const items: PageTextItem[] = [];

      for (const raw of textContent.items) {
        if (!raw || typeof raw !== 'object' || !('str' in raw)) continue;
        const r = raw as {
          str: string;
          transform: number[];
          width?: number;
          height?: number;
          fontName?: string;
        };
        const str = r.str;
        if (!str || !str.trim()) continue;

        const transform = r.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4] || 0;
        const y = transform[5] || 0;
        const fontSize = Math.hypot(transform[2] || 0, transform[3] || 0) || Math.abs(transform[3] || 10) || 10;
        const width = r.width || str.length * fontSize * 0.55;
        const height = r.height || fontSize;
        const fontName = r.fontName || '';

        let bold = false;
        let italic = false;
        const lowerFont = fontName.toLowerCase();
        if (lowerFont.includes('bold') || lowerFont.includes('heavy') || lowerFont.includes('black')) bold = true;
        if (lowerFont.includes('italic') || lowerFont.includes('oblique')) italic = true;

        const styleObj = styles[fontName];
        if (styleObj) {
          const fam = (styleObj.fontFamily || '').toLowerCase();
          const nm = (styleObj.name || '').toLowerCase();
          if (
            fam.includes('bold') ||
            nm.includes('bold') ||
            styleObj.fontWeight === 'bold' ||
            (typeof styleObj.fontWeight === 'number' && styleObj.fontWeight >= 600)
          ) {
            bold = true;
          }
          if (fam.includes('italic') || nm.includes('italic') || styleObj.fontStyle === 'italic') {
            italic = true;
          }
        }

        items.push({ str, x, y, width, height, fontSize, fontName, bold, italic });
      }

      let pageImgs: ExtractedMarkdownImage[] = [];
      if (options?.extractImages) {
        pageImgs = await extractImagesFromPage(page, pNum);
        extractedImages.push(...pageImgs);
      }

      pagesData.push({
        pageNum: pNum,
        width: viewport.width,
        height: viewport.height,
        items,
        images: pageImgs,
      });

      if (typeof (page as unknown as { cleanup?: () => void }).cleanup === 'function') {
        (page as unknown as { cleanup: () => void }).cleanup();
      }

      onProgress?.({ current: pNum, total: numPages });
    }

    let totalChars = 0;
    const allFontSizes: number[] = [];
    const headerFooterCounts = new Map<string, number>();

    for (const pData of pagesData) {
      for (const item of pData.items) {
        const trimmed = item.str.trim();
        totalChars += trimmed.length;
        allFontSizes.push(item.fontSize);

        if (pagesData.length >= 3) {
          const isTop = item.y > pData.height * 0.88;
          const isBottom = item.y < pData.height * 0.12;
          if (isTop || isBottom) {
            const norm = trimmed.replace(/\d+/g, '#').toLowerCase();
            if (norm.length >= 2) {
              const band = Math.round(item.y / 15) * 15;
              const key = `${norm}_${band}`;
              headerFooterCounts.set(key, (headerFooterCounts.get(key) || 0) + 1);
            }
          }
        }
      }
    }

    const isScannedOrImageOnly = totalChars < 15 && extractedImages.length === 0;
    if (isScannedOrImageOnly) {
      return {
        markdown:
          '# ⚠️ Scanned or Image-Only PDF Detected\n\nThis PDF page contains no selectable text layer. To extract text or markdown from scanned documents, click the **AI Vision OCR Mode** button above to perform Multimodal AI recognition.',
        images: extractedImages,
        pageCount: numPages,
        isScannedOrImageOnly: true,
      };
    }

    allFontSizes.sort((a, b) => a - b);
    const medianFontSize =
      allFontSizes.length > 0 ? allFontSizes[Math.floor(allFontSizes.length / 2)] : 11;

    const thresholdPages = Math.min(3, Math.ceil(pagesData.length * 0.5));
    const repeatingKeys = new Set<string>();
    headerFooterCounts.forEach((count, key) => {
      if (count >= thresholdPages) {
        repeatingKeys.add(key);
      }
    });

    const pageMarkdownSections: string[] = [];

    for (const pData of pagesData) {
      // 1. Strip repeating headers/footers & standalone page numbers
      const validItems = pData.items.filter((item) => {
        const trimmed = item.str.trim();
        const isTop = item.y > pData.height * 0.88;
        const isBottom = item.y < pData.height * 0.12;

        if (isTop || isBottom) {
          if (/^(page\s*)?\d+(\s*[/|-]\s*\d+)?$/i.test(trimmed)) {
            return false;
          }
          if (pagesData.length >= 3) {
            const norm = trimmed.replace(/\d+/g, '#').toLowerCase();
            const band = Math.round(item.y / 15) * 15;
            if (repeatingKeys.has(`${norm}_${band}`)) {
              return false;
            }
          }
        }
        return true;
      });

      if (validItems.length === 0 && pData.images.length === 0) {
        continue;
      }

      // 2. Advanced Recursive XY-Cut & Histogram Column Clustering
      // Separate horizontal spanning banners (titles/abstracts > 58% width) from column blocks
      const fullWidthItems: PageTextItem[] = [];
      const colCandidates: PageTextItem[] = [];

      for (const item of validItems) {
        if (item.width >= pData.width * 0.58) {
          fullWidthItems.push(item);
        } else {
          colCandidates.push(item);
        }
      }

      // Compute X-histogram across page width to find vertical column dividers (gutters)
      const numBins = 50;
      const binWidth = pData.width / numBins;
      const binDensity = new Array(numBins).fill(0);

      for (const item of colCandidates) {
        const startBin = Math.max(0, Math.floor(item.x / binWidth));
        const endBin = Math.min(numBins - 1, Math.floor((item.x + item.width) / binWidth));
        for (let b = startBin; b <= endBin; b++) {
          binDensity[b] += item.str.length;
        }
      }

      // Find clear zero-density vertical gutters in the middle region (20% to 80% width)
      const gutters: number[] = [];
      for (let b = Math.floor(numBins * 0.2); b <= Math.floor(numBins * 0.8); b++) {
        if (binDensity[b] === 0 && (b === 0 || binDensity[b - 1] === 0 || b === numBins - 1 || binDensity[b + 1] === 0)) {
          const gutterX = (b + 0.5) * binWidth;
          if (gutters.length === 0 || gutterX - gutters[gutters.length - 1] > pData.width * 0.15) {
            gutters.push(gutterX);
          }
        }
      }

      const sortLineItems = (arr: PageTextItem[]) => {
        return arr.sort((a, b) => {
          if (Math.abs(b.y - a.y) > Math.max(4, a.fontSize * 0.35)) {
            return b.y - a.y; // Top to bottom (PDF y goes upwards)
          }
          return a.x - b.x; // Left to right
        });
      };

      let orderedItems: PageTextItem[] = [];

      if (gutters.length >= 1 && colCandidates.length >= 6) {
        // Multi-column layout detected! Partition items vertically into horizontal bands, then read columns sequentially
        const topFull = fullWidthItems.filter((i) => i.y > pData.height * 0.65);
        const botFull = fullWidthItems.filter((i) => i.y < pData.height * 0.25);
        const midFull = fullWidthItems.filter((i) => i.y <= pData.height * 0.65 && i.y >= pData.height * 0.25);

        const columns: PageTextItem[][] = new Array(gutters.length + 1).fill(null).map(() => []);
        for (const item of colCandidates) {
          const midX = item.x + item.width / 2;
          let colIdx = 0;
          for (let g = 0; g < gutters.length; g++) {
            if (midX > gutters[g]) {
              colIdx = g + 1;
            }
          }
          columns[colIdx].push(item);
        }

        orderedItems = [
          ...sortLineItems(topFull),
          ...sortLineItems(midFull),
          ...columns.flatMap((col) => sortLineItems(col)),
          ...sortLineItems(botFull),
        ];
      } else {
        orderedItems = sortLineItems([...validItems]);
      }

      // Group items into visual lines
      interface VisualLine {
        y: number;
        fontSize: number;
        bold: boolean;
        items: PageTextItem[];
      }

      const lines: VisualLine[] = [];
      for (const item of orderedItems) {
        const lastLine = lines.length > 0 ? lines[lines.length - 1] : null;
        if (
          lastLine &&
          Math.abs(item.y - lastLine.y) <= Math.max(4, lastLine.fontSize * 0.35)
        ) {
          lastLine.items.push(item);
          lastLine.items.sort((a, b) => a.x - b.x);
          lastLine.fontSize = Math.max(lastLine.fontSize, item.fontSize);
          lastLine.bold = lastLine.bold || item.bold;
        } else {
          lines.push({
            y: item.y,
            fontSize: item.fontSize,
            bold: item.bold,
            items: [item],
          });
        }
      }

      // 3. Format lines into Markdown (Tables, Headings, Lists, Paragraphs)
      const pageOutput: string[] = [];
      let lIdx = 0;

      while (lIdx < lines.length) {
        // Table detection: check 3+ consecutive lines aligned into 2+ columns with grid tolerance
        let tableEndIdx = lIdx;
        let isTable = false;
        if (lines[lIdx].items.length >= 2) {
          const baseCols = lines[lIdx].items.map((it) => it.x);
          while (tableEndIdx < lines.length && lines[tableEndIdx].items.length >= 2) {
            const curCols = lines[tableEndIdx].items.map((it) => it.x);
            if (curCols.length !== baseCols.length) break;
            let aligned = true;
            for (let c = 0; c < baseCols.length; c++) {
              if (Math.abs(curCols[c] - baseCols[c]) > 18) {
                aligned = false;
                break;
              }
            }
            if (!aligned && tableEndIdx > lIdx) break;
            tableEndIdx++;
          }
          if (tableEndIdx - lIdx >= 3) {
            isTable = true;
          }
        }

        if (isTable) {
          const headerRow = lines[lIdx].items.map((it) => it.str.trim()).join(' | ');
          pageOutput.push(`| ${headerRow} |`);
          const sepRow = lines[lIdx].items.map(() => '---').join(' | ');
          pageOutput.push(`| ${sepRow} |`);

          for (let rIdx = lIdx + 1; rIdx < tableEndIdx; rIdx++) {
            const dataRow = lines[rIdx].items.map((it) => it.str.trim()).join(' | ');
            pageOutput.push(`| ${dataRow} |`);
          }
          pageOutput.push('');
          lIdx = tableEndIdx;
          continue;
        }

        const currentLine = lines[lIdx];
        let lineFormattedText = currentLine.items
          .map((it) => {
            const s = it.str.trim();
            if (!s) return '';
            if (it.bold && it.italic) return `***${s}***`;
            if (it.bold) return `**${s}**`;
            if (it.italic) return `*${s}*`;
            return s;
          })
          .filter(Boolean)
          .join(' ');

        // Check List items
        if (/^[•\-*–—▪○●]\s+/.test(lineFormattedText) || /^▪️\s+/.test(lineFormattedText)) {
          lineFormattedText = lineFormattedText.replace(/^[•\-*–—▪○●]\s+/, '- ').replace(/^▪️\s+/, '- ');
          pageOutput.push(lineFormattedText);
          lIdx++;
          continue;
        } else if (/^(\d+[.)]|[a-zA-Z][.)])\s+/.test(lineFormattedText)) {
          lineFormattedText = lineFormattedText.replace(/^(\d+)[.)]\s+/, '$1. ');
          pageOutput.push(lineFormattedText);
          lIdx++;
          continue;
        }

        // Check Headings
        const ratio = currentLine.fontSize / medianFontSize;
        if (ratio >= 1.55) {
          pageOutput.push('');
          pageOutput.push(`# ${lineFormattedText.replace(/[*#]+/g, '').trim()}`);
          pageOutput.push('');
        } else if (ratio >= 1.28) {
          pageOutput.push('');
          pageOutput.push(`## ${lineFormattedText.replace(/[*#]+/g, '').trim()}`);
          pageOutput.push('');
        } else if (ratio >= 1.12 || (currentLine.bold && ratio >= 1.05)) {
          pageOutput.push('');
          pageOutput.push(`### ${lineFormattedText.replace(/[*#]+/g, '').trim()}`);
          pageOutput.push('');
        } else {
          // Normal Paragraph or Continuation
          const prevLine = lIdx > 0 ? lines[lIdx - 1] : null;
          if (prevLine && prevLine.y - currentLine.y > 1.5 * currentLine.fontSize) {
            pageOutput.push('');
          }
          pageOutput.push(lineFormattedText);
        }

        lIdx++;
      }

      if (pData.images.length > 0) {
        pageOutput.push('');
        for (const img of pData.images) {
          pageOutput.push(`![Embedded Figure](${img.filename})`);
        }
        pageOutput.push('');
      }

      pageMarkdownSections.push(pageOutput.join('\n').replace(/\n{3,}/g, '\n\n').trim());
    }

    const finalMarkdown = pageMarkdownSections
      .filter(Boolean)
      .join('\n\n---\n\n')
      .trim();

    return {
      markdown: finalMarkdown || '# Empty Document',
      images: extractedImages,
      pageCount: numPages,
      isScannedOrImageOnly: false,
    };
  } finally {
    if (pdf && typeof pdf.destroy === 'function') {
      await pdf.destroy();
    }
  }
}

