import { Trash2, AlertCircle, AlertTriangle, Loader2, CheckSquare, Square, Download } from 'lucide-react';
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

export const DeletePagesPage: React.FC = () => {
  const { t } = useTranslation('common');
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
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    urlsRef.current = thumbnails.map((t) => t.dataUrl);
  }, [thumbnails]);

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
      thumbnails.forEach((t) => URL.revokeObjectURL(t.dataUrl));
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

      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;
        // Get page count independently of thumbnail rendering so manual deletion
        // still works even if pdfToImage fails.
        const count = await WorkerManager.getInstance().runOperation<number>(
          'getPageCount',
          { bytes }
        );
        if (myToken !== operationTokenRef.current) return;
        setTotalPages(count);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        const message = err instanceof Error ? err.message : 'Failed to read PDF.';
        setError(t('deletePages.readError', { message, defaultValue: `Failed to read PDF: ${message}` }));
        setTotalPages(0);
        return;
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
        setThumbnails(mapped);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        logger.error('Failed to render previews:', err);
        setError(
          t('deletePages.previewWarning', {
            defaultValue: 'Previews could not be rendered, but you can still delete pages using standard input.',
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
    return pagesStr
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p));
  }, [pagesStr]);

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
    if (!selectedFile) return;
    if (!pagesStr.trim()) {
      setError(
        t('deletePages.provideIndices', {
          defaultValue: 'Please provide page indices to delete. Examples: "2, 4, 6"',
        })
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the totalPages state (fetched via getPageCount), not thumbnails.length.
      // This ensures manual deletion works even when preview rendering fails.
      if (totalPages === 0) {
        setError(
          t('deletePages.pageCountError', {
            defaultValue: 'Could not determine document page count. Please try re-uploading.',
          })
        );
        setLoading(false);
        return;
      }
      const parsed = pagesStr
        .split(',')
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p));

      // Reject out-of-range and non-positive values. Surface a clear error so the
      // user knows which tokens were rejected.
      const invalidTokens: string[] = [];
      const validPages: number[] = [];
      const seen = new Set<number>();

      for (const p of parsed) {
        if (!Number.isInteger(p) || p < 1 || p > totalPages) {
          invalidTokens.push(String(p));
          continue;
        }
        if (seen.has(p)) continue; // silently dedupe
        seen.add(p);
        validPages.push(p);
      }

      if (invalidTokens.length > 0) {
        setError(
          t('deletePages.invalidPageNumber', {
            tokens: invalidTokens.join(', '),
            total: totalPages,
            defaultValue: `Invalid page number(s): ${invalidTokens.join(', ')}. Document has ${totalPages} page(s). Use numbers between 1 and ${totalPages}.`,
          })
        );
        setLoading(false);
        return;
      }

      if (validPages.length === 0) {
        setError(
          t('deletePages.atLeastOneValid', {
            defaultValue: 'Please enter at least one valid page number to delete.',
          })
        );
        setLoading(false);
        return;
      }

      if (validPages.length === totalPages) {
        setError(
          t('deletePages.cannotDeleteAll', {
            defaultValue: 'Cannot delete all pages of the document.',
          })
        );
        setLoading(false);
        return;
      }

      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const parsedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'deletePagesPDF',
        { bytes: fileBytes, pageIndices: validPages },
        [fileBytes.buffer]
      );
      const blob = new Blob([parsedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_stripped_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Delete pages error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('deletePages.unexpectedError', {
            defaultValue: 'An unexpected failure occurred. Verify indices match document dimensions.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="delete_pages_container">
      <SEO slug="delete-pages-pdf" />
      <ToolHeader slug="delete-pages-pdf" limitMB={TOOL_SIZE_LIMITS['delete-pages-pdf'].maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Trash2 className="w-5 h-5 text-rose-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['delete-pages-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_delete_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {t('deletePages.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    operationTokenRef.current++; // Invalidate in-flight rendering
                    // Revoke existing blob URLs to prevent memory leaks.
                    thumbnails.forEach((t) => URL.revokeObjectURL(t.dataUrl));
                    setSelectedFile(null);
                    setThumbnails([]);
                    setPagesStr('');
                    setTotalPages(0); // Reset page count
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="delete_pages_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>
                  {t('deletePages.successTitle', {
                    defaultValue: 'Pages Deleted Successfully! Your modified PDF has been generated.',
                  })}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                {t('deletePages.successDesc', {
                  defaultValue: 'The selected pages have been removed completely offline in your browser.',
                })}
              </p>
              {downloadUrl && (
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    id="manual_download_link"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>{t('deletePages.downloadStripped', { defaultValue: 'Download Stripped PDF' })}</span>
                  </a>
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-700">
                  {t('deletePages.selectPagesToDelete', { defaultValue: 'Select Pages to Delete' })}
                </h3>
                {thumbnails.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-semibold text-rose-600 hover:underline bg-slate-50 py-1 px-2.5 rounded-lg border border-slate-200"
                    >
                      {t('deletePages.deleteAll', { defaultValue: 'Delete All' })}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-xs font-semibold text-slate-500 hover:underline bg-slate-50 py-1 px-2.5 rounded-lg border border-slate-200"
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
                    {t('deletePages.loadingPages', { defaultValue: 'Loading document pages structure...' })}
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
                        id={`delete-page-thumbnail-btn-${item.page}`}
                        onClick={() => togglePageDeletion(item.page)}
                        aria-label={t('deletePages.pageAriaLabel', {
                          page: item.page,
                          defaultValue: `Page ${item.page}`,
                        })}
                        className={`group relative aspect-[3/4] bg-slate-50 border-2 rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all p-1 flex flex-col justify-between ${
                          isSelected
                            ? 'border-rose-500 ring-4 ring-rose-500/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-10 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </div>

                        <div className="w-full h-[85%] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          <img
                            src={item.dataUrl}
                            alt={t('deletePages.pageNumber', {
                              page: item.page,
                              defaultValue: `Page ${item.page}`,
                            })}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="w-full flex items-center justify-center pt-1">
                          <span
                            className={`text-[10px] font-extrabold ${isSelected ? 'text-rose-600' : 'text-slate-500'}`}
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
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs text-slate-500">
                    {t('deletePages.couldNotLoadPreviews', {
                      defaultValue: 'Could not load individual page previews.',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 p-4 rounded-xl flex items-start space-x-2 border border-amber-200 text-xs text-amber-800 leading-normal">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('deletePages.cautionTitle', { defaultValue: 'Cautionary notice:' })}</p>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('deletePages.targetPagesTitle', { defaultValue: 'Target Pages' })}
            </h3>

            <div className="space-y-2">
              <label
                htmlFor="pages_csv"
                className="text-xs font-bold text-slate-600 uppercase tracking-wider block"
              >
                {t('deletePages.pagesToDeleteLabel', { defaultValue: 'Pages to delete:' })}
              </label>
              <input
                id="pages_csv"
                type="text"
                value={pagesStr}
                onChange={(e) => setPagesStr(e.target.value)}
                placeholder={t('deletePages.placeholder', { defaultValue: 'e.g. 2, 5, 8' })}
                className="w-full border border-slate-300 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={!selectedFile}
              />
            </div>

            <p className="text-xs text-slate-400">
              {t('deletePages.specifyHelp', {
                defaultValue: 'Specify precise, 1-based index numbers divided by commas to trim.',
              })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleDelete}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/10 ${
                selectedFile && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('deletePages.strippingButton', { defaultValue: 'Stripping pages...' })}</span>
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
