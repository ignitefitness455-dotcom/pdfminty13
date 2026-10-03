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
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { ToolLongForm } from '../components/ToolLongForm';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

export type CompressionMode = 'lossless' | 'downsample';
export type DownsamplePreset = 'recommended' | 'extreme';

export const CompressPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('lossless');
  const [downsamplePreset, setDownsamplePreset] = useState<DownsamplePreset>('recommended');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customQuality, setCustomQuality] = useState<number>(0.80);
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);

  // Compression stats
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const limitMB = TOOL_SIZE_LIMITS['compress-pdf']?.maxSingleMB || 100;

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setOriginalSize(files[0].size);
      setError(null);
      setIsSuccess(false);
      setCompressedBlob(null);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setCompressedBlob(null);

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      const level = compressionMode === 'lossless' ? 'basic' : downsamplePreset;
      const options = {
        level,
        mode: compressionMode,
        quality: showAdvanced ? customQuality : (level === 'extreme' ? 0.68 : 0.80),
        grayscale: showAdvanced ? isGrayscale : false,
      };

      // Do NOT transfer fileBytes.buffer so fileBytes remains intact in main thread
      const compressedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'compressPDF',
        { bytes: fileBytes, options }
      );

      // Senior Engineering Guarantee: Invariant that compressed output is NEVER larger than original.
      // If compressedBytes is valid and smaller or equal to original, use it; otherwise preserve the original bytes.
      const finalBytes =
        compressedBytes &&
        compressedBytes.byteLength > 0 &&
        compressedBytes.byteLength <= fileBytes.byteLength
          ? compressedBytes
          : fileBytes;

      const safeBuffer = finalBytes.buffer.slice(
        finalBytes.byteOffset,
        finalBytes.byteOffset + finalBytes.byteLength
      );
      const blob = new Blob([safeBuffer], { type: 'application/pdf' });
      const rawBase = selectedFile.name.replace(/\.pdf$/i, '').trim();
      const safeName = sanitizeDownloadFilename(`${rawBase || 'document'}-compressed.pdf`);
      const url = URL.createObjectURL(blob);

      setCompressedBlob(blob);
      setCompressedSize(finalBytes.byteLength);
      setDownloadUrl(url);
      setDownloadName(safeName);
      setIsSuccess(true);

      // Attempt automatic download (fail-safe: even if browser blocks unprompted download, manual button is ready)
      try {
        await downloadBlob(blob, safeName);
      } catch (dlErr) {
        logger.warn('Browser prevented automatic download. Manual download button is active:', dlErr);
      }
    } catch (err: unknown) {
      logger.error('Compress operation failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('compressPdf.unexpectedError', {
            defaultValue: 'An error occurred while compressing your PDF document.',
          })
      );
    } finally {
      setIsProcessing(false);
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

  const handleOpenPreview = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
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

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
                id="compress_pdf_uploader"
              />
            ) : (
              <div
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                id="loaded_compress_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(selectedFile.size)} • PDF Document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Results card upon successful compression */}
            {isSuccess && (
              <div
                className="p-5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4"
                id="compress_success_banner"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Compression Completed Successfully!</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                    {percentSaved > 0 ? `-${percentSaved}% Saved` : 'Fully Optimized'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Original Size:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {formatBytes(originalSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Compressed:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatBytes(compressedSize)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                      Space Saved:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {savedBytes > 0
                        ? `${formatBytes(savedBytes)} (${percentSaved}%)`
                        : 'Max Optimized (Best Ratio)'}
                    </span>
                  </div>
                </div>

                {savedBytes === 0 && (
                  <div className="space-y-1.5 text-[11px] text-emerald-800 dark:text-emerald-200 leading-normal">
                    <p className="m-0">
                      ℹ️ <strong>Already Compact:</strong> This document is already in the most optimized structure for this tier. Original size was strictly preserved to prevent file bloating.
                    </p>
                    {compressionMode === 'lossless' && (
                      <p className="m-0 text-slate-600 dark:text-slate-300">
                        Need higher compression?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCompressionMode('downsample');
                            setIsSuccess(false);
                          }}
                          className="font-bold text-indigo-700 dark:text-indigo-400 underline hover:text-indigo-800 cursor-pointer"
                        >
                          Switch to Image Downsampling (Maximum Size Drop)
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {downloadUrl && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleManualDownload}
                        id="manual_download_btn"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Compressed PDF ({formatBytes(compressedSize)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenPreview}
                        id="preview_pdf_btn"
                        className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                        <span>Preview / Open in New Tab</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                      💡 Click <strong>Download Compressed PDF</strong> above to save. If your browser blocked automatic downloading, the manual button or <strong>Preview / Open</strong> allows instant saving.
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
              <h3 className="font-bold text-slate-900 dark:text-white">
                Compression Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Select your preferred compression level
              </p>
            </div>

            {/* International Standard Compression Modes */}
            <div className="space-y-3">
              {/* Option 1: Lossless Pass (Default) */}
              <div
                onClick={() => setCompressionMode('lossless')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  compressionMode === 'lossless'
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
                      Lossless Pass (Default)
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                    100% Quality
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Zero visual change • Keeps vector text sharp
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  Compacts object streams, cleans metadata & embedded thumbnails. Perfect for text and contracts with zero visual change.
                </p>
              </div>

              {/* Option 2: Image Downsampling (Maximum Size Drop) */}
              <div
                onClick={() => setCompressionMode('downsample')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  compressionMode === 'downsample'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/25 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Image Downsampling
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                    Maximum Size Drop
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                  High-DPI canvas re-sampling (Up to ~80% reduction)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                  Re-samples high-DPI raster images to JPEG via canvas. Ideal for heavy scans and strict email attachment limits.
                </p>

                {/* Sub-presets for Image Downsampling */}
                {compressionMode === 'downsample' && (
                  <div
                    className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 grid grid-cols-2 gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setDownsamplePreset('recommended')}
                      className={`p-2 rounded-lg text-[11px] font-bold text-left transition-all border cursor-pointer ${
                        downsamplePreset === 'recommended'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-black">Balanced (80%)</span>
                      <span className="text-[10px] font-normal opacity-90">Sharp text, scans</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDownsamplePreset('extreme')}
                      className={`p-2 rounded-lg text-[11px] font-bold text-left transition-all border cursor-pointer ${
                        downsamplePreset === 'extreme'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="block font-black">Extreme (68%)</span>
                      <span className="text-[10px] font-normal opacity-90">Max MB drop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings Accordion */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  Advanced Custom Settings
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {showAdvanced ? 'Hide' : 'Configure'}
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showAdvanced && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900">
                  {compressionMode === 'downsample' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          Custom JPEG Quality:
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(customQuality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.40"
                        max="0.90"
                        step="0.05"
                        value={customQuality}
                        onChange={(e) => setCustomQuality(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isGrayscale}
                      onChange={(e) => setIsGrayscale(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Convert to Grayscale (B&W) for extra 30-40% drop</span>
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
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing in Browser...</span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Compress & Download PDF</span>
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

      {/* Embedded SEO long-form article & technical FAQ */}
      <ToolLongForm slug="compress-pdf" />
    </div>
  );
};


export default CompressPdfPage;
