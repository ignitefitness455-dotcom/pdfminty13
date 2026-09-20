import { Lock, AlertCircle, KeyRound, Download } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const UnlockPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
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

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  const handleUnlock = async () => {
    if (!selectedFile) return;
    if (!password.trim()) {
      setError(t('unlockPdf.emptyKeyError', { defaultValue: 'Please provide the corresponding encryption key.' }));
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
      const unlockedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'unlockPDF',
        { fileBytes, password },
        [fileBytes.buffer]
      );
      const blob = new Blob([unlockedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_unlocked_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Unlock error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('unlockPdf.decryptError', {
            defaultValue: 'Decryption failed. Please verify the keys match target structures.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="unlock_page_container">
      <SEO slug="unlock-pdf" />

      <ToolHeader slug="unlock-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Lock className="w-5 h-5 text-teal-600" />
              <span>{t('unlockPdf.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['unlock-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_unlock_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {t('unlockPdf.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="unlock_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('unlockPdf.successTitle', { defaultValue: 'File Unlocked Successfully! Your clean PDF is ready.' })}</span>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                {t('unlockPdf.successDesc', { defaultValue: 'All password restrictions and lock properties have been completely removed from this file.' })}
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
                    <span>{t('unlockPdf.downloadUnlocked', { defaultValue: 'Download Unlocked PDF' })}</span>
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
              {t('unlockPdf.settingsTitle', { defaultValue: 'Provide Credentials' })}
            </h3>

            <div className="space-y-2">
              <label
                htmlFor="sec_phrase"
                className="text-xs font-bold text-slate-600 uppercase tracking-wider block"
              >
                {t('unlockPdf.passwordLabel', { defaultValue: 'Password key:' })}
              </label>
              <div className="relative">
                <input
                  id="sec_phrase"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('unlockPdf.passwordPlaceholder', { defaultValue: 'Enter standard password phrase' })}
                  className="w-full border border-slate-300 rounded-xl py-2 pl-9 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={!selectedFile}
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {t('unlockPdf.passwordHelp', {
                defaultValue: 'You must already possess editing or viewing credentials to unlock encrypted structures.',
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
              onClick={handleUnlock}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-teal-600/10 ${
                selectedFile && !loading
                  ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('unlockPdf.unlockingButton', { defaultValue: 'Stripping locks...' })}</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t('unlockPdf.unlockButton', { defaultValue: 'Unlock File' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
