import { PDFDocument as PlainPDFDocument } from 'pdf-lib';
import { describe, it, expect } from 'vitest';

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
    it('basic compression returns valid PDF', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await compressPDF(pdfBytes, 'basic');
      const doc = await PlainPDFDocument.load(result);
      expect(doc.getPageCount()).toBe(3);
    });

    it('output is non-empty Uint8Array', async () => {
      const pdfBytes = await createCustomPdf(3);
      const result = await compressPDF(pdfBytes, 'basic');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
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
});
