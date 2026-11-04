import { Bookmark, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getToolLimit } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';

const MAX_PREVIEW_RENDER_BYTES = 50 * 1024 * 1024; // 50 MB threshold for PDF.js thumbnail rasterization

export const WatermarkPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, isPro: authIsPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const isPro = Boolean(authIsPro || user?.isPro === true || user?.plan === 'pro');
  const isLoggedIn = Boolean(user);
  const currentLimits = getToolLimit('watermark-pdf', isPro, isLoggedIn);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [size, setSize] = useState<number>(45);
  const [opacity, setOpacity] = useState<number>(0.3);
  const [rotationDegrees, setRotationDegrees] = useState<number>(45);
  const [color, setColor] = useState<string>('#94a3b8'); // Slate-400
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [outputSize, setOutputSize] = useState<number>(0);

  // Live preview states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [renderingPreview, setRenderingPreview] = useState<boolean>(false);
  const operationTokenRef = React.useRef<number>(0);
  const isSubmittingRef = React.useRef<boolean>(false);

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Extract first page preview image (skip heavy PDF.js rasterization on files > 50MB to preserve Worker memory)
  React.useEffect(() => {
    const generatePreview = async () => {
      if (!selectedFile) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

      const myToken = ++operationTokenRef.current;

      if (selectedFile.size > MAX_PREVIEW_RENDER_BYTES) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setRenderingPreview(false);
        return;
      }

      setRenderingPreview(true);

      try {
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;

        // Render first page as PNG image using the worker operation
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >(
          'pdfToImage',
          { bytes: fileBytes, originalName: selectedFile.name, scale: 0.4, maxPages: 1 },
          [fileBytes.buffer]
        );

        if (myToken !== operationTokenRef.current) return;

        if (rendered && rendered.length > 0) {
          const blob = new Blob([rendered[0].imageBytes as unknown as BlobPart], {
            type: 'image/png',
          });
          const url = URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        logger.error('Failed to generate watermark page preview:', err);
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingPreview(false);
        }
      }
    };

    void generatePreview();
  }, [selectedFile]);

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

  const handleWatermark = async () => {
    if (!selectedFile || loading || isSubmittingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }
    const trimmedText = text.trim();
    if (!trimmedText) {
      setError(t('watermarkPdf.emptyTextError', { defaultValue: 'Please enter watermark text.' }));
      return;
    }
    if (text.length > 60) {
      setError(
        t('watermarkPdf.textTooLongError', {
          defaultValue: 'Watermark text is too long. Maximum 60 characters.',
        })
      );
      return;
    }

    const activeToken = operationTokenRef.current;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const watermarkedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'watermarkPDF',
        {
          bytes: fileBytes,
          text: trimmedText,
          options: { size, opacity, colorHex: color, rotationDegrees },
        },
        [fileBytes.buffer]
      );

      if (activeToken !== operationTokenRef.current) return;

      const blob = new Blob([watermarkedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = sanitizeDownloadFilename(`pdfminty_stamped_${selectedFile.name}`);
      const url = URL.createObjectURL(blob);
      setOutputSize(blob.size);
      setDownloadUrl(url);
      setDownloadName(name);
      setIsSuccess(true);

      addActivityItem({
        toolName: 'Watermark PDF',
        toolId: 'watermark',
        fileName: selectedFile.name,
        fileSizeFormatted: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Security',
        savings: trimmedText.slice(0, 18),
      });

      await downloadBlob(blob, name);
    } catch (err: unknown) {
      if (activeToken !== operationTokenRef.current) return;
      logger.error('Watermark error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('watermarkPdf.watermarkError', {
            defaultValue: 'An unexpected error occurred while adding the watermark.',
          })
      );
    } finally {
      isSubmittingRef.current = false;
      if (activeToken === operationTokenRef.current) {
        setLoading(false);
      }
    }
  };

  const colorOptions = [
    {
      hex: '#94a3b8',
      bgClass: 'bg-[#94a3b8]',
      label: t('watermarkPdf.colorGray', { defaultValue: 'Gray' }),
    },
    {
      hex: '#ef4444',
      bgClass: 'bg-[#ef4444]',
      label: t('watermarkPdf.colorRed', { defaultValue: 'Red' }),
    },
    {
      hex: '#22c55e',
      bgClass: 'bg-[#22c55e]',
      label: t('watermarkPdf.colorGreen', { defaultValue: 'Green' }),
    },
    {
      hex: '#3b82f6',
      bgClass: 'bg-[#3b82f6]',
      label: t('watermarkPdf.colorBlue', { defaultValue: 'Blue' }),
    },
    {
      hex: '#f59e0b',
      bgClass: 'bg-[#f59e0b]',
      label: t('watermarkPdf.colorAmber', { defaultValue: 'Amber' }),
    },
  ];

  const angleOptions = [
    {
      degrees: 45,
      label: t('watermarkPdf.angleDiagonalUp', { defaultValue: '45° Diagonal' }),
    },
    {
      degrees: 0,
      label: t('watermarkPdf.angleHorizontal', { defaultValue: '0° Horizontal' }),
    },
    {
      degrees: -45,
      label: t('watermarkPdf.angleDiagonalDown', { defaultValue: '-45° Reverse' }),
    },
  ];

  const presets = [
    {
      key: 'confidential',
      label: t('watermarkPdf.presetConfidential', { defaultValue: 'CONFIDENTIAL' }),
    },
    { key: 'draft', label: t('watermarkPdf.presetDraft', { defaultValue: 'DRAFT' }) },
    { key: 'doNotCopy', label: t('watermarkPdf.presetDoNotCopy', { defaultValue: 'DO NOT COPY' }) },
    { key: 'approved', label: t('watermarkPdf.presetApproved', { defaultValue: 'APPROVED' }) },
    { key: 'final', label: t('watermarkPdf.presetFinal', { defaultValue: 'FINAL' }) },
  ];

  const renderSvgWatermarkOverlay = (scaleFactor: number) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    // In PDF coordinate space, positive degrees rotate counter-clockwise (bottom-left to top-right).
    // In SVG coordinate space (Y-down), negative degrees rotate counter-clockwise to match PDF output.
    const svgAngle = -rotationDegrees;
    return (
      <svg
        viewBox="0 0 300 420"
        className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <text
          x="150"
          y="210"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${svgAngle} 150 210)`}
          fill={color}
          fillOpacity={opacity}
          fontSize={Math.max(10, Math.round(size * scaleFactor))}
          fontWeight="800"
          letterSpacing="1.5"
        >
          {trimmed}
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="watermark_page_container">
      <SEO slug="watermark-pdf" />
      <ToolHeader slug="watermark-pdf" limitMB={currentLimits.maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="dark:text-slate-100">
                {t('watermarkPdf.workspace', { defaultValue: 'Document Workspace' })}
              </span>
            </div>

            {!selectedFile ? (
              <div className="space-y-4">
                <FileUploader
                  onFilesSelected={handleFilesSelected}
                  accept=".pdf,application/pdf"
                  maxSizeMB={currentLimits.maxSingleMB}
                />
                <EmptyState
                  icon={Bookmark}
                  description={t('watermarkPdf.emptyState', {
                    defaultValue: 'Select a PDF document to configure and preview your watermark.',
                  })}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                  id="loaded_watermark_file"
                >
                  <div className="truncate pr-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400 tabular-nums">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {t('watermarkPdf.pdfDocument', { defaultValue: 'PDF Document' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      operationTokenRef.current++;
                      setSelectedFile(null);
                      setIsSuccess(false);
                      setError(null);
                      setOutputSize(0);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
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

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                      <span>
                        {t('watermarkPdf.previewTitle', {
                          defaultValue: 'Real-time Visual Preview',
                        })}
                      </span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {t('watermarkPdf.page1', { defaultValue: 'Page 1' })}
                    </span>
                  </div>

                  <div className="relative w-full aspect-[1/1.4] max-w-sm mx-auto bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    {renderingPreview ? (
                      <div className="flex flex-col items-center gap-2.5 text-slate-400">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold tracking-wider uppercase animate-pulse">
                          {t('watermarkPdf.loadingDoc', { defaultValue: 'Loading Document...' })}
                        </span>
                      </div>
                    ) : previewUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                        {/* Rendered PDF Page Background */}
                        <img
                          src={previewUrl}
                          alt={t('watermarkPdf.page1Alt', { defaultValue: 'PDF Page 1 Preview' })}
                          className="w-full h-full object-contain pointer-events-none"
                        />

                        {/* Real-time Watermark Overlay */}
                        {renderSvgWatermarkOverlay(0.45)}
                      </div>
                    ) : (
                      // Lightweight template page overlay when PDF.js preview is skipped (>50MB) or unavailable
                      <div className="relative w-full h-full bg-white dark:bg-slate-900 flex flex-col justify-between p-6">
                        {/* Skeletal document lines */}
                        <div className="space-y-3 opacity-[0.08] dark:opacity-[0.15]">
                          <div className="h-4 w-1/2 bg-slate-900 dark:bg-slate-200 rounded"></div>
                          <div className="space-y-1.5 pt-2">
                            <div className="h-2 w-full bg-slate-800 dark:bg-slate-300 rounded"></div>
                            <div className="h-2 w-full bg-slate-800 dark:bg-slate-300 rounded"></div>
                            <div className="h-2 w-5/6 bg-slate-800 dark:bg-slate-300 rounded"></div>
                          </div>
                          <div className="space-y-1.5 pt-4">
                            <div className="h-2 w-full bg-slate-800 dark:bg-slate-300 rounded"></div>
                            <div className="h-2 w-4/5 bg-slate-800 dark:bg-slate-300 rounded"></div>
                          </div>
                          <div className="space-y-1.5 pt-4">
                            <div className="h-2 w-full bg-slate-800 dark:bg-slate-300 rounded"></div>
                            <div className="h-2 w-full bg-slate-800 dark:bg-slate-300 rounded"></div>
                            <div className="h-2 w-2/3 bg-slate-800 dark:bg-slate-300 rounded"></div>
                          </div>
                        </div>

                        {/* Stamped text */}
                        {renderSvgWatermarkOverlay(0.45)}

                        <div className="text-[9px] text-slate-400 font-bold self-center text-center mt-auto bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                          {selectedFile.size > MAX_PREVIEW_RENDER_BYTES
                            ? t('watermarkPdf.largeFileTemplateView', {
                                defaultValue: 'Large File Fast Preview (>50 MB)',
                              })
                            : t('watermarkPdf.templateView', { defaultValue: 'Template View' })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isSuccess && (
            <div
              className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold"
              id="watermark_success_banner"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {t('watermarkPdf.successTitle', {
                      defaultValue:
                        'Watermark Applied Successfully! Your stamped PDF has been generated.',
                    })}
                  </span>
                </div>
                {outputSize > 0 && (
                  <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2.5 py-0.5 rounded-md tabular-nums">
                    {formatBytes(outputSize)}
                  </span>
                )}
              </div>
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
                      {t('watermarkPdf.downloadStamped', { defaultValue: 'Download Stamped PDF' })}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      operationTokenRef.current++;
                      setSelectedFile(null);
                      setIsSuccess(false);
                      setError(null);
                      setOutputSize(0);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                      if (downloadUrl) {
                        URL.revokeObjectURL(downloadUrl);
                        setDownloadUrl(null);
                      }
                    }}
                    id="reset_watermark_btn"
                    className="inline-flex items-center gap-2 min-h-[44px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <span>
                      {t('watermarkPdf.watermarkAnother', {
                        defaultValue: 'Watermark Another PDF',
                      })}
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
            <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('watermarkPdf.settingsTitle', { defaultValue: 'Watermark Config' })}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="watermark_text"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
                >
                  {t('watermarkPdf.stampTextLabel', { defaultValue: 'Stamp Text:' })}
                </label>
                <input
                  id="watermark_text"
                  type="text"
                  maxLength={60}
                  aria-label={t('watermarkPdf.stampTextLabel', { defaultValue: 'Stamp Text:' })}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('watermarkPdf.stampTextPlaceholder', {
                    defaultValue: 'e.g. DRAFT',
                  })}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl py-2 px-3.5 text-sm font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60"
                  disabled={!selectedFile}
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setText(preset.label)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                      disabled={!selectedFile}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 mt-1 text-right">{text.length} / 60</p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="stamp_size"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
                >
                  {t('watermarkPdf.fontSizeLabel', { size, defaultValue: `Font Size: ${size}px` })}
                </label>
                <input
                  id="stamp_size"
                  type="range"
                  min="20"
                  max="100"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                  disabled={!selectedFile}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="stamp_opacity"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
                >
                  {t('watermarkPdf.opacityLabel', {
                    opacity: (opacity * 100).toFixed(0),
                    defaultValue: `Opacity: ${(opacity * 100).toFixed(0)}%`,
                  })}
                </label>
                <input
                  id="stamp_opacity"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                  disabled={!selectedFile}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  {t('watermarkPdf.angleLabel', { defaultValue: 'Orientation:' })}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {angleOptions.map((item) => (
                    <button
                      key={item.degrees}
                      type="button"
                      onClick={() => setRotationDegrees(item.degrees)}
                      aria-pressed={rotationDegrees === item.degrees}
                      disabled={!selectedFile}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                        rotationDegrees === item.degrees
                          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  {t('watermarkPdf.colorLabel', { defaultValue: 'Stamp Color:' })}
                </span>
                <div className="flex items-center space-x-2">
                  {colorOptions.map((item) => (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => setColor(item.hex)}
                      aria-label={t('watermarkPdf.colorAria', {
                        label: item.label,
                        defaultValue: `Watermark color: ${item.label}`,
                      })}
                      aria-pressed={color === item.hex}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer disabled:opacity-50 ${item.bgClass} ${
                        color === item.hex
                          ? 'border-slate-800 dark:border-white scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105'
                      }`}
                      disabled={!selectedFile}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div
                role="alert"
                className="flex items-start space-x-1.5 text-xs text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleWatermark}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-purple-600/10 ${
                selectedFile && !loading
                  ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>
                    {t('watermarkPdf.processingButton', { defaultValue: 'Superimposing stamp...' })}
                  </span>
                </span>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>{t('watermarkPdf.applyButton', { defaultValue: 'Apply Watermark' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
