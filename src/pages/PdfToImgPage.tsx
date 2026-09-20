import JSZip from 'jszip';
import { Eye, Download, AlertCircle, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { getPdfJs } from '../core/index';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const PdfToImgPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<{ page: number; dataUrl: string; format: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [maxPagesLimit, setMaxPagesLimit] = useState<string>('15');
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [scale, setScale] = useState<1.0 | 1.5 | 2.0>(1.5);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const urlsRef = React.useRef<string[]>([]);
  const operationTokenRef = React.useRef(0);

  React.useEffect(() => {
    urlsRef.current = imageUrls.map((item) => item.dataUrl);
  }, [imageUrls]);

  React.useEffect(() => {
    return () => {
      // Clean up all generated URLs when leaving page
      urlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      operationTokenRef.current++;  // Invalidate in-flight render
      imageUrls.forEach((item) => URL.revokeObjectURL(item.dataUrl));
      setSelectedFile(files[0]);
      setImageUrls([]);
      setError(null);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    }
  };

  const handleExport = async () => {
    if (!selectedFile) return;
    const myToken = ++operationTokenRef.current;

    imageUrls.forEach((item) => URL.revokeObjectURL(item.dataUrl));
    setError(null);
    setImageUrls([]);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const maxPagesVal = maxPagesLimit === 'all' ? undefined : parseInt(maxPagesLimit, 10);

      // Get total page count for progress display.
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({ data: fileBytes.slice() });
      const pdf = await loadingTask.promise;
      const total = maxPagesVal ? Math.min(pdf.numPages, maxPagesVal) : pdf.numPages;
      await pdf.destroy();

      if (myToken !== operationTokenRef.current) return;
      setProgress({ current: 0, total });
      setLoading(true);

      const collected: { page: number; dataUrl: string; format: string }[] = [];
      const zipEntries: { filename: string; blob: Blob }[] = [];

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        if (myToken !== operationTokenRef.current) {
          return;
        }

        // SINGLE worker roundtrip per page — render this page directly from
        // the source PDF. The sanitizer inside pdfToImage copies the buffer,
        // so fileBytes is never detached and can be reused across iterations.
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >(
          'pdfToImage',
          {
            bytes: fileBytes,
            originalName: selectedFile.name,
            scale,
            maxPages: 1,
            format: exportFormat,
            startPage: pageNum,
          }
          // NOTE: do NOT transfer fileBytes.buffer — we need it for the next iteration.
        );

        if (rendered.length === 0) break;

        const item = rendered[0];
        const blob = new Blob([item.imageBytes as unknown as BlobPart], { type: exportFormat });
        const url = URL.createObjectURL(blob);
        collected.push({ page: pageNum, dataUrl: url, format: exportFormat });

        const ext = exportFormat === 'image/jpeg' ? 'jpeg' : 'png';
        const filename = `pdfminty_page_${pageNum}_${selectedFile.name.replace(/\.pdf$/i, '')}.${ext}`;
        zipEntries.push({ filename, blob });

        if (myToken !== operationTokenRef.current) return;
        setProgress({ current: pageNum, total });
        // Yield to the event loop so the UI can repaint the progress bar.
        await new Promise((r) => setTimeout(r, 0));
      }

      if (myToken !== operationTokenRef.current) return;

      // Package all images into a single ZIP for one-shot download.
      // This avoids Chrome's "1 download per user gesture" popup-blocker rule.
      let finalBlob: Blob;
      let finalFilename: string;

      if (zipEntries.length === 1) {
        finalBlob = zipEntries[0].blob;
        finalFilename = zipEntries[0].filename;
      } else {
        const zip = new JSZip();
        for (const entry of zipEntries) {
          zip.file(entry.filename, entry.blob);
        }
        finalBlob = await zip.generateAsync({ type: 'blob' });
        finalFilename = `pdfminty_${selectedFile.name.replace(/\.pdf$/i, '')}_images.zip`;
      }

      const url = URL.createObjectURL(finalBlob);
      setDownloadUrl(url);
      setDownloadName(finalFilename);

      await downloadBlob(finalBlob, finalFilename);
      setImageUrls(collected);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      logger.error('Export images failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(
        errMsg ||
          t('pdfToImg.parseError', {
            defaultValue: 'Error occurred during PDF parsing. Encrypted documents are not supported for canvas extraction.',
          })
      );
    } finally {
      if (myToken === operationTokenRef.current) {
        setLoading(false);
        setProgress(null);
      }
    }
  };

  const downloadImage = (dataUrl: string, page: number, format: string) => {
    if (!selectedFile) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    const ext = format === 'image/jpeg' ? 'jpeg' : 'png';
    link.download = `pdfminty_page_${page}_${selectedFile.name.replace(/\.pdf$/i, '')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="pdf_to_img_container">
      <SEO slug="pdf-to-image" />
      <ToolHeader slug="pdf-to-image" limitMB={TOOL_SIZE_LIMITS['pdf-to-image'].maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Eye className="w-5 h-5 text-violet-600" />
              <span>{t('pdfToImg.workspace', { defaultValue: 'Document Workspace' })}</span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                maxSizeMB={TOOL_SIZE_LIMITS['pdf-to-image'].maxSingleMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_to_img_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {t('pdfToImg.pdfDocument', { defaultValue: 'PDF Document' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    operationTokenRef.current++;  // Invalidate any in-flight rendering
                    setSelectedFile(null);
                    imageUrls.forEach((item) => URL.revokeObjectURL(item.dataUrl));
                    setImageUrls([]);
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="pdf_to_img_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('pdfToImg.successTitle', { defaultValue: 'Conversion Completed Successfully! Your files are ready.' })}</span>
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
                    <span>{t('pdfToImg.downloadCompiled', { defaultValue: 'Download Compiled Images (ZIP / Image)' })}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {progress && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>{t('pdfToImg.renderingProgress', { defaultValue: 'Rendering pages...' })}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!selectedFile && (
            <EmptyState
              title={t('pdfToImg.emptyTitle', { defaultValue: 'Upload a PDF to convert to images' })}
              description={t('pdfToImg.emptyDesc', { defaultValue: 'Select a document above to render and extract high-definition image files.' })}
            />
          )}

          {imageUrls.length > 0 && (
            <div
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              id="rendered_img_deck"
            >
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                {t('pdfToImg.renderedPagesTitle', { defaultValue: 'Rendered Pages Decodes' })}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageUrls.map((item) => (
                  <div
                    key={item.page}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] relative w-full bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm flex items-center justify-center">
                      <img
                        src={item.dataUrl}
                        alt={`Page ${item.page}`}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {t('pdfToImg.pageLabel', { page: item.page, defaultValue: `Page ${item.page}` })}
                      </span>
                      <button
                        onClick={() => downloadImage(item.dataUrl, item.page, item.format)}
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="uppercase">{item.format.replace('image/', '')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('pdfToImg.exportTitle', { defaultValue: 'Image Export' })}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('pdfToImg.exportDesc', {
                defaultValue: 'Export is performed entirely inside your browser. No document data is ever sent to a server.',
              })}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="export_format_select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('pdfToImg.formatLabel', { defaultValue: 'Export Format:' })}
                </label>
                <select
                  id="export_format_select"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'image/png' | 'image/jpeg')}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="image/png">
                    {t('pdfToImg.formatPng', { defaultValue: 'PNG (Lossless, higher quality)' })}
                  </option>
                  <option value="image/jpeg">
                    {t('pdfToImg.formatJpeg', { defaultValue: 'JPEG (Smaller file size, fast sharing)' })}
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="scale_select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('pdfToImg.qualityLabel', { defaultValue: 'Render Quality:' })}
                </label>
                <select
                  id="scale_select"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value) as 1.0 | 1.5 | 2.0)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="1">
                    {t('pdfToImg.qualitySmall', { defaultValue: '1.0x (Smaller, faster)' })}
                  </option>
                  <option value="1.5">
                    {t('pdfToImg.qualityBalanced', { defaultValue: '1.5x (Balanced)' })}
                  </option>
                  <option value="2">
                    {t('pdfToImg.qualityHigh', { defaultValue: '2.0x (High-res, larger file)' })}
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="max_pages_limit_select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('pdfToImg.maxPagesLabel', { defaultValue: 'Max pages to convert:' })}
                </label>
                <select
                  id="max_pages_limit_select"
                  value={maxPagesLimit}
                  onChange={(e) => setMaxPagesLimit(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="5">
                    {t('pdfToImg.pages5', { defaultValue: 'First 5 Pages' })}
                  </option>
                  <option value="10">
                    {t('pdfToImg.pages10', { defaultValue: 'First 10 Pages' })}
                  </option>
                  <option value="15">
                    {t('pdfToImg.pages15', { defaultValue: 'First 15 Pages' })}
                  </option>
                  <option value="30">
                    {t('pdfToImg.pages30', { defaultValue: 'First 30 Pages' })}
                  </option>
                  <option value="all">
                    {t('pdfToImg.pagesAll', { defaultValue: 'All Pages (Unlimited)' })}
                  </option>
                </select>
              </div>
            </div>

            {(maxPagesLimit === 'all' || parseInt(maxPagesLimit, 10) > 15) && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 leading-normal">
                <span className="font-bold block mb-0.5">
                  {t('pdfToImg.memoryWarningTitle', { defaultValue: '⚠️ Memory warning:' })}
                </span>
                {t('pdfToImg.memoryWarningText', {
                  defaultValue:
                    'Rendering many pages at high-definition scales uses significant browser memory and CPU locally. For very large PDF files, this might cause your browser tab to temporarily freeze.',
                })}
              </div>
            )}

            <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 text-[11px] text-violet-800 font-medium leading-normal flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <span>
                {t('pdfToImg.featureBadge', { defaultValue: 'Converts PDF plates locally to raw PNG grids' })}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {imageUrls.length === 0 && (
              <button
                onClick={handleExport}
                disabled={!selectedFile || loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-violet-600/10 ${
                  selectedFile && !loading
                    ? 'bg-violet-600 hover:bg-violet-700 cursor-pointer hover:-translate-y-0.5'
                    : 'bg-slate-300 pointer-events-none shadow-none'
                }`}
              >
                {loading ? (
                  <span className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{t('pdfToImg.extractingButton', { defaultValue: 'Extracting layers...' })}</span>
                  </span>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t('pdfToImg.renderButton', { defaultValue: 'Render Pages' })}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
