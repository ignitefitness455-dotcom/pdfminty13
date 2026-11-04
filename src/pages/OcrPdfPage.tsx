import {
  Sparkles,
  Copy,
  Download,
  AlertCircle,
  RefreshCw,
  FileText,
  Check,
  FileCheck2,
  Crown,
  XCircle,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getToolLimit } from '../config/constants';
import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { getPdfJs } from '../core/index';
import { PDFSanitizer } from '../core/PDFSanitizer';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';
import { recordDailyTask, resolveCurrentSession } from '../utils/usageLimit';

interface OcrPagePreview {
  index: number;
  dataUrl: string;
}

const MAX_OCR_IMAGE_BYTES = 1800 * 1024; // ~1.8 MB binary (~2.4 MB base64, well below 4 MB proxy cap)
const MAX_OCR_IMAGE_DIMENSION = 2200;

function uint8ToBase64DataUrl(bytes: Uint8Array, mimeType: string): string {
  const safeMime =
    mimeType && mimeType.startsWith('image/')
      ? mimeType.toLowerCase() === 'image/jpg'
        ? 'image/jpeg'
        : mimeType.toLowerCase()
      : 'image/jpeg';
  const chunks: string[] = [];
  for (let i = 0; i < bytes.byteLength; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return `data:${safeMime};base64,${btoa(chunks.join(''))}`;
}

async function encodeImageFileForOcr(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(buffer);
  const mimeType = file.type || 'image/jpeg';

  // Compress/downscale large image uploads on a white canvas so high-res photos never trigger HTTP 413
  if (rawBytes.byteLength > MAX_OCR_IMAGE_BYTES && typeof createImageBitmap === 'function') {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(new Blob([rawBytes], { type: mimeType }));
      if (bitmap.width > 0 && bitmap.height > 0 && typeof document !== 'undefined') {
        const scale = Math.min(
          1,
          MAX_OCR_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
        );
        const targetW = Math.max(1, Math.round(bitmap.width * scale));
        const targetH = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(bitmap, 0, 0, targetW, targetH);
          const compressedBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85)
          );
          if (compressedBlob) {
            const compressedBytes = new Uint8Array(await compressedBlob.arrayBuffer());
            if (compressedBytes.byteLength > 0) {
              return uint8ToBase64DataUrl(compressedBytes, 'image/jpeg');
            }
          }
        }
      }
    } catch {
      // Fall back to raw bytes if canvas/bitmap decoding is unavailable
    } finally {
      bitmap?.close?.();
    }
  }

  return uint8ToBase64DataUrl(rawBytes, mimeType);
}

export const OcrPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, firebaseUser, isPro: authIsPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const { tier } = resolveCurrentSession(user);
  const isPro = Boolean(authIsPro || tier === 'pro' || user?.plan === 'pro');
  const isLoggedIn = Boolean(user);
  const effectiveLimitMB = isPro ? 500 : getToolLimit('ocr-pdf', isPro, isLoggedIn).maxSingleMB;
  const maxBatchPages = isPro ? 15 : 5;
  const maxPreviewPages = isPro ? 25 : 10;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page rendering and selection states
  const [pagePreviews, setPagePreviews] = useState<OcrPagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [renderingPreviews, setRenderingPreviews] = useState(false);

  // OCR result states
  const [ocrResult, setOcrResult] = useState<string>('');
  const [ocrLanguage, setOcrLanguage] = useState<string>('auto');
  const [copied, setCopied] = useState(false);
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  const operationTokenRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pagePreviews.forEach((p) => URL.revokeObjectURL(p.dataUrl));
    };
  }, [pagePreviews]);

  useEffect(() => {
    const token = operationTokenRef;
    const abortRef = abortControllerRef;
    return () => {
      token.current++;
      abortRef.current?.abort();
    };
  }, []);

  // Load document and render page previews if it is a PDF
  useEffect(() => {
    const handleFileLoad = async () => {
      setPagePreviews([]);
      setSelectedPages(new Set());
      setOcrResult('');
      setError(null);

      if (!selectedFile) {
        return;
      }

      // Handle image file uploads directly
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPagePreviews([{ index: 0, dataUrl: url }]);
        setSelectedPages(new Set([0]));
        return;
      }

      // Handle PDF uploads
      setRenderingPreviews(true);
      const myToken = ++operationTokenRef.current;

      try {
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;

        const isEncrypted = await PDFSanitizer.isEncrypted(fileBytes);
        if (myToken !== operationTokenRef.current) return;
        if (isEncrypted) {
          setError(
            'SECURED_LOCKED: This PDF appears to be password protected — please use Unlock PDF first.'
          );
          return;
        }

        const pdfjs = await getPdfJs();
        const doc = await pdfjs.getDocument({ data: fileBytes.slice() }).promise;

        const loadedPreviews: OcrPagePreview[] = [];
        let committedPreviews = false;
        try {
          // Pro users preview up to 25 pages; standard users up to 10 pages
          const pagesToRender = Math.min(doc.numPages, maxPreviewPages);

          for (let i = 1; i <= pagesToRender; i++) {
            if (myToken !== operationTokenRef.current) {
              loadedPreviews.forEach((p) => URL.revokeObjectURL(p.dataUrl));
              return;
            }
            const page = await doc.getPage(i);
            try {
              const viewport = page.getViewport({ scale: 0.8 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (context) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, viewport.width, viewport.height);
                await page.render({
                  canvasContext: context,
                  viewport,
                  background: 'rgb(255, 255, 255)',
                }).promise;
                const blob = await new Promise<Blob | null>((resolve) =>
                  canvas.toBlob(resolve, 'image/jpeg', 0.85)
                );
                if (blob && myToken === operationTokenRef.current) {
                  const url = URL.createObjectURL(blob);
                  loadedPreviews.push({ index: i - 1, dataUrl: url });
                }
              }
            } finally {
              page.cleanup();
              if (
                myToken === operationTokenRef.current &&
                loadedPreviews.length === pagesToRender
              ) {
                loadedPreviews.sort((a, b) => a.index - b.index);
                committedPreviews = true;
                setPagePreviews([...loadedPreviews]);
              }
            }
          }

          // Default select first page
          if (myToken === operationTokenRef.current) {
            if (!committedPreviews && loadedPreviews.length > 0) {
              loadedPreviews.sort((a, b) => a.index - b.index);
              committedPreviews = true;
              setPagePreviews([...loadedPreviews]);
            }
            if (loadedPreviews.length > 0) {
              setSelectedPages(new Set([0]));
            }
          } else if (!committedPreviews) {
            loadedPreviews.forEach((p) => URL.revokeObjectURL(p.dataUrl));
          }
        } catch (renderErr) {
          if (!committedPreviews) {
            loadedPreviews.forEach((p) => URL.revokeObjectURL(p.dataUrl));
          }
          throw renderErr;
        } finally {
          await doc.destroy().catch(() => {
            /* ignore */
          });
        }
      } catch (err: unknown) {
        logger.error('Failed to parse document for OCR previews:', err);
        const errName = (err as { name?: string })?.name || '';
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          errName === 'PasswordException' ||
          errMsg.includes('SECURED_LOCKED') ||
          errMsg.toLowerCase().includes('password')
        ) {
          setError(
            'SECURED_LOCKED: This PDF appears to be password protected — please use Unlock PDF first.'
          );
        } else {
          setError('Failed to analyze the PDF file. It might be corrupted or encrypted.');
        }
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingPreviews(false);
        }
      }
    };

    void handleFileLoad();
  }, [selectedFile, maxPreviewPages]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const togglePageSelection = (pageIdx: number) => {
    const nextSelection = new Set(selectedPages);
    if (nextSelection.has(pageIdx)) {
      if (nextSelection.size > 1) {
        nextSelection.delete(pageIdx);
      }
    } else {
      if (nextSelection.size >= maxBatchPages) {
        setError(
          isPro
            ? `Pro Batch OCR supports up to ${maxBatchPages} pages per batch for optimal vision accuracy.`
            : `Standard mode allows up to ${maxBatchPages} pages per run. Upgrade to Pro for Full Batch OCR (up to 15 pages at once)!`
        );
        return;
      }
      nextSelection.add(pageIdx);
      setError(null);
    }
    setSelectedPages(nextSelection);
  };

  const handleSelectBatchPages = () => {
    const batch = pagePreviews.slice(0, maxBatchPages).map((p) => p.index);
    setSelectedPages(new Set(batch));
    setError(null);
  };

  const handleCancelOcr = () => {
    operationTokenRef.current++;
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  const handleStartOcr = async () => {
    if (!selectedFile || loading) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }
    if (selectedPages.size === 0) {
      setError('Please select at least one page to transcribe.');
      return;
    }
    if (!hasConsented) {
      setError(
        'Please acknowledge the Cloud AI Vision consent checkbox before proceeding with OCR extraction.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setOcrResult('');

    const myToken = ++operationTokenRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const imageBase64s: string[] = [];

      if (selectedFile.type.startsWith('image/')) {
        const encoded = await encodeImageFileForOcr(selectedFile);
        if (myToken !== operationTokenRef.current) return;
        imageBase64s.push(encoded);
      } else {
        // PDF pages conversion via single-pass worker call
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;

        const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);
        const pageNumbersOneBased = pagesArray.map((idx) => idx + 1);
        const targetScale = pagesArray.length > 5 ? 1.25 : 1.5;

        const renderedBatch = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >('pdfToImage', {
          bytes: fileBytes.slice(),
          originalName: selectedFile.name,
          scale: targetScale,
          maxPages: pageNumbersOneBased.length,
          format: 'image/jpeg',
          startPage: pageNumbersOneBased[0] || 1,
          pageNumbers: pageNumbersOneBased,
        });

        if (myToken !== operationTokenRef.current) return;

        if (renderedBatch && renderedBatch.length > 0) {
          for (const item of renderedBatch) {
            imageBase64s.push(uint8ToBase64DataUrl(item.imageBytes, 'image/jpeg'));
          }
        }
      }

      if (myToken !== operationTokenRef.current) return;

      if (imageBase64s.length === 0) {
        throw new Error('Could not render any selected pages for OCR transcription.');
      }

      // Invoke the Gemini AI proxy endpoint for OCR extraction
      const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (firebaseUser && typeof firebaseUser.getIdToken === 'function') {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) {
            requestHeaders.Authorization = `Bearer ${idToken}`;
          }
        } catch {
          // Proceed unauthenticated if token refresh fails on optional OCR auth
        }
      }

      const res = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          mode: 'ocr',
          imagesBase64: imageBase64s,
          language: ocrLanguage,
        }),
        signal: controller.signal,
      });

      if (myToken !== operationTokenRef.current) return;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || `AI OCR request failed (${res.status})`
        );
      }

      const data = (await res.json()) as { success: boolean; result: string };
      setOcrResult(data.result || 'No text could be extracted from the document.');
      recordDailyTask(user, 'ocr_pdf');
    } catch (err: unknown) {
      if (
        myToken !== operationTokenRef.current ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        return;
      }
      logger.error('OCR Extraction error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An error occurred during AI character recognition.');
    } finally {
      if (myToken === operationTokenRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!ocrResult) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(ocrResult);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyErr) {
      logger.warn('Clipboard write failed:', copyErr);
    }
  };

  const handleDownloadTxt = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' });
    const name = `pdfminty_ocr_${selectedFile?.name.replace(/\.[^/.]+$/, '')}.txt`;
    void downloadBlob(blob, name, { skipQuotaRecord: true });
  };

  const handleDownloadMd = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult], { type: 'text/markdown;charset=utf-8' });
    const name = `pdfminty_ocr_${selectedFile?.name.replace(/\.[^/.]+$/, '')}.md`;
    void downloadBlob(blob, name, { skipQuotaRecord: true });
  };

  const isQuotaError = Boolean(
    error &&
      (error.toLowerCase().includes('quota') ||
        error.toLowerCase().includes('limit') ||
        error.toLowerCase().includes('429') ||
        error.toLowerCase().includes('exhausted') ||
        error.toLowerCase().includes('busy'))
  );

  const isLockedError = Boolean(
    error &&
      (error.includes('SECURED_LOCKED') ||
        error.toLowerCase().includes('password') ||
        error.toLowerCase().includes('encrypted'))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="ocr_pdf_page_container">
      <SEO slug="ocr-pdf" />
      <ToolHeader slug="ocr-pdf" limitMB={effectiveLimitMB} />

      {!selectedFile ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
            maxSizeMB={effectiveLimitMB}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: File details and layout selection */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {selectedFile.type.startsWith('image/') ? 'Image File' : 'PDF Document'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    operationTokenRef.current++;
                    abortControllerRef.current?.abort();
                    setLoading(false);
                    setSelectedFile(null);
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 py-1 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>

              {!selectedFile.type.startsWith('image/') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      {isPro && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      <span>
                        {isPro
                          ? `Pro Batch OCR (Up to ${maxBatchPages} Pages)`
                          : t('ocrPdf.selectPagesTitle', {
                              defaultValue: 'Select Pages for AI OCR (Max 5)',
                            })}
                      </span>
                    </p>
                    {pagePreviews.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectBatchPages}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 underline cursor-pointer"
                      >
                        Select Batch ({Math.min(pagePreviews.length, maxBatchPages)})
                      </button>
                    )}
                  </div>
                  {renderingPreviews ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mr-2" />
                      <span className="text-xs text-slate-400">
                        {t('ocrPdf.preparingThumbnails', {
                          defaultValue: 'Preparing page thumbnails...',
                        })}
                      </span>
                    </div>
                  ) : pagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      {pagePreviews.map((p) => {
                        const isSelected = selectedPages.has(p.index);
                        return (
                          <button
                            key={p.index}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`Page ${p.index + 1}`}
                            onClick={() => togglePageSelection(p.index)}
                            className={`relative aspect-[3/4] rounded-lg border-2 overflow-hidden transition-all bg-white dark:bg-slate-900 group ${
                              isSelected
                                ? 'border-emerald-600 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <img
                              src={p.dataUrl}
                              alt={`Page ${p.index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-opacity ${
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-slate-900'
                                }`}
                              >
                                {isSelected ? '✓' : p.index + 1}
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 font-mono text-[8px] bg-slate-950/70 text-white px-1.5 py-0.5 rounded-md">
                              Page {p.index + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                      No page previews available for this document.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label
                    htmlFor="ocr_language_select"
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block"
                  >
                    Document Language:
                  </label>
                  <select
                    id="ocr_language_select"
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="auto">{t('ocrPdf.autoDetect')}</option>
                    <option value="en">{t('ocr.lang.en', { defaultValue: 'English' })}</option>
                    <option value="bn">
                      {t('ocr.lang.bn', { defaultValue: 'Bengali (বাংলা)' })}
                    </option>
                    <option value="hi">
                      {t('ocr.lang.hi', { defaultValue: 'Hindi (हिन्दी)' })}
                    </option>
                    <option value="es">
                      {t('ocr.lang.es', { defaultValue: 'Spanish (Español)' })}
                    </option>
                    <option value="fr">
                      {t('ocr.lang.fr', { defaultValue: 'French (Français)' })}
                    </option>
                    <option value="de">
                      {t('ocr.lang.de', { defaultValue: 'German (Deutsch)' })}
                    </option>
                    <option value="zh">
                      {t('ocr.lang.zh', { defaultValue: 'Chinese (中文)' })}
                    </option>
                    <option value="ar">
                      {t('ocr.lang.ar', { defaultValue: 'Arabic (العربية)' })}
                    </option>
                  </select>
                </div>

                {/* AI Vision Disclosure & Explicit Consent Box */}
                <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-950 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {t('ocrPdf.consentTitle', {
                        defaultValue: 'Cloud AI Vision Disclosure & Consent',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {isPro
                      ? `Selected pages (up to ${maxBatchPages}) are converted into images and transmitted securely via HTTPS proxy to Google Gemini Multimodal Vision API solely for optical character recognition. Standard PdfMinty tools process files 100% locally in your browser; this AI feature requires external cloud processing.`
                      : t('ocrPdf.consentDesc', {
                          defaultValue:
                            'Selected pages (up to 5) are converted into images and transmitted securely via HTTPS proxy to Google Gemini Multimodal Vision API solely for optical character recognition. Standard PdfMinty tools process files 100% locally in your browser; this AI feature requires external cloud processing.',
                        })}
                  </p>
                  <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasConsented}
                      onChange={(e) => setHasConsented(e.target.checked)}
                      className="mt-0.5 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      {t('ocrPdf.consentCheckbox', {
                        defaultValue:
                          'I understand and consent to transmitting selected page images to Google Gemini AI Vision for OCR transcription.',
                      })}
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleStartOcr()}
                    disabled={loading || selectedPages.size === 0 || !hasConsented}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>
                          {t('ocrPdf.processingButton', {
                            defaultValue: 'Transcribing via AI Vision...',
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400 dark:text-white" />
                        <span>
                          {t('ocrPdf.processButton', {
                            defaultValue: 'Extract Text with AI Vision',
                          })}
                        </span>
                      </>
                    )}
                  </button>
                  {loading && (
                    <button
                      type="button"
                      id="cancel_ocr_btn"
                      onClick={handleCancelOcr}
                      className="flex items-center justify-center gap-1.5 py-3 px-3.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t('toolCommon.cancel', { defaultValue: 'Cancel' })}</span>
                    </button>
                  )}
                </div>
              </div>

              {error &&
                (isQuotaError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-sm flex-col w-full"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="font-extrabold text-amber-900 dark:text-amber-200">
                        {t('ocrPdf.busyMessage')}
                      </p>
                    </div>
                    <div className="pl-6 space-y-1 text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      <p>
                        {t('ocrPdf.orUseOffline')}{' '}
                        <Link
                          to={ROUTES.HOME}
                          className="underline text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold"
                        >
                          {t('tools.mergePdf')} &amp; {t('tools.splitPdf')}
                        </Link>
                      </p>
                      <p>
                        {t('ocrPdf.rateLimitReached', {
                          defaultValue:
                            'Rate limit reached. Please wait a few minutes before trying again.',
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    role="alert"
                    className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 rounded-xl flex flex-col gap-2 text-rose-800 dark:text-rose-200 text-xs font-medium"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error.replace(/^SECURED_LOCKED:\s*/i, '')}</span>
                    </div>
                    {isLockedError && (
                      <div className="pl-6">
                        <Link
                          to={ROUTES.UNLOCK}
                          className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 underline hover:text-rose-900"
                        >
                          {t('tools.unlockPdf', { defaultValue: 'Unlock PDF' })} →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Right panel: Extracted editable text output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{t('ocrPdf.resultTitle', { defaultValue: 'OCR Extracted Result' })}</span>
                  </h2>

                  {ocrResult && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopy()}
                        className="p-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg flex items-center gap-1 transition-all"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[250px]">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {t('ocrPdf.engineTranscribing', {
                        defaultValue: 'AI OCR Engine Transcribing Pixels...',
                      })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                      {t('ocrPdf.analyzingStructure', {
                        defaultValue:
                          'Analyzing page structures, text blocks, and table formats to build clean Markdown.',
                      })}
                    </p>
                  </div>
                ) : ocrResult ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <textarea
                      value={ocrResult}
                      onChange={(e) => setOcrResult(e.target.value)}
                      aria-label="Transcribed OCR text output"
                      className="w-full flex-1 min-h-[280px] p-4 bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[250px]">
                    <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('ocrPdf.noContent', { defaultValue: 'No Extracted Content Yet' })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                      {t('ocrPdf.selectTargetPages', {
                        defaultValue:
                          'Select target pages and click the button on the left to transcribe characters.',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {ocrResult && !loading && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('ocrPdf.downloadTxt', { defaultValue: 'Download TXT' })}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadMd}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>
                      {t('ocrPdf.downloadMd', { defaultValue: 'Download Markdown (MD)' })}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrPdfPage;
