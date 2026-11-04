import { PDFDocument } from '@cantoo/pdf-lib';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as coreIndex from '../core/index';
import { WorkerManager } from '../core/WorkerManager';
import { OcrPdfPage } from '../pages/OcrPdfPage';

async function createSamplePdfBytes(pageCount = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 500]);
    page.drawText(`Scanned OCR Test Page ${i}`, { x: 40, y: 440, size: 12 });
  }
  return await doc.save();
}

async function createEncryptedPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 500]);
  page.drawText('Confidential Scan', { x: 40, y: 440, size: 12 });
  doc.encrypt({
    userPassword: 'secret',
    ownerPassword: 'secret',
    permissions: { printing: 'highResolution' },
  });
  return await doc.save();
}

describe('Tool #23: OCR PDF (/ocr-pdf/) — Privacy Consent Gate, Batch Worker Rendering, Encrypted PDF Recovery & Proxy MIME', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-ocr-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enforces explicit opt-in consent gate and sends PNG image with preserved MIME type to /api/gemini-proxy', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: '# Invoice Summary\n\n| Item | Total |\n| --- | --- |\n| Consulting | $500 |',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    render(
      <HelmetProvider>
        <MemoryRouter>
          <OcrPdfPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const imageFile = new File([pngBytes], 'receipt.png', { type: 'image/png' });
    const hiddenInput = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [imageFile] } });

    await screen.findByText('receipt.png');

    const submitBtn = screen.getByRole('button', { name: /Extract Text with AI Vision/i });
    expect(submitBtn).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();

    // Check explicit Cloud AI Vision consent checkbox
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('/api/gemini-proxy');
    const parsedBody = JSON.parse(String(calledInit?.body));
    expect(parsedBody.mode).toBe('ocr');
    expect(parsedBody.imagesBase64).toHaveLength(1);
    expect(parsedBody.imagesBase64[0]).toMatch(/^data:image\/png;base64,/);

    const textarea = await screen.findByLabelText('Transcribed OCR text output');
    expect((textarea as HTMLTextAreaElement).value).toContain('# Invoice Summary');
  });

  it('batches multi-page PDF OCR into a single pdfToImage worker call with pageNumbers array (OCR-01)', async () => {
    // Mock getPdfJs so 3 page thumbnails render cleanly in jsdom
    vi.spyOn(coreIndex, 'getPdfJs').mockResolvedValue({
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 3,
          getPage: async () => ({
            getViewport: () => ({ width: 200, height: 280 }),
            render: () => ({ promise: Promise.resolve() }),
            cleanup: () => {},
          }),
          destroy: async () => {},
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof coreIndex.getPdfJs>>);

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
      cb(new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }));
    });

    const runOpSpy = vi.spyOn(WorkerManager.getInstance(), 'runOperation').mockResolvedValue([
      { page: 1, imageBytes: new Uint8Array([0xff, 0xd8, 0x01]) },
      { page: 2, imageBytes: new Uint8Array([0xff, 0xd8, 0x02]) },
      { page: 3, imageBytes: new Uint8Array([0xff, 0xd8, 0x03]) },
    ]);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: 'Page 1-3 Extracted Markdown',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const pdfBytes = await createSamplePdfBytes(3);
    const pdfFile = new File([pdfBytes as unknown as BlobPart], 'scanned-contract.pdf', {
      type: 'application/pdf',
    });

    render(
      <HelmetProvider>
        <MemoryRouter>
          <OcrPdfPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const hiddenInput = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [pdfFile] } });

    await screen.findByText('scanned-contract.pdf');
    const selectBatchBtn = await screen.findByRole('button', { name: /Select Batch \(3\)/i });
    fireEvent.click(selectBatchBtn);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Extract Text with AI Vision/i }));

    await waitFor(() => {
      expect(runOpSpy).toHaveBeenCalledTimes(1);
    });

    expect(runOpSpy.mock.calls[0][0]).toBe('pdfToImage');
    const workerPayload = runOpSpy.mock.calls[0][1] as { pageNumbers?: number[]; maxPages?: number };
    expect(workerPayload.pageNumbers).toEqual([1, 2, 3]);
    expect(workerPayload.maxPages).toBe(3);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    const sentBody = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(sentBody.imagesBase64).toHaveLength(3);
  });

  it('detects password-protected PDFs and displays a direct link to Unlock PDF (OCR-03)', async () => {
    const encryptedBytes = await createEncryptedPdfBytes();
    const encryptedFile = new File([encryptedBytes as unknown as BlobPart], 'locked-scan.pdf', {
      type: 'application/pdf',
    });

    render(
      <HelmetProvider>
        <MemoryRouter>
          <OcrPdfPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const hiddenInput = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [encryptedFile] } });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/password protected/i);
    const unlockLink = screen.getByRole('link', { name: /Unlock PDF/i });
    expect(unlockLink).toHaveAttribute('href', '/unlock-pdf/');
  });

  it('supports cancelling an in-flight OCR request without rendering stale results (OCR-06)', async () => {
    let resolveFetch: ((res: Response) => void) | null = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(
      <HelmetProvider>
        <MemoryRouter>
          <OcrPdfPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const imageFile = new File([pngBytes], 'slow-scan.png', { type: 'image/png' });
    const hiddenInput = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [imageFile] } });

    await screen.findByText('slow-scan.png');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Extract Text with AI Vision/i }));

    const cancelBtn = await screen.findByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await act(async () => {
      resolveFetch?.(
        new Response(JSON.stringify({ success: true, result: 'Stale OCR Text' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(screen.queryByLabelText('Transcribed OCR text output')).toBeNull();
  });
});
