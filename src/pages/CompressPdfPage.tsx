import confetti from 'canvas-confetti';
import {
  Download,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Zap,
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CompressAnimation } from '../components/CompressAnimation';
import { FileUploader } from '../components/FileUploader';
import { PdfPreview } from '../components/PdfPreview';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

export type CompressionMode = 'recommended' | 'extreme' | 'low';

export const CompressPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('recommended');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customQuality, setCustomQuality] = useState<number>(0.8);
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Compression stats
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [wasAlreadyCompact, setWasAlreadyCompact] = useState<boolean>(false);

  const operationTokenRef = React.useRef<number>(0);
  const isProcessingRef = React.useRef<boolean>(false);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    const token = operationTokenRef;
    return () => {
      token.current++;
    };
  }, []);

  const limitMB = TOOL_SIZE_LIMITS['compress-pdf']?.maxSingleMB || 100;

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      operationTokenRef.current++;
      setSelectedFile(files[0]);
      setOriginalSize(files[0].size);
      setError(null);
      setIsSuccess(false);
      setWasAlreadyCompact(false);
      setShowPreview(false);
      setCompressedBlob(null);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  const handleCompress = async () => {
    if (!selectedFile || isProcessing || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const myToken = ++operationTokenRef.current;
    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);
    setWasAlreadyCompact(false);
    setShowPreview(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setCompressedBlob(null);

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      if (myToken !== operationTokenRef.current) return;

      const level =
        compressionMode === 'extreme'
          ? 'extreme'
          : compressionMode === 'low'
            ? 'low'
            : 'recommended';

      const options = {
        level,
        mode: compressionMode,
        quality: showAdvanced ? customQuality : undefined,
        grayscale: showAdvanced ? isGrayscale : false,
      };

      logger.info(
        `[Compress UI] Starting compression for "${selectedFile.name}" (Original: ${fileBytes.byteLength} B / ${(fileBytes.byteLength / 1024 / 1024).toFixed(2)} MB, Mode: ${compressionMode}, Level: ${level})`
      );

      // Do NOT transfer fileBytes.buffer so fileBytes remains intact in main thread
      const compressedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'compressPDF',
        { bytes: fileBytes, options }
      );
      if (myToken !== operationTokenRef.current) return;

      // Senior Engineering Guarantee: Invariant that compressed output is NEVER larger than original.
      // If compressedBytes is valid and strictly smaller than original, use it; otherwise preserve the original bytes.
      const isSmaller =
        Boolean(compressedBytes) &&
        compressedBytes.byteLength > 0 &&
        compressedBytes.byteLength < fileBytes.byteLength;
      const finalBytes = isSmaller ? compressedBytes : fileBytes;

      const savedBytes = fileBytes.byteLength - finalBytes.byteLength;
      const savedPct =
        fileBytes.byteLength > 0 ? Math.round((savedBytes / fileBytes.byteLength) * 100) : 0;

      logger.info(
        `[Compress UI] Compression finished for "${selectedFile.name}": ${fileBytes.byteLength} B -> ${finalBytes.byteLength} B (Net saved: ${savedBytes} B / ${savedPct}%)`
      );

      const safeBuffer = new Uint8Array(finalBytes);
      const blob = new Blob([safeBuffer], { type: 'application/pdf' });
      const rawBase = selectedFile.name.replace(/\.pdf$/i, '').trim();
      const safeName = sanitizeDownloadFilename(`${rawBase || 'document'}-compressed.pdf`);
      const url = URL.createObjectURL(blob);

      setOriginalSize(fileBytes.byteLength);
      setCompressedBlob(blob);
      setCompressedSize(finalBytes.byteLength);
      setWasAlreadyCompact(!isSmaller);
      setDownloadUrl(url);
      setDownloadName(safeName);
      setIsSuccess(true);
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#14b8a6'],
        });
      } catch {
        // Non-blocking confetti fallback
      }

      // Record real user activity for Dashboard
      try {
        const formatMb = (bytes: number) =>
          bytes >= 1048576
            ? `${(bytes / 1048576).toFixed(1)} MB`
            : `${Math.round(bytes / 1024)} KB`;
        addActivityItem({
          toolName: 'Compress PDF',
          toolId: 'compress',
          fileName: selectedFile.name,
          fileSizeFormatted: `${formatMb(fileBytes.byteLength)} → ${formatMb(finalBytes.byteLength)}`,
          status: 'completed',
          tag: 'Compress',
          savings: `${savedPct}% reduced`,
        });
      } catch {
        // Non-blocking log
      }

      // Attempt automatic download (fail-safe: even if browser blocks unprompted download, manual button is ready)
      try {
        await downloadBlob(blob, safeName);
      } catch (dlErr) {
        logger.warn(
          'Browser prevented automatic download. Manual download button is active:',
          dlErr
        );
      }
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      logger.error('Compress operation failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('compressPdf.unexpectedError', {
            defaultValue: 'An error occurred while compressing your PDF document.',
          })
      );
    } finally {
      if (myToken === operationTokenRef.current) {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const handleManualDownload = () => {
    if (compressedBlob) {
      downloadBlob(compressedBlob, downloadName);
    } else if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 1000);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const savedBytes = Math.max(0, originalSize - compressedSize);
  const percentSaved =
    originalSize > 0 ? Math.max(0, Math.round((savedBytes / originalSize) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadein" id="compress_pdf_container">
      <SEO slug="compress-pdf" />
      <ToolHeader slug="compress-pdf" limitMB={limitMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Workspace & File Upload */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Minimize2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('compressPdf.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {isProcessing && selectedFile ? (
              <CompressAnimation
                fileName={selectedFile.name}
                originalSizeBytes={selectedFile.size}
                compressionMode={compressionMode}
                onCancel={() => {
                  operationTokenRef.current += 1;
                  isProcessingRef.current = false;
                  setIsProcessing(false);
                }}
              />
            ) : !selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
                id="compress_pdf_uploader"
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                id="loaded_compress_file"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatBytes(selectedFile.size)} • PDF Document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    operationTokenRef.current += 1;
                    setSelectedFile(null);
                    setIsSuccess(false);
                    setError(null);
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

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 font-semibold leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Results card upon successful compression */}
            {isSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="p-5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4"
                id="compress_success_banner"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Compression Completed Successfully!</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black tabular-nums bg-emerald-600 text-white shadow-sm">
                    {percentSaved > 0 ? `-${percentSaved}% Saved` : 'Fully Optimized'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs tabular-nums">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Original Size:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                      {formatBytes(originalSize)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {originalSize.toLocaleString()} B
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Compressed:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                      {formatBytes(compressedSize)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {compressedSize.toLocaleString()} B
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Space Saved:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {savedBytes > 0
                        ? `${formatBytes(savedBytes)} (${percentSaved}%)`
                        : '0 B (0%)'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {savedBytes.toLocaleString()} B saved
                    </span>
                  </div>
                </div>

                {(savedBytes === 0 || wasAlreadyCompact) && (
                  <div className="space-y-1.5 text-[11px] text-emerald-800 dark:text-emerald-200 leading-normal">
                    <p className="m-0">
                      ℹ️ <strong>Already Compact:</strong> Re-encoding did not yield a smaller file
                      than the original ({originalSize.toLocaleString()} B). Original bytes were
                      preserved unchanged so output is never larger than input.
                    </p>
                  </div>
                )}

                {downloadUrl && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleManualDownload}
                        id="manual_download_btn"
                        className="inline-flex items-center gap-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Download Compressed PDF ({formatBytes(compressedSize)})</span>
                      </button>

                      <button
                        type="button"
                        aria-expanded={showPreview}
                        onClick={() => setShowPreview((prev) => !prev)}
                        id="toggle_preview_pdf_btn"
                        className="inline-flex items-center gap-2 min-h-[44px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4 shrink-0" />
                            <span>Hide In-Page Preview</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>Inspect & Preview Pages</span>
                          </>
                        )}
                      </button>

                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="preview_pdf_btn"
                        className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm no-underline"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Open in New Tab</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          operationTokenRef.current += 1;
                          setSelectedFile(null);
                          setIsSuccess(false);
                          setError(null);
                          setShowPreview(false);
                          if (downloadUrl) {
                            URL.revokeObjectURL(downloadUrl);
                            setDownloadUrl(null);
                          }
                        }}
                        id="reset_compress_btn"
                        className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
                      >
                        <span>
                          {t('compressPdf.compressAnother', {
                            defaultValue: 'Compress Another PDF',
                          })}
                        </span>
                      </button>
                    </div>

                    {showPreview && compressedBlob && (
                      <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800/80 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-inner">
                        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                          <span>Quality & Layout Inspector (Live View)</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Live Output Preview
                          </span>
                        </div>
                        <PdfPreview
                          file={
                            new File([compressedBlob], downloadName, { type: 'application/pdf' })
                          }
                          scale={0.5}
                        />
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                      💡 Click <strong>Download Compressed PDF</strong> above to save. If automatic
                      download was blocked by browser security, the button or{' '}
                      <strong>Open in New Tab</strong> allows instant direct saving.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Options & Action Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3
                className="font-bold text-slate-900 dark:text-white"
                id="compression-mode-heading"
              >
                Compression Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Select your preferred compression level (iLovePDF standard)
              </p>
            </div>

            {/* International Standard Compression Modes */}
            <div className="space-y-3" role="radiogroup" aria-labelledby="compression-mode-heading">
              {/* Option 1: Recommended Compression (Default) */}
              <div
                role="radio"
                aria-checked={compressionMode === 'recommended'}
                tabIndex={0}
                onClick={() => setCompressionMode('recommended')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCompressionMode('recommended');
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  compressionMode === 'recommended'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Recommended (Default)
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                    Best Balance
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Smart Vector-Preserving Optimization
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  Recompresses embedded high-resolution raster images (~70% JPEG quality, max
                  1600px) and packs PDF object streams while preserving vector text, fonts, links,
                  and layout. Actual size reduction depends on embedded image content.
                </p>
              </div>

              {/* Option 2: Extreme Compression */}
              <div
                role="radio"
                aria-checked={compressionMode === 'extreme'}
                tabIndex={0}
                onClick={() => setCompressionMode('extreme')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCompressionMode('extreme');
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                  compressionMode === 'extreme'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/25 shadow-sm ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Extreme Compression
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                    Smallest File
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
                  Stronger image downsampling (~60% JPEG quality, max 1280px)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  Stronger embedded image compression for email attachments and portal upload
                  limits. Selectable vector text, fonts, and page geometry remain intact.
                </p>
              </div>

              {/* Option 3: Low Compression / High Quality */}
              <div
                role="radio"
                aria-checked={compressionMode === 'low'}
                tabIndex={0}
                onClick={() => setCompressionMode('low')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCompressionMode('low');
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  compressionMode === 'low'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/25 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Low Compression
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                    High Quality
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                  High-fidelity images (~80% JPEG quality, max 2048px)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  Maintains high photo detail with gentle image and object-stream optimization.
                  Ideal for portfolios and print-ready proofs.
                </p>
              </div>
            </div>

            {/* Advanced Settings Accordion */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                aria-expanded={showAdvanced}
                aria-controls="compress-advanced-panel"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  Advanced Custom Settings
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {showAdvanced ? 'Hide' : 'Configure'}
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {showAdvanced && (
                <div
                  id="compress-advanced-panel"
                  className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <label
                        htmlFor="custom-jpeg-quality-range"
                        className="text-slate-600 dark:text-slate-400 font-semibold"
                      >
                        Custom JPEG Quality:
                      </label>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(customQuality * 100)}%
                      </span>
                    </div>
                    <input
                      id="custom-jpeg-quality-range"
                      aria-label="Custom JPEG Quality"
                      type="range"
                      min="0.40"
                      max="0.95"
                      step="0.05"
                      value={customQuality}
                      onChange={(e) => setCustomQuality(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isGrayscale}
                      onChange={(e) => setIsGrayscale(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Convert Images to Grayscale (B&W) for extra size drop</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCompress}
              disabled={!selectedFile || isProcessing}
              id="compress_submit_btn"
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                selectedFile && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-700 pointer-events-none shadow-none text-slate-500'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                  <span className="animate-pulse">
                    {t('compressPdf.compressingButton', {
                      defaultValue: 'Compressing in Browser...',
                    })}
                  </span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {t('compressPdf.compressSubmit', { defaultValue: 'Compress & Download PDF' })}
                  </span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% In-Browser • Zero Server Uploads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful educational articles banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/"
          className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 transition-colors group block no-underline"
        >
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Deep-Dive Guide
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors m-0 mb-1">
            How to Compress a PDF Without Losing Quality (2026) →
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Compare lossless object compaction vs lossy downsampling for print, web, and legal
            documents.
          </p>
        </Link>

        <Link
          to="/blog/why-is-my-pdf-so-large/"
          className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 transition-colors group block no-underline"
        >
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Forensic Analysis
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors m-0 mb-1">
            Why Is My PDF So Large? (5 Hidden Causes) →
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Diagnose un-subsetted fonts, 600 DPI scanner presets, and hidden XMP metadata bloat.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default CompressPdfPage;
