import { Scissors, AlertCircle, Info, Download } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlobsSequentially } from '../utils/download';
import { logger } from '../utils/logger';

export const SplitPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [splitFiles, setSplitFiles] = useState<{ url: string; filename: string }[]>([]);

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
      setSelectedFile(files[0]);
      setError(null);
      clearSplitFiles();
    }
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
        const name = `${selectedFile.name.replace(/\.pdf$/i, '')}_part_${idx + 1}.pdf`;
        const url = URL.createObjectURL(blob);
        return {
          blob,
          url,
          filename: name,
        };
      });

      setSplitFiles(items.map(item => ({ url: item.url, filename: item.filename })));

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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Scissors className="w-5 h-5 text-amber-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept="application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['split-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_split_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {t('toolCommon.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    clearSplitFiles();
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="split_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('splitPdf.successTitle', { defaultValue: 'Split Completed Successfully! Your split document sections have been generated.' })}</span>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                {t('splitPdf.manualDownloadPrompt', { defaultValue: 'If the automatic sequence of downloads did not complete, you can download each part manually below:' })}
              </p>
              {splitFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-emerald-200/50">
                  {splitFiles.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm gap-4">
                      <span className="truncate text-slate-700 font-bold max-w-[250px] shrink-0" title={item.filename}>{item.filename}</span>
                      <a
                        href={item.url}
                        download={item.filename}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('toolCommon.download', { defaultValue: 'Download' })}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedFile && <EmptyState />}

          <div className="bg-slate-100 p-4 rounded-xl flex items-start space-x-2 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">{t('splitPdf.howRangesWork', { defaultValue: 'How ranges work:' })}</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  {t('splitPdf.singleNumbers', { defaultValue: 'Use single numbers to extract single pages:' })}{' '}
                  <code className="bg-white px-1 py-0.5 rounded border">5</code>
                </li>
                <li>
                  {t('splitPdf.spansWithDashes', { defaultValue: 'Use spans with en-dashes to extract page blocks:' })}{' '}
                  <code className="bg-white px-1 py-0.5 rounded border">1-3</code>
                </li>
                <li>
                  {t('splitPdf.separateWithCommas', { defaultValue: 'Separate segments with comma lists:' })}{' '}
                  <code className="bg-white px-1 py-0.5 rounded border">1-2, 4, 6-8</code>{' '}
                  {t('splitPdf.parsesInto', { defaultValue: 'parses into 3 separate file outputs.' })}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configurations menu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('splitPdf.directivesTitle', { defaultValue: 'Split Directives' })}
            </h3>

            <div className="space-y-2">
              <label
                htmlFor="range_directives"
                className="text-xs font-bold text-slate-600 uppercase tracking-wider block"
              >
                {t('splitPdf.pageRangeLabel', { defaultValue: 'Page ranges:' })}
              </label>
              <input
                id="range_directives"
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder={t('splitPdf.rangePlaceholder', { defaultValue: 'e.g. 1-2, 4, 6-10' })}
                className="w-full border border-slate-300 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={!selectedFile}
              />
            </div>

            <p className="text-xs text-slate-400">
              {t('splitPdf.commaBlockHelp', { defaultValue: 'Each comma block triggers a separate download containing those precise indices.' })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg"
                id="split_error_box"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-600/10 ${
                selectedFile && !loading
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
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
