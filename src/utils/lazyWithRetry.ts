import React from 'react';

import { logger } from './logger';

/**
 * Wraps React.lazy() so a failed dynamic-import (stale hashed chunk after a
 * fresh deploy — "ChunkLoadError" / "Failed to fetch dynamically imported
 * module") triggers exactly ONE silent full-page reload instead of bubbling
 * up to the route's ErrorBoundary as a generic crash screen.
 *
 * Guard via sessionStorage so a genuinely broken component (real runtime
 * error, not a stale-chunk 404) doesn't cause an infinite reload loop —
 * after one retry it lets the real error surface normally.
 */
export function lazyWithRetry<T extends { default: React.ComponentType<unknown> }>(
  factory: () => Promise<T>
) {
  return React.lazy(async () => {
    try {
      const result = await factory();
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pdfminty-chunk-retry');
        }
      } catch {
        // Ignore sessionStorage errors
      }
      return result;
    } catch {
      // 1. Immediate in-memory retry (fixes transient network flakiness/race conditions)
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const retryResult = await factory();
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pdfminty-chunk-retry');
          }
        } catch {
          // Ignore
        }
        return retryResult;
      } catch (secondError) {
        // 2. If chunk load still fails (e.g. stale deployment asset 404), trigger single page reload & cache clear
        const key = 'pdfminty-chunk-retry';
        if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
          logger.warn('Lazy chunk load failed after internal retry. Cleaning SW + Cache to force reload...', secondError);
          sessionStorage.setItem(key, '1');
          
          try {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              for (const reg of regs) {
                await reg.unregister();
              }
            }
            if ('caches' in window) {
              const cacheKeys = await caches.keys();
              for (const cacheKey of cacheKeys) {
                await caches.delete(cacheKey);
              }
            }
          } catch (swError) {
            logger.error('Failed to clear SW/caches during chunk retry:', swError);
          }

          window.location.reload();
          return new Promise<T>(() => {});
        }
        
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(key);
          }
        } catch {
          // Ignore
        }
        throw secondError;
      }
    }
  });
}
