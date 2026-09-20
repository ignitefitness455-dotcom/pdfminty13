import { PDFDocument } from 'pdf-lib';

export interface MetadataPayload {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string; // Comma separated
  creator?: string;
  producer?: string;
}

export async function editMetadataPDF(bytes: Uint8Array, metadata: MetadataPayload): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      const kw = metadata.keywords.split(',').map(k => k.trim()).filter(Boolean);
      pdfDoc.setKeywords(kw);
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    return await pdfDoc.save();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('encrypted')) {
      throw new Error('This document is encrypted. Please unlock it first before editing metadata.');
    }
    throw new Error('Failed to edit PDF metadata. The file may be corrupted.');
  }
}
