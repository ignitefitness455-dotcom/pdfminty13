import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';

import { _resetPdfJsCacheForTesting, getPdfJs, WorkerManager } from '../index';
import type { PdfToMarkdownResult } from '../pdf-operations';

async function buildSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Phase 2 Worker Verification');
  doc.setAuthor('PDFMinty QA');
  doc.setSubject('Worker PDF.js & Metadata Offload');
  doc.setKeywords(['worker', 'pdfjs', 'metadata']);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page1 = doc.addPage([595, 842]);
  page1.drawText('Architectural Audit Heading', { x: 50, y: 780, size: 22, font });
  page1.drawText('Body paragraph confirming Dedicated Web Worker PDF.js parsing works.', {
    x: 50,
    y: 740,
    size: 12,
    font,
  });

  const page2 = doc.addPage([595, 842]);
  page2.drawText('Second page text content.', { x: 50, y: 780, size: 12, font });

  return await doc.save();
}

describe('TASK-P0-01 — Worker PDF.js initialization & Metadata Worker Offload', () => {
  it('initializes GlobalWorkerOptions.workerSrc to a non-empty string and registers pdfjsWorker handler in non-window contexts', async () => {
    Reflect.deleteProperty(globalThis, 'pdfjsWorker');
    _resetPdfJsCacheForTesting();

    const pdfjs = await getPdfJs({ forceNonWindowModeForTest: true });
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBeTruthy();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).not.toBe('');
    const registered = (
      globalThis as unknown as { pdfjsWorker?: { WorkerMessageHandler?: unknown } }
    ).pdfjsWorker;
    expect(registered?.WorkerMessageHandler).toBeTruthy();

    const sampleBytes = await buildSamplePdf();
    const loaded = await pdfjs.getDocument({ data: sampleBytes.slice() }).promise;
    expect(loaded.numPages).toBe(2);
    await loaded.destroy();
  });

  it('executes pdfToMarkdown cleanly through WorkerManager using in-thread PDF.js worker handler', async () => {
    const sampleBytes = await buildSamplePdf();
    const wm = WorkerManager.getInstance();
    const res = await wm.runOperation<PdfToMarkdownResult>('pdfToMarkdown', {
      bytes: sampleBytes,
      options: { extractImages: false },
    });

    expect(res.pageCount).toBe(2);
    expect(res.markdown).toContain('Architectural Audit Heading');
    expect(res.markdown).toContain('Second page text content');
  });

  it('offloads getMetadataPDF and editMetadataPDF through WorkerManager without main-thread static pdf-lib imports', async () => {
    const sampleBytes = await buildSamplePdf();
    const wm = WorkerManager.getInstance();

    const initialMeta = await wm.runOperation<{
      title: string;
      author: string;
      subject: string;
      keywords: string;
      creator: string;
      producer: string;
    }>('getMetadataPDF', { bytes: sampleBytes.slice() });

    expect(initialMeta.title).toBe('Phase 2 Worker Verification');
    expect(initialMeta.author).toBe('PDFMinty QA');
    expect(initialMeta.subject).toBe('Worker PDF.js & Metadata Offload');

    const editedBytes = await wm.runOperation<Uint8Array>('editMetadataPDF', {
      bytes: sampleBytes.slice(),
      metadata: {
        ...initialMeta,
        title: 'Updated via WorkerManager',
        author: 'Principal Architect',
      },
    });

    const updatedMeta = await wm.runOperation<{
      title: string;
      author: string;
    }>('getMetadataPDF', { bytes: editedBytes });

    expect(updatedMeta.title).toBe('Updated via WorkerManager');
    expect(updatedMeta.author).toBe('Principal Architect');
  });
});
