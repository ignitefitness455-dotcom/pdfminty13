import { PDFDocument, PDFName } from '@cantoo/pdf-lib';

import { UPLOAD_LIMITS } from '../config/constants';

import { formatUserFriendlyErrorMessage } from './pdf-operations';
import { PDFSanitizer } from './PDFSanitizer';

export interface MetadataPayload {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string | string[]; // Comma separated string or array
  creator?: string;
  producer?: string;
}

export async function getMetadataPDF(bytes: Uint8Array): Promise<{
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}> {
  try {
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('PDF file is empty (0 bytes).');
    }
    const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes, {
      maxBytes: UPLOAD_LIMITS.PRO_MAX_SINGLE_FILE,
    });
    if (await PDFSanitizer.isEncrypted(safeBytes)) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    const pdfDoc = await PDFDocument.load(safeBytes, { updateMetadata: false });
    if (pdfDoc.isEncrypted) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    if (pdfDoc.getPageCount() === 0) {
      throw new Error('The PDF document has 0 pages.');
    }
    return {
      title: pdfDoc.getTitle() || '',
      author: pdfDoc.getAuthor() || '',
      subject: pdfDoc.getSubject() || '',
      keywords: pdfDoc.getKeywords() || '',
      creator: pdfDoc.getCreator() || '',
      producer: pdfDoc.getProducer() || '',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    throw new Error(
      formatUserFriendlyErrorMessage(err, 'Failed to read PDF metadata. The file may be corrupted.')
    );
  }
}

export async function editMetadataPDF(
  bytes: Uint8Array,
  metadata: MetadataPayload
): Promise<Uint8Array> {
  try {
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('PDF file is empty (0 bytes).');
    }
    const { bytes: safeBytes } = PDFSanitizer.sanitize(bytes, {
      maxBytes: UPLOAD_LIMITS.PRO_MAX_SINGLE_FILE,
    });
    if (await PDFSanitizer.isEncrypted(safeBytes)) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    const pdfDoc = await PDFDocument.load(safeBytes, { updateMetadata: false });
    if (pdfDoc.isEncrypted) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    if (pdfDoc.getPageCount() === 0) {
      throw new Error('The PDF document has 0 pages.');
    }

    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      const kw = Array.isArray(metadata.keywords)
        ? metadata.keywords.map((k) => k.trim()).filter(Boolean)
        : metadata.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
      pdfDoc.setKeywords(kw);
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    // Strip any stale XMP /Metadata stream from the Catalog so old author/title/tool properties do not remain leaked in XMP XML
    pdfDoc.catalog.delete(PDFName.of('Metadata'));
    pdfDoc.setModificationDate(new Date());

    return await pdfDoc.save();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      throw new Error(
        'SECURED_LOCKED: This document is encrypted. Please unlock it first before editing metadata.'
      );
    }
    throw new Error(
      formatUserFriendlyErrorMessage(err, 'Failed to edit PDF metadata. The file may be corrupted.')
    );
  }
}
