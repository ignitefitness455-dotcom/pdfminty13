import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  scrubPII,
  setFileProcessingContext,
  updateFileProcessingContext,
  clearFileProcessingContext,
  getFileProcessingContext,
  formatBytes,
  extractFileProcessingContext,
  formatFileContextForLog,
  reportErrorToTelemetry,
  FileProcessingErrorBoundary,
  FileProcessingProvider,
  useFileProcessingContext,
} from '../error-handler';

describe('error-handler', () => {
  beforeEach(() => {
    clearFileProcessingContext();
  });

  afterEach(() => {
    clearFileProcessingContext();
  });

  describe('scrubPII', () => {
    it('scrubs email addresses and phone numbers', () => {
      const input = 'Contact john.doe@example.com at 555-123-4567';
      const output = scrubPII(input);
      expect(output).toContain('[REDACTED_EMAIL]');
      expect(output).toContain('[REDACTED_PHONE]');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes nicely', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('FileProcessingContext utilities', () => {
    it('sets, updates, and retrieves global file context', () => {
      setFileProcessingContext({ fileName: 'test.pdf', fileSize: 1048576 });
      let ctx = getFileProcessingContext();
      expect(ctx?.fileName).toBe('test.pdf');
      expect(ctx?.fileSize).toBe(1048576);

      updateFileProcessingContext({ pdfVersion: '1.7', isEncrypted: false });
      ctx = getFileProcessingContext();
      expect(ctx?.pdfVersion).toBe('1.7');
      expect(ctx?.isEncrypted).toBe(false);

      const logStr = formatFileContextForLog(ctx);
      expect(logStr).toContain('File: test.pdf');
      expect(logStr).toContain('PDF Version: v1.7');

      clearFileProcessingContext();
      expect(getFileProcessingContext()).toBeNull();
    });

    it('extracts PDF version from buffer header', async () => {
      const headerText = '%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(headerText);

      const ctx = await extractFileProcessingContext(buffer, { fileName: 'sample.pdf' });
      expect(ctx.fileName).toBe('sample.pdf');
      expect(ctx.pdfVersion).toBe('1.7');
      expect(ctx.fileSizeFormatted).toBeDefined();
    });
  });

  describe('React Components and Hooks', () => {
    it('renders child when no error in FileProcessingErrorBoundary', () => {
      render(
        <FileProcessingErrorBoundary>
          <div data-testid="child">Hello World</div>
        </FileProcessingErrorBoundary>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
    });

    it('useFileProcessingContext allows updating context', () => {
      const TestConsumer: React.FC = () => {
        const { context, updateContext } = useFileProcessingContext();
        return (
          <div>
            <span data-testid="ctx-name">{context?.fileName || 'none'}</span>
            <button onClick={() => updateContext({ fileName: 'updated.pdf' })}>Update</button>
          </div>
        );
      };

      render(
        <FileProcessingProvider>
          <TestConsumer />
        </FileProcessingProvider>
      );

      expect(screen.getByTestId('ctx-name')).toHaveTextContent('none');
      fireEvent.click(screen.getByText('Update'));
      expect(screen.getByTestId('ctx-name')).toHaveTextContent('updated.pdf');
    });

    it('anonymizes fileContext and strips raw fileName from fileContextLog before sending to /api/error', () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchSpy);

      setFileProcessingContext({
        fileName: 'confidential_patient_record_2026.pdf',
        fileSize: 3 * 1024 * 1024,
        pdfVersion: '1.6',
        isEncrypted: false,
        pageCount: 12,
        processingStep: 'sanitize',
        toolName: 'Sanitize PDF',
      });

      reportErrorToTelemetry(
        'Unexpected parse error',
        'Error: Unexpected parse error\n  at worker'
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('/api/error');
      const body = JSON.parse(options.body as string);

      // Ensure raw fileName is never transmitted in either structured fileContext or stringified fileContextLog
      expect(body.fileContext.fileName).toBeUndefined();
      expect(body.fileContext.toolName).toBe('Sanitize PDF');
      expect(body.fileContextLog).not.toContain('confidential_patient_record_2026.pdf');
      expect(body.fileContextLog).toContain('Tool: Sanitize PDF');

      clearFileProcessingContext();
      vi.unstubAllGlobals();
    });

    it('scrubs oobCode and id_token and strips URL query/hash parameters from error telemetry', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchSpy);

      const originalHref = window.location.href;
      window.history.pushState(
        {},
        '',
        '/auth?mode=resetPassword&oobCode=SECRET_OOB_1234567890&id_token=EYJ_SECRET_TOKEN_987654321#token=HASH_SECRET'
      );

      const scrubbed = scrubPII(
        'Failed reset at https://pdfminty.com/auth?oobCode=SECRET_OOB_1234567890&id_token=EYJ_SECRET_TOKEN_987654321'
      );
      expect(scrubbed).not.toContain('SECRET_OOB_1234567890');
      expect(scrubbed).not.toContain('EYJ_SECRET_TOKEN_987654321');
      expect(scrubbed).toContain('oobCode=[REDACTED]');
      expect(scrubbed).toContain('id_token=[REDACTED]');

      reportErrorToTelemetry(
        'Reset failed with oobCode=SECRET_OOB_1234567890',
        'Error: Reset failed'
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body as string);

      expect(body.url).toBe(`${window.location.origin}/auth`);
      expect(body.url).not.toContain('SECRET_OOB_1234567890');
      expect(body.url).not.toContain('HASH_SECRET');
      expect(body.message).not.toContain('SECRET_OOB_1234567890');

      window.history.pushState({}, '', originalHref);
      vi.unstubAllGlobals();
    });
  });

  describe('sanitizeDownloadFilename security hardening', () => {
    it('strips path traversal, control/bidi characters, reserved device names, and caps length', async () => {
      const { sanitizeDownloadFilename } = await import('../utils/download');

      expect(sanitizeDownloadFilename('../../etc/passwd.pdf')).toBe('____etc_passwd.pdf');
      expect(sanitizeDownloadFilename('invoice\u202Efdp.exe.pdf')).toBe('invoicefdp.exe.pdf');
      expect(sanitizeDownloadFilename('CON.pdf')).toBe('_CON.pdf');
      expect(sanitizeDownloadFilename('.htaccess')).toBe('htaccess');

      const longName = `${'a'.repeat(250)}.pdf`;
      const sanitizedLong = sanitizeDownloadFilename(longName);
      expect(sanitizedLong.length).toBeLessThanOrEqual(200);
      expect(sanitizedLong.endsWith('.pdf')).toBe(true);
    });
  });
});

