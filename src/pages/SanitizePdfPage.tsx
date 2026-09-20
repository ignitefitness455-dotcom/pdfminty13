import { Download, ShieldBan, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';

export default function SanitizePdfPage() {
  const { t } = useTranslation('common');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
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

  const limitMB = TOOL_SIZE_LIMITS['sanitize-pdf']?.maxSingleMB || 50;

  const handleProcess = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
      
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await WorkerManager.getInstance().runOperation<{ bytes: Uint8Array; warnings: string[] }>(
        'sanitizePDF',
        { bytes }
      );

      setWarnings(result.warnings);

      const blob = new Blob([result.bytes], { type: 'application/pdf' });
      const name = file.name.replace(/\.pdf$/i, '') + '-sanitized.pdf';
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Failed to sanitize document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="sanitize_pdf_container">
      <SEO slug="sanitize-pdf" />
      <ToolHeader slug="sanitize-pdf" limitMB={limitMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <ShieldBan className="w-5 h-5 text-emerald-600" />
              <span>{t('sanitizePdf.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!file ? (
              <FileUploader
                onFilesSelected={(files) => {
                  if (files && files.length > 0) {
                    setFile(files[0]);
                    setWarnings([]);
                    setError(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }
                }}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
                id="sanitize_pdf_uploader"
              />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between" id="loaded_sanitize_file">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setWarnings([]);
                    setError(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {isSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="sanitize_success_banner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                  <span>{t('sanitizePdf.successTitle', { defaultValue: 'Sanitization Completed Successfully! Your clean PDF is ready.' })}</span>
                </div>
                <p className="text-slate-500 text-[11px] font-semibold leading-normal">{t('sanitizePdf.successDesc', { defaultValue: 'All scripts, hidden actions, and metadata have been purged from the file.' })}</p>
                {downloadUrl && (
                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      id="manual_download_link"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>{t('sanitizePdf.downloadSanitized', { defaultValue: 'Download Sanitized PDF' })}</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">{t("sanitizePdf.resultsTitle")}</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-700 font-medium">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">{t('sanitizePdf.actionsTitle', { defaultValue: 'Sanitize Actions' })}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("sanitizePdf.actionsDesc")}
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
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                file && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('sanitizePdf.processingButton', { defaultValue: 'Sanitizing...' })}</span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('sanitizePdf.processButton', { defaultValue: 'Sanitize & Download' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deep Content & Comprehensive Guide Section */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed" id="sanitize_guide_section">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t("sanitizePdf.guideTitle")}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {t("sanitizePdf.guideDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t("sanitizePdf.whatRemoved")}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-4">
              <li>{t("sanitizePdf.liJs")}</li>
              <li>{t("sanitizePdf.liMeta")}</li>
              <li>{t("sanitizePdf.liLaunch")}</li>
              <li>{t("sanitizePdf.liForm")}</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t("sanitizePdf.whoNeeds")}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-4">
              <li>{t("sanitizePdf.liLegal")}</li>
              <li>{t("sanitizePdf.liGov")}</li>
              <li>{t("sanitizePdf.liSec")}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{t('sanitizePdf.howToSanitize', { defaultValue: 'How to Sanitize PDFs Securely in Your Browser' })}</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
            <li>{t("sanitizePdf.step1")}</li>
            <li>{t("sanitizePdf.step2")}</li>
            <li>{t("sanitizePdf.step3")}</li>
          </ol>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
          <p className="font-bold">{t("sanitizePdf.offlineProtection")}</p>
          <p className="leading-normal text-slate-600">
            {t("sanitizePdf.offlineNotice")}
          </p>
        </div>
      </section>
    </div>
  );
}
