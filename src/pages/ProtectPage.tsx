import { Shield, AlertCircle, KeyRound, Download, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SecurityAffiliateBanner } from '../components/SecurityAffiliateBanner';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

export const ProtectPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [outputSize, setOutputSize] = useState<number>(0);

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
      setIsSuccess(false);
      setOutputSize(0);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  const handleProtect = async () => {
    if (!selectedFile) return;
    if (!password.trim()) {
      setError(
        t('protectPdf.emptyPasswordError', {
          defaultValue: 'Please provide a secure lock password.',
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
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const encryptedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'protectPDF',
        { fileBytes, userPassword: password },
        [fileBytes.buffer]
      );
      const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = sanitizeDownloadFilename(`pdfminty_locked_${selectedFile.name}`);
      const url = URL.createObjectURL(blob);
      setOutputSize(blob.size);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Protect error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('protectPdf.protectError', {
            defaultValue: 'An unexpected failure occurred while securing the document.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="protect_page_container">
      <SEO slug="protect-pdf" />

      <ToolHeader slug="protect-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Shield className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <span>{t('protectPdf.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['protect-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                id="loaded_protect_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {formatBytes(selectedFile.size)} •{' '}
                    {t('protectPdf.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPassword('');
                    setError(null);
                    setIsSuccess(false);
                    setOutputSize(0);
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
              id="protect_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('protectPdf.successTitle', {
                      defaultValue:
                        'Security Applied Successfully! Your locked PDF has been generated.',
                    })}
                  </span>
                </div>
                {outputSize > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tabular-nums">
                    {formatBytes(outputSize)}
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] font-semibold leading-normal m-0">
                {t('protectPdf.successDesc', {
                  defaultValue:
                    'Your PDF is now protected with the password lock key. Ensure you keep this password safe.',
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
                      {t('protectPdf.downloadLocked', { defaultValue: 'Download Locked PDF' })}
                      {outputSize > 0 ? ` (${formatBytes(outputSize)})` : ''}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPassword('');
                      setError(null);
                      setIsSuccess(false);
                      setOutputSize(0);
                      if (downloadUrl) {
                        URL.revokeObjectURL(downloadUrl);
                        setDownloadUrl(null);
                      }
                    }}
                    id="reset_protect_btn"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <span>
                      {t('protectPdf.protectAnother', { defaultValue: 'Protect Another PDF' })}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('protectPdf.settingsTitle', { defaultValue: 'Lock Specifications' })}
            </h3>

            <div className="space-y-2">
              <label
                htmlFor="sec_password"
                className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
              >
                {t('protectPdf.setPasswordLabel', { defaultValue: 'Set Password:' })}
              </label>
              <div className="relative">
                <input
                  id="sec_password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedFile && !loading) {
                      void handleProtect();
                    }
                  }}
                  placeholder={t('protectPdf.passwordPlaceholder', {
                    defaultValue: 'Secret key...',
                  })}
                  className="w-full min-h-[44px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  disabled={!selectedFile}
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {t('protectPdf.passwordHelp', {
                defaultValue:
                  'Locked containers prompt users to specify this password when reading details elsewhere.',
              })}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div
                className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleProtect}
              disabled={!selectedFile || loading}
              className={`w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-slate-600/10 ${
                selectedFile && !loading
                  ? 'bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>
                    {t('protectPdf.encryptingButton', { defaultValue: 'Encrypting container...' })}
                  </span>
                </span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{t('protectPdf.protectButton', { defaultValue: 'Secure PDF' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <SecurityAffiliateBanner
        variant="pass"
        contextTitle="Store Your PDF Passwords in NordPass"
        contextDesc="Never lose track of passwords set on sensitive documents. NordPass uses XChaCha20 zero-knowledge encryption to securely store and auto-fill your keys across all your devices."
      />
    </div>
  );
};
