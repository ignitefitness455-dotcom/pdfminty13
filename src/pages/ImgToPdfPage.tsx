import { Image, Download, Trash2, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

export const ImgToPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [images, setImages] = useState<{ file: File; id: string; url: string }[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'A4' | 'Letter'>('fit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    urlsRef.current = images.map((img) => img.url);
  }, [images]);

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

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    const existingTotalBytes = images.reduce((acc, img) => acc + img.file.size, 0);
    const newTotalBytes = newFiles.reduce((acc, f) => acc + f.size, 0);
    const combinedBytes = existingTotalBytes + newTotalBytes;
    const maxTotalBytes = (TOOL_SIZE_LIMITS['image-to-pdf'].maxTotalMB || 100) * 1024 * 1024;

    if (combinedBytes > maxTotalBytes) {
      setError(
        t('imageToPdf.maxSizeError', {
          size: (combinedBytes / 1024 / 1024).toFixed(2),
          limit: TOOL_SIZE_LIMITS['image-to-pdf'].maxTotalMB,
          defaultValue: `Uploading failed! The combined size of all your images (${(combinedBytes / 1024 / 1024).toFixed(
            2
          )} MB) exceeds the absolute combined limit of ${TOOL_SIZE_LIMITS['image-to-pdf'].maxTotalMB} MB. Please use fewer/smaller images.`,
        })
      );
      return;
    }

    const nextImages = newFiles.map((file) => ({
      file,
      id: `${file.name}_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...nextImages]);
  };

  const handleRemove = (index: number) => {
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    const imgToRemove = images[index];
    if (imgToRemove) {
      URL.revokeObjectURL(imgToRemove.url);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearDeck = () => {
    setIsSuccess(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError(t('imageToPdf.minFilesError', { defaultValue: 'Please add at least 1 image file.' }));
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
      const imageBlobs = await Promise.all(
        images.map(async (img) => ({
          buf: new Uint8Array(await img.file.arrayBuffer()),
          type: img.file.type,
        }))
      );
      const pdfBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'imagesToPDF',
        {
          imageBlobs,
          options: pageSize === 'fit' ? undefined : { pageSize },
        },
        imageBlobs.map((b) => b.buf.buffer)
      );
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_images_${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Image logic error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          t('imageToPdf.convertError', {
            defaultValue: 'Failed to convert selected images to PDF. Ensure standard PNG/JPG formats.',
          })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="img_to_pdf_container">
      <SEO slug="image-to-pdf" />
      <ToolHeader slug="image-to-pdf" limitMB={TOOL_SIZE_LIMITS['image-to-pdf'].maxSingleMB} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Image className="w-5 h-5 text-fuchsia-600" />
              <span>{t('imageToPdf.emptyTitle', { defaultValue: 'Upload images to convert to PDF' })}</span>
            </div>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, image/bmp, image/heic, image/heif"
              maxSizeMB={TOOL_SIZE_LIMITS['image-to-pdf'].maxSingleMB}
            />
          </div>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 text-xs text-emerald-800 font-bold" id="img_to_pdf_success_banner">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-mint"></span>
                <span>{t('imageToPdf.successTitle', { defaultValue: 'PDF Created Successfully! Your images have been converted.' })}</span>
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
                    <span>{t('imageToPdf.downloadCompiled', { defaultValue: 'Download Compiled PDF' })}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {images.length === 0 ? (
            <EmptyState
              title={t('imageToPdf.emptyTitle', { defaultValue: 'Upload images to convert to PDF' })}
              description={t('imageToPdf.emptyDesc', { defaultValue: 'Select PNG, JPG, or WebP files above to build and organize your PDF document.' })}
            />
          ) : (
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              id="images_deck_list"
            >
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('imageToPdf.deckTitle', { count: images.length, defaultValue: `Arrange Photo Deck (${images.length} added)` })}
                </span>
                <button
                  onClick={handleClearDeck}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >{t('imageToPdf.clearDeck', { defaultValue: 'Clear Deck' })}</button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                {images.map((img, idx) => {
                  return (
                    <div
                      key={img.id}
                      className="relative group bg-slate-50 rounded-xl overflow-hidden border border-slate-200 p-2 flex flex-col justify-between"
                    >
                      <div className="aspect-square relative w-full rounded-lg overflow-hidden bg-slate-200">
                        <img
                          src={img.url}
                          alt={img.file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <button
                          onClick={() => handleRemove(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 hover:bg-rose-700 hover:scale-110 active:scale-95 text-white rounded-lg shadow-sm transition-transform"
                          title={t('imageToPdf.removeImageTitle', { defaultValue: 'Remove image' })}
                          aria-label={t('imageToPdf.removeImageAria', { name: img.file.name, defaultValue: `Remove image ${img.file.name}` })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-1 mt-2">
                        <p className="text-xs font-bold text-slate-800 truncate" title={img.file.name}>
                          {img.file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(img.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
              {t('imageToPdf.layoutTitle', { defaultValue: 'Layout Guidelines' })}
            </h3>
            
            <div className="space-y-2">
              <label
                htmlFor="page-size-select"
                className="block text-[11px] uppercase tracking-wide font-bold text-slate-500"
              >
                {t('imageToPdf.pageSizeLabel', { defaultValue: 'Page Size' })}
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'fit' | 'A4' | 'Letter')}
                className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-500 transition-colors"
                aria-label={t('imageToPdf.pageSizeAria', { defaultValue: 'Page size for PDF pages' })}
                disabled={loading}
              >
                <option value="fit">{t('imageToPdf.pageSizeFit', { defaultValue: 'Fit identical to Image' })}</option>
                <option value="A4">{t('imageToPdf.pageSizeA4', { defaultValue: 'A4 (Standard Document)' })}</option>
                <option value="Letter">{t('imageToPdf.pageSizeLetter', { defaultValue: 'US Letter' })}</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {error && (
              <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={images.length === 0 || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-fuchsia-600/10 ${
                images.length > 0 && !loading
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('imageToPdf.compilingButton', { defaultValue: 'Compiling pages...' })}</span>
                </span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('imageToPdf.convertButton', { defaultValue: 'Convert to PDF' })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
