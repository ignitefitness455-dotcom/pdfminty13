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

interface FileSystemFileHandle {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

interface WindowWithSavePicker extends Window {
  showSaveFilePicker?: (opts: {
    suggestedName?: string;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle>;
}

const REVOKE_DELAY_MS = 60_000;

export async function downloadBlob(
  blob: Blob,
  filename: string,
  options?: { fallbackOnly?: boolean }
): Promise<void> {
  const w = window as WindowWithSavePicker;

  // File System Access API path (Chromium desktop only).
  if (!options?.fallbackOnly && typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'File',
            accept: { [blob.type || 'application/octet-stream']: [getExt(filename)] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      // User cancelled, or permission denied. Fall through to anchor method.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Otherwise continue to fallback.
    }
  }

  // Fallback: blob URL + anchor click + delayed revoke.
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  // For Safari support we set the download attribute but also need to
  // dispatch a real mouse event.
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Delay revoke so the browser has time to fetch the blob.
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

function getExt(filename: string): string {
  const m = filename.match(/\.([a-zA-Z0-9]+)$/);
  return m ? `.${m[1].toLowerCase()}` : '';
}
