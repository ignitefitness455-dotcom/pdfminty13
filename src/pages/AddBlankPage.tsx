import { FilePlus, AlertCircle, Download } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const AddBlankPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [positionType, setPositionType] = useState<'start' | 'end' | 'custom'>('end');
  const [customIndex, setCustomIndex] = useState<number>(2);
  const [totalPages, setTotalPages] = useState<number>(0);
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

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFile(files[0]);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    try {
      const bytes = new Uint8Array(await files[0].arrayBuffer());
      const count = await WorkerManager.getInstance().runOperation<number>('getPageCount', { bytes });
      setTotalPages(count);
      if (customIndex > count + 1) setCustomIndex(count + 1);
    } catch {
      setError(t('addBlankPage.readError', { defaultValue: 'Failed to read PDF. It may be corrupted.' }));
    }
  };

  const handleInsert = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    // Validate customIndex against totalPages before calling worker.
    if (positionType === 'custom') {
      const upperBound = totalPages > 0 ? totalPages + 1 : 1;
      if (customIndex < 1 || customIndex > upperBound) {
        setError(t('addBlankPage.positionRangeError', { max: upperBound, defaultValue: `Position must be between 1 and ${upperBound}.` }));
        return;
      }
    }

    setLoading(true);

    try {
      const targetPos = positionType === 'custom' ? customIndex : positionType;
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const updatedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'addBlankPagePDF',
        { bytes: fileBytes, position: targetPos },
        [fileBytes.buffer]
      );
      const blob = new Blob([updatedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_padded_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Add blank page error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t('addBlankPage.unexpectedError', { defaultValue: 'An unexpected error occurred while adding the blank page.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="add_blank_container">
      <SEO slug="add-blank-page" />
      <ToolHeader slug="add-blank-page" limitMB={TOOL_SIZE_LIMITS['add-blank-page'].maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FilePlus className="w-5 h-5 text-sky-600" />
              <span>{t('addBlankPage.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                maxSizeMB={TOOL_SIZE_LIMITS['add-blank-page'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_blank_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {t('addBlankPage.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setTotalPages(0);
                    setCustomIndex(1);  // Reset to default
                    setPositionType('end');  // Reset position type too
                    setError(null);
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="add_blank_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('addBlankPage.successTitle', { defaultValue: 'Page Inserted Successfully! Your modified PDF has been generated.' })}</span>
              </div>
              <p className="text-slate-500 text-[11px] font-normal leading-normal">
                {t('addBlankPage.successDesc', { defaultValue: 'A new blank page has been inserted into your document completely offline in your browser.' })}
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
                    <span>{t('addBlankPage.downloadModified', { defaultValue: 'Download Modified PDF' })}</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('addBlankPage.insertLocation', { defaultValue: 'Insert Location' })}
            </h3>

            <div className="space-y-3">
              {[
                { type: 'start' as const, labelKey: 'addBlankPage.posStart', label: 'Start', descKey: 'addBlankPage.posStartDesc', desc: 'Prepend at very beginning of file' },
                { type: 'end' as const, labelKey: 'addBlankPage.posEnd', label: 'End', descKey: 'addBlankPage.posEndDesc', desc: 'Append at final trailing page' },
                { type: 'custom' as const, labelKey: 'addBlankPage.posCustom', label: 'Custom Index', descKey: 'addBlankPage.posCustomDesc', desc: 'Insert at specific page offset' },
              ].map((pos) => (
                <button
                  key={pos.type}
                  type="button"
                  onClick={() => setPositionType(pos.type)}
                  aria-pressed={positionType === pos.type}
                  aria-label={t(pos.labelKey, { defaultValue: pos.label })}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    positionType === pos.type
                      ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/15'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  disabled={!selectedFile}
                >
                  <span className="font-bold text-sm text-slate-900 block">{t(pos.labelKey, { defaultValue: pos.label })}</span>
                  <span className="text-[11px] text-slate-500 block leading-normal mt-0.5">
                    {t(pos.descKey, { defaultValue: pos.desc })}
                  </span>
                </button>
              ))}

              {positionType === 'custom' && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fadeIn text-xs">
                  <label htmlFor="custom_pg_index" className="font-bold text-slate-600 block">
                    {t('addBlankPage.insertAtLabel', { defaultValue: 'Insert at page index:' })}
                  </label>
                  <input
                    id="custom_pg_index"
                    type="number"
                    min="1"
                    max={totalPages + 1}
                    value={customIndex}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      if (Number.isNaN(parsed)) {
                        setCustomIndex(1);
                      } else {
                        // Enforce both lower bound (1) and upper bound (totalPages + 1).
                        const upperBound = totalPages > 0 ? totalPages + 1 : 1;
                        setCustomIndex(Math.min(Math.max(1, parsed), upperBound));
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                  />
                  <p className="text-xs text-slate-400">
                    {t('addBlankPage.pageLimitHelp', {
                      total: totalPages,
                      max: totalPages + 1,
                      defaultValue: `Document has ${totalPages} pages. Insert position must be between 1 and ${totalPages + 1}.`,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleInsert}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-600/10 ${
                selectedFile && !loading
                  ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('addBlankPage.threadingButton', { defaultValue: 'Threading sheets...' })}</span>
                </span>
              ) : (
                <>
                  <FilePlus className="w-4 h-4" />
                  <span>{t('addBlankPage.insertButton', { defaultValue: 'Insert Page' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
