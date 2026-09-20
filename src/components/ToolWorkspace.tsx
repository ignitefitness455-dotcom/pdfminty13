import { AlertCircle, Shield, ExternalLink } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NORD_AFFILIATE_LINKS } from '../config/constants';
import { useToast } from '../contexts/ToastContext';
import { downloadBlob } from '../utils/download';

import { FileUploader } from './FileUploader';

interface ToolWorkspaceProps<TOptions extends Record<string, unknown>> {
  title: string;
  description?: string;
  acceptedTypes?: string[];
  multiple?: boolean;
  maxSizeMB?: number;
  onProcess: (files: File[], options: TOptions) => Promise<Blob | void>;
  renderOptions?: (options: TOptions, setOptions: (o: Partial<TOptions>) => void) => React.ReactNode;
  defaultOptions: TOptions;
  autoDownload?: boolean;
  downloadFilenamePrefix?: string;
}

export function ToolWorkspace<TOptions extends Record<string, unknown>>({
  title,
  description,
  acceptedTypes,
  multiple = false,
  maxSizeMB = 50,
  onProcess,
  renderOptions,
  defaultOptions,
  autoDownload = false,
  downloadFilenamePrefix = 'pdfminty_output',
}: ToolWorkspaceProps<TOptions>) {
  const { t } = useTranslation('common');
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<TOptions>(defaultOptions);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected);
    setError(null);
    setResult(null);
  }, []);

  const handleSetOptions = useCallback((partial: Partial<TOptions>) => {
    setOptions((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setError(t('toolWorkspace.selectPrompt', { defaultValue: 'Please select at least one file.' }));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await onProcess(files, options);
      if (output) {
        setResult(output);
        if (autoDownload) {
          await downloadBlob(output, `${downloadFilenamePrefix}_${Date.now()}.pdf`);
        }
        showToast(t('toolCommon.success', { defaultValue: 'Operation completed successfully!' }), 'success');
      } else {
        showToast(t('toolCommon.success', { defaultValue: 'Operation completed.' }), 'success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || t('toolCommon.error', { defaultValue: 'Processing failed.' }));
      showToast(message || t('toolCommon.error', { defaultValue: 'Processing failed.' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [files, options, onProcess, autoDownload, downloadFilenamePrefix, showToast, t]);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    try {
      await downloadBlob(result, `${downloadFilenamePrefix}_${Date.now()}.pdf`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed.';
      showToast(message, 'error');
    }
  }, [result, downloadFilenamePrefix, showToast]);

  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
      {description && <p className="text-sm text-slate-500">{description}</p>}

      <FileUploader
        onFilesSelected={handleFilesSelected}
        accept={acceptedTypes?.join(',')}
        multiple={multiple}
        maxSizeMB={maxSizeMB}
      />

      {renderOptions && renderOptions(options, handleSetOptions)}

      {error && (
        <div
          className="flex items-start space-x-2 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-800 text-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div
          className="flex items-center space-x-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="font-bold">{t('toolWorkspace.processingTitle', { defaultValue: 'Processing PDF...' })}</span>
            <span className="text-xs text-emerald-700">{t('toolWorkspace.processingDesc', { defaultValue: 'Please wait while your file is being processed.' })}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={files.length === 0 || loading}
        aria-busy={loading}
        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold disabled:bg-slate-300 hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        )}
        <span>{loading ? t('toolCommon.processing', { defaultValue: 'Processing...' }) : t('toolCommon.process', { defaultValue: 'Process' })}</span>
      </button>

      {result && !autoDownload && (
        <button
          onClick={handleDownload}
          className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          {t('toolCommon.download', { defaultValue: 'Download Result' })}
        </button>
      )}

      {result && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-on-surface">{t('toolWorkspace.securityTipTitle', { defaultValue: 'Security & Privacy Tip' })}</p>
              <p className="text-on-surface-variant">{t('toolWorkspace.securityTipDesc', { defaultValue: 'Sharing or uploading sensitive documents online? Keep your connection encrypted with NordVPN.' })}</p>
            </div>
          </div>
          <a
            href={NORD_AFFILIATE_LINKS.NORDVPN}
            target="_blank"
            rel="nofollow sponsored noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
          >
            <span>{t('toolWorkspace.getNordVpn', { defaultValue: 'Get NordVPN' })}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

export default ToolWorkspace;
