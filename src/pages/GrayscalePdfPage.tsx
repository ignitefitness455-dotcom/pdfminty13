import { RefreshCw, AlertCircle, Printer, Download } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const GrayscalePdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scale, setScale] = useState<number>(1.5);
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

  const handleGrayscale = async () => {
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
      const processedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'grayscalePDF',
        { bytes: fileBytes, scale },
        [fileBytes.buffer]
      );
      const blob = new Blob([processedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_grayscale_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Grayscale error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('grayscalePdf.unexpectedError', {
            defaultValue: 'An unexpected error occurred while converting the PDF to grayscale.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  const limitMB = TOOL_SIZE_LIMITS['grayscale-pdf']?.maxSingleMB || 30;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadein" id="grayscale_page_container">
      <SEO slug="grayscale-pdf" />
      <ToolHeader slug="grayscale-pdf" limitMB={limitMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Printer className="w-5 h-5 text-security-green" />
              <span>{t('grayscalePdf.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                title={t('fileUploader.selectPdf', { defaultValue: 'Select a PDF file' })}
                subtitle={t('grayscalePdf.uploadSubtitle', {
                  limit: limitMB,
                  defaultValue: `Drag and drop your document here or browse (Max: ${limitMB}MB)`,
                })}
                maxSizeMB={limitMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_grayscale_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {t('grayscalePdf.pdfDocument', { defaultValue: 'PDF Document' })}
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                  <span>
                    {t('grayscalePdf.successTitle', {
                      defaultValue:
                        'Conversion Completed Successfully! Your monochrome PDF has been generated.',
                    })}
                  </span>
                </div>
                {downloadUrl && (
                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      id="manual_download_link"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>
                        {t('grayscalePdf.downloadMonochrome', {
                          defaultValue: 'Download Monochrome PDF',
                        })}
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('grayscalePdf.settingsTitle', { defaultValue: 'Grayscale Settings' })}
            </h3>
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {t('grayscalePdf.resolutionLabel', {
                  defaultValue: 'Render Resolution (DPI Quality)',
                })}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    key: 'normal',
                    labelKey: 'grayscalePdf.resNormal',
                    label: 'Normal',
                    value: 1.0,
                    descKey: 'grayscalePdf.resNormalDesc',
                    desc: 'Faster / Lighter',
                  },
                  {
                    key: 'high',
                    labelKey: 'grayscalePdf.resHigh',
                    label: 'High',
                    value: 1.5,
                    descKey: 'grayscalePdf.resHighDesc',
                    desc: 'Sharp text',
                  },
                  {
                    key: 'ultra',
                    labelKey: 'grayscalePdf.resUltra',
                    label: 'Ultra',
                    value: 2.0,
                    descKey: 'grayscalePdf.resUltraDesc',
                    desc: 'Maximum print',
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScale(opt.value)}
                    className={`p-2.5 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                      scale === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{t(opt.labelKey, { defaultValue: opt.label })}</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{t(opt.descKey, { defaultValue: opt.desc })}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleGrayscale}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                selectedFile && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('grayscalePdf.convertingButton', { defaultValue: 'Converting Pages...' })}</span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('grayscalePdf.convertAndDownload', { defaultValue: 'Convert & Download' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deep Content & Comprehensive Guide Section */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed" id="grayscale_guide_section">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('grayscalePdf.guideTitle', {
              defaultValue: 'Comprehensive Guide to Converting Color PDFs to Grayscale (Black & White)',
            })}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {t('grayscalePdf.guideLead', {
              defaultValue:
                'Converting high-resolution color PDF documents to pure monochrome (grayscale) is one of the most effective strategies for slashing file byte size, optimizing documents for bulk office printing, and preparing legal or academic filings according to strict publication guidelines.',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('grayscalePdf.advTitle', { defaultValue: 'Key Advantages of Grayscale Conversion' })}
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-4">
              <li>
                <strong>{t('grayscalePdf.adv1Bold', { defaultValue: 'Major File Size Reduction:' })}</strong>{' '}
                {t('grayscalePdf.adv1Text', {
                  defaultValue: 'Strips redundant 24-bit RGB and 32-bit CMYK color channels, compressing documents by up to 60-80%.',
                })}
              </li>
              <li>
                <strong>{t('grayscalePdf.adv2Bold', { defaultValue: 'Save Expensive Printer Toner:' })}</strong>{' '}
                {t('grayscalePdf.adv2Text', {
                  defaultValue: 'Eliminates color cartridge bleeding and prevents accidental color print billing.',
                })}
              </li>
              <li>
                <strong>{t('grayscalePdf.adv3Bold', { defaultValue: 'Institutional Compliance:' })}</strong>{' '}
                {t('grayscalePdf.adv3Text', {
                  defaultValue: 'Meets official submission criteria for courts, patent registries, and academic libraries that enforce monochrome requirements.',
                })}
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('grayscalePdf.algoTitle', { defaultValue: 'Luminance-Preserving Conversion Algorithms' })}
            </h3>
            <p className="text-xs text-slate-600 leading-normal">
              {t('grayscalePdf.algoText1', {
                defaultValue: 'PdfMinty uses standard ITU-R BT.601 luminance weighting',
              })}{' '}
              <code>(Y = 0.299R + 0.587G + 0.114B)</code>{' '}
              {t('grayscalePdf.algoText2', {
                defaultValue:
                  'during page re-rasterization. This ensures that yellow highlights, subtle charts, and colored contrast text remain perfectly legible without muddying into solid black or washing out into white.',
              })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            {t('grayscalePdf.stepsTitle', {
              defaultValue: 'How to Convert PDFs to Monochrome in 3 Easy Steps',
            })}
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
            <li>
              <strong>{t('grayscalePdf.step1Bold', { defaultValue: 'Select File:' })}</strong>{' '}
              {t('grayscalePdf.step1Text', {
                defaultValue: 'Upload or drag-and-drop your target color PDF into the converter above.',
              })}
            </li>
            <li>
              <strong>{t('grayscalePdf.step2Bold', { defaultValue: 'Select Resolution:' })}</strong>{' '}
              {t('grayscalePdf.step2Text', {
                defaultValue: 'Choose from Normal (1.0x for web sharing), High (1.5x for crisp text), or Ultra (2.0x for archival print).',
              })}
            </li>
            <li>
              <strong>{t('grayscalePdf.step3Bold', { defaultValue: 'Process & Download:' })}</strong>{' '}
              {t('grayscalePdf.step3Text', {
                defaultValue: 'Click "Convert & Download" to process each page locally in your browser memory and save your monochrome document.',
              })}
            </li>
          </ol>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
          <p className="font-bold">{t('grayscalePdf.privacyTitle', { defaultValue: '🔒 100% Client-Side Privacy' })}</p>
          <p className="leading-normal text-slate-600">
            {t('grayscalePdf.privacyText', {
              defaultValue:
                'All document rasterization, color math, and PDF reconstruction take place locally on your computer using WebAssembly and HTML5 Canvas. Your confidential pages are never uploaded to any cloud server.',
            })}
          </p>
        </div>
      </section>
    </div>
  );
};

export default GrayscalePdfPage;
