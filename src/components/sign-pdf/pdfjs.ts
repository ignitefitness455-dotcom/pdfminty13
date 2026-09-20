import type { PDFDocumentProxy } from 'pdfjs-dist';

import { getPdfJs as getCorePdfJs } from '../../core/index';

import type { PageInfo } from './types';

type PdfJs = typeof import('pdfjs-dist');

export function getPdfJs(): Promise<PdfJs> {
  return getCorePdfJs() as Promise<PdfJs>;
}

export async function loadPdfDocument(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  // pdf.js transfers the buffer to the worker, so hand it a copy
  const task = pdfjs.getDocument({ data: bytes.slice(0) });
  return task.promise;
}

export async function readPageInfos(doc: PDFDocumentProxy): Promise<PageInfo[]> {
  const infos: PageInfo[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    infos.push({
      index: i - 1,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate,
    });
  }
  return infos;
}

/**
 * Render a page onto a canvas at the given CSS width. Uses devicePixelRatio for crisp output.
 */
export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  signal?: { cancelled: boolean }
) {
  const page = await doc.getPage(pageIndex + 1);
  if (signal?.cancelled) return;
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth / base.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const viewport = page.getViewport({ scale: scale * dpr });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${(cssWidth * base.height) / base.width}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const task = page.render({ canvasContext: ctx, viewport });
  try {
    await task.promise;
  } catch (err) {
    if ((err as { name?: string })?.name !== 'RenderingCancelledException') throw err;
  }
}
