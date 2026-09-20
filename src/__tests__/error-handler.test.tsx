import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  scrubPII,
  setFileProcessingContext,
  updateFileProcessingContext,
  clearFileProcessingContext,
  getFileProcessingContext,
  formatBytes,
  extractFileProcessingContext,
  formatFileContextForLog,
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
  });
});
