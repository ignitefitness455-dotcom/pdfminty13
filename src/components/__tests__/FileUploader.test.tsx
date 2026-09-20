import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { FileUploader } from '../FileUploader';

describe('FileUploader', () => {
  it('renders title and subtitle', () => {
    render(
      <FileUploader
        onFilesSelected={() => {}}
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('dropzone is keyboard accessible with role=button', () => {
    render(<FileUploader onFilesSelected={() => {}} title="Upload" />);
    const dropzone = screen.getByRole('button', { name: /Upload.*Press Enter/i });
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('shows error when file type is unsupported', () => {
    render(
      <FileUploader
        onFilesSelected={() => {}}
        accept="application/pdf"
        title="Upload"
      />
    );
    const input = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    const fakeFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [fakeFile] } });
    expect(screen.getByText(/unsupported|Unsupported/i)).toBeInTheDocument();
  });

  it('shows error when file exceeds size limit', () => {
    render(
      <FileUploader
        onFilesSelected={() => {}}
        accept="application/pdf"
        maxSizeMB={1}
        title="Upload"
      />
    );
    const input = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    const largeContent = new Uint8Array(2 * 1024 * 1024);
    const header = new TextEncoder().encode('%PDF-1.4');
    largeContent.set(header, 0);
    const fakeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fakeFile] } });
    expect(screen.getByText(/too large/i)).toBeInTheDocument();
  });

  it('calls onFilesSelected with valid PDF', async () => {
    const onFilesSelected = vi.fn();
    render(
      <FileUploader
        onFilesSelected={onFilesSelected}
        accept="application/pdf"
        title="Upload"
      />
    );
    const input = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    const fakePdf = new File(['%PDF-1.4 content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fakePdf] } });
    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledWith([fakePdf]);
    });
  });

  it('resets input value after selection so same file can be re-selected', () => {
    const onFilesSelected = vi.fn();
    render(
      <FileUploader
        onFilesSelected={onFilesSelected}
        accept="application/pdf"
        title="Upload"
      />
    );
    const input = document.getElementById('uploader_hidden_input') as HTMLInputElement;
    const fakePdf = new File(['%PDF-1.4 content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [fakePdf] } });
    expect(input.value).toBe('');
  });
});
