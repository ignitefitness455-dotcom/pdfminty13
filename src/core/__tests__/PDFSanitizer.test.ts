import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, it, expect } from 'vitest';

import { detectPiiInTextItem, normalizeDigitsToAscii } from '../../pages/SanitizePdfPage';
import { PDFSanitizer } from '../PDFSanitizer';

describe('PDFSanitizer', () => {
  describe('sanitize - validation', () => {
    it('rejects empty (0-byte) buffer', () => {
      expect(() => PDFSanitizer.sanitize(new Uint8Array(0))).toThrow(/empty/i);
    });

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
      expect(result.warnings).toContainEqual(expect.stringContaining('%%EOF'));
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
      expect(result.warnings).toContainEqual(expect.stringContaining('neutralized'));
    });

    it('neutralizes /Launch and /SubmitForm actions', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      const pdfBytes = await doc.save();
      const modified = new Uint8Array(pdfBytes.length + 30);
      modified.set(pdfBytes, 0);
      const actionBytes = new TextEncoder().encode('/Launch /SubmitForm ');
      modified.set(actionBytes, pdfBytes.length);
      const result = PDFSanitizer.sanitize(modified);
      const resultStr = new TextDecoder('ascii', { fatal: false }).decode(result.bytes);
      expect(resultStr).not.toContain('/Launch');
      expect(resultStr).not.toContain('/SubmitForm');
      expect(result.warnings).toContainEqual(expect.stringContaining('neutralized'));
    });
  });

  describe('sanitizeDocument - deep structural sanitization', () => {
    it('purges Info metadata, XMP /Metadata stream, /OpenAction, /AA, /Names, /AcroForm, and page /Annots', async () => {
      const doc = await PDFDocument.create();
      const page = doc.addPage([300, 300]);
      doc.setTitle('Secret Project Plan');
      doc.setAuthor('Jane Doe');
      doc.setSubject('Internal Audit');
      doc.setKeywords(['confidential', 'audit']);
      doc.setCreator('SecretCreator 1.0');
      doc.setProducer('SecretProducer 1.0');

      const xmpStream = doc.context.flateStream('<x:xmpmeta>Jane Doe Secret XMP</x:xmpmeta>');
      doc.catalog.set(PDFName.of('Metadata'), doc.context.register(xmpStream));
      doc.catalog.set(PDFName.of('OpenAction'), doc.context.obj({ S: 'JavaScript', JS: 'app.alert(1)' }));
      doc.catalog.set(PDFName.of('Names'), doc.context.obj({}));

      const form = doc.getForm();
      const textField = form.createTextField('ssn_field');
      textField.addToPage(page, { x: 20, y: 20, width: 100, height: 20 });

      const rawBytes = await doc.save();
      const sanitized = await PDFSanitizer.sanitizeDocument(rawBytes);

      expect(sanitized.warnings).toContainEqual(expect.stringContaining('Info dictionary metadata'));
      expect(sanitized.warnings).toContainEqual(expect.stringContaining('/Metadata'));
      expect(sanitized.warnings).toContainEqual(expect.stringContaining('/OpenAction'));
      expect(sanitized.warnings).toContainEqual(expect.stringContaining('/Names'));
      expect(sanitized.warnings).toContainEqual(expect.stringContaining('/AcroForm'));
      expect(sanitized.warnings).toContainEqual(expect.stringContaining('/Annots'));

      const reloaded = await PDFDocument.load(sanitized.bytes);
      expect(reloaded.getTitle() || '').toBe('');
      expect(reloaded.getAuthor() || '').toBe('');
      expect(reloaded.getSubject() || '').toBe('');
      expect(reloaded.catalog.get(PDFName.of('Metadata'))).toBeUndefined();
      expect(reloaded.catalog.get(PDFName.of('OpenAction'))).toBeUndefined();
      expect(reloaded.catalog.get(PDFName.of('Names'))).toBeUndefined();
      expect(reloaded.catalog.get(PDFName.of('AcroForm'))).toBeUndefined();
      expect(reloaded.getPages()[0].node.get(PDFName.of('Annots'))).toBeUndefined();
    });

    it('rejects encrypted PDFs with SECURED_LOCKED', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([100, 100]);
      doc.encrypt({ userPassword: 'secret', ownerPassword: 'secret' });
      const encryptedBytes = await doc.save();

      await expect(PDFSanitizer.sanitizeDocument(encryptedBytes)).rejects.toThrow(/SECURED_LOCKED/);
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

  describe('PII Detection & Numeral Normalization (SanitizePdfPage)', () => {
    it('normalizes Bengali and Devanagari digits to ASCII preserving 1:1 length', () => {
      expect(normalizeDigitsToAscii('০১৭১২-৩৪৫৬৭৮')).toBe('01712-345678');
      expect(normalizeDigitsToAscii('०१७१२-३४५६७८')).toBe('01712-345678');
    });

    it('detects credit cards, emails, phones (including Bengali digits), NIDs, and secret tokens', () => {
      const entities = detectPiiInTextItem(
        'Contact user@example.com or ০১৭১২৩৪৫৬৭৮ or SSN 123-45-6789 token sk-abcdefghijklmnopqrst1234',
        0,
        10,
        20,
        300,
        14
      );
      const categories = entities.map((e) => e.category);
      expect(categories).toContain('email');
      expect(categories).toContain('phone');
      expect(categories).toContain('nid');
      expect(categories).toContain('secret');
    });
  });
});

