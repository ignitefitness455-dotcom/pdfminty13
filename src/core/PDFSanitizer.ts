import { PDFDocument } from 'pdf-lib';

import { UPLOAD_LIMITS } from '../config/constants';

export interface SanitizeOptions {
  skipEncryptionCheck?: boolean;
}

export interface SanitizeResult {
  bytes: Uint8Array;
  warnings: string[];
}

/**
 * Validate and sanitize a PDF byte buffer.
 *
 * Validation:
 * 1. Enforce maximum file size limit.
 * 2. Check for `%PDF-` header.
 * 3. Check for `%%EOF` trailer (warning if missing).
 *
 * Sanitization (best-effort, non-destructive):
 * - Neutralize `/JavaScript`, `/JS`, `/Launch` action dictionaries by
 *   overwriting the keyword bytes with spaces.
 *
 * Encryption detection is done by the caller via `PDFSanitizer.isEncrypted`
 * (which uses pdf-lib's native `isEncrypted` property — more reliable than
 * byte-scanning, which misses encrypted dicts hidden in compressed object streams).
 */
export class PDFSanitizer {
  public static sanitize(
    bytes: Uint8Array,
    _options?: SanitizeOptions
  ): SanitizeResult {
    const warnings: string[] = [];

    if (bytes.byteLength > UPLOAD_LIMITS.MAX_SINGLE_FILE) {
      throw new Error(
        `File exceeds the maximum allowed size of ${UPLOAD_LIMITS.MAX_SINGLE_FILE / (1024 * 1024)}MB.`
      );
    }

    const headerBytes = bytes.slice(0, Math.min(200, bytes.length));
    const startStr = new TextDecoder('ascii', { fatal: false }).decode(headerBytes);
    if (!startStr.includes('%PDF-')) {
      throw new Error('This does not appear to be a valid PDF file. Missing PDF header.');
    }

    const trailerSize = Math.min(200, bytes.length);
    const trailerBytes = bytes.slice(bytes.length - trailerSize);
    const endStr = new TextDecoder('ascii', { fatal: false }).decode(trailerBytes);
    if (!endStr.includes('%%EOF')) {
      warnings.push('PDF is missing standard %%EOF marker, file might be truncated or corrupted.');
    }

    const sanitizedBytes = new Uint8Array(bytes);

    // Patterns to neutralize (longest first so /JavaScript is matched before /JS).
    const patterns: Uint8Array[] = [
      new TextEncoder().encode('/JavaScript'),
      new TextEncoder().encode('/Launch'),
      new TextEncoder().encode('/JS'),
    ];

    let neutralized = false;
    const isWordBoundary = (byte: number | undefined): boolean => {
      if (byte === undefined || Number.isNaN(byte)) return true;
      return [0x20, 0x0a, 0x0d, 0x09, 0x2f, 0x5b, 0x5d, 0x3c, 0x3e, 0x28, 0x29].includes(byte);
    };

    // Single-pass scan. Skip positions where byte isn't `/` (0x2F) — no pattern can match.
    for (let i = 0; i < sanitizedBytes.length - 3; i++) {
      if (sanitizedBytes[i] !== 0x2f) continue;

      for (const seq of patterns) {
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

        for (let j = 0; j < seq.length; j++) {
          sanitizedBytes[i + j] = 0x20;
        }
        neutralized = true;
        i += seq.length - 1;
        break;
      }
    }

    if (neutralized) {
      warnings.push('Embedded scripts or launch actions were detected and neutralized.');
    }

    return { bytes: sanitizedBytes, warnings };
  }

  /**
   * Check if a PDF is encrypted using pdf-lib's native API.
   */
  public static async isEncrypted(bytes: Uint8Array): Promise<boolean> {
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      return doc.isEncrypted;
    } catch {
      return false;
    }
  }
}
