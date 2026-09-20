import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';

import { getPdfJs } from '../core/index';
import { logger } from '../utils/logger';

interface LazyPDFPageProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  rotation?: number;
  scale?: number;
  onSelect?: (pageIndex: number, event?: React.MouseEvent | React.KeyboardEvent) => void;
  isSelected?: boolean;
  pageIndex?: number;
}

const PLACEHOLDER_BG = '#f1f5f9';

export const LazyPDFPage: React.FC<LazyPDFPageProps> = ({
  pdfDoc,
  pageNumber,
  rotation = 0,
  scale = 1,
  onSelect,
  isSelected = false,
  pageIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  // Observe visibility to lazy-render.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render when visible or rotation changes. Cancel any in-flight render first.
  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      await getPdfJs();
      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      // HiDPI rendering: scale backing store by devicePixelRatio, keep CSS
      // size at logical pixels (scaled by the `scale` prop).
      const dpr = window.devicePixelRatio || 1;
      const cssViewport = page.getViewport({ scale, rotation });
      const cssWidth = Math.floor(cssViewport.width);
      const cssHeight = Math.floor(cssViewport.height);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      // Cancel any previously in-flight render before starting a new one.
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore — task may have already finished.
        }
      }

      const backingViewport = page.getViewport({ scale: scale * dpr, rotation });
      const renderTask = page.render({
        canvasContext: context,
        viewport: backingViewport,
      });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
        if (!cancelled) setRendered(true);
      } catch (err: unknown) {
        // Cancellation throws — that's expected, not an error.
        const msg = err instanceof Error ? err.message : '';
        if (!msg.toLowerCase().includes('cancel')) {
          logger.error('PDF render failed:', err);
        }
      } finally {
        // Best-effort cleanup of pdfjs page resources.
        page.cleanup();
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore.
        }
        renderTaskRef.current = null;
      }
    };
  }, [visible, pdfDoc, pageNumber, rotation, scale]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={(e) => onSelect?.(pageIndex ?? pageNumber - 1, e)}
      role={onSelect ? 'button' : undefined}
      aria-pressed={onSelect ? isSelected : undefined}
      aria-label={onSelect ? `Page ${pageNumber}${isSelected ? ', selected' : ''}` : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(pageIndex ?? pageNumber - 1, e);
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className={`block ${isSelected ? 'ring-4 ring-emerald-500' : ''}`}
        style={{ background: PLACEHOLDER_BG }}
      />
      {!rendered && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
      )}
    </div>
  );
};

export default LazyPDFPage;
