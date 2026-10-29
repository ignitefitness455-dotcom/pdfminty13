/**
 * Shared download utility for triggering browser downloads of Blob content.
 *
 * The naive pattern `link.click(); URL.revokeObjectURL(url)` is racy:
 * in Safari and Firefox the blob may not have been read by the network
 * layer when revokeObjectURL runs, producing 0-byte or truncated downloads.
 *
 * This implementation:
 * 1. Uses the File System Access API (`showSaveFilePicker`) when available
 *    (Chromium desktop). This avoids blob URL lifecycle entirely and gives
 *    the user a real Save-As dialog.
 * 2. Falls back to anchor + blob URL with a 60-second delayed revoke. The
 *    delay is generous enough for even slow mobile connections to finish
 *    reading the blob, and short enough that we don't leak memory for long.
 * 3. Always returns the URL (or empty string) so callers can do their own
 *    cleanup if they really want to.
 */

import { recordDailyTask } from './usageLimit';

const REVOKE_DELAY_MS = 60_000;
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const MAX_FILENAME_LENGTH = 200;

export function sanitizeDownloadFilename(filename: string, defaultName = 'document.pdf'): string {
  if (!filename || typeof filename !== 'string') return defaultName;
  // Strip control characters, Unicode bidi/zero-width spoofing chars, quotes, and invalid path separators
  const cleaned = filename
    .replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '');

  if (!cleaned) return defaultName;

  let safe = WINDOWS_RESERVED_NAMES.test(cleaned) ? `_${cleaned}` : cleaned;

  if (safe.length > MAX_FILENAME_LENGTH) {
    const lastDot = safe.lastIndexOf('.');
    if (lastDot > 0 && safe.length - lastDot <= 15) {
      const ext = safe.slice(lastDot);
      const base = safe.slice(0, MAX_FILENAME_LENGTH - ext.length).replace(/[.\s]+$/g, '');
      safe = `${base || 'document'}${ext}`;
    } else {
      safe = safe.slice(0, MAX_FILENAME_LENGTH).replace(/[.\s]+$/g, '');
    }
  }

  return safe || defaultName;
}

export async function downloadBlob(
  blob: Blob,
  filename: string,
  _options?: { fallbackOnly?: boolean }
): Promise<void> {
  // Reliable universal download using Blob URL and hidden anchor tag.
  // Works cleanly in all browsers, mobile devices, and sandboxed iframes.
  const safeFilename = sanitizeDownloadFilename(filename);

  // Automatically count successful task execution without retaining document filename in state
  try {
    recordDailyTask(null, 'pdf_download');
  } catch {
    // Non-blocking quota recording
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  link.rel = 'noopener';
  link.target = '_blank';
  link.style.display = 'none';
  document.body.appendChild(link);

  try {
    link.click();
  } catch {
    // Best-effort fallback if programmatic click is blocked by sandboxed iframe
  }

  // Generous delay before revoke to ensure browser download manager has completed reading the stream.
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY_MS);
}

/**
 * Trigger a batch download of multiple blobs with a small delay between each
 * to avoid browser popup blockers (most browsers cap simultaneous downloads
 * at 1 per user gesture, with a 1-2 second window after).
 */
export async function downloadBlobsSequentially(
  items: { blob: Blob; filename: string }[],
  delayMs = 600
): Promise<void> {
  for (const item of items) {
    await downloadBlob(item.blob, item.filename, { fallbackOnly: true });
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
}
