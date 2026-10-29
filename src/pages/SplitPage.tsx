import { Scissors, AlertCircle, Info, Download, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlobsSequentially, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

export const SplitPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [ranges, setRanges] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [splitFiles, setSplitFiles] = useState<
    { url: string; filename: string; sizeBytes: number }[]
  >([]);

  React.useEffect(() => {
    return () => {
      splitFiles.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [splitFiles]);

  const clearSplitFiles = () => {
    splitFiles.forEach((item) => URL.revokeObjectURL(item.url));
    setSplitFiles([]);
    setIsSuccess(false);
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setTotalPages(0);
      setError(null);
      clearSplitFiles();
      void (async () => {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const count = await WorkerManager.getInstance().runOperation<number>(
            'getPageCount',
            { bytes },
            [bytes.buffer]
          );
          if (typeof count === 'number' && count > 0) {
            setTotalPages(count);
          }
        } catch {
          // Ignore page count probe errors on mock/invalid files
        }
      })();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleSplit = async () => {
    if (!selectedFile) return;
    if (!ranges.trim()) {
      setError(
        t('splitPdf.rangeError', {
          defaultValue: 'Please provide a valid range. Examples: "1-2, 3, 4"',
        })
      );
      return;
    }

    setLoading(true);
    setError(null);
    clearSplitFiles();

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const results = await WorkerManager.getInstance().runOperation<Uint8Array[]>(
        'splitPDF',
        { bytes: fileBytes, ranges },
        [fileBytes.buffer]
      );

      const items = results.map((bytes, idx) => {
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const name = sanitizeDownloadFilename(
          `${selectedFile.name.replace(/\.pdf$/i, '')}_part_${idx + 1}.pdf`
        );
        const url = URL.createObjectURL(blob);
        return {
          blob,
          url,
          filename: name,
          sizeBytes: blob.size,
        };
      });

      setSplitFiles(
        items.map((item) => ({
          url: item.url,
          filename: item.filename,
          sizeBytes: item.sizeBytes,
        }))
      );

      addActivityItem({
        toolName: 'Split PDF',
        toolId: 'split',
        fileName: selectedFile.name,
        fileSizeFormatted: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Merge',
        savings: `${items.length} files`,
      });

      await downloadBlobsSequentially(items, 600);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Split error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(
        errMsg ||
          t('splitPdf.unexpectedFailure', {
            defaultValue:
              'An unexpected failure occurred while splitting the document. Verify bounds or password locks.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="split_page_container">
      <SEO slug="split-pdf" />

      <ToolHeader slug="split-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <Scissors className="w-5 h-5 text-amber-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['split-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                id="loaded_split_file"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {formatBytes(selectedFile.size)} •{' '}
                    {totalPages > 0 ? `${totalPages} Pages • ` : ''}
                    {t('toolCommon.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setTotalPages(0);
                    setError(null);
                    clearSplitFiles();
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
              id="split_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('splitPdf.successTitle', {
                      defaultValue:
                        'Split Completed Successfully! Your split document sections have been generated.',
                    })}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tabular-nums">
                  {splitFiles.length} {splitFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold leading-normal m-0">
                {t('splitPdf.manualDownloadPrompt', {
                  defaultValue:
                    'If the automatic sequence of downloads did not complete, you can download each part manually below:',
                })}
              </p>
              {splitFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  {splitFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60 shadow-sm gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span
                          className="block truncate text-slate-700 dark:text-slate-200 font-bold"
                          title={item.filename}
                        >
                          {item.filename}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                          {formatBytes(item.sizeBytes)}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        download={item.filename}
                        className="inline-flex items-center gap-1.5 min-h-[38px] shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg shadow-sm transition-colors cursor-pointer no-underline"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('toolCommon.download', { defaultValue: 'Download' })}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setTotalPages(0);
                    setError(null);
                    clearSplitFiles();
                  }}
                  id="reset_split_btn"
                  className="inline-flex items-center gap-2 min-h-[40px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  <span>{t('splitPdf.splitAnother', { defaultValue: 'Split Another PDF' })}</span>
                </button>
              </div>
            </div>
          )}

          {!selectedFile && <EmptyState />}

          <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl flex items-start space-x-2 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold mb-1">
                {t('splitPdf.howRangesWork', { defaultValue: 'How ranges work:' })}
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  {t('splitPdf.singleNumbers', {
                    defaultValue: 'Use single numbers to extract single pages:',
                  })}{' '}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    5
                  </code>
                </li>
                <li>
                  {t('splitPdf.spansWithDashes', {
                    defaultValue: 'Use spans with en-dashes to extract page blocks:',
                  })}{' '}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1-3
                  </code>
                </li>
                <li>
                  {t('splitPdf.separateWithCommas', {
                    defaultValue: 'Separate segments with comma lists:',
                  })}{' '}
                  <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1-2, 4, 6-8
                  </code>{' '}
                  {t('splitPdf.parsesInto', {
                    defaultValue: 'parses into 3 separate file outputs.',
                  })}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configurations menu */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('splitPdf.directivesTitle', { defaultValue: 'Split Directives' })}
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="range_directives"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
                >
                  {t('splitPdf.pageRangeLabel', { defaultValue: 'Page ranges:' })}
                </label>
                {totalPages > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    1 – {totalPages}
                  </span>
                )}
              </div>
              <input
                id="range_directives"
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder={t('splitPdf.rangePlaceholder', { defaultValue: 'e.g. 1-2, 4, 6-10' })}
                className="w-full min-h-[44px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                disabled={!selectedFile}
              />

              {selectedFile && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setRanges('1')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {t('splitPdf.presetFirstPage', { defaultValue: 'First page (1)' })}
                  </button>
                  {totalPages > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const mid = Math.ceil(totalPages / 2);
                        setRanges(`1-${mid}, ${mid + 1}-${totalPages}`);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {t('splitPdf.presetTwoHalves', { defaultValue: 'Split in half' })}
                    </button>
                  )}
                  {totalPages > 1 && totalPages <= 25 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRanges(Array.from({ length: totalPages }, (_, i) => i + 1).join(', '))
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {t('splitPdf.presetAllSeparate', { defaultValue: 'All pages separate' })}
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {t('splitPdf.commaBlockHelp', {
                defaultValue:
                  'Each comma block triggers a separate download containing those precise indices.',
              })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg"
                id="split_error_box"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSplit}
              disabled={!selectedFile || loading}
              className={`w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-600/10 ${
                selectedFile && !loading
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('splitPdf.splittingButton', { defaultValue: 'Splitting PDF...' })}</span>
                </span>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>{t('splitPdf.splitButton', { defaultValue: 'Split Document' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
