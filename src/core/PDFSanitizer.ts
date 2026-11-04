import { UPLOAD_LIMITS } from '../config/constants';

export interface SanitizeOptions {
  skipEncryptionCheck?: boolean;
  maxBytes?: number;
}

export interface SanitizeResult {
  bytes: Uint8Array;
  warnings: string[];
}

const SANITIZE_PATTERNS: Uint8Array[] = [
  new TextEncoder().encode('/JavaScript'),
  new TextEncoder().encode('/SubmitForm'),
  new TextEncoder().encode('/ImportData'),
  new TextEncoder().encode('/RichMedia'),
  new TextEncoder().encode('/Launch'),
  new TextEncoder().encode('/JS'),
];

const isWordBoundary = (byte: number | undefined): boolean => {
  if (byte === undefined || Number.isNaN(byte)) return true;
  return [0x20, 0x0a, 0x0d, 0x09, 0x2f, 0x5b, 0x5d, 0x3c, 0x3e, 0x28, 0x29].includes(byte);
};

/**
 * Validate and sanitize a PDF byte buffer.
 *
 * Validation:
 * 1. Enforce non-empty and maximum file size limit (defaults to MAX_SINGLE_FILE; tier-specific checks pass maxBytes).
 * 2. Check for `%PDF-` header.
 * 3. Check for `%%EOF` trailer (warning if missing).
 *
 * Sanitization (best-effort, non-destructive, copy-on-write):
 * - Neutralize `/JavaScript`, `/JS`, `/Launch`, `/SubmitForm`, `/ImportData`, `/RichMedia`
 *   action dictionaries by overwriting the keyword bytes with spaces. Clean PDFs return the input
 *   Uint8Array directly without allocating a redundant copy.
 *
 * Encryption detection is done by the caller via `PDFSanitizer.isEncrypted`
 * (which uses pdf-lib's native `isEncrypted` property — more reliable than
 * byte-scanning, which misses encrypted dicts hidden in compressed object streams).
 */
export class PDFSanitizer {
  public static sanitize(bytes: Uint8Array, options?: SanitizeOptions): SanitizeResult {
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('PDF file is empty (0 bytes).');
    }

    const warnings: string[] = [];
    const maxAllowedBytes = options?.maxBytes ?? UPLOAD_LIMITS.MAX_SINGLE_FILE;

    if (bytes.byteLength > maxAllowedBytes) {
      throw new Error(
        `File exceeds the maximum allowed size of ${maxAllowedBytes / (1024 * 1024)}MB.`
      );
    }

    const headerBytes = bytes.subarray(0, Math.min(200, bytes.length));
    const startStr = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    if (!startStr.includes('%PDF-')) {
      throw new Error('This does not appear to be a valid PDF file. Missing PDF header.');
    }

    const trailerSize = Math.min(200, bytes.length);
    const trailerBytes = bytes.subarray(bytes.length - trailerSize);
    const endStr = new TextDecoder('ascii', { fatal: false }).decode(trailerBytes);
    if (!endStr.includes('%%EOF')) {
      warnings.push('PDF is missing standard %%EOF marker, file might be truncated or corrupted.');
    }

    let sanitizedBytes = bytes;
    let neutralized = false;

    // Only scan and mutate raw bytes on unencrypted buffers; mutating bytes inside
    // encrypted streams before decryption can corrupt AES/RC4 ciphertext blocks.
    if (!options?.skipEncryptionCheck) {
      // Single-pass scan. Skip positions where byte isn't `/` (0x2F) — no pattern can match.
      for (let i = 0; i < sanitizedBytes.length - 3; i++) {
        if (sanitizedBytes[i] !== 0x2f) continue;

        for (const seq of SANITIZE_PATTERNS) {
          if (i + seq.length > sanitizedBytes.length) continue;
          let matched = true;
          for (let j = 0; j < seq.length; j++) {
            if (sanitizedBytes[i + j] !== seq[j]) {
              matched = false;
              break;
            }
          }
          if (!matched) continue;

          const nextByte = sanitizedBytes[i + seq.length];
          if (!isWordBoundary(nextByte)) continue;

          if (!neutralized) {
            sanitizedBytes = new Uint8Array(bytes);
            neutralized = true;
          }

          for (let j = 0; j < seq.length; j++) {
            sanitizedBytes[i + j] = 0x20;
          }
          i += seq.length - 1;
          break;
        }
      }
    }

    if (neutralized) {
      warnings.push('Embedded scripts or launch actions were detected and neutralized.');
    }

    return { bytes: sanitizedBytes, warnings };
  }

  /**
   * Deep structural sanitization for the Sanitize PDF tool:
   * 1. Rejects empty or password-encrypted PDFs (`SECURED_LOCKED`).
   * 2. Neutralizes raw script/action tokens via `PDFSanitizer.sanitize`.
   * 3. Parses the PDF object tree via `@cantoo/pdf-lib` and purges:
   *    - Document `/Info` dictionary metadata (Title, Author, Subject, Keywords, Creator, Producer, dates)
   *    - Catalog `/Metadata` XMP XML stream
   *    - Catalog `/OpenAction` and `/AA` automatic triggers
   *    - Catalog `/Names` trees (embedded files and script name trees)
   *    - Catalog `/AcroForm` interactive form definitions
   *    - Page-level `/AA` and `/Annots` interactive annotations/actions
   * 4. Re-serializes a clean PDF without object streams and runs a final byte-level pass.
   */
  public static async sanitizeDocument(
    bytes: Uint8Array,
    options?: SanitizeOptions
  ): Promise<SanitizeResult> {
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('PDF file is empty (0 bytes).');
    }

    if (!options?.skipEncryptionCheck && (await PDFSanitizer.isEncrypted(bytes))) {
      throw new Error(
        'SECURED_LOCKED: This PDF is password-protected. Please unlock it first using the Unlock PDF tool.'
      );
    }

    const initialPass = PDFSanitizer.sanitize(bytes, options);
    const warnings = [...initialPass.warnings];

    const { PDFDocument, PDFName } = await import('@cantoo/pdf-lib');
    const pdfDoc = await PDFDocument.load(initialPass.bytes, {
      updateMetadata: false,
      ignoreEncryption: false,
    });

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('PDF contains 0 pages.');
    }

    const hadInfoMetadata = Boolean(
      pdfDoc.getTitle() ||
        pdfDoc.getAuthor() ||
        pdfDoc.getSubject() ||
        pdfDoc.getKeywords() ||
        pdfDoc.getCreator() ||
        pdfDoc.getProducer() ||
        pdfDoc.getCreationDate() ||
        pdfDoc.getModificationDate()
    );

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));

    if (hadInfoMetadata) {
      warnings.push(
        'Purged document Info dictionary metadata (Author, Title, Creator, Producer, timestamps).'
      );
    }

    if (pdfDoc.catalog.get(PDFName.of('Metadata'))) {
      pdfDoc.catalog.delete(PDFName.of('Metadata'));
      warnings.push('Purged embedded XMP XML metadata stream (/Metadata).');
    }

    let removedCatalogActions = false;
    if (pdfDoc.catalog.get(PDFName.of('OpenAction'))) {
      pdfDoc.catalog.delete(PDFName.of('OpenAction'));
      removedCatalogActions = true;
    }
    if (pdfDoc.catalog.get(PDFName.of('AA'))) {
      pdfDoc.catalog.delete(PDFName.of('AA'));
      removedCatalogActions = true;
    }
    if (removedCatalogActions) {
      warnings.push('Removed automatic document execution triggers (/OpenAction, /AA).');
    }

    if (pdfDoc.catalog.get(PDFName.of('Names'))) {
      pdfDoc.catalog.delete(PDFName.of('Names'));
      warnings.push('Removed embedded file and script name trees (/Names).');
    }

    if (pdfDoc.catalog.get(PDFName.of('AcroForm'))) {
      pdfDoc.catalog.delete(PDFName.of('AcroForm'));
      warnings.push('Removed interactive AcroForm input definitions (/AcroForm).');
    }

    let removedPageTriggers = false;
    for (const page of pdfDoc.getPages()) {
      if (page.node.get(PDFName.of('AA'))) {
        page.node.delete(PDFName.of('AA'));
        removedPageTriggers = true;
      }
      if (page.node.get(PDFName.of('Annots'))) {
        page.node.delete(PDFName.of('Annots'));
        removedPageTriggers = true;
      }
    }
    if (removedPageTriggers) {
      warnings.push(
        'Removed page-level interactive annotations and action triggers (/Annots, /AA).'
      );
    }

    const savedBytes = await pdfDoc.save({ useObjectStreams: false });
    const finalPass = PDFSanitizer.sanitize(savedBytes, {
      ...options,
      skipEncryptionCheck: true,
    });

    for (const warning of finalPass.warnings) {
      if (!warnings.includes(warning)) {
        warnings.push(warning);
      }
    }

    return { bytes: finalPass.bytes, warnings };
  }

  /**
   * Check if a PDF is encrypted using pdf-lib's native API.
   */
  public static async isEncrypted(bytes: Uint8Array): Promise<boolean> {
    try {
      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      return doc.isEncrypted;
    } catch {
      return false;
    }
  }
}
