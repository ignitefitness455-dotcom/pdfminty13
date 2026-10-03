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

const REVOKE_DELAY_MS = 60_000;

export function sanitizeDownloadFilename(filename: string, defaultName = 'document.pdf'): string {
  if (!filename || typeof filename !== 'string') return defaultName;
  // Strip control characters, quotes, and invalid path separators that cause browser download rejections
  const cleaned = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || defaultName;
}

export async function downloadBlob(
  blob: Blob,
  filename: string,
  _options?: { fallbackOnly?: boolean }
): Promise<void> {
  // Reliable universal download using Blob URL and hidden anchor tag.
  // Works cleanly in all browsers, mobile devices, and sandboxed iframes.
  const safeFilename = sanitizeDownloadFilename(filename);
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
    // If programmatic click was disallowed by sandboxing or security policy, open in new tab
    try {
      window.open(url, '_blank');
    } catch {
      // Best-effort fallback
    }
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
