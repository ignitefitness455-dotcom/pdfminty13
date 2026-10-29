import React from 'react';

import { logger } from './logger';

const CHUNK_RETRY_STORAGE_KEY = 'pdfminty-chunk-retry';

/**
 * In-memory lock for the current page execution lifecycle.
 * Prevents a race condition where 2+ concurrent React.lazy() components fail on
 * the same render: without this lock, the first component sets sessionStorage
 * ('pdfminty-chunk-retry' = '1') and yields at `await navigator.serviceWorker...`,
 * causing the second component (a few milliseconds later) to see sessionStorage
 * already set and immediately `throw secondError` into ErrorBoundary before
 * `window.location.reload()` completes.
 */
let isReloadingForChunkError = false;
let clearRetryKeyTimer: ReturnType<typeof setTimeout> | null = null;

export function isChunkLoadError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i.test(
    msg
  );
}

export async function purgeStaleCachesAndReload(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (
      'serviceWorker' in navigator &&
      navigator.serviceWorker &&
      typeof navigator.serviceWorker.getRegistrations === 'function'
    ) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
  } catch (swError) {
    logger.error('Failed to unregister Service Workers during chunk recovery:', swError);
  }

  try {
    if ('caches' in window && window.caches && typeof window.caches.keys === 'function') {
      const cacheKeys = await caches.keys();
      for (const cacheKey of cacheKeys) {
        await caches.delete(cacheKey);
      }
    }
  } catch (cacheError) {
    logger.error('Failed to clear CacheStorage during chunk recovery:', cacheError);
  }

  try {
    // Force the browser HTTP cache (especially mobile WebViews like Via Browser)
    // to fetch a fresh copy of the current HTML document before reloading.
    if (typeof fetch === 'function' && window.location?.href) {
      await fetch(window.location.href, {
        cache: 'reload',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      }).catch(() => {});
    }
  } catch {
    // Ignore network errors before reload
  }

  window.location.reload();
}

/**
 * Reset the in-memory reload lock (used in unit tests).
 */
export function __resetChunkRetryStateForTests(): void {
  isReloadingForChunkError = false;
  if (clearRetryKeyTimer) {
    clearTimeout(clearRetryKeyTimer);
    clearRetryKeyTimer = null;
  }
}

/**
 * Wraps React.lazy() so a failed dynamic-import (stale hashed chunk after a
 * fresh deploy — "ChunkLoadError" / "Failed to fetch dynamically imported
 * module") retries in-memory and, if still failing, triggers exactly ONE
 * coordinated cache-purging full-page reload instead of crashing into ErrorBoundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const result = await factory();
      if (typeof window !== 'undefined' && !clearRetryKeyTimer) {
        clearRetryKeyTimer = setTimeout(() => {
          try {
            sessionStorage.removeItem(CHUNK_RETRY_STORAGE_KEY);
          } catch {
            // Ignore sessionStorage errors
          }
          clearRetryKeyTimer = null;
        }, 3000);
      }
      return result;
    } catch {
      // 1. First in-memory retry after 250ms (fixes transient mobile network hiccups)
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return await factory();
      } catch {
        // 2. Clear any stale Service Worker / CacheStorage entries and try one more time in-memory
        try {
          if (typeof window !== 'undefined' && 'caches' in window && window.caches) {
            const cacheKeys = await caches.keys();
            await Promise.allSettled(cacheKeys.map((k) => caches.delete(k)));
          }
          await new Promise((resolve) => setTimeout(resolve, 350));
          return await factory();
        } catch (finalError) {
          // 3. If another chunk in this same page load has already initiated a reload,
          // suspend this lazy tree indefinitely so it never races and throws into ErrorBoundary.
          if (isReloadingForChunkError) {
            return new Promise<{ default: T }>(() => {});
          }

          let alreadyReloadedInPreviousLoad = false;
          try {
            if (typeof window !== 'undefined') {
              alreadyReloadedInPreviousLoad =
                sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY) === '1';
            }
          } catch {
            // Ignore storage access errors
          }

          if (typeof window !== 'undefined' && !alreadyReloadedInPreviousLoad) {
            isReloadingForChunkError = true;
            logger.warn(
              'Lazy chunk load failed after retries. Purging SW + caches and reloading...',
              finalError
            );
            try {
              sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, '1');
            } catch {
              // Ignore storage access errors
            }

            void purgeStaleCachesAndReload();
            return new Promise<{ default: T }>(() => {});
          }

          try {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(CHUNK_RETRY_STORAGE_KEY);
            }
          } catch {
            // Ignore
          }
          throw finalError;
        }
      }
    }
  });
}
