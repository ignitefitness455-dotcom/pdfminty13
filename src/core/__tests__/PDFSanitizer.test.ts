import { PDFDocument } from 'pdf-lib';
import { describe, it, expect } from 'vitest';

import { PDFSanitizer } from '../PDFSanitizer';

describe('PDFSanitizer', () => {
  describe('sanitize - validation', () => {
    it('rejects non-PDF file with clear error', () => {
      const fakeBytes = new TextEncoder().encode('Hello World this is plain text!');
      expect(() => PDFSanitizer.sanitize(fakeBytes)).toThrow(/Missing PDF header/);
    });

    it('rejects oversized file', () => {
      const pdfBytes = new Uint8Array(200 * 1024 * 1024);
      const header = new TextEncoder().encode('%PDF-1.4');
      pdfBytes.set(header, 0);
      expect(() => PDFSanitizer.sanitize(pdfBytes)).toThrow(/exceeds the maximum/i);
    });

    it('warns on missing %%EOF marker', () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4\nsome content\n');
      const result = PDFSanitizer.sanitize(pdfBytes);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('%%EOF')
      );
    });

    it('accepts valid PDF without warnings', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const pdfBytes = await doc.save();
      const result = PDFSanitizer.sanitize(pdfBytes);
      expect(result.warnings).toHaveLength(0);
      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe('sanitize - script neutralization', () => {
    it('neutralizes /JavaScript actions', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const pdfBytes = await doc.save();
      const modified = new Uint8Array(pdfBytes.length + 20);
      modified.set(pdfBytes, 0);
      const jsBytes = new TextEncoder().encode('/JavaScript ');
      modified.set(jsBytes, pdfBytes.length);
      const result = PDFSanitizer.sanitize(modified);
      const resultStr = new TextDecoder('ascii', { fatal: false }).decode(result.bytes);
      expect(resultStr).not.toContain('/JavaScript');
      expect(result.warnings).toContainEqual(
        expect.stringContaining('neutralized')
      );
    });

    it('neutralizes /Launch actions', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const pdfBytes = await doc.save();
      const modified = new Uint8Array(pdfBytes.length + 20);
      modified.set(pdfBytes, 0);
      const launchBytes = new TextEncoder().encode('/Launch ');
      modified.set(launchBytes, pdfBytes.length);
      const result = PDFSanitizer.sanitize(modified);
      const resultStr = new TextDecoder('ascii', { fatal: false }).decode(result.bytes);
      expect(resultStr).not.toContain('/Launch');
    });
  });

  describe('isEncrypted', () => {
    it('returns false for non-encrypted PDF', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const pdfBytes = await doc.save();
      const result = await PDFSanitizer.isEncrypted(pdfBytes);
      expect(result).toBe(false);
    });

    it('returns true for encrypted PDF', async () => {
      const { PDFDocument: EncryptedDoc } = await import('@cantoo/pdf-lib');
      const doc = await EncryptedDoc.create();
      doc.addPage([100, 100]);
      doc.encrypt({ userPassword: 'test123', ownerPassword: 'test123' });
      const encrypted = await doc.save();
      const result = await PDFSanitizer.isEncrypted(encrypted);
      expect(result).toBe(true);
    });
  });
});
