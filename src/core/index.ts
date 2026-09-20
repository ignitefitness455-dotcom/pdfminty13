import type * as PDFJSTypes from 'pdfjs-dist';
// ✅ FIX (Bug #1): Use Vite's static `?url` import.
// This is resolved at BUILD TIME by Vite, producing the correct hashed URL
// for the pdfjs worker bundle. It works in BOTH the main thread AND inside
// a Web Worker (nested worker case).
//
// The old code used:
//   const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
//
// That pattern is ONLY supported by Vite for files in the local source tree
// (relative paths). For node_modules paths like 'pdfjs-dist/build/pdf.worker.min.mjs',
// Vite does NOT rewrite the URL — it stays as a literal string. Inside our
// Web Worker (src/workers/pdf-worker.ts → bundled as /assets/pdf-worker-[hash].js),
// `import.meta.url` points to the worker's own URL, so the resolved URL
// became `/assets/pdfjs-dist/build/pdf.worker.min.mjs` — which does not exist.
// pdfjs then failed to spawn its sub-worker, getDocument() rejected, and
// CompressPage showed "Failed to compress document."
//
// Using `?url` is the officially recommended Vite pattern for referencing
// assets from node_modules. See: https://vitejs.dev/guide/assets.html#url-imports
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { PDFSanitizer } from './PDFSanitizer';

export { WorkerManager } from './WorkerManager';

let cachedPdfJs: typeof import('pdfjs-dist') | null = null;
let workerInitialized = false;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cachedPdfJs = null;
    workerInitialized = false;
  });
}

export const getPdfJs = async () => {
  if (cachedPdfJs) return cachedPdfJs;
  const pdfjs = await import('pdfjs-dist');

  // Worker must be initialized in exactly ONE place. Duplicate GlobalWorkerOptions.workerSrc
  // assignments across multiple page components previously caused the worker to never attach
  // correctly, hanging loadingTask.promise forever and silently dropping uploaded files.
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    workerInitialized = true;
  }

  cachedPdfJs = pdfjs;
  return pdfjs;
};

export const getFriendlyErrorMessage = (prefix: string, rawError: unknown): string => {
  const message = rawError instanceof Error ? rawError.message : String(rawError || '');
  const errorStr = message.toLowerCase();
  if (['secured_locked', '/encrypt', 'no pdf header found', 'failed to parse pdf document', 'invalid pdf', 'formaterror', 'encrypted content'].some(s => errorStr.includes(s))) {
    return `${prefix}: The file is encrypted or locked. Please use the "Unlock PDF" tool first to decrypt it.`;
  }
  if (['pdf header magic', 'missing the standard', 'header signature'].some(s => errorStr.includes(s))) {
    return `${prefix}: Incompatible file format. The file is missing a standard '%PDF' header signature.`;
  }
  if (['incorrect password', 'decrypt', 'bad decrypt'].some(s => errorStr.includes(s))) {
    return `${prefix}: Incorrect password! Please verify and try again.`;
  }
  return `${prefix}: ${message}`;
};

export function truncateTextGrapheme(text: string, maxGraphemes: number): string {
  const normalized = text.normalize('NFC');
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    let count = 0, result = '';
    for (const segment of segmenter.segment(normalized)) {
      if (count >= maxGraphemes) break;
      result += segment.segment;
      count++;
    }
    return result;
  } catch {
    return normalized.substring(0, maxGraphemes);
  }
}

export interface PreprocessResult {
  pdf: unknown;
  sanitizedBytes: Uint8Array;
}
export interface PreprocessOptions {
  skipEncryptionCheck?: boolean;
  onEncrypted?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  customLockMessage?: string;
}

export async function preprocessAndLoadPdf(file: File, options?: PreprocessOptions): Promise<PreprocessResult> {
  const arrayBuffer = await file.arrayBuffer();
  let sanitizedBytes: Uint8Array = new Uint8Array(arrayBuffer);
  try {
    const sanResult = PDFSanitizer.sanitize(sanitizedBytes, { skipEncryptionCheck: options?.skipEncryptionCheck });
    sanitizedBytes = sanResult.bytes as Uint8Array;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err || '');
    if (message.includes('SECURED_LOCKED')) {
      options?.onEncrypted?.();
      options?.showToast?.(
        options?.customLockMessage || '🔒 Secured/locked PDF detected. Please use the Unlock tool first.',
        'error'
      );
    }
    throw err;
  }
  const pdfjs = (await getPdfJs()) as typeof PDFJSTypes;
  const loadingTask = pdfjs.getDocument({ data: sanitizedBytes });
  const pdf = await loadingTask.promise;
  return { pdf, sanitizedBytes };
}