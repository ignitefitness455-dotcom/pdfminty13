import fs from 'node:fs';
import path from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ErrorBoundary, SilentErrorBoundary } from '../components/ErrorBoundary';
import {
  lazyWithRetry,
  isChunkLoadError,
  __resetChunkRetryStateForTests,
} from '../utils/lazyWithRetry';

describe('Dynamic Chunk Load Resilience & Error Isolation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    __resetChunkRetryStateForTests();
  });

  afterEach(() => {
    sessionStorage.clear();
    __resetChunkRetryStateForTests();
    vi.restoreAllMocks();
  });

  it('identifies dynamic import and stale chunk load errors accurately', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://pdfminty.com/assets/RelatedBlogs-Dzp_1_AD.js'
        )
      )
    ).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Normal business logic error'))).toBe(false);
  });

  it('Layout.tsx imports RelatedBlogs and RelatedTools statically and isolates secondary widgets with SilentErrorBoundary', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/components/Layout.tsx');
    const layoutSrc = fs.readFileSync(layoutPath, 'utf8');

    expect(layoutSrc).toContain("import { RelatedBlogs } from './RelatedBlogs'");
    expect(layoutSrc).toContain("import { RelatedTools } from './RelatedTools'");
    expect(layoutSrc).not.toContain("import('./RelatedBlogs')");
    expect(layoutSrc).not.toContain("import('./RelatedTools')");
    expect(layoutSrc).toContain('<SilentErrorBoundary>');
  });

  it('SilentErrorBoundary isolates failures in secondary widgets without crashing sibling content', () => {
    const BrokenWidget: React.FC = () => {
      throw new Error('Auxiliary widget failed');
    };

    render(
      <div>
        <div data-testid="primary-content">Primary PDF Workspace</div>
        <SilentErrorBoundary>
          <BrokenWidget />
        </SilentErrorBoundary>
      </div>
    );

    expect(screen.getByTestId('primary-content')).toHaveTextContent('Primary PDF Workspace');
  });

  it('prevents concurrent failing lazy chunks from racing and throwing into ErrorBoundary while reload is in flight', async () => {
    vi.useFakeTimers();

    const failingFactoryA = vi.fn().mockRejectedValue(
      new TypeError('Failed to fetch dynamically imported module: https://pdfminty.com/assets/ChunkA.js')
    );
    const failingFactoryB = vi.fn().mockRejectedValue(
      new TypeError('Failed to fetch dynamically imported module: https://pdfminty.com/assets/RelatedBlogs-Dzp_1_AD.js')
    );

    const LazyA = lazyWithRetry(failingFactoryA);
    const LazyB = lazyWithRetry(failingFactoryB);

    render(
      <ErrorBoundary>
        <React.Suspense fallback={<div data-testid="loading-fallback">Loading...</div>}>
          <LazyA />
          <LazyB />
        </React.Suspense>
      </ErrorBoundary>
    );

    // Advance past both retry timers (250ms + 350ms)
    await vi.advanceTimersByTimeAsync(700);

    // Neither LazyA nor LazyB should have surfaced the crash screen in ErrorBoundary
    // because the first chunk initiates a reload and the second chunk is held by isReloadingForChunkError
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
    expect(sessionStorage.getItem('pdfminty-chunk-retry')).toBe('1');

    vi.useRealTimers();
  });

  it('recovers automatically on in-memory retry when a transient mobile network error resolves', async () => {
    let attempts = 0;
    const FlakyComponent = lazyWithRetry(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new TypeError('Failed to fetch dynamically imported module');
      }
      return {
        default: () => <div data-testid="recovered-view">Loaded After Retry</div>,
      };
    });

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <FlakyComponent />
      </React.Suspense>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('recovered-view')).toHaveTextContent('Loaded After Retry');
      },
      { timeout: 2000 }
    );
    expect(attempts).toBe(2);
  });
});
