import { Move, Download, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

interface PageItem {
  page: number; // Original 1-based page index
  dataUrl: string;
}

const parsePageSequence = (input: string, maxPages: number): number[] => {
  const result: number[] = [];
  const parts = input.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const rangeParts = trimmed.split('-');
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim(), 10);
        const end = parseInt(rangeParts[1].trim(), 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
          const step = start <= end ? 1 : -1;
          for (let i = start; step === 1 ? i <= end : i >= end; i += step) {
            if (i <= maxPages) {
              result.push(i);
            }
          }
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
        result.push(pageNum);
      }
    }
  }
  return result;
};

export const ReorderPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderingThumbnails, setRenderingThumbnails] = useState(false);
  const [items, setItems] = useState<PageItem[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const operationTokenRef = React.useRef(0);
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    urlsRef.current = items.map((item) => item.dataUrl);
  }, [items]);

  React.useEffect(() => {
    if (items.length > 0) {
      setManualInput(items.map((item) => item.page).join(', '));
    } else {
      setManualInput('');
    }
  }, [items]);

  React.useEffect(() => {
    const currentUrls = urlsRef.current;
    const token = operationTokenRef;
    return () => {
      token.current++;
      // Clean up all generated URLs when leaving page
      currentUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const myToken = ++operationTokenRef.current;
      // Revoke any existing URLs before resetting / rendering new
      items.forEach((item) => URL.revokeObjectURL(item.dataUrl));
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setItems([]);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      setRenderingThumbnails(true);
      try {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >('pdfToImage', { bytes: fileBytes, originalName: file.name, scale: 0.3 }, [
          fileBytes.buffer,
        ]);
        if (myToken !== operationTokenRef.current) return;
        const mapped = rendered.map((item) => {
          const blob = new Blob([item.imageBytes as unknown as BlobPart], { type: 'image/png' });
          return {
            page: item.page,
            dataUrl: URL.createObjectURL(blob),
          };
        });
        if (myToken !== operationTokenRef.current) return;
        setItems(mapped);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        logger.error('Failed to render previews:', err);
        setError(
          t('reorderPdf.previewWarning', { defaultValue: 'Error generating page layouts. You can still confirm standard sequencing if required.' })
        );
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingThumbnails(false);
        }
      }
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    if (draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...items];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    setItems(reordered);
    setDraggedIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (e.key === 'ArrowLeft' && index > 0) {
      const next = [...items];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      setItems(next);
      // Restore focus to the moved item.
      window.requestAnimationFrame(() => {
        const el = document.getElementById(`reorder-item-${index - 1}`);
        el?.focus();
      });
    } else if (e.key === 'ArrowRight' && index < items.length - 1) {
      const next = [...items];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      setItems(next);
      window.requestAnimationFrame(() => {
        const el = document.getElementById(`reorder-item-${index + 1}`);
        el?.focus();
      });
    }
  };

  const resetOrder = () => {
    const original = [...items].sort((a, b) => a.page - b.page);
    setItems(original);
  };

  const applyManualSequence = () => {
    if (items.length === 0) return;

    const sortedOriginals = [...items].sort((a, b) => a.page - b.page);
    const maxPageNum = sortedOriginals.length;

    const parsedPages = parsePageSequence(manualInput, maxPageNum);
    if (parsedPages.length === 0) {
      setError('Invalid page sequence. Please enter valid page numbers (e.g., 1, 3, 2, 4-6).');
      return;
    }

    const newItems: PageItem[] = [];
    parsedPages.forEach((pageNum) => {
      const originalItem = sortedOriginals.find((item) => item.page === pageNum);
      if (originalItem) {
        newItems.push({
          page: originalItem.page,
          dataUrl: originalItem.dataUrl,
        });
      }
    });

    if (newItems.length > 0) {
      setItems(newItems);
      setError(null);
    } else {
      setError('No matching pages found in the sequence.');
    }
  };

  const handleReorder = async () => {
    if (!selectedFile) return;
    if (items.length === 0) {
      setError('Please upload a PDF document with valid pages first.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const newSequence = items.map((item) => item.page); // Map visual grid to original 1-indexed page bounds

      const parsedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'reorderPDF',
        { bytes: fileBytes, newOrder: newSequence },
        [fileBytes.buffer]
      );

      const blob = new Blob([parsedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `ordered_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Reorder PDF failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to reorder document layout. Confirm pages structure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="reorder_page_container">
      <SEO slug="reorder-pdf" />
      <ToolHeader slug="reorder-pdf" limitMB={TOOL_SIZE_LIMITS['reorder-pdf'].maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <Move className="w-5 h-5 text-emerald-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['reorder-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                id="loaded_reorder_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  onClick={() => {
                    operationTokenRef.current++; // Invalidate in-flight rendering
                    items.forEach((item) => URL.revokeObjectURL(item.dataUrl));
                    setSelectedFile(null);
                    setItems([]);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="reorder_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('reorderPdf.successTitle', { defaultValue: 'Pages Reordered Successfully! Your custom PDF is ready.' })}</span>
              </div>
              {downloadUrl && (
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    id="manual_download_link"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>{t('reorderPdf.downloadReordered', { defaultValue: 'Download Reordered PDF' })}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {!selectedFile && (
            <EmptyState
              title={t('reorderPdf.emptyTitle', { defaultValue: 'Upload a PDF to reorder pages' })}
              description={t('reorderPdf.emptyDesc', { defaultValue: 'Select a document above to drag, drop, and rearrange your PDF page order.' })}
            />
          )}

          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">{t('reorderPdf.arrangeElements', { defaultValue: 'Arrange PDF Page Elements' })}</h3>
                  <p className="text-[11px] text-slate-400">
                    Drag thumbnails left or right to re-sequence. Dropping swaps the positions
                    cleanly.
                  </p>
                </div>
                {items.length > 0 && (
                  <button
                    onClick={resetOrder}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline bg-slate-50 dark:bg-slate-950/45 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto"
                  >{t('reorderPdf.resetOrder', { defaultValue: 'Reset Order' })}</button>
                )}
              </div>

              {items.length > 0 && !renderingThumbnails && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3" id="manual_reorder_container">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label htmlFor="manual-page-sequence-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('reorderPdf.manualSequence', { defaultValue: 'Manual Page Sequence' })}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      e.g., 1, 3, 2, 4-6 (Supports ranges & duplicates)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="manual-page-sequence-input"
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyManualSequence();
                        }
                      }}
                      placeholder="e.g. 1, 3, 2, 4-6"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={applyManualSequence}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                    >{t('reorderPdf.applyOrder', { defaultValue: 'Apply Order' })}</button>
                  </div>
                </div>
              )}

              {renderingThumbnails ? (
                <div
                  className="flex flex-col items-center justify-center p-12 space-y-3"
                  id="reorder_thumbnails_loader"
                >
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">{t('reorderPdf.renderingPages', { defaultValue: 'Rendering pages for workspace drag grids...' })}</p>
                </div>
              ) : items.length > 0 ? (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-6"
                  id="reorder_draggable_grid"
                  role="listbox"
                  aria-label="Reorder PDF pages. Select an item and use arrow keys to move it."
                >
                  {items.map((item, index) => {
                    const isDragging = draggedIndex === index;
                    return (
                      <div
                        key={`${item.page}-${index}`}
                        id={`reorder-item-${index}`}
                        draggable
                        onDragStart={() => setDraggedIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={() => setDraggedIndex(null)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        tabIndex={0}
                        role="option"
                        aria-selected={isDragging}
                        aria-roledescription="draggable item"
                        aria-label={`Page ${item.page}, position ${index + 1} of ${items.length}. Use left and right arrow keys to reorder.`}
                        className={`group relative aspect-[3/4] bg-slate-50 dark:bg-slate-950/40 border-2 rounded-xl p-1.5 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all select-none ${
                          isDragging
                            ? 'opacity-40 border-dashed border-emerald-500 scale-95'
                            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
                        }`}
                      >
                        {/* Sequence badge & indicator handles */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-white font-extrabold text-[10px] rounded shadow-sm">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2 z-10 p-1 rounded-md bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-400">
                          {/* Always visible drag handle, not hover-only */}
                          <span className="opacity-70 text-slate-400" aria-hidden="true">⠿</span>
                        </div>

                        <div className="w-full h-[85%] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner pointer-events-none">
                          <img
                            src={item.dataUrl}
                            alt={`Page ${item.page}`}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 px-1 font-semibold pointer-events-none">
                          <span>Original P.{item.page}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <p className="text-xs text-slate-500">{t('reorderPdf.addFilePrompt', { defaultValue: 'Add a file above to begin ordering.' })}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">{t('reorderPdf.layoutSummary', { defaultValue: 'Layout Summary' })}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Rearranging pages lets you correct scanner mistakes, adjust slide order, or prepend
              covers before merging or sending.
            </p>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-normal flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Grids run fully offline. Page indices in the top-left indicate the final assembled
                order.
              </span>
            </div>

            {items.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('reorderPdf.outputMatrix', { defaultValue: 'Output Ordering Matrix' })}</p>
                <div className="flex flex-wrap gap-1">
                  {items.map((item, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-[10px] rounded inline-flex items-center gap-1 shadow-sm"
                    >
                      <span className="text-[9px] text-slate-400">#{index + 1}:</span> P.{item.page}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleReorder}
              disabled={!selectedFile || items.length === 0 || loading}
              className={`w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-950/25 dark:disabled:text-slate-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-colors ${
                loading ? 'cursor-not-allowed opacity-80' : ''
              }`}
              id="confirm-reorder-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{t('reorderPdf.processingButton', { defaultValue: 'Reordering Assembling...' })}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('reorderPdf.reorderSaveButton', { defaultValue: 'Reorder and Save PDF' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderPdfPage;
