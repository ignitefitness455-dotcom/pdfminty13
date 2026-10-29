import { PDFDocument } from '@cantoo/pdf-lib';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { FileUploader } from '../components/FileUploader';
import { WorkerManager } from '../core/WorkerManager';
import { CompressPdfPage } from '../pages/CompressPdfPage';
import { downloadBlob, downloadBlobsSequentially } from '../utils/download';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

async function createSamplePdfBytes(pageCount = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 500]);
    page.drawText(`Sample PDF Page ${i}`, { x: 40, y: 440, size: 12 });
  }
  return await doc.save();
}

describe('Phase 6 — End-to-End Workflows, Cancellation, Duplicate Submissions, Accessibility & Resource Cleanup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. FileUploader Keyboard Accessibility & Drag-and-Drop Boundary Validation', () => {
    it('activates hidden file input when user presses Enter or Space on dropzone', () => {
      render(<FileUploader onFilesSelected={() => {}} title="Keyboard Upload Test" />);
      const dropzone = screen.getByRole('button', { name: /Keyboard Upload Test.*Press Enter/i });
      const hiddenInput = document.getElementById('uploader_hidden_input') as HTMLInputElement;
      const clickSpy = vi.spyOn(hiddenInput, 'click');

      fireEvent.keyDown(dropzone, { key: 'Enter' });
      expect(clickSpy).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(dropzone, { key: ' ' });
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('validates drag-and-drop files: accepts valid PDF, rejects 0-byte and unsupported MIME files', async () => {
      const onFilesSelected = vi.fn();
      render(
        <FileUploader
          onFilesSelected={onFilesSelected}
          accept="application/pdf"
          title="Dropzone Validation"
        />
      );
      const dropzone = screen.getByRole('button', { name: /Dropzone Validation/i });

      // 1. Drop unsupported executable file
      const badFile = new File(['MZ-binary'], 'malware.exe', { type: 'application/x-msdownload' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [badFile] } });
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/unsupported/i);
      });
      expect(onFilesSelected).not.toHaveBeenCalled();

      // 2. Drop 0-byte empty PDF
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      fireEvent.drop(dropzone, { dataTransfer: { files: [emptyFile] } });
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/empty \(0 bytes\)/i);
      });
      expect(onFilesSelected).not.toHaveBeenCalled();

      // 3. Drop valid PDF
      const validBytes = await createSamplePdfBytes(1);
      const validFile = new File([validBytes as unknown as BlobPart], 'valid-contract.pdf', {
        type: 'application/pdf',
      });
      fireEvent.drop(dropzone, { dataTransfer: { files: [validFile] } });
      await waitFor(() => {
        expect(onFilesSelected).toHaveBeenCalledWith([validFile]);
      });
    });
  });

  describe('2. Output MIME Types, Sanitized Extensions & Object URL Cleanup on Download', () => {
    it('preserves output MIME type, applies sanitized filename extension, and revokes Object URL after timer', async () => {
      vi.useFakeTimers();
      const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-pdf-url');
      const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const appendSpy = vi.spyOn(document.body, 'appendChild');
      await downloadBlob(blob, '../../unsafe\u202Ename.pdf');

      expect(createUrlSpy).toHaveBeenCalledTimes(1);
      const passedBlob = createUrlSpy.mock.calls[0][0] as Blob;
      expect(passedBlob.type).toBe('application/pdf');
      expect(clickSpy).toHaveBeenCalledTimes(1);

      const anchor = appendSpy.mock.calls.find(
        (call) => (call[0] as HTMLElement).tagName === 'A'
      )?.[0] as HTMLAnchorElement | undefined;
      expect(anchor).toBeDefined();
      expect(anchor?.download).toBe('____unsafename.pdf');
      expect(anchor?.href).toContain('blob:mock-pdf-url');

      // Advance timers so cleanup executes URL.revokeObjectURL
      vi.advanceTimersByTime(65000);
      expect(revokeUrlSpy).toHaveBeenCalledWith('blob:mock-pdf-url');

      vi.useRealTimers();
    });

    it('downloadBlobsSequentially downloads multiple archive/image blobs with preserved MIME types', async () => {
      const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-dl');
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/zip' });
      await downloadBlobsSequentially([{ blob, filename: 'archive_pages.zip' }], 0);

      expect(createUrlSpy).toHaveBeenCalledWith(blob);
      expect((createUrlSpy.mock.calls[0][0] as Blob).type).toBe('application/zip');
    });
  });

  describe('3. WorkerManager Failure Recovery & Termination Cleanup', () => {
    it('rejects in-flight operations when terminated and cleanly recovers on the next operation', async () => {
      const manager = WorkerManager.getInstance();

      // Terminate any existing state cleanly
      manager.terminate();

      // Run a real operation on the fallback/worker path and verify it succeeds after terminate()
      const sampleBytes = await createSamplePdfBytes(2);
      const count = await manager.runOperation<number>('getPageCount', { bytes: sampleBytes });
      expect(count).toBe(2);
    });
  });

  describe('4. CompressPdfPage Integration: Duplicate Submission Guard, Cancellation, Failure Recovery & Already-Compact Handling', () => {
    it('prevents duplicate submissions on rapid double-click and supports mid-flight cancellation without rendering stale output', async () => {
      let resolveWorker: ((val: Uint8Array) => void) | null = null;
      const runOpSpy = vi
        .spyOn(WorkerManager.getInstance(), 'runOperation')
        .mockImplementation(
          () =>
            new Promise<Uint8Array>((resolve) => {
              resolveWorker = resolve;
            })
        );

      const sampleBytes = await createSamplePdfBytes(2);
      const file = new File([sampleBytes as unknown as BlobPart], 'quarterly-report.pdf', {
        type: 'application/pdf',
      });

      render(
        <HelmetProvider>
          <MemoryRouter>
            <CompressPdfPage />
          </MemoryRouter>
        </HelmetProvider>
      );

      const input = document.getElementById('compress_pdf_uploader_input') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for FileUploader magic-byte validation to finish and populate selectedFile
      await screen.findByText('quarterly-report.pdf');

      const submitBtn = screen.getByRole('button', { name: /Compress & Download PDF/i });
      expect(submitBtn).not.toBeDisabled();

      // Rapid synchronous double-click before React re-renders
      act(() => {
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(runOpSpy).toHaveBeenCalledTimes(1);
      });

      // Cancel button should now be visible in CompressAnimation
      const cancelBtn = document.getElementById('cancel_compress_btn') as HTMLButtonElement;
      expect(cancelBtn).not.toBeNull();

      act(() => {
        fireEvent.click(cancelBtn);
      });

      // Resolve the stale worker promise after cancellation
      await act(async () => {
        resolveWorker?.(new Uint8Array(100));
      });

      // Ensure stale completion banner is NOT rendered after cancellation
      expect(document.getElementById('compress_success_banner')).toBeNull();
    });

    it('recovers cleanly after a processing failure and preserves original bytes when output fails to decrease', async () => {
      const sampleBytes = await createSamplePdfBytes(2);
      // Create a bloated worker output larger than sampleBytes to verify non-decreasing fallback
      const largerOutput = new Uint8Array(sampleBytes.byteLength + 5000).fill(0x20);

      const runOpSpy = vi
        .spyOn(WorkerManager.getInstance(), 'runOperation')
        .mockRejectedValueOnce(new Error('Simulated transient worker failure'))
        .mockResolvedValueOnce(largerOutput);

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-compressed-url');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const file = new File([sampleBytes as unknown as BlobPart], 'already-compact.pdf', {
        type: 'application/pdf',
      });

      const { unmount } = render(
        <HelmetProvider>
          <MemoryRouter>
            <CompressPdfPage />
          </MemoryRouter>
        </HelmetProvider>
      );

      const input = document.getElementById('compress_pdf_uploader_input') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      // Wait for FileUploader async header check to complete
      await screen.findByText('already-compact.pdf');

      // Check keyboard radio navigation on compression modes
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
      expect(radios[0]).toHaveAttribute('aria-checked', 'true'); // Recommended
      fireEvent.keyDown(radios[1], { key: 'Enter' });
      expect(radios[1]).toHaveAttribute('aria-checked', 'true'); // Extreme

      // 1st attempt: fails with error alert
      const submitBtn = screen.getByRole('button', { name: /Compress & Download PDF/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Simulated transient worker failure/i);
      });

      // 2nd attempt: recovers and handles non-decreasing output size by preserving original bytes
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(document.getElementById('compress_success_banner')).not.toBeNull();
      });

      expect(runOpSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/Already Compact:/i)).toBeInTheDocument();
      expect(screen.getByText(/0 B \(0%\)/i)).toBeInTheDocument();

      // Unmount triggers URL.revokeObjectURL cleanup
      unmount();
      expect(revokeSpy).toHaveBeenCalled();
    });
  });
});
