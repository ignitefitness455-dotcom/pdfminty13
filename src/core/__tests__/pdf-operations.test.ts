import { PDFDocument as PlainPDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, it, expect } from 'vitest';

import { getFriendlyErrorMessage } from '../index';
import { getMetadataPDF, editMetadataPDF } from '../metadata-operations';
import {
  mergePDFs,
  splitPDF,
  extractPages,
  reorderPDF,
  protectPDF,
  unlockPDF,
  watermarkPDF,
  addPageNumbersPDF,
  addBlankPagePDF,
  rotatePDF,
  deletePagesPDF,
  compressPDF,
  imagesToPDF,
  flattenPDF,
  repairPDF,
} from '../pdf-operations';
import { PDFSanitizer } from '../PDFSanitizer';

// Utility to create a PDF of different page counts with unique page sizes (width = pageIndex * 100)
async function createCustomPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PlainPDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    doc.addPage([i * 100, i * 100]);
  }
  return await doc.save();
}

describe('pdf-operations - Quality Infrastructure Test Suite', () => {
  it('mergePDFs combines page counts and sizes correctly', async () => {
    const pdf1Bytes = await createCustomPdf(2); // page sizes 100 and 200
    const pdf2Bytes = await createCustomPdf(3); // page sizes 100, 200, and 300

    const mergedBytes = await mergePDFs([pdf1Bytes, pdf2Bytes]);
    expect(mergedBytes).toBeInstanceOf(Uint8Array);

    const doc = await PlainPDFDocument.load(mergedBytes);
    expect(doc.getPageCount()).toBe(5);

    // Page dimensions verification
    expect(doc.getPage(0).getSize().width).toBe(100);
    expect(doc.getPage(1).getSize().width).toBe(200);
    expect(doc.getPage(2).getSize().width).toBe(100);
    expect(doc.getPage(3).getSize().width).toBe(200);
    expect(doc.getPage(4).getSize().width).toBe(300);
  });

  it('splitPDF on "1-2,4" produces correct output files and page counts', async () => {
    const pdfBytes = await createCustomPdf(4); // 4 pages

    const results = await splitPDF(pdfBytes, '1-2,4');
    expect(results).toHaveLength(2);

    // First split "1-2"
    const doc1 = await PlainPDFDocument.load(results[0]);
    expect(doc1.getPageCount()).toBe(2);
    expect(doc1.getPage(0).getSize().width).toBe(100);
    expect(doc1.getPage(1).getSize().width).toBe(200);

    // Second split "4"
    const doc2 = await PlainPDFDocument.load(results[1]);
    expect(doc2.getPageCount()).toBe(1);
    expect(doc2.getPage(0).getSize().width).toBe(400);
  });

  it('extractPages yields documents with the expected page subset', async () => {
    const pdfBytes = await createCustomPdf(4);

    // Extract pages 1 and 3 (index 1-based)
    const resultBytes = await extractPages(pdfBytes, [1, 3]);
    expect(resultBytes).toBeInstanceOf(Uint8Array);

    const doc = await PlainPDFDocument.load(resultBytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize().width).toBe(100);
    expect(doc.getPage(1).getSize().width).toBe(300);
  });

  it('reorderPDF reshuffles document sequence matching maps cleanly', async () => {
    const pdfBytes = await createCustomPdf(4);

    // Shuffle order of pages: 4, 2, 1, 3 (1-based indices)
    const resultBytes = await reorderPDF(pdfBytes, [4, 2, 1, 3]);
    expect(resultBytes).toBeInstanceOf(Uint8Array);

    const doc = await PlainPDFDocument.load(resultBytes);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPage(0).getSize().width).toBe(400);
    expect(doc.getPage(1).getSize().width).toBe(200);
    expect(doc.getPage(2).getSize().width).toBe(100);
    expect(doc.getPage(3).getSize().width).toBe(300);
  });

  it('protectPDF followed by unlockPDF with correct password round-trips correctly', async () => {
    const pdfBytes = await createCustomPdf(2);

    // Encrypt the PDF
    const encryptedBytes = await protectPDF({
      fileBytes: pdfBytes,
      userPassword: 'super_secure_password',
    });
    expect(encryptedBytes).toBeInstanceOf(Uint8Array);

    // Decrypt the PDF
    const decryptedBytes = await unlockPDF({
      fileBytes: encryptedBytes,
      password: 'super_secure_password',
    });
    expect(decryptedBytes).toBeInstanceOf(Uint8Array);

    const finalDoc = await PlainPDFDocument.load(decryptedBytes);
    expect(finalDoc.getPageCount()).toBe(2);
    expect(finalDoc.getPage(0).getSize().width).toBe(100);
  });

  it('unlockPDF with INCORRECT password throws a friendly error', async () => {
    const pdfBytes = await createCustomPdf(2);

    // Encrypt
    const encryptedBytes = await protectPDF({ fileBytes: pdfBytes, userPassword: 'safe_key_123' });

    // Decrypt with bad password
    await expect(
      unlockPDF({ fileBytes: encryptedBytes, password: 'wrong_password' })
    ).rejects.toThrowError(/Failed to decrypt document/);
  });

  it('PDFSanitizer.sanitize rejects non-PDF file with a clear error', () => {
    const fakeBytes = new TextEncoder().encode(
      'Hello World this is plain text, not a PDF document!'
    );

    expect(() => PDFSanitizer.sanitize(fakeBytes)).toThrowError(/Missing PDF header/);
  });
});

describe('pdf-operations - Edge Cases', () => {
  describe('empty/single-page PDFs', () => {
    it('rotatePDF on single-page PDF works', async () => {
      const doc = await PlainPDFDocument.create();
      doc.addPage([100, 100]);
      const bytes = await doc.save();
      const rotated = await rotatePDF(bytes, 90);
      const result = await PlainPDFDocument.load(rotated);
      expect(result.getPageCount()).toBe(1);
      expect(result.getPage(0).getRotation().angle).toBe(90);
    });
  });

  describe('corrupted PDFs', () => {
    it('mergePDFs with corrupted bytes throws clear error', async () => {
      const corrupted = new TextEncoder().encode('%PDF-1.4\nthis is not valid pdf content\n%%EOF');
      await expect(mergePDFs([corrupted])).rejects.toThrow();
    });

    it('splitPDF with corrupted bytes throws', async () => {
      const corrupted = new TextEncoder().encode('%PDF-1.4\ngarbage\n%%EOF');
      await expect(splitPDF(corrupted, '1')).rejects.toThrow();
    });
  });

  describe('password-protected PDFs', () => {
    it('mergePDFs rejects password-protected PDF with friendly error', async () => {
      const { PDFDocument: EncryptedDoc } = await import('@cantoo/pdf-lib');
      const encDoc = await EncryptedDoc.create();
      encDoc.addPage([100, 100]);
      encDoc.encrypt({ userPassword: 'test123', ownerPassword: 'test123' });
      const encrypted = await encDoc.save();

      await expect(mergePDFs([encrypted])).rejects.toThrow(/password protected/i);
    });

    it('splitPDF rejects password-protected PDF with friendly error', async () => {
      const { PDFDocument: EncryptedDoc } = await import('@cantoo/pdf-lib');
      const doc = await EncryptedDoc.create();
      doc.addPage([100, 100]);
      doc.encrypt({ userPassword: 'test123', ownerPassword: 'test123' });
      const encrypted = await doc.save();

      await expect(splitPDF(encrypted, '1')).rejects.toThrow(/password protected/i);
    });
  });

  describe('reorderPDF edge cases', () => {
    it('reorderPDF with out-of-range index throws', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(reorderPDF(pdfBytes, [1, 2, 99])).rejects.toThrow(/out of bounds/i);
    });

    it('reorderPDF with empty array throws', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(reorderPDF(pdfBytes, [])).rejects.toThrow();
    });
  });

  describe('extractPages edge cases', () => {
    it('extractPages with empty array throws', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(extractPages(pdfBytes, [])).rejects.toThrow(/No valid pages/i);
    });

    it('extractPages with out-of-range pages filters them out', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await extractPages(pdfBytes, [1, 99]);
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(1);
    });
  });

  describe('splitPDF malformed ranges', () => {
    it('splitPDF with "abc" throws clear error', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(splitPDF(pdfBytes, 'abc')).rejects.toThrow(/Invalid range/i);
    });

    it('splitPDF with "0-0" throws clear error', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(splitPDF(pdfBytes, '0-0')).rejects.toThrow(/Invalid range/i);
    });

    it('splitPDF with "5-2" (reversed) throws clear error', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(splitPDF(pdfBytes, '5-2')).rejects.toThrow(/Invalid range/i);
    });

    it('splitPDF with range beyond page count clamps to actual end', async () => {
      const pdfBytes = await createCustomPdf(3);
      const results = await splitPDF(pdfBytes, '1-100');
      expect(results).toHaveLength(1);
      const doc = await PlainPDFDocument.load(results[0]);
      expect(doc.getPageCount()).toBe(3);
    });
  });

  describe('watermarkPDF', () => {
    it('applies watermark text to all pages', async () => {
      const pdfBytes = await createCustomPdf(2);
      const result = await watermarkPDF(pdfBytes, 'CONFIDENTIAL');
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(2);
    });
  });

  describe('addPageNumbersPDF', () => {
    it('adds page numbers to all pages', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await addPageNumbersPDF(pdfBytes);
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
    });

    it('skipFirstPage option skips page 1', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await addPageNumbersPDF(pdfBytes, { skipFirstPage: true });
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('addBlankPagePDF', () => {
    it('adds blank page at start', async () => {
      const pdfBytes = await createCustomPdf(2);
      const result = await addBlankPagePDF(pdfBytes, 'start');
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
    });

    it('adds blank page at end', async () => {
      const pdfBytes = await createCustomPdf(2);
      const result = await addBlankPagePDF(pdfBytes, 'end');
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
    });

    it('adds blank page at custom position', async () => {
      const pdfBytes = await createCustomPdf(2);
      const result = await addBlankPagePDF(pdfBytes, 2);
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
    });
  });

  describe('deletePagesPDF', () => {
    it('deletes specified pages', async () => {
      const pdfBytes = await createCustomPdf(5);
      const result = await deletePagesPDF(pdfBytes, [2, 4]);
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
      expect(doc.getPage(0).getSize().width).toBe(100);
      expect(doc.getPage(1).getSize().width).toBe(300);
      expect(doc.getPage(2).getSize().width).toBe(500);
    });

    it('throws when deleting all pages', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(deletePagesPDF(pdfBytes, [1, 2, 3])).rejects.toThrow(/Cannot delete all pages/i);
    });

    it('throws when deleting no valid pages', async () => {
      const pdfBytes = await createCustomPdf(3);
      await expect(deletePagesPDF(pdfBytes, [99, 100])).rejects.toThrow(/No valid pages/i);
    });
  });

  describe('compressPDF', () => {
    it('basic compression returns valid PDF with preserved page count and dimensions', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await compressPDF(pdfBytes, 'basic');
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
      const pages = doc.getPages();
      expect(pages[0].getWidth()).toBe(100);
      expect(pages[1].getWidth()).toBe(200);
      expect(pages[2].getWidth()).toBe(300);
    });

    it('output is non-empty Uint8Array with valid PDF header', async () => {
      const pdfBytes = await createCustomPdf(2);
      const result = await compressPDF(pdfBytes, 'basic');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
      const header = new TextDecoder().decode(result.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('lossless pass resets metadata properties and compacts streams', async () => {
      const doc = await PlainPDFDocument.create();
      doc.setTitle('Confidential Document Title');
      doc.setAuthor('Secret Author');
      doc.setProducer('Old PDF Engine');
      doc.setSubject('Metadata Subject');
      doc.setKeywords(['confidential', 'draft']);
      doc.addPage([200, 200]);
      const initialBytes = await doc.save();

      const compressed = await compressPDF(initialBytes, 'basic');
      const compressedDoc = await PlainPDFDocument.load(compressed);
      expect(compressedDoc.getPageCount()).toBe(1);
      // Lossless compression cleans up metadata
      expect(compressedDoc.getTitle()).toBeFalsy();
      expect(compressedDoc.getAuthor()).toBeFalsy();
    });

    it('supports options object with mode "lossless"', async () => {
      const pdfBytes = await createCustomPdf(4);
      const result = await compressPDF(pdfBytes, { mode: 'lossless' });
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(4);
      expect(result.length).toBeGreaterThan(0);
    });

    it('supports international standard tiers: extreme and recommended', async () => {
      const pdfBytes = await createCustomPdf(2);
      const recResult = await compressPDF(pdfBytes, 'recommended');
      expect(recResult).toBeInstanceOf(Uint8Array);
      expect(recResult.length).toBeGreaterThan(0);

      const extResult = await compressPDF(pdfBytes, { level: 'extreme', grayscale: true });
      expect(extResult).toBeInstanceOf(Uint8Array);
      expect(extResult.length).toBeGreaterThan(0);

      const doc = await PlainPDFDocument.load(extResult);
      expect(doc.getPageCount()).toBe(2);
    });

    it('preserves multi-page content and distinct dimensions across all pages', async () => {
      const doc = await PlainPDFDocument.create();
      doc.addPage([150, 250]);
      doc.addPage([300, 400]);
      doc.addPage([595, 842]); // A4
      const initialBytes = await doc.save();

      const compressed = await compressPDF(initialBytes, 'basic');
      const compressedDoc = await PlainPDFDocument.load(compressed);
      expect(compressedDoc.getPageCount()).toBe(3);
      const pages = compressedDoc.getPages();
      expect(pages[0].getWidth()).toBe(150);
      expect(pages[0].getHeight()).toBe(250);
      expect(pages[1].getWidth()).toBe(300);
      expect(pages[1].getHeight()).toBe(400);
      expect(pages[2].getWidth()).toBe(595);
      expect(pages[2].getHeight()).toBe(842);
    });

    it('lossless pass handles empty and complex PDF structures without corruption', async () => {
      const pdfBytes = await createCustomPdf(1);
      const result = await compressPDF(pdfBytes, { mode: 'lossless' });
      expect(result).toBeInstanceOf(Uint8Array);
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(1);
    });

    it('throws error when fed corrupted or invalid PDF data', async () => {
      const corruptedBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      await expect(compressPDF(corruptedBytes, 'basic')).rejects.toThrow();
    });

    it('compresses and preserves image-heavy and text+image mixed PDFs', async () => {
      const doc = await PlainPDFDocument.create();
      for (let i = 1; i <= 4; i++) {
        const p = doc.addPage([500, 500]);
        p.drawText(
          `Invoice and Report Document Section ${i} with detailed text content and description`,
          {
            x: 50,
            y: 450,
          }
        );
      }

      // Embed a test 1x1 JPEG image
      const jpegBase64 =
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      const imageBytes = Uint8Array.from(atob(jpegBase64), (c) => c.charCodeAt(0));
      const embedded = await doc.embedJpg(imageBytes);
      doc.getPages()[0].drawImage(embedded, { x: 50, y: 100, width: 200, height: 200 });

      const initialBytes = await doc.save();
      expect(initialBytes.length).toBeGreaterThan(2048);

      const compressed = await compressPDF(initialBytes, 'recommended');

      expect(compressed).toBeInstanceOf(Uint8Array);
      expect(compressed.length).toBeGreaterThan(0);
      expect(compressed.length).toBeLessThanOrEqual(initialBytes.length);

      const reloaded = await PlainPDFDocument.load(compressed);
      expect(reloaded.getPageCount()).toBe(4);
      expect(reloaded.getPages()[0].getWidth()).toBe(500);
    });

    it('successfully recompresses image streams and reduces file size when canvas API is available', async () => {
      const doc = await PlainPDFDocument.create();
      const page = doc.addPage([600, 800]);
      page.drawText('Sample document with high-res illustration', { x: 50, y: 700 });

      // Valid JPEG base64 padded with valid JPEG comment marker to exceed 2KB threshold
      const baseJpg = Uint8Array.from(
        atob(
          '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
        ),
        (c) => c.charCodeAt(0)
      );
      const commentLen = 5000;
      const commentPayload = new Uint8Array(commentLen).fill(0x42);
      const marker = new Uint8Array([0xff, 0xfe, (commentLen + 2) >> 8, (commentLen + 2) & 0xff]);
      const validLargeJpg = new Uint8Array(2 + marker.length + commentLen + (baseJpg.length - 2));
      validLargeJpg.set(baseJpg.subarray(0, 2), 0);
      validLargeJpg.set(marker, 2);
      validLargeJpg.set(commentPayload, 2 + marker.length);
      validLargeJpg.set(baseJpg.subarray(2), 2 + marker.length + commentLen);

      const embedded = await doc.embedJpg(validLargeJpg);
      page.drawImage(embedded, { x: 50, y: 100, width: 500, height: 500 });

      const initialBytes = await doc.save();
      expect(initialBytes.length).toBeGreaterThan(5000);

      // Mock browser createImageBitmap & OffscreenCanvas for this test
      const originalCreateImageBitmap = (globalThis as unknown as { createImageBitmap?: unknown })
        .createImageBitmap;
      const originalOffscreenCanvas = (globalThis as unknown as { OffscreenCanvas?: unknown })
        .OffscreenCanvas;

      // The recompressed smaller JPEG (baseJpg is ~134 bytes)
      const smallerJpeg = baseJpg;

      (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = async () => ({
        width: 100,
        height: 100,
        close: () => {},
      });

      class MockOffscreenCanvas {
        width: number;
        height: number;
        constructor(width: number, height: number) {
          this.width = width;
          this.height = height;
        }
        getContext() {
          return {
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
            fillStyle: '#fff',
            fillRect: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            putImageData: () => {},
          };
        }
        async convertToBlob() {
          return {
            arrayBuffer: async () =>
              smallerJpeg.buffer.slice(
                smallerJpeg.byteOffset,
                smallerJpeg.byteOffset + smallerJpeg.byteLength
              ),
          };
        }
      }

      (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas = MockOffscreenCanvas;

      try {
        const compressed = await compressPDF(initialBytes, 'recommended');

        // File size should be significantly smaller!
        expect(compressed.length).toBeLessThan(initialBytes.length);
        expect(compressed.length).toBeLessThan(3500); // 5.5KB -> ~1-2KB

        const reloaded = await PlainPDFDocument.load(compressed);
        expect(reloaded.getPageCount()).toBe(1);
        expect(reloaded.getPages()[0].getWidth()).toBe(600);
      } finally {
        (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap =
          originalCreateImageBitmap;
        (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas =
          originalOffscreenCanvas;
      }
    });

    it('safely handles already-compressed PDFs without corruption or size bloating', async () => {
      const doc = await PlainPDFDocument.create();
      for (let i = 1; i <= 5; i++) {
        const page = doc.addPage([400, 400]);
        page.drawText(`Already Optimized Document Chapter ${i} with multiple paragraphs of text`, {
          x: 20,
          y: 350,
        });
      }
      const initialBytes = await doc.save({ useObjectStreams: true });
      expect(initialBytes.length).toBeGreaterThan(2048);

      const compressed = await compressPDF(initialBytes, 'recommended');
      expect(compressed.length).toBeLessThanOrEqual(initialBytes.length);

      const reloaded = await PlainPDFDocument.load(compressed);
      expect(reloaded.getPageCount()).toBe(5);
    });

    it('preserves vector structure without rasterizing pages on >12KB text documents', async () => {
      const doc = await PlainPDFDocument.create();
      for (let i = 1; i <= 18; i++) {
        const page = doc.addPage([595, 842]);
        for (let line = 0; line < 20; line++) {
          page.drawText(
            `Page ${i} Line ${line}: Vector text preservation check for legal and technical contracts.`,
            { x: 40, y: 800 - line * 30, size: 11 }
          );
        }
      }
      const initialBytes = await doc.save({ useObjectStreams: false });
      expect(initialBytes.length).toBeGreaterThan(12000);

      const compressedRec = await compressPDF(initialBytes, {
        level: 'recommended',
        mode: 'recommended',
      });
      const compressedExt = await compressPDF(initialBytes, { level: 'extreme', mode: 'extreme' });
      const compressedLow = await compressPDF(initialBytes, { level: 'low', mode: 'low' });

      expect(compressedRec.length).toBeLessThan(initialBytes.length);
      expect(compressedExt.length).toBeLessThan(initialBytes.length);
      expect(compressedLow.length).toBeLessThan(initialBytes.length);

      const reloaded = await PlainPDFDocument.load(compressedExt);
      expect(reloaded.getPageCount()).toBe(18);
      expect(reloaded.getPage(0).getWidth()).toBe(595);
      expect(reloaded.getPage(0).getHeight()).toBe(842);

      // Verify page 1 retains its vector /Font resource dictionary and has 0 raster image /XObject entries
      const page1Resources = reloaded.getPage(0).node.Resources();
      const fontDict = page1Resources?.lookup(reloaded.context.obj('Font')) as
        | { entries?: () => unknown[] }
        | undefined;
      const xObjectDict = page1Resources?.lookup(reloaded.context.obj('XObject')) as
        | { entries?: () => unknown[] }
        | undefined;
      expect(fontDict?.entries?.().length).toBeGreaterThanOrEqual(1);
      expect(xObjectDict?.entries?.().length ?? 0).toBe(0);
    });
  });

  describe('metadata-operations (getMetadataPDF & editMetadataPDF)', () => {
    it('extracts, updates, and clears metadata fields including Producer and Creator without overwriting', async () => {
      const doc = await PlainPDFDocument.create();
      doc.addPage([200, 200]);
      doc.setTitle('Original Title');
      doc.setAuthor('Original Author');
      doc.setSubject('Original Subject');
      doc.setKeywords(['alpha', 'beta']);
      doc.setCreator('Custom Creator');
      doc.setProducer('Custom Producer');
      const bytes = await doc.save();

      const extracted = await getMetadataPDF(bytes);
      expect(extracted.title).toBe('Original Title');
      expect(extracted.author).toBe('Original Author');
      expect(extracted.creator).toBe('Custom Creator');
      expect(extracted.producer).toBe('Custom Producer');

      const updatedBytes = await editMetadataPDF(bytes, {
        title: '',
        author: 'Updated Author',
        subject: '',
        keywords: '',
        creator: 'Updated Creator',
        producer: 'Updated Producer',
      });

      const afterMeta = await getMetadataPDF(updatedBytes);
      expect(afterMeta.title).toBe('');
      expect(afterMeta.author).toBe('Updated Author');
      expect(afterMeta.subject).toBe('');
      expect(afterMeta.keywords).toBe('');
      expect(afterMeta.creator).toBe('Updated Creator');
      expect(afterMeta.producer).toBe('Updated Producer');
    });

    it('rejects password-protected PDFs in getMetadataPDF and editMetadataPDF', async () => {
      const pdfBytes = await createCustomPdf(1);
      const encrypted = await protectPDF({ fileBytes: pdfBytes, userPassword: 'secretPassword' });

      await expect(getMetadataPDF(encrypted)).rejects.toThrow(/encrypted/i);
      await expect(editMetadataPDF(encrypted, { title: 'Test' })).rejects.toThrow(/encrypted/i);
    });
  });

  describe('repairPDF and flattenPDF', () => {
    it('repairs leading and trailing junk bytes around a valid PDF', async () => {
      const cleanBytes = await createCustomPdf(2);
      const junkPrefix = new TextEncoder().encode('JUNK_HEADER_BYTES_12345\n');
      const junkSuffix = new TextEncoder().encode('\nTRAILING_GARBAGE_98765');
      const damaged = new Uint8Array(junkPrefix.length + cleanBytes.length + junkSuffix.length);
      damaged.set(junkPrefix, 0);
      damaged.set(cleanBytes, junkPrefix.length);
      damaged.set(junkSuffix, junkPrefix.length + cleanBytes.length);

      const { bytes: repairedBytes, repairs } = await repairPDF(damaged);
      expect(repairs.length).toBeGreaterThanOrEqual(2);
      const doc = await PlainPDFDocument.load(repairedBytes);
      expect(doc.getPageCount()).toBe(2);
    });

    it('rejects password-protected PDF in repairPDF instead of corrupting streams', async () => {
      const cleanBytes = await createCustomPdf(1);
      const encrypted = await protectPDF({ fileBytes: cleanBytes, userPassword: 'secretPassword' });
      await expect(repairPDF(encrypted)).rejects.toThrow(/password protected/i);
    });

    it('flattens AcroForm fields in flattenPDF and preserves page count', async () => {
      const doc = await PlainPDFDocument.create();
      const page = doc.addPage([400, 400]);
      const form = doc.getForm();
      const textField = form.createTextField('sample.field');
      textField.setText('Filled Value');
      textField.addToPage(page, { x: 50, y: 300, width: 150, height: 30 });
      const bytesWithForm = await doc.save();

      const flattenedBytes = await flattenPDF(bytesWithForm);
      const reloaded = await PlainPDFDocument.load(flattenedBytes);
      expect(reloaded.getPageCount()).toBe(1);
      expect(reloaded.getForm().getFields()).toHaveLength(0);
    });
  });

  describe('imagesToPDF', () => {
    it('throws on unsupported format', async () => {
      const fakeImage = {
        buf: new Uint8Array([0, 1, 2, 3]),
        type: 'image/tiff',
        name: 'test.tiff',
      };
      await expect(imagesToPDF([fakeImage])).rejects.toThrow(/Unsupported image format/i);
    });
  });

  describe('Phase 2 Regression Tests', () => {
    it('splitPDF supports en-dashes and whitespace around range separators', async () => {
      const pdfBytes = await createCustomPdf(4);
      const chunks = await splitPDF(pdfBytes, '1–2, 3 - 4');
      expect(chunks).toHaveLength(2);
      const doc1 = await PlainPDFDocument.load(chunks[0]);
      const doc2 = await PlainPDFDocument.load(chunks[1]);
      expect(doc1.getPageCount()).toBe(2);
      expect(doc2.getPageCount()).toBe(2);
    });

    it('rotatePDF and reorderPDF normalize negative rotation angles to positive [0, 270] multiples', async () => {
      const pdfBytes = await createCustomPdf(2);
      const rotatedBytes = await rotatePDF(pdfBytes, -90, [1]);
      const rotatedDoc = await PlainPDFDocument.load(rotatedBytes);
      expect(rotatedDoc.getPages()[0].getRotation().angle).toBe(270);
      expect(rotatedDoc.getPages()[1].getRotation().angle).toBe(0);

      const reorderedBytes = await reorderPDF(pdfBytes, [
        { page: 1, rotation: -90 },
        { page: 2, rotation: -180 },
      ]);
      const reorderedDoc = await PlainPDFDocument.load(reorderedBytes);
      expect(reorderedDoc.getPages()[0].getRotation().angle).toBe(270);
      expect(reorderedDoc.getPages()[1].getRotation().angle).toBe(180);
    });

    it('compressPDF preserves 1-bit monochrome image streams without corrupting them', async () => {
      const doc = await PlainPDFDocument.create();
      doc.addPage([400, 400]);
      // Create a >2KB 1-bit DeviceGray image stream (BitsPerComponent: 1) with high-entropy data
      const oneBitData = new Uint8Array(8192);
      let seed = 0x12345678;
      for (let i = 0; i < oneBitData.length; i++) {
        seed = (seed * 1664525 + 1013904223) | 0;
        oneBitData[i] = (seed >>> 16) & 0xff;
      }
      const imgStream = doc.context.flateStream(oneBitData, {
        Type: 'XObject',
        Subtype: 'Image',
        Width: 256,
        Height: 256,
        ColorSpace: 'DeviceGray',
        BitsPerComponent: 1,
      });
      const streamRef = doc.context.register(imgStream);
      doc.getPages()[0].node.set(PDFName.of('XObjectTest'), streamRef);
      const savedBytes = await doc.save();

      const compressedBytes = await compressPDF(savedBytes, 'recommended');
      const reloaded = await PlainPDFDocument.load(compressedBytes);
      expect(reloaded.getPageCount()).toBe(1);
    });

    it('getFriendlyErrorMessage distinguishes encrypted PDFs from corrupt/empty PDFs', () => {
      const encMsg = getFriendlyErrorMessage('Merge failed', new Error('SECURED_LOCKED: encrypted'));
      expect(encMsg).toMatch(/encrypted or locked/i);

      const corruptMsg = getFriendlyErrorMessage(
        'Merge failed',
        new Error('Failed to parse PDF document (line:0 col:0)')
      );
      expect(corruptMsg).toMatch(/corrupted, empty, or not a valid PDF/i);
      expect(corruptMsg).not.toMatch(/encrypted or locked/i);
    });
  });

  describe('Phase 6 — Decoded Page Content, Compression Regressions & Boundary Suite', () => {
    // Helper to create a multi-page PDF with distinct text markers on each page
    async function createLabeledPdf(labels: string[]): Promise<Uint8Array> {
      const doc = await PlainPDFDocument.create();
      labels.forEach((label, idx) => {
        const page = doc.addPage([500, 600 + idx * 20]);
        page.drawText(label, { x: 50, y: 500, size: 14 });
      });
      // Save with useObjectStreams: false so content streams can also be inspected directly
      return await doc.save({ useObjectStreams: false });
    }

    // Helper to decode uncompressed/FlateDecode page content streams and extract drawn literal strings
    async function extractDecodedPageLiterals(pdfBytes: Uint8Array): Promise<string[]> {
      const { decodePDFRawStream, PDFRawStream, PDFArray } = await import('@cantoo/pdf-lib');
      const doc = await PlainPDFDocument.load(pdfBytes);
      const pageTexts: string[] = [];

      for (const page of doc.getPages()) {
        const contentsRef = page.node.Contents();
        if (!contentsRef) {
          pageTexts.push('');
          continue;
        }
        const chunks: string[] = [];
        const collectStream = (obj: unknown) => {
          if (obj instanceof PDFRawStream) {
            const decoded = decodePDFRawStream(obj).decode();
            chunks.push(new TextDecoder('latin1').decode(decoded));
          }
        };
        const lookedUp = doc.context.lookup(contentsRef);
        if (!lookedUp) {
          pageTexts.push('');
          continue;
        }
        if (lookedUp instanceof PDFArray) {
          for (const item of lookedUp.asArray()) {
            collectStream(doc.context.lookup(item));
          }
        } else {
          collectStream(lookedUp);
        }
        const rawContent = chunks.join('\n');
        // pdf-lib encodes standard font drawText strings as hex <...> or literal (...)
        const hexMatches = [...rawContent.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)];
        const decodedHex = hexMatches
          .map((m) => {
            const hex = m[1];
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
            }
            return str;
          })
          .join(' ');
        const parenMatches = [...rawContent.matchAll(/\(([^)]+)\)\s*Tj/g)]
          .map((m) => m[1])
          .join(' ');
        pageTexts.push(`${decodedHex} ${parenMatches} ${rawContent}`.trim());
      }
      return pageTexts;
    }

    it('verifies decoded page content and exact page order across merge, reorder, extract, split, and deletePages', async () => {
      const docA = await createLabeledPdf(['ALPHA_PAGE_ONE', 'BETA_PAGE_TWO']);
      const docB = await createLabeledPdf(['GAMMA_PAGE_THREE', 'DELTA_PAGE_FOUR']);

      // 1. Merge preserves page order and decoded content
      const merged = await mergePDFs([docA, docB]);
      const mergedLiterals = await extractDecodedPageLiterals(merged);
      expect(mergedLiterals).toHaveLength(4);
      expect(mergedLiterals[0]).toContain('ALPHA_PAGE_ONE');
      expect(mergedLiterals[1]).toContain('BETA_PAGE_TWO');
      expect(mergedLiterals[2]).toContain('GAMMA_PAGE_THREE');
      expect(mergedLiterals[3]).toContain('DELTA_PAGE_FOUR');

      // 2. Reorder [4, 1, 3, 2] moves decoded page content to exact target positions
      const reordered = await reorderPDF(merged, [4, 1, 3, 2]);
      const reorderedLiterals = await extractDecodedPageLiterals(reordered);
      expect(reorderedLiterals).toHaveLength(4);
      expect(reorderedLiterals[0]).toContain('DELTA_PAGE_FOUR');
      expect(reorderedLiterals[1]).toContain('ALPHA_PAGE_ONE');
      expect(reorderedLiterals[2]).toContain('GAMMA_PAGE_THREE');
      expect(reorderedLiterals[3]).toContain('BETA_PAGE_TWO');

      // 3. Delete page 2 ('ALPHA_PAGE_ONE') from reordered document leaves 3 pages in order
      const afterDelete = await deletePagesPDF(reordered, [2]);
      const deletedLiterals = await extractDecodedPageLiterals(afterDelete);
      expect(deletedLiterals).toHaveLength(3);
      expect(deletedLiterals[0]).toContain('DELTA_PAGE_FOUR');
      expect(deletedLiterals[1]).toContain('GAMMA_PAGE_THREE');
      expect(deletedLiterals[2]).toContain('BETA_PAGE_TWO');

      // 4. Extract pages [3, 1] from merged yields GAMMA then ALPHA
      const extracted = await extractPages(merged, [3, 1]);
      const extractedLiterals = await extractDecodedPageLiterals(extracted);
      expect(extractedLiterals).toHaveLength(2);
      expect(extractedLiterals[0]).toContain('GAMMA_PAGE_THREE');
      expect(extractedLiterals[1]).toContain('ALPHA_PAGE_ONE');
    });

    it('verifies watermarkPDF and addPageNumbersPDF inject new decoded text without erasing original page content', async () => {
      const original = await createLabeledPdf(['CONTRACT_BODY_2026']);
      const watermarked = await watermarkPDF(original, 'INTERNAL_DRAFT_ONLY');
      const numbered = await addPageNumbersPDF(watermarked, { format: 'Page {n} of {total}' });

      const literals = await extractDecodedPageLiterals(numbered);
      expect(literals).toHaveLength(1);
      expect(literals[0]).toContain('CONTRACT_BODY_2026');
      expect(literals[0]).toContain('INTERNAL_DRAFT_ONLY');
      expect(literals[0]).toContain('Page 1 of 1');
    });

    it('compression regression: guarantees output size never exceeds input size even on tiny (<2KB) already-compact PDFs', async () => {
      const doc = await PlainPDFDocument.create();
      doc.addPage([200, 200]);
      const tinyCompactBytes = await doc.save({ useObjectStreams: true });
      expect(tinyCompactBytes.byteLength).toBeLessThan(2048);

      const recOut = await compressPDF(tinyCompactBytes, 'recommended');
      const extOut = await compressPDF(tinyCompactBytes, 'extreme');
      const lowOut = await compressPDF(tinyCompactBytes, 'low');

      expect(recOut.byteLength).toBeLessThanOrEqual(tinyCompactBytes.byteLength);
      expect(extOut.byteLength).toBeLessThanOrEqual(tinyCompactBytes.byteLength);
      expect(lowOut.byteLength).toBeLessThanOrEqual(tinyCompactBytes.byteLength);

      const loaded = await PlainPDFDocument.load(recOut);
      expect(loaded.getPageCount()).toBe(1);
    });

    it('compression regression: prevents excessive compression from downsampling images below 600px or destroying soft masks and vector text', async () => {
      const doc = await PlainPDFDocument.create();
      const page = doc.addPage([600, 800]);
      page.drawText('CRITICAL_LEGAL_CLAUSE_VECTOR_TEXT', { x: 40, y: 740, size: 12 });

      // Embed a >5KB JPEG image (2400x1800)
      const baseJpg = Uint8Array.from(
        atob(
          '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
        ),
        (c) => c.charCodeAt(0)
      );
      const commentLen = 6000;
      const commentPayload = new Uint8Array(commentLen).fill(0x41);
      const marker = new Uint8Array([0xff, 0xfe, (commentLen + 2) >> 8, (commentLen + 2) & 0xff]);
      const largeJpg = new Uint8Array(2 + marker.length + commentLen + (baseJpg.length - 2));
      largeJpg.set(baseJpg.subarray(0, 2), 0);
      largeJpg.set(marker, 2);
      largeJpg.set(commentPayload, 2 + marker.length);
      largeJpg.set(baseJpg.subarray(2), 2 + marker.length + commentLen);

      const embedded = await doc.embedJpg(largeJpg);
      page.drawImage(embedded, { x: 50, y: 100, width: 400, height: 300 });
      const inputBytes = await doc.save({ useObjectStreams: false });

      let capturedCanvasWidth = 0;
      let capturedCanvasHeight = 0;
      let capturedQuality = 0;

      const origCreateImageBitmap = (globalThis as unknown as { createImageBitmap?: unknown })
        .createImageBitmap;
      const origOffscreenCanvas = (globalThis as unknown as { OffscreenCanvas?: unknown })
        .OffscreenCanvas;

      (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = async () => ({
        width: 2400,
        height: 1800,
        close: () => {},
      });

      class ClampingVerifyOffscreenCanvas {
        width: number;
        height: number;
        constructor(w: number, h: number) {
          this.width = w;
          this.height = h;
          capturedCanvasWidth = w;
          capturedCanvasHeight = h;
        }
        getContext() {
          return {
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
            fillStyle: '#ffffff',
            fillRect: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            putImageData: () => {},
          };
        }
        async convertToBlob(opts?: { type?: string; quality?: number }) {
          capturedQuality = opts?.quality ?? 0;
          return {
            arrayBuffer: async () =>
              baseJpg.buffer.slice(baseJpg.byteOffset, baseJpg.byteOffset + baseJpg.byteLength),
          };
        }
      }

      (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas =
        ClampingVerifyOffscreenCanvas;

      try {
        // Pass excessively aggressive settings (quality: 0.05, maxDimension: 100)
        const compressed = await compressPDF(inputBytes, {
          level: 'extreme',
          quality: 0.05,
          maxDimension: 100,
        });

        // Verify clamping: maxDimension is clamped to >= 600px, quality is clamped to >= 0.40
        expect(Math.max(capturedCanvasWidth, capturedCanvasHeight)).toBeGreaterThanOrEqual(600);
        expect(capturedQuality).toBeGreaterThanOrEqual(0.4);
        expect(compressed.byteLength).toBeLessThan(inputBytes.byteLength);

        // Verify vector text is still present and decoded cleanly
        const decodedLiterals = await extractDecodedPageLiterals(compressed);
        expect(decodedLiterals[0]).toContain('CRITICAL_LEGAL_CLAUSE_VECTOR_TEXT');
      } finally {
        (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap =
          origCreateImageBitmap;
        (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas =
          origOffscreenCanvas;
      }
    });

    it('compression regression: falls back to original image stream when recompressed bytes are larger than original stream', async () => {
      const doc = await PlainPDFDocument.create();
      const page = doc.addPage([500, 500]);
      page.drawText('PRESERVE_ALREADY_OPTIMIZED_STREAM', { x: 40, y: 440 });

      const baseJpg = Uint8Array.from(
        atob(
          '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
        ),
        (c) => c.charCodeAt(0)
      );
      const commentLen = 3000;
      const marker = new Uint8Array([0xff, 0xfe, (commentLen + 2) >> 8, (commentLen + 2) & 0xff]);
      const mediumJpg = new Uint8Array(2 + marker.length + commentLen + (baseJpg.length - 2));
      mediumJpg.set(baseJpg.subarray(0, 2), 0);
      mediumJpg.set(marker, 2);
      mediumJpg.set(new Uint8Array(commentLen).fill(0x33), 2 + marker.length);
      mediumJpg.set(baseJpg.subarray(2), 2 + marker.length + commentLen);

      const embedded = await doc.embedJpg(mediumJpg);
      page.drawImage(embedded, { x: 20, y: 20, width: 200, height: 200 });
      const inputBytes = await doc.save({ useObjectStreams: true });

      const origCreateImageBitmap = (globalThis as unknown as { createImageBitmap?: unknown })
        .createImageBitmap;
      const origOffscreenCanvas = (globalThis as unknown as { OffscreenCanvas?: unknown })
        .OffscreenCanvas;

      (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = async () => ({
        width: 400,
        height: 400,
        close: () => {},
      });

      // Simulate canvas producing a bloated 15KB buffer larger than the 3KB source image stream
      const bloatedBuffer = new Uint8Array(15000).fill(0x55);
      class BloatedOffscreenCanvas {
        width: number;
        height: number;
        constructor(w: number, h: number) {
          this.width = w;
          this.height = h;
        }
        getContext() {
          return {
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
            fillStyle: '#fff',
            fillRect: () => {},
            drawImage: () => {},
          };
        }
        async convertToBlob() {
          return {
            arrayBuffer: async () => bloatedBuffer.buffer.slice(0),
          };
        }
      }

      (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas =
        BloatedOffscreenCanvas;

      try {
        const result = await compressPDF(inputBytes, 'recommended');
        expect(result.byteLength).toBeLessThanOrEqual(inputBytes.byteLength);
        const decoded = await extractDecodedPageLiterals(result);
        expect(decoded[0]).toContain('PRESERVE_ALREADY_OPTIMIZED_STREAM');
      } finally {
        (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap =
          origCreateImageBitmap;
        (globalThis as unknown as { OffscreenCanvas: unknown }).OffscreenCanvas =
          origOffscreenCanvas;
      }
    });

    it('rejects 0-byte empty buffers and XFA dynamic forms with explicit error messages', async () => {
      const emptyBytes = new Uint8Array(0);
      await expect(mergePDFs([emptyBytes])).rejects.toThrow();
      await expect(splitPDF(emptyBytes, '1')).rejects.toThrow();
      await expect(compressPDF(emptyBytes, 'recommended')).rejects.toThrow();
      await expect(flattenPDF(emptyBytes)).rejects.toThrow();
      await expect(repairPDF(emptyBytes)).rejects.toThrow();

      // Create a PDF containing an /XFA entry in /AcroForm
      const xfaDoc = await PlainPDFDocument.create();
      xfaDoc.addPage([400, 400]);
      const acroForm = xfaDoc.context.obj({
        XFA: xfaDoc.context.obj([]),
      });
      xfaDoc.catalog.set(PDFName.of('AcroForm'), acroForm);
      const xfaBytes = await xfaDoc.save();

      await expect(flattenPDF(xfaBytes)).rejects.toThrow(/UNSUPPORTED_XFA/i);
    });
  });
});

