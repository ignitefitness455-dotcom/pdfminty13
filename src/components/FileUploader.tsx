import { Upload, File, AlertCircle, ShieldCheck } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { extractFileProcessingContext } from '../error-handler';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  maxSizeMB?: number;
  icon?: React.ComponentType<{ className?: string }>;
  id?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = '.pdf,application/pdf',
  multiple = false,
  title,
  subtitle,
  maxSizeMB = 50,
  icon: IconComponent = Upload,
  id,
}) => {
  const { t } = useTranslation('common');
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayTitle =
    title || t('fileUploader.dragDrop', { defaultValue: 'Drag and drop your files here' });
  const displaySubtitle =
    subtitle || t('fileUploader.orBrowse', { defaultValue: 'or click to browse from your device' });

  const processFiles = useCallback(
    async (filesList: FileList | null) => {
      if (!filesList || filesList.length === 0) return;
      setError(null);

      const validFiles: File[] = [];
      const expectedTypes = accept.split(',').map((t) => t.trim());
      const limitBytes = maxSizeMB * 1024 * 1024;

      const rejectedFiles: { name: string; reason: string }[] = [];

      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];

        // 1. Validate file format (extension + MIME type)
        const matchesType = expectedTypes.some((type) => {
          if (type === 'application/pdf' || type === '.pdf') {
            return (
              file.type === 'application/pdf' ||
              file.type === 'application/x-pdf' ||
              file.type === 'application/acrobat' ||
              file.name.toLowerCase().endsWith('.pdf')
            );
          }
          if (type === 'image/png') {
            return file.type === 'image/png' || /\.png$/i.test(file.name);
          }
          if (type === 'image/jpeg' || type === 'image/jpg') {
            return file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name);
          }
          if (type === 'image/webp') {
            return file.type === 'image/webp' || /\.webp$/i.test(file.name);
          }
          if (type === 'image/gif') {
            return file.type === 'image/gif' || /\.gif$/i.test(file.name);
          }
          if (type === 'image/bmp') {
            return file.type === 'image/bmp' || /\.bmp$/i.test(file.name);
          }
          if (type === 'image/avif') {
            return file.type === 'image/avif' || /\.avif$/i.test(file.name);
          }
          if (type === 'image/heic') {
            return file.type === 'image/heic' || /\.heic$/i.test(file.name);
          }
          if (type === 'image/heif') {
            return file.type === 'image/heif' || /\.heif$/i.test(file.name);
          }
          // Generic image/* fallback — accept any image type.
          if (type === 'image/*' || type === 'image/') {
            return file.type.startsWith('image/');
          }
          return true;
        });

        if (!matchesType) {
          rejectedFiles.push({
            name: file.name,
            reason: `Unsupported file format. Expected: ${accept}`,
          });
          continue;
        }

        // 2. Validate maximum file size limit
        if (file.size > limitBytes) {
          rejectedFiles.push({
            name: file.name,
            reason: `too large (${(file.size / 1024 / 1024).toFixed(2)} MB, max ${maxSizeMB} MB)`,
          });
          continue;
        }

        // 3. For PDFs only, validate magic bytes (%PDF header).
        const isPdfExpected = expectedTypes.some((t) => t.includes('pdf') || t === '.pdf');
        if (
          isPdfExpected &&
          (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) &&
          file.size >= 4
        ) {
          try {
            const slice = file.slice(0, 100);
            const buf = new Uint8Array(await slice.arrayBuffer());
            let isPdfHeader = false;
            for (let j = 0; j <= buf.length - 4; j++) {
              if (buf[j] === 0x25 && buf[j + 1] === 0x50 && buf[j + 2] === 0x44 && buf[j + 3] === 0x46) {
                isPdfHeader = true;
                break;
              }
            }
            if (!isPdfHeader && buf.length >= 4) {
              rejectedFiles.push({
                name: file.name,
                reason: 'file does not have a valid PDF header (%PDF)',
              });
              continue;
            }
          } catch {
            // If we can't read the slice, let downstream handler process it.
          }
        }

        validFiles.push(file);
      }

      if (rejectedFiles.length > 0) {
        if (rejectedFiles.length === 1) {
          setError(`"${rejectedFiles[0].name}" rejected: ${rejectedFiles[0].reason}.`);
        } else {
          const first = rejectedFiles[0];
          setError(
            `${rejectedFiles.length} files rejected. First: "${first.name}" (${first.reason}).`
          );
        }
      }

      if (validFiles.length > 0) {
        // Register the primary file context for debugging any subsequent operation errors
        extractFileProcessingContext(validFiles[0]).catch(() => {});
        if (!multiple) {
          onFilesSelected([validFiles[0]]);
        } else {
          onFilesSelected(validFiles);
        }
      }
    },
    [accept, maxSizeMB, multiple, onFilesSelected]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      await processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      await processFiles(e.target.files);
      // Reset value so selecting the same file again (e.g. retry after error)
      // still fires onChange.
      e.target.value = '';
    },
    [processFiles]
  );

  const triggerInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter and Space both activate the file picker, matching native button behavior.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerInputClick();
      }
    },
    [triggerInputClick]
  );

  return (
    <div className="w-full flex flex-col space-y-3" id={id || 'file_uploader_wrapper'}>
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t('fileUploader.clientSide', { defaultValue: '🔒 Client-Side In-Browser Processing' })}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
          {t('fileUploader.localMemory', { defaultValue: 'Local Browser Memory Only' })}
        </span>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${displayTitle}. ${displaySubtitle}. ${t('fileUploader.browseAria', { defaultValue: 'Press Enter or Space to browse.' })}`}
        aria-disabled={false}
        id="uploader_dropzone"
        className={`relative w-full border-2 border-dashed rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50/40 shadow-inner'
            : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
          id={id ? `${id}_input` : 'uploader_hidden_input'}
          aria-label={t('fileUploader.inputAria', { defaultValue: 'File input' })}
        />

        <div
          className={`p-4 rounded-full mb-4 transition-transform duration-200 ${
            isDragActive
              ? 'bg-emerald-100 text-emerald-600 scale-110'
              : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:scale-105'
          }`}
          aria-hidden="true"
        >
          <IconComponent className="w-8 h-8" />
        </div>

        <h3 className="font-semibold text-slate-800 text-base md:text-lg mb-1">{displayTitle}</h3>
        <p className="text-slate-500 text-sm mb-2">{displaySubtitle}</p>
        <span className="inline-flex py-1 px-3 rounded-md bg-white border border-slate-200 text-xs text-slate-500 font-medium group-hover:border-emerald-200 group-hover:text-emerald-700">
          {t('fileUploader.maxSize', { size: maxSizeMB, defaultValue: `Max file size: ${maxSizeMB}MB` })}
        </span>
      </div>

      {error && (
        <div
          className="flex items-center space-x-2 p-3.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-800 text-xs font-semibold shadow-sm"
          id="uploader_error"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
