import {
  Trash2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
  Download,
} from 'lucide-react';
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

function parseDeletePageSelection(
  input: string,
  totalPages: number
): { validPages: number[]; invalidTokens: string[] } {
  const tokens = input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const invalidTokens: string[] = [];
  const validPages: number[] = [];
  const seen = new Set<number>();

  for (const token of tokens) {
    if (/^\d+\s*[-–—]\s*\d+$/.test(token)) {
      const [startStr, endStr] = token.split(/\s*[-–—]\s*/);
      const start = Number(startStr);
      const end = Number(endStr);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < start ||
        (totalPages > 0 && end > totalPages)
      ) {
        invalidTokens.push(token);
        continue;
      }
      for (let p = start; p <= end; p++) {
        if (!seen.has(p)) {
          seen.add(p);
          validPages.push(p);
        }
      }
    } else if (/^-?\d+$/.test(token)) {
      const p = Number(token);
      if (!Number.isInteger(p) || p < 1 || (totalPages > 0 && p > totalPages)) {
        invalidTokens.push(token);
        continue;
      }
      if (!seen.has(p)) {
        seen.add(p);
        validPages.push(p);
      }
    } else {
      invalidTokens.push(token);
    }
  }

  return { validPages, invalidTokens };
}

export const DeletePagesPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, isPro: authIsPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const isPro = Boolean(authIsPro || user?.isPro === true || user?.plan === 'pro');
  const isLoggedIn = Boolean(user);
  const currentLimits = getToolLimit('delete-pages-pdf', isPro, isLoggedIn);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pagesStr, setPagesStr] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [renderingThumbnails, setRenderingThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ page: number; dataUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const operationTokenRef = React.useRef(0);
  const isSubmittingRef = React.useRef<boolean>(false);
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    urlsRef.current = thumbnails.map((t) => t.dataUrl).filter(Boolean);
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
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const myToken = ++operationTokenRef.current;
      thumbnails.forEach((t) => {
        if (t.dataUrl) URL.revokeObjectURL(t.dataUrl);
      });
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setPagesStr('');
      setThumbnails([]);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      let docPageCount = 0;
      try {
        const countBuffer = await file.arrayBuffer();
        const countBytes = new Uint8Array(countBuffer);
        if (myToken !== operationTokenRef.current) return;
        // Get page count independently of thumbnail rendering so manual deletion
        // still works even if pdfToImage fails. Pass transferable buffer to avoid structured-clone duplication.
        docPageCount = await WorkerManager.getInstance().runOperation<number>(
          'getPageCount',
          { bytes: countBytes },
          [countBytes.buffer]
        );
        if (myToken !== operationTokenRef.current) return;
        setTotalPages(docPageCount);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        const message = err instanceof Error ? err.message : 'Failed to read PDF.';
        setError(
          t('deletePages.readError', { message, defaultValue: `Failed to read PDF: ${message}` })
        );
        setTotalPages(0);
        return;
      }

      // Skip heavy PDF.js canvas rasterization for files > 50MB to preserve Worker memory
      if (file.size > MAX_THUMBNAIL_RENDER_BYTES) {
        const gridCount = Math.min(docPageCount, MAX_INTERACTIVE_GRID_PAGES);
        const placeholderGrid = Array.from({ length: gridCount }, (_, idx) => ({
          page: idx + 1,
          dataUrl: '',
        }));
        setThumbnails(placeholderGrid);
        setRenderingThumbnails(false);
        return;
      }

      setRenderingThumbnails(true);
      try {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;
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
        const maxGridPages = Math.min(docPageCount, MAX_INTERACTIVE_GRID_PAGES);
        for (let p = mapped.length + 1; p <= maxGridPages; p++) {
          mapped.push({ page: p, dataUrl: '' });
        }
        if (myToken !== operationTokenRef.current) return;
        setThumbnails(mapped);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        logger.error('Failed to render previews:', err);
        setError(
          t('deletePages.previewWarning', {
            defaultValue:
              'Previews could not be rendered, but you can still delete pages using standard input.',
          })
        );
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingThumbnails(false);
        }
      }
    }
  };

  const parsedPagesToDelete = React.useMemo(() => {
    return parseDeletePageSelection(pagesStr, totalPages).validPages;
  }, [pagesStr, totalPages]);

  const togglePageDeletion = (pageNumber: number) => {
    let newPages: number[];
    if (parsedPagesToDelete.includes(pageNumber)) {
      newPages = parsedPagesToDelete.filter((p) => p !== pageNumber);
    } else {
      newPages = [...parsedPagesToDelete, pageNumber].sort((a, b) => a - b);
    }
    setPagesStr(newPages.join(', '));
  };

  const selectAll = () => {
    if (thumbnails.length > 0) {
      setPagesStr(thumbnails.map((t) => t.page).join(', '));
    }
  };

  const clearSelection = () => {
    setPagesStr('');
  };

  const handleDelete = async () => {
    if (!selectedFile || loading || isSubmittingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }
    if (!pagesStr.trim()) {
      setError(
        t('deletePages.provideIndices', {
          defaultValue: 'Please provide page indices to delete. Examples: "2, 4, 6"',
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
      // Use the totalPages state (fetched via getPageCount), not thumbnails.length.
      // This ensures manual deletion works even when preview rendering fails.
      if (totalPages === 0) {
        setError(
          t('deletePages.pageCountError', {
            defaultValue: 'Could not determine document page count. Please try re-uploading.',
          })
        );
        return;
      }

      const { validPages, invalidTokens } = parseDeletePageSelection(pagesStr, totalPages);

      if (invalidTokens.length > 0) {
        setError(
          t('deletePages.invalidPageNumber', {
            tokens: invalidTokens.join(', '),
            total: totalPages,
            defaultValue: `Invalid page number(s): ${invalidTokens.join(', ')}. Document has ${totalPages} page(s). Use numbers between 1 and ${totalPages}.`,
          })
        );
        return;
      }

      if (validPages.length === 0) {
        setError(
          t('deletePages.atLeastOneValid', {
            defaultValue: 'Please enter at least one valid page number to delete.',
          })
        );
        return;
      }

      if (validPages.length >= totalPages) {
        setError(
          t('deletePages.cannotDeleteAll', {
            defaultValue: 'Cannot delete all pages of the document.',
          })
        );
        return;
      }

      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const parsedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'deletePagesPDF',
        { bytes: fileBytes, pageIndices: validPages },
        [fileBytes.buffer]
      );

      if (activeToken !== operationTokenRef.current) return;

      const blob = new Blob([parsedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = sanitizeDownloadFilename(`pdfminty_stripped_${selectedFile.name}`);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      setIsSuccess(true);

      addActivityItem({
        toolName: 'Delete Pages',
        toolId: 'delete-pages',
        fileName: selectedFile.name,
        fileSizeFormatted: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Edit',
        savings: `${validPages.length} ${validPages.length === 1 ? 'page' : 'pages'} removed`,
      });

      await downloadBlob(blob, name);
    } catch (err: unknown) {
      if (activeToken !== operationTokenRef.current) return;
      logger.error('Delete pages error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('deletePages.unexpectedError', {
            defaultValue:
              'An unexpected failure occurred. Verify indices match document dimensions.',
          })
      );
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="delete_pages_container">
      <SEO slug="delete-pages-pdf" />
      <ToolHeader slug="delete-pages-pdf" limitMB={currentLimits.maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <Trash2 className="w-5 h-5 text-rose-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="application/pdf"
                maxSizeMB={currentLimits.maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                id="loaded_delete_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {totalPages > 0 ? `${totalPages} Pages • ` : ''}
                    {t('deletePages.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    operationTokenRef.current++; // Invalidate in-flight rendering
                    // Revoke existing blob URLs to prevent memory leaks.
                    thumbnails.forEach((t) => {
                      if (t.dataUrl) URL.revokeObjectURL(t.dataUrl);
                    });
                    setSelectedFile(null);
                    setThumbnails([]);
                    setPagesStr('');
                    setTotalPages(0); // Reset page count
                    setError(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="min-h-[40px] shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 px-3.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}
          </div>

          {isSuccess && (
            <div
              className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold"
              id="delete_pages_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>
                  {t('deletePages.successTitle', {
                    defaultValue:
                      'Pages Deleted Successfully! Your modified PDF has been generated.',
                  })}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold leading-normal m-0">
                {t('deletePages.successDesc', {
                  defaultValue:
                    'The selected pages have been removed completely offline in your browser.',
                })}
              </p>
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
                      {t('deletePages.downloadStripped', { defaultValue: 'Download Stripped PDF' })}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      operationTokenRef.current++;
                      thumbnails.forEach((t) => {
                        if (t.dataUrl) URL.revokeObjectURL(t.dataUrl);
                      });
                      setSelectedFile(null);
                      setThumbnails([]);
                      setPagesStr('');
                      setTotalPages(0);
                      setError(null);
                      setIsSuccess(false);
                      if (downloadUrl) {
                        URL.revokeObjectURL(downloadUrl);
                        setDownloadUrl(null);
                      }
                    }}
                    id="reset_delete_pages_btn"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <span>
                      {t('deletePages.deleteAnother', { defaultValue: 'Process Another PDF' })}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!selectedFile && (
            <EmptyState
              title={t('deletePages.emptyTitle', { defaultValue: 'Upload a PDF to delete pages' })}
              description={t('deletePages.emptyDesc', {
                defaultValue:
                  'Select a document above to inspect page thumbnails and click to remove unwanted pages.',
              })}
            />
          )}

          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  {t('deletePages.selectPagesToDelete', { defaultValue: 'Select Pages to Delete' })}
                </h3>
                {thumbnails.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline bg-slate-50 dark:bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {t('deletePages.deleteAll', { defaultValue: 'Delete All' })}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline bg-slate-50 dark:bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {t('deletePages.keepAll', { defaultValue: 'Keep All' })}
                    </button>
                  </div>
                )}
              </div>

              {renderingThumbnails ? (
                <div
                  className="flex flex-col items-center justify-center p-12 space-y-3"
                  id="delete_thumbnails_loader"
                >
                  <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">
                    {t('deletePages.loadingPages', {
                      defaultValue: 'Loading document pages structure...',
                    })}
                  </p>
                </div>
              ) : thumbnails.length > 0 ? (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  id="delete_thumbnails_interactive_grid"
                >
                  {thumbnails.map((item) => {
                    const isSelected = parsedPagesToDelete.includes(item.page);
                    return (
                      <button
                        key={item.page}
                        type="button"
                        id={`delete-page-thumbnail-btn-${item.page}`}
                        onClick={() => togglePageDeletion(item.page)}
                        aria-pressed={isSelected}
                        aria-label={t('deletePages.pageAriaLabel', {
                          page: item.page,
                          defaultValue: `Page ${item.page}`,
                        })}
                        className={`group relative aspect-[3/4] bg-slate-50 dark:bg-slate-800 border-2 rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all p-1 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 ring-4 ring-rose-500/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-10 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </div>

                        <div className="w-full h-[85%] bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {item.dataUrl ? (
                            <img
                              src={item.dataUrl}
                              alt={t('deletePages.pageNumber', {
                                page: item.page,
                                defaultValue: `Page ${item.page}`,
                              })}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {t('deletePages.pageNumber', {
                                page: item.page,
                                defaultValue: `Page ${item.page}`,
                              })}
                            </span>
                          )}
                        </div>

                        <div className="w-full flex items-center justify-center pt-1">
                          <span
                            className={`text-[10px] font-extrabold ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            {t('deletePages.pageNumber', {
                              page: item.page,
                              defaultValue: `Page ${item.page}`,
                            })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('deletePages.couldNotLoadPreviews', {
                      defaultValue: 'Could not load individual page previews.',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl flex items-start space-x-2 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 leading-normal">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">
                {t('deletePages.cautionTitle', { defaultValue: 'Cautionary notice:' })}
              </p>
              <p className="mt-0.5">
                {t('deletePages.cautionDesc', {
                  defaultValue:
                    'Deleting pages is an irreversible destructive operation. Make sure to retain copy backups of the source document prior to conversion.',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Configurations column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('deletePages.targetPagesTitle', { defaultValue: 'Target Pages' })}
            </h3>

            <div className="space-y-2">
              <label
                htmlFor="pages_csv"
                className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
              >
                {t('deletePages.pagesToDeleteLabel', { defaultValue: 'Pages to delete:' })}
              </label>
              <input
                id="pages_csv"
                type="text"
                value={pagesStr}
                onChange={(e) => setPagesStr(e.target.value)}
                placeholder={t('deletePages.placeholder', { defaultValue: 'e.g. 2, 5, 8' })}
                className="w-full min-h-[44px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                disabled={!selectedFile}
              />
            </div>

            <p className="text-xs text-slate-400">
              {t('deletePages.specifyHelp', {
                defaultValue: 'Specify precise, 1-based index numbers divided by commas to trim.',
              })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 p-3 rounded-lg"
                id="delete_pages_error_box"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedFile || loading}
              className={`w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/10 ${
                selectedFile && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>
                    {t('deletePages.strippingButton', { defaultValue: 'Stripping pages...' })}
                  </span>
                </span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{t('deletePages.deleteButton', { defaultValue: 'Remove Pages' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
