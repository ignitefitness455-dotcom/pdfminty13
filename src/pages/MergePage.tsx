import { Files, Trash2, ArrowUp, ArrowDown, Download, AlertCircle } from 'lucide-react';
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

export const MergePage: React.FC = () => {
  const { t } = useTranslation('merge-pdf');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

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
    const maxTotalBytes = (TOOL_SIZE_LIMITS['merge-pdf'].maxTotalMB || 150) * 1024 * 1024;

    if (totalBytes > maxTotalBytes) {
      setError(
        t('errors.totalSizeExceeded', {
          size: (totalBytes / 1024 / 1024).toFixed(2),
          limit: TOOL_SIZE_LIMITS['merge-pdf'].maxTotalMB,
          defaultValue: `Uploading failed! The combined size of all your files (${(
            totalBytes /
            1024 /
            1024
          ).toFixed(2)} MB) exceeds the absolute combined limit of ${
            TOOL_SIZE_LIMITS['merge-pdf'].maxTotalMB
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

  const handleMerge = async () => {
    if (files.length < 2) {
      setError(
        t('errors.minFilesRequired', {
          defaultValue: 'Please add at least 2 PDF files to perform the merge operation.',
        })
      );
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
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="merge_page_container">
      <SEO slug="merge-pdf" />
      <ToolHeader slug="merge-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Deck */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Files className="w-5 h-5 text-emerald-600" />
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple
              title={t('dropzone.title', { defaultValue: 'Add more files to merge' })}
              subtitle={t('dropzone.subtitleWithLimit', {
                maxSingle: TOOL_SIZE_LIMITS['merge-pdf'].maxSingleMB,
                defaultValue: `Drag PDF files here or click to browse (Max limit: ${TOOL_SIZE_LIMITS['merge-pdf'].maxSingleMB}MB per file)`,
              })}
              maxSizeMB={TOOL_SIZE_LIMITS['merge-pdf'].maxSingleMB}
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
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              id="files_deck_list"
            >
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('fileList.titleWithCount', {
                    count: files.length,
                    defaultValue: `Arrange File Order (${files.length} selected)`,
                  })}
                </span>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  {t('fileList.clearAll', { defaultValue: 'Clear All' })}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}_${i}`}
                    className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] text-slate-600 font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => moveItem(i, 'up')}
                        disabled={i === 0}
                        aria-label={t('fileList.actions.moveUp', { defaultValue: 'Move item up' })}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(i, 'down')}
                        disabled={i === files.length - 1}
                        aria-label={t('fileList.actions.moveDown', {
                          defaultValue: 'Move item down',
                        })}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(i)}
                        aria-label={t('fileList.actions.remove', { defaultValue: 'Delete item' })}
                        className="p-1.5 rounded hover:bg-rose-50 text-rose-600 hover:scale-105 transition-transform cursor-pointer"
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
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold"
              id="merge_success_banner"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>
                  {t('alerts.successTitle', {
                    defaultValue: 'Merge Operation Completed Successfully!',
                  })}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                {t('alerts.successDescription', {
                  defaultValue:
                    'Your compiled and structured PDF has been built completely in your browser.',
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
                    <span>
                      {t('alerts.downloadButton', { defaultValue: 'Download Merged PDF' })}
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('sidebar.title', { defaultValue: 'Merge Settings' })}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('sidebar.description', {
                defaultValue:
                  'Use the ordering switches in the list deck to set page hierarchy. Merge compiles them consecutively from top to bottom.',
              })}
            </p>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium">
              {t('sidebar.securityNote', {
                defaultValue:
                  'Files are merged 100% locally on your computer. Your secrets never leave your side.',
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg"
                id="merge_error_box"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                files.length >= 2 && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('mergeControls.mergingButton', { defaultValue: 'Compiling PDF...' })}</span>
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
