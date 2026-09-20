import { RotateCw, AlertCircle, Download } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const RotatePage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [degrees, setDegrees] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  // Live preview states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [renderingPreview, setRenderingPreview] = useState<boolean>(false);
  const operationTokenRef = React.useRef<number>(0);

  React.useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [downloadUrl, previewUrl]);

  // Extract first page preview image
  React.useEffect(() => {
    const generatePreview = async () => {
      if (!selectedFile) {
        setPreviewUrl(null);
        return;
      }

      const myToken = ++operationTokenRef.current;
      setRenderingPreview(true);

      try {
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;

        // Render first page as PNG image using the worker operation
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >('pdfToImage', { bytes: fileBytes, originalName: selectedFile.name, scale: 0.4 }, [
          fileBytes.buffer,
        ]);

        if (myToken !== operationTokenRef.current) return;

        if (rendered && rendered.length > 0) {
          const blob = new Blob([rendered[0].imageBytes as unknown as BlobPart], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (err) {
        logger.error('Failed to generate rotate page preview:', err);
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingPreview(false);
        }
      }
    };

    generatePreview();
  }, [selectedFile]);

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

  const handleRotate = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const rotatedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'rotatePDF',
        { bytes: fileBytes, degreesValue: degrees },
        [fileBytes.buffer]
      );
      const blob = new Blob([rotatedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_rotated_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Rotate error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('rotatePdf.unexpectedError', {
            defaultValue: 'An unexpected error occurred while rotating the PDF.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="rotate_page_container">
      <SEO slug="rotate-pdf" />

      <ToolHeader slug="rotate-pdf" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <RotateCw className="w-5 h-5 text-blue-600" />

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['rotate-pdf'].maxSingleMB}
              />
            ) : (
              <div className="space-y-4">
                <div
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  id="loaded_rotate_file"
                >
                  <div className="truncate pr-4">
                    <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {t('rotatePdf.pdfDocument', { defaultValue: 'PDF Document' })}
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
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span>{t('toolCommon.preview', { defaultValue: 'Live Preview' })}</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                      {t('rotatePdf.page', { defaultValue: 'Page' })} 1 • {degrees}°
                    </span>
                  </div>

                  {/* Frame container for holding the 3D rotating box */}
                  <div className="relative w-full aspect-[1/1.4] max-w-sm mx-auto bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200 flex items-center justify-center p-8">
                    {renderingPreview ? (
                      <div className="flex flex-col items-center gap-2.5 text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold tracking-wider uppercase animate-pulse">
                          {t('rotatePdf.loadingDocument', { defaultValue: 'Loading Document...' })}
                        </span>
                      </div>
                    ) : (
                      <div 
                        className="w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-md rounded-lg overflow-hidden bg-white"
                        style={{ transform: `rotate(${degrees}deg)` }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={t('rotatePdf.previewAlt', { page: 1, defaultValue: 'PDF Page 1 Preview' })}
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          // Exquisite mock page overlay if PDF.js is unavailable
                          <div className="w-full h-full bg-white flex flex-col justify-between p-6">
                            <div className="space-y-3 opacity-[0.08]">
                              <div className="h-4 w-1/2 bg-slate-900 rounded"></div>
                              <div className="space-y-1.5 pt-2">
                                <div className="h-2 w-full bg-slate-800 rounded"></div>
                                <div className="h-2 w-full bg-slate-800 rounded"></div>
                                <div className="h-2 w-5/6 bg-slate-800 rounded"></div>
                              </div>
                              <div className="space-y-1.5 pt-4">
                                <div className="h-2 w-full bg-slate-800 rounded"></div>
                                <div className="h-2 w-4/5 bg-slate-800 rounded"></div>
                              </div>
                              <div className="space-y-1.5 pt-4">
                                <div className="h-2 w-full bg-slate-800 rounded"></div>
                                <div className="h-2 w-full bg-slate-800 rounded"></div>
                                <div className="h-2 w-2/3 bg-slate-800 rounded"></div>
                              </div>
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold self-center text-center mt-auto bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              {t('rotatePdf.templateView', { defaultValue: 'Template View' })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="rotate_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>
                  {t('rotatePdf.successTitle', {
                    defaultValue: 'Rotation Completed Successfully! Your rotated PDF has been generated.',
                  })}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                {t('rotatePdf.successDesc', {
                  defaultValue: 'The pages have been rotated and saved completely offline in your browser.',
                })}
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
                    <span>{t('rotatePdf.downloadRotated', { defaultValue: 'Download Rotated PDF' })}</span>
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
              {t('rotatePdf.rotationAngle', { defaultValue: 'Rotation Angle' })}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setDegrees(deg)}
                  aria-pressed={degrees === deg}
                  aria-label={t('rotatePdf.rotateDegreesAria', { deg, defaultValue: `Rotate ${deg} degrees` })}
                  className={`py-3.5 rounded-xl border font-bold text-sm transition-all ${
                    degrees === deg
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  disabled={!selectedFile}
                >
                  +{deg}°
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {t('rotatePdf.angleHelp', {
                defaultValue: 'Clockwise rotation applied unconditionally across all page grids.',
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
              onClick={handleRotate}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/10 ${
                selectedFile && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('rotatePdf.rotatingButton', { defaultValue: 'Rotating sheets...' })}</span>
                </span>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>{t('rotatePdf.rotateButton', { defaultValue: 'Rotate PDF' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
