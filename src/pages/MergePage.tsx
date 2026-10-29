import {
  Files,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  GripVertical,
  CheckCircle2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getToolLimit } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const MergePage: React.FC = () => {
  const { t } = useTranslation('merge-pdf');
  const { user } = useAuth();
  const isPro = user?.plan === 'pro';
  const isLoggedIn = !!user;
  const currentLimits = getToolLimit('merge-pdf', isPro, isLoggedIn);
  const [files, setFiles] = useState<File[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [mergedSize, setMergedSize] = useState<number>(0);
  const isSubmittingRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    const updatedFiles = [...files, ...newFiles];
    const totalBytes = updatedFiles.reduce((acc, f) => acc + f.size, 0);
    const maxTotalBytes = (currentLimits.maxTotalMB || 200) * 1024 * 1024;

    if (totalBytes > maxTotalBytes) {
      setError(
        t('errors.totalSizeExceeded', {
          size: (totalBytes / 1024 / 1024).toFixed(2),
          limit: currentLimits.maxTotalMB,
          defaultValue: `Uploading failed! The combined size of all your files (${(
            totalBytes /
            1024 /
            1024
          ).toFixed(2)} MB) exceeds the absolute combined limit of ${
            currentLimits.maxTotalMB
          } MB. please remove some files.`,
        })
      );
      return;
    }

    setFiles(updatedFiles);
  };

  const handleRemove = (index: number) => {
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...files];
    const item = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = item;
    setFiles(reordered);
  };

  const handleDropRow = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    const reordered = [...files];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setFiles(reordered);
    setDraggedIdx(null);
  };

  const handleMerge = async () => {
    if (loading || isSubmittingRef.current) return;
    if (files.length < 2) {
      setError(
        t('errors.minFilesRequired', {
          defaultValue: 'Please add at least 2 PDF files to perform the merge operation.',
        })
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const filesBytes = await Promise.all(
        files.map((file) => file.arrayBuffer().then((ab) => new Uint8Array(ab)))
      );
      const mergedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'mergePDFs',
        { filesBytes },
        filesBytes.map((b) => b.buffer)
      );
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_merged_${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      setMergedSize(blob.size);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);

      // Record real user activity for Dashboard
      try {
        const mb = (blob.size / (1024 * 1024)).toFixed(1);
        addActivityItem({
          toolName: 'Merge PDF',
          toolId: 'merge',
          fileName: name,
          fileSizeFormatted: `${mb} MB (${files.length} files)`,
          status: 'completed',
          tag: 'Merge',
          savings: `${files.length} files combined`,
        });
      } catch {
        // Non-blocking log
      }
    } catch (err: unknown) {
      logger.error('Merge error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('errors.unexpectedFailure', {
            defaultValue:
              'An unexpected failure occurred while merging documents. Make sure they are not encrypted.',
          })
      );
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const totalSelectedBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="merge_page_container">
      <SEO slug="merge-pdf" />
      <ToolHeader slug="merge-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Deck */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <Files className="w-5 h-5 text-emerald-600" />
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple
              title={t('dropzone.title', { defaultValue: 'Add more files to merge' })}
              subtitle={t('dropzone.subtitleWithLimit', {
                maxSingle: currentLimits.maxSingleMB,
                defaultValue: `Drag PDF files here or click to browse (Max limit: ${currentLimits.maxSingleMB}MB per file)`,
              })}
              maxSizeMB={currentLimits.maxSingleMB}
            />
          </div>

          {files.length === 0 ? (
            <EmptyState
              title={t('emptyState.title', { defaultValue: 'Upload PDFs to merge' })}
              description={t('emptyState.description', {
                defaultValue:
                  'Add two or more PDF files above to arrange them and combine into a single document.',
              })}
            />
          ) : (
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              id="files_deck_list"
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider tabular-nums">
                    {t('fileList.titleWithCount', {
                      count: files.length,
                      defaultValue: `Arrange File Order (${files.length} selected)`,
                    })}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                    • {formatBytes(totalSelectedBytes)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  {t('fileList.clearAll', { defaultValue: 'Clear All' })}
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}_${i}`}
                    draggable
                    onDragStart={() => setDraggedIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropRow(i)}
                    onDragEnd={() => setDraggedIdx(null)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                      draggedIdx === i ? 'opacity-50 bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <GripVertical
                        className="w-4 h-4 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing shrink-0 hidden sm:block"
                        aria-hidden="true"
                      />
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-bold tabular-nums flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400 tabular-nums">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItem(i, 'up')}
                        disabled={i === 0}
                        aria-label={t('fileList.actions.moveUp', { defaultValue: 'Move item up' })}
                        className="min-w-[38px] min-h-[38px] p-2 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(i, 'down')}
                        disabled={i === files.length - 1}
                        aria-label={t('fileList.actions.moveDown', {
                          defaultValue: 'Move item down',
                        })}
                        className="min-w-[38px] min-h-[38px] p-2 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        aria-label={t('fileList.actions.remove', { defaultValue: 'Delete item' })}
                        className="min-w-[38px] min-h-[38px] p-2 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuccess && (
            <div
              className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold"
              id="merge_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('alerts.successTitle', {
                      defaultValue: 'Merge Operation Completed Successfully!',
                    })}
                  </span>
                </div>
                {mergedSize > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tabular-nums">
                    {formatBytes(mergedSize)} • {files.length} files
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold leading-normal m-0">
                {t('alerts.successDescription', {
                  defaultValue:
                    'Your compiled and structured PDF has been built completely in your browser.',
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
                      {t('alerts.downloadButton', { defaultValue: 'Download Merged PDF' })}
                      {mergedSize > 0 ? ` (${formatBytes(mergedSize)})` : ''}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setIsSuccess(false);
                      setMergedSize(0);
                      if (downloadUrl) {
                        URL.revokeObjectURL(downloadUrl);
                        setDownloadUrl(null);
                      }
                    }}
                    id="reset_merge_btn"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <span>{t('alerts.mergeMore', { defaultValue: 'Merge More PDFs' })}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('sidebar.title', { defaultValue: 'Merge Settings' })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('sidebar.description', {
                defaultValue:
                  'Use the ordering switches in the list deck to set page hierarchy. Merge compiles them consecutively from top to bottom.',
              })}
            </p>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              {t('sidebar.securityNote', {
                defaultValue:
                  'Files are merged 100% locally on your computer. Your secrets never leave your side.',
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {files.length === 1 && !error && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-lg font-medium m-0">
                {t('mergeControls.needOneMoreFile', {
                  defaultValue: 'Add at least 1 more PDF file above to enable merging.',
                })}
              </p>
            )}

            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg"
                id="merge_error_box"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className={`w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                files.length >= 2 && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>
                    {t('mergeControls.mergingButton', { defaultValue: 'Compiling PDF...' })}
                  </span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {t('mergeControls.mergeButtonWithCount', {
                      count: files.length,
                      defaultValue: `Merge PDFs (${files.length})`,
                    })}
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
