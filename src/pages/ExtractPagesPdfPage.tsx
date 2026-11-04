import { CheckSquare, Square, Download, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getToolLimit } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

const MAX_THUMBNAIL_RENDER_BYTES = 50 * 1024 * 1024; // 50 MB threshold for PDF.js thumbnail rasterization
const MAX_INTERACTIVE_GRID_PAGES = 500;

function parseExtractPageSequence(
  input: string,
  totalPages: number
): { validPages: number[]; invalidTokens: string[] } {
  const tokens = input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const invalidTokens: string[] = [];
  const validPages: number[] = [];

  for (const token of tokens) {
    if (/^\d+\s*[-–—]\s*\d+$/.test(token)) {
      const [startStr, endStr] = token.split(/\s*[-–—]\s*/);
      const start = Number(startStr);
      const end = Number(endStr);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1 ||
        (totalPages > 0 && (start > totalPages || end > totalPages))
      ) {
        invalidTokens.push(token);
        continue;
      }
      if (start <= end) {
        for (let p = start; p <= end; p++) {
          validPages.push(p);
        }
      } else {
        for (let p = start; p >= end; p--) {
          validPages.push(p);
        }
      }
    } else if (/^-?\d+$/.test(token)) {
      const p = Number(token);
      if (!Number.isInteger(p) || p < 1 || (totalPages > 0 && p > totalPages)) {
        invalidTokens.push(token);
        continue;
      }
      validPages.push(p);
    } else {
      invalidTokens.push(token);
    }
  }

  return { validPages, invalidTokens };
}

export const ExtractPagesPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, isPro: authIsPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const isPro = Boolean(authIsPro || user?.isPro === true || user?.plan === 'pro');
  const isLoggedIn = Boolean(user);
  const currentLimits = getToolLimit('extract-pages-pdf', isPro, isLoggedIn);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderingThumbnails, setRenderingThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ page: number; dataUrl: string }[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const operationTokenRef = React.useRef(0);
  const isSubmittingRef = React.useRef<boolean>(false);
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    urlsRef.current = thumbnails.map((item) => item.dataUrl).filter(Boolean);
  }, [thumbnails]);

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  React.useEffect(() => {
    const token = operationTokenRef;
    return () => {
      token.current++;
      // Clean up all generated URLs when leaving page
      urlsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const resetFileState = () => {
    operationTokenRef.current++;
    thumbnails.forEach((item) => {
      if (item.dataUrl) URL.revokeObjectURL(item.dataUrl);
    });
    setSelectedFile(null);
    setThumbnails([]);
    setTotalPages(0);
    setSelectedPages([]);
    setRangeInput('');
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const myToken = ++operationTokenRef.current;
      // Revoke any existing URLs before resetting/rendering new
      thumbnails.forEach((item) => {
        if (item.dataUrl) URL.revokeObjectURL(item.dataUrl);
      });
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setThumbnails([]);
      setTotalPages(0);
      setSelectedPages([]);
      setRangeInput('');
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      setRenderingThumbnails(true);
      try {
        const rawBuffer = await file.arrayBuffer();
        if (myToken !== operationTokenRef.current) return;

        const countBytes = new Uint8Array(rawBuffer.slice(0));
        const docPageCount = await WorkerManager.getInstance().runOperation<number>(
          'getPageCount',
          { bytes: countBytes },
          [countBytes.buffer]
        );
        if (myToken !== operationTokenRef.current) return;
        setTotalPages(docPageCount);

        const gridCap = Math.min(docPageCount, MAX_INTERACTIVE_GRID_PAGES);

        // Skip heavy PDF.js canvas rasterization for files > 50MB to preserve Worker memory
        if (file.size > MAX_THUMBNAIL_RENDER_BYTES) {
          const placeholderGrid = Array.from({ length: gridCap }, (_, idx) => ({
            page: idx + 1,
            dataUrl: '',
          }));
          setThumbnails(placeholderGrid);
          return;
        }

        const fileBytes = new Uint8Array(rawBuffer);
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >(
          'pdfToImage',
          {
            bytes: fileBytes,
            originalName: file.name,
            scale: 0.3,
            maxPages: 50,
            format: 'image/jpeg',
          },
          [fileBytes.buffer]
        );
        if (myToken !== operationTokenRef.current) return;
        const mapped = rendered.map((item) => {
          const blob = new Blob([item.imageBytes as unknown as BlobPart], { type: 'image/jpeg' });
          return {
            page: item.page,
            dataUrl: URL.createObjectURL(blob),
          };
        });
        for (let p = mapped.length + 1; p <= gridCap; p++) {
          mapped.push({ page: p, dataUrl: '' });
        }
        setThumbnails(mapped);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        logger.error('Failed to render previews:', err);
        try {
          const fallbackBytes = new Uint8Array(await file.arrayBuffer());
          if (myToken !== operationTokenRef.current) return;
          const count = await WorkerManager.getInstance().runOperation<number>(
            'getPageCount',
            { bytes: fallbackBytes },
            [fallbackBytes.buffer]
          );
          if (myToken !== operationTokenRef.current) return;
          if (count > 0) {
            setTotalPages(count);
            const gridCap = Math.min(count, MAX_INTERACTIVE_GRID_PAGES);
            setThumbnails(
              Array.from({ length: gridCap }, (_, i) => ({ page: i + 1, dataUrl: '' }))
            );
          }
        } catch {
          // Ignore secondary error
        }
        setError(
          t('extractPages.previewWarning', {
            defaultValue:
              'Previews could not be rendered, but you can still run extraction using standard page parameters.',
          })
        );
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingThumbnails(false);
        }
      }
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setError(null);
    let next: number[];
    if (selectedPages.includes(pageNumber)) {
      next = selectedPages.filter((p) => p !== pageNumber);
    } else {
      // Preserve cherry-picked selection order as promised in the UI
      next = [...selectedPages, pageNumber];
    }
    setSelectedPages(next);
    setRangeInput(next.join(', '));
  };

  const selectAll = () => {
    if (thumbnails.length > 0) {
      const all = thumbnails.map((item) => item.page);
      setSelectedPages(all);
      setRangeInput(all.join(', '));
      setError(null);
    }
  };

  const clearSelection = () => {
    setSelectedPages([]);
    setRangeInput('');
    setError(null);
  };

  const applyRangeInput = () => {
    if (!rangeInput.trim()) {
      clearSelection();
      return;
    }
    const maxPages = totalPages || thumbnails.length;
    const { validPages, invalidTokens } = parseExtractPageSequence(rangeInput, maxPages);
    if (invalidTokens.length > 0) {
      setError(
        t('extractPages.invalidPageRange', {
          tokens: invalidTokens.join(', '),
          total: maxPages,
          defaultValue: `Invalid page number or range: ${invalidTokens.join(', ')}. Document has ${maxPages} page(s).`,
        })
      );
      return;
    }
    setSelectedPages(validPages);
    setError(null);
  };

  const handleExtract = async () => {
    if (!selectedFile || loading || isSubmittingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }

    let targetPages = selectedPages;
    const maxPages = totalPages || thumbnails.length;
    if (rangeInput.trim()) {
      const parsed = parseExtractPageSequence(rangeInput, maxPages);
      if (parsed.invalidTokens.length > 0) {
        setError(
          t('extractPages.invalidPageRange', {
            tokens: parsed.invalidTokens.join(', '),
            total: maxPages,
            defaultValue: `Invalid page number or range: ${parsed.invalidTokens.join(', ')}. Document has ${maxPages} page(s).`,
          })
        );
        return;
      }
      if (parsed.validPages.length > 0) {
        targetPages = parsed.validPages;
        setSelectedPages(targetPages);
      }
    }

    if (targetPages.length === 0) {
      setError(
        t('extractPages.selectOnePage', {
          defaultValue: 'Please select at least one page to extract.',
        })
      );
      return;
    }

    const activeToken = operationTokenRef.current;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      if (activeToken !== operationTokenRef.current) return;

      const extractedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'extractPages',
        { bytes: fileBytes, pageNumbers: targetPages },
        [fileBytes.buffer]
      );
      if (activeToken !== operationTokenRef.current) return;

      const blob = new Blob([extractedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = sanitizeDownloadFilename(`extracted_${selectedFile.name}`);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      setIsSuccess(true);
      addActivityItem({
        toolName: 'Extract Pages',
        toolId: 'extract-pages',
        fileName: selectedFile.name,
        fileSizeFormatted: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Edit',
        savings: `${targetPages.length} ${targetPages.length === 1 ? 'page' : 'pages'} extracted`,
      });
      await downloadBlob(blob, name);
    } catch (err: unknown) {
      if (activeToken !== operationTokenRef.current) return;
      logger.error('Extract error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('extractPages.extractError', {
            defaultValue: 'Failed to extract selected pages from the document.',
          })
      );
    } finally {
      isSubmittingRef.current = false;
      if (activeToken === operationTokenRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="extract_pages_page_container">
      <SEO slug="extract-pages-pdf" />
      <ToolHeader slug="extract-pages-pdf" limitMB={currentLimits.maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <CheckSquare className="w-5 h-5 text-emerald-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={currentLimits.maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                id="loaded_extract_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {totalPages > 0 ? `${totalPages} Pages` : 'PDF Document'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFileState}
                  className="min-h-[40px] shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-3.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}
          </div>

          {isSuccess && (
            <div
              className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold"
              id="extract_pages_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>
                  {t('extractPages.successTitle', {
                    defaultValue:
                      'Pages Extracted Successfully! Your custom PDF has been generated.',
                  })}
                </span>
              </div>
              {downloadUrl && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    id="manual_download_link"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer no-underline"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>
                      {t('extractPages.downloadExtracted', {
                        defaultValue: 'Download Extracted PDF',
                      })}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={resetFileState}
                    id="reset_extract_pages_btn"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <span>
                      {t('extractPages.extractAnother', { defaultValue: 'Extract Another PDF' })}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!selectedFile && (
            <EmptyState
              title={t('extractPages.emptyTitle', {
                defaultValue: 'Upload a PDF to extract pages',
              })}
              description={t('extractPages.emptyDesc', {
                defaultValue:
                  'Select a document above to view page thumbnails and cherry-pick specific pages to extract.',
              })}
            />
          )}

          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  {t('extractPages.selectPagesTitle', {
                    defaultValue: 'Select Pages for Extraction',
                  })}
                </h3>
                {thumbnails.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-slate-50 dark:bg-slate-950/40 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                    >
                      {t('extractPages.selectAll', { defaultValue: 'Select All' })}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline bg-slate-50 dark:bg-slate-950/40 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                    >
                      {t('extractPages.clearAll', { defaultValue: 'Clear All' })}
                    </button>
                  </div>
                )}
              </div>

              {!renderingThumbnails && (totalPages > 0 || thumbnails.length > 0) && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                  <label
                    htmlFor="extract-pages-range-input"
                    className="block text-[11px] font-bold text-slate-600 dark:text-slate-300"
                  >
                    {t('extractPages.rangeInputLabel', {
                      defaultValue: 'Pages or Ranges (e.g., 1, 3, 5-8):',
                    })}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="extract-pages-range-input"
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyRangeInput();
                        }
                      }}
                      placeholder="e.g. 1, 3, 5-8"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={applyRangeInput}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {t('extractPages.applySelection', { defaultValue: 'Apply' })}
                    </button>
                  </div>
                </div>
              )}

              {renderingThumbnails ? (
                <div
                  className="flex flex-col items-center justify-center p-12 space-y-3"
                  id="thumbnails_loader"
                >
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">
                    {t('extractPages.loadingPages', {
                      defaultValue: 'Loading document pages structure...',
                    })}
                  </p>
                </div>
              ) : thumbnails.length > 0 ? (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  id="thumbnails_interactive_grid"
                >
                  {thumbnails.map((item) => {
                    const isSelected = selectedPages.includes(item.page);
                    return (
                      <button
                        type="button"
                        key={item.page}
                        id={`page-thumbnail-btn-${item.page}`}
                        onClick={() => togglePageSelection(item.page)}
                        aria-pressed={isSelected}
                        className={`group relative aspect-[3/4] bg-slate-50 dark:bg-slate-950/40 border-2 rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all p-1 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400" />
                          )}
                        </div>

                        <div className="w-full h-[85%] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {item.dataUrl ? (
                            <img
                              src={item.dataUrl}
                              alt={`Page ${item.page}`}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Page {item.page}
                            </span>
                          )}
                        </div>

                        <div className="w-full flex items-center justify-center pt-1">
                          <span
                            className={`text-[10px] font-extrabold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            Page {item.page}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <p className="text-xs text-slate-500">
                    {t('extractPages.couldNotExtract', {
                      defaultValue:
                        'Could not extract individual page views for this document type.',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('extractPages.configTitle', { defaultValue: 'Extraction Config' })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unlike the standard Split tool, this lets you cherry-pick specific pages in any order
              and combine them into a single, light document.
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-normal flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Select individual thumbnails to extract. Selected order represents their output
                sequence.
              </span>
            </div>

            {selectedPages.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Target Pages Sequence ({selectedPages.length})
                </p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {selectedPages.map((page, index) => (
                    <span
                      key={`${page}-${index}`}
                      className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[10px] rounded"
                    >
                      {page}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div
                role="alert"
                className="flex items-start space-x-1.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/50 p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExtract}
              disabled={
                !selectedFile || (selectedPages.length === 0 && !rangeInput.trim()) || loading
              }
              className={`w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-950/20 dark:disabled:text-slate-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                loading ? 'cursor-not-allowed opacity-80' : ''
              }`}
              id="confirm-extract-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {t('extractPages.extractingButton', { defaultValue: 'Extracting Pages...' })}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {t('extractPages.extractButton', { defaultValue: 'Extract Pages' })} (
                    {selectedPages.length})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractPagesPdfPage;
