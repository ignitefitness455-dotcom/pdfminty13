import { Sparkles, Copy, Download, AlertCircle, RefreshCw, FileText, Check, FileCheck2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { ROUTES } from '../config/routes';
import { getPdfJs } from '../core/index';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

interface OcrPagePreview {
  index: number;
  dataUrl: string;
}

export const OcrPdfPage: React.FC = () => {
  const { t } = useTranslation('common');
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

  const operationTokenRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      pagePreviews.forEach((p) => URL.revokeObjectURL(p.dataUrl));
    };
  }, [pagePreviews]);

  // Load document and render page previews if it is a PDF
  useEffect(() => {
    const handleFileLoad = async () => {
      if (!selectedFile) {
        setPagePreviews([]);
        setSelectedPages(new Set());
        setOcrResult('');
        return;
      }

      setOcrResult('');
      setError(null);

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

        const pdfjs = await getPdfJs();
        const doc = await pdfjs.getDocument({ data: fileBytes.slice() }).promise;

        const loadedPreviews: OcrPagePreview[] = [];
        // Limit previews generation to first 10 pages for speed, but let them OCR any page
        const pagesToRender = Math.min(doc.numPages, 10);

        for (let i = 1; i <= pagesToRender; i++) {
          if (myToken !== operationTokenRef.current) return;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.8 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            canvas.toBlob((blob) => {
              if (blob && myToken === operationTokenRef.current) {
                const url = URL.createObjectURL(blob);
                loadedPreviews.push({ index: i - 1, dataUrl: url });
                if (loadedPreviews.length === pagesToRender) {
                  // Sort to match original order
                  loadedPreviews.sort((a, b) => a.index - b.index);
                  setPagePreviews([...loadedPreviews]);
                }
              }
            }, 'image/jpeg', 0.85);
          }
        }

        // Default select first page
        setSelectedPages(new Set([0]));
      } catch (err) {
        logger.error('Failed to parse document for OCR previews:', err);
        setError('Failed to analyze the PDF file. It might be corrupted or encrypted.');
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingPreviews(false);
        }
      }
    };

    handleFileLoad();
  }, [selectedFile]);

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
      // Limit to max 5 pages per run to protect rate limits and timeout budgets
      if (nextSelection.size >= 5) {
        setError('To ensure high performance and respect rate limits, please select up to 5 pages at a time.');
        return;
      }
      nextSelection.add(pageIdx);
      setError(null);
    }
    setSelectedPages(nextSelection);
  };

  const handleStartOcr = async () => {
    if (!selectedFile) return;
    if (selectedPages.size === 0) {
      setError('Please select at least one page to transcribe.');
      return;
    }

    setLoading(true);
    setError(null);
    setOcrResult('');

    const myToken = ++operationTokenRef.current;

    try {
      const imageBase64s: string[] = [];

      if (selectedFile.type.startsWith('image/')) {
        // Direct image convert to base64
        const buffer = await selectedFile.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageBase64s.push(`data:${selectedFile.type};base64,${btoa(binary)}`);
      } else {
        // PDF pages conversion
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;

        const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);

        for (const pageNum of pagesArray) {
          // Single-page worker render for high accuracy
          const rendered = await WorkerManager.getInstance().runOperation<
            { page: number; imageBytes: Uint8Array }[]
          >('pdfToImage', {
            bytes: fileBytes,
            originalName: selectedFile.name,
            scale: 1.5, // slightly higher scale for extremely accurate OCR readability
            maxPages: 1,
            format: 'image/jpeg',
            startPage: pageNum + 1,
          });

          if (myToken !== operationTokenRef.current) return;
          if (rendered && rendered.length > 0) {
            let binary = '';
            const imgBytes = rendered[0].imageBytes;
            const len = imgBytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(imgBytes[i]);
            }
            imageBase64s.push(`data:image/jpeg;base64,${btoa(binary)}`);
          }
        }
      }

      if (myToken !== operationTokenRef.current) return;

      // Invoke the Gemini AI proxy endpoint for OCR extraction
      const res = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ocr',
          imagesBase64: imageBase64s,
        }),
      });

      if (myToken !== operationTokenRef.current) return;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `AI OCR request failed (${res.status})`);
      }

      const data = (await res.json()) as { success: boolean; result: string };
      setOcrResult(data.result || 'No text could be extracted from the document.');
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      logger.error('OCR Extraction error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An error occurred during AI character recognition.');
    } finally {
      if (myToken === operationTokenRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCopy = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' });
    const name = `pdfminty_ocr_${selectedFile?.name.replace(/\.[^/.]+$/, '')}.txt`;
    downloadBlob(blob, name);
  };

  const handleDownloadMd = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult], { type: 'text/markdown;charset=utf-8' });
    const name = `pdfminty_ocr_${selectedFile?.name.replace(/\.[^/.]+$/, '')}.md`;
    downloadBlob(blob, name);
  };

  const isQuotaError = !!(
    error &&
    (error.toLowerCase().includes('quota') ||
      error.toLowerCase().includes('limit') ||
      error.toLowerCase().includes('429') ||
      error.toLowerCase().includes('exhausted') ||
      error.toLowerCase().includes('busy'))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="ocr_pdf_page_container">
      <SEO slug="ocr-pdf" />
      <ToolHeader slug="ocr-pdf" limitMB={TOOL_SIZE_LIMITS['ocr-pdf'].maxSingleMB} />

      {!selectedFile ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
            maxSizeMB={TOOL_SIZE_LIMITS['ocr-pdf'].maxSingleMB}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: File details and layout selection */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.startsWith('image/') ? 'Image File' : 'PDF Document'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-1 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>

              {!selectedFile.type.startsWith('image/') && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('ocrPdf.selectPagesTitle', { defaultValue: 'Select Pages for AI OCR (Max 5)' })}</p>
                  {renderingPreviews ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mr-2" />
                      <span className="text-xs text-slate-400">{t('ocrPdf.preparingThumbnails', { defaultValue: 'Preparing page thumbnails...' })}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      {pagePreviews.map((p) => (
                        <button
                          key={p.index}
                          onClick={() => togglePageSelection(p.index)}
                          className={`relative aspect-[3/4] rounded-lg border-2 overflow-hidden transition-all bg-white group ${
                            selectedPages.has(p.index) ? 'border-emerald-600 shadow-sm' : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img src={p.dataUrl} alt={`Page ${p.index + 1}`} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-opacity ${
                            selectedPages.has(p.index) ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                          }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              selectedPages.has(p.index) ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'
                            }`}>
                              {selectedPages.has(p.index) ? '✓' : p.index + 1}
                            </div>
                          </div>
                          <span className="absolute bottom-1 right-1 font-mono text-[8px] bg-slate-950/70 text-white px-1.5 py-0.5 rounded-md">
                            Page {p.index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label htmlFor="ocr_language_select" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Document Language:
                  </label>
                  <select
                    id="ocr_language_select"
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="auto">{t("ocrPdf.autoDetect")}</option>
                    <option value="en">{t("ocr.lang.en", { defaultValue: "English" })}</option>
                    <option value="bn">{t("ocr.lang.bn", { defaultValue: "Bengali (বাংলা)" })}</option>
                    <option value="es">{t("ocr.lang.es", { defaultValue: "Spanish (Español)" })}</option>
                    <option value="fr">{t("ocr.lang.fr", { defaultValue: "French (Français)" })}</option>
                    <option value="de">{t("ocr.lang.de", { defaultValue: "German (Deutsch)" })}</option>
                    <option value="ar">{t("ocr.lang.ar", { defaultValue: "Arabic (العربية)" })}</option>
                  </select>
                </div>

                <button
                  onClick={handleStartOcr}
                  disabled={loading || selectedPages.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('ocrPdf.processingButton', { defaultValue: 'Transcribing via AI Vision...' })}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{t('ocrPdf.processButton', { defaultValue: 'Extract Text with AI Vision' })}</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                isQuotaError ? (
                  <div className="flex items-start gap-3 text-xs text-amber-800 bg-amber-50/50 border border-amber-200 p-4 rounded-xl shadow-sm flex-col w-full">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="font-extrabold text-amber-900">{t("ocrPdf.busyMessage")}</p>
                    </div>
                    <div className="pl-6 space-y-1 text-slate-600 font-medium leading-relaxed">
                      <p>{t("ocrPdf.orUseOffline")} <Link to={ROUTES.HOME} className="underline text-emerald-700 hover:text-emerald-800 font-bold">{t("tools.mergePdf")} &amp; {t("tools.splitPdf")}</Link></p>
                      <p>{t('ocrPdf.rateLimitReached', { defaultValue: 'Rate limit reached. Please wait a few minutes before trying again.' })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right panel: Extracted editable text output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{t('ocrPdf.resultTitle', { defaultValue: 'OCR Extracted Result' })}</span>
                  </h2>

                  {ocrResult && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex items-center gap-1 transition-all"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[250px]">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                    <p className="text-xs font-bold text-slate-700">{t('ocrPdf.engineTranscribing', { defaultValue: 'AI OCR Engine Transcribing Pixels...' })}</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs">{t('ocrPdf.analyzingStructure', { defaultValue: 'Analyzing page structures, text blocks, and table formats to build clean Markdown.' })}</p>
                  </div>
                ) : ocrResult ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <textarea
                      value={ocrResult}
                      onChange={(e) => setOcrResult(e.target.value)}
                      aria-label="Transcribed OCR text output"
                      className="w-full flex-1 min-h-[280px] p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400 leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[250px]">
                    <Sparkles className="w-8 h-8 text-slate-300 mb-3" />
                    <p className="text-xs font-bold text-slate-600">{t('ocrPdf.noContent', { defaultValue: 'No Extracted Content Yet' })}</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs">{t('ocrPdf.selectTargetPages', { defaultValue: 'Select target pages and click the button on the left to transcribe characters.' })}</p>
                  </div>
                )}
              </div>

              {ocrResult && !loading && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-2.5">
                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('ocrPdf.downloadTxt', { defaultValue: 'Download TXT' })}</span>
                  </button>
                  <button
                    onClick={handleDownloadMd}
                    className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{t('ocrPdf.downloadMd', { defaultValue: 'Download Markdown (MD)' })}</span>
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
