import {
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { ROUTES } from '../config/routes';
import { getPdfJs } from '../core/index';
import { PDFSanitizer } from '../core/PDFSanitizer';
import { logger } from '../utils/logger';

export const AiAnalyzePage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasConsented, setHasConsented] = useState(false);

  // AI querying state
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const operationTokenRef = React.useRef(0);
  const aiQueryTokenRef = React.useRef(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const myToken = ++operationTokenRef.current;
    const file = files[0];
    setSelectedFile(file);
    setIsExtracting(true);
    setExtractedText('');
    setAiResult('');
    setError(null);

    let pdf: PDFDocumentProxy | null = null;
    try {
      const pdfjs = await getPdfJs();
      const rawBytes = new Uint8Array(await file.arrayBuffer());

      // Sanitize the PDF before handing it to pdfjs. This neutralizes
      // /JavaScript, /JS, and /Launch action dictionaries by overwriting
      // those keyword bytes with spaces. Defense-in-depth: pdfjs is
      // generally sandboxed, but the sanitizer is a safety net that every
      // other tool in PdfMinty uses. The AI page previously bypassed it.
      let sanitizedBytes: Uint8Array;
      try {
        const sanResult = PDFSanitizer.sanitize(rawBytes);
        sanitizedBytes = sanResult.bytes;
      } catch (sanErr: unknown) {
        if (myToken !== operationTokenRef.current) return;
        const message = sanErr instanceof Error ? sanErr.message : 'Failed to sanitize PDF.';
        setError(message);
        setIsExtracting(false);
        return;
      }

      const loadingTask = pdfjs.getDocument({ data: sanitizedBytes });
      pdf = await loadingTask.promise;
      if (myToken !== operationTokenRef.current) return;
      setTotalPages(pdf.numPages);

      // Cap at 12 pages to keep payload reasonable and avoid token limits.
      const maxPages = Math.min(pdf.numPages, 12);

      let textBuffer = '';
      for (let i = 1; i <= maxPages; i++) {
        if (myToken !== operationTokenRef.current) {
          break;
        }
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (item as { str?: string }).str || '')
          .join(' ');
        textBuffer += `--- PAGE ${i} ---\n${pageText}\n\n`;
        page.cleanup();
      }

      if (myToken !== operationTokenRef.current) return;
      setExtractedText(textBuffer);
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Text extraction error:', err);
      // Surface a friendly message for encrypted PDFs, mirroring other tools.
      const lowerMsg = message.toLowerCase();
      if (
        lowerMsg.includes('encrypted') ||
        lowerMsg.includes('password') ||
        lowerMsg.includes('secured')
      ) {
        setError(
          'This PDF is encrypted or password-protected. Please use the Unlock PDF tool first, then try again.'
        );
      } else {
        setError(
          message ||
            'Failed to extract text structures. Make sure document does not contain image-only pages or lock passwords.'
        );
      }
    } finally {
      if (myToken === operationTokenRef.current) {
        setIsExtracting(false);
      }
      // Always destroy the PDF document to free WASM memory, even if extraction failed.
      if (pdf) {
        try {
          await pdf.destroy();
        } catch {
          // Ignore destroy errors — best-effort cleanup.
        }
      }
    }
  };

  const submitQuery = async (mode: 'summary' | 'qa') => {
    if (!extractedText) {
      setError('No extracted text structures found to inspect.');
      return;
    }
    if (mode === 'qa' && !query.trim()) {
      setError('Please provide a specific query prompt.');
      return;
    }

    // Abort any in-flight AI request and invalidate its token.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const myToken = ++aiQueryTokenRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s timeout

    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: extractedText,
          query: mode === 'qa' ? query : '',
          mode,
        }),
        signal: controller.signal,
      });

      // Discard stale response if a newer request was started.
      if (myToken !== aiQueryTokenRef.current) return;

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Server rejected request. Please check secret API variables.'
        );
      }

      if (myToken !== aiQueryTokenRef.current) return;
      setAiResult(data.result || 'No response returned.');
    } catch (err: unknown) {
      if (myToken !== aiQueryTokenRef.current) return;
      // Don't show error if this was aborted by a newer request.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error('AI Error:', err);
      setError(message || 'An unexpected server error occurred during AI analysis.');
    } finally {
      clearTimeout(timeoutId);
      if (myToken === aiQueryTokenRef.current) {
        setAiLoading(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
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
    <div className="space-y-6 max-w-5xl mx-auto" id="ai_analyze_page">
      <SEO slug="ai-analyze-pdf" />
      <ToolHeader slug="ai-analyze-pdf" limitMB={TOOL_SIZE_LIMITS['ai-analyze'].maxSingleMB} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload & Inspection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{t('aiAnalyze.documentUpload', { defaultValue: 'Document Upload' })}</span>
            </h3>

            {!selectedFile ? (
              <>
                <FileUploader
                  onFilesSelected={handleFilesSelected}
                  accept=".pdf,application/pdf"
                  maxSizeMB={TOOL_SIZE_LIMITS['ai-analyze'].maxSingleMB}
                />
                <EmptyState />
              </>
            ) : (
              <div className="space-y-4">
                <div
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  id="loaded_ai_file"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {totalPages} pages
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      operationTokenRef.current++; // Invalidate extraction
                      aiQueryTokenRef.current++; // Invalidate AI query
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                        abortControllerRef.current = null;
                      }
                      setSelectedFile(null);
                      setExtractedText('');
                      setAiResult('');
                      setHasConsented(false);
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1 px-2.5 rounded-lg cursor-pointer"
                  >
                    {t('toolCommon.changeFile', { defaultValue: 'Clear' })}
                  </button>
                </div>

                {isExtracting ? (
                  <div
                    className="flex items-center space-x-2 text-xs text-slate-500 justify-center py-3 bg-slate-50 rounded-xl"
                    id="extraction_spinner"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{t('aiAnalyze.extractingText', { defaultValue: 'Extracting PDF text locally...' })}</span>
                  </div>
                ) : extractedText ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-1.5 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{t('aiAnalyze.textIndexesLoaded', { defaultValue: 'Text indexes loaded successfully!' })}</span>
                    </div>

                    {extractedText && totalPages > 12 && (
                      <div
                        className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800"
                        role="status"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                          Analysis is based on the first 12 of {totalPages} pages ({((12 / totalPages) * 100).toFixed(0)}%
                          of the document). Insights may not reflect the full content.
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl space-y-2 border border-slate-200 text-xs text-slate-500 leading-normal">
            <p className="font-bold text-slate-700">{t("aiAnalyze.privacyInfoTitle")}</p>
            <p>
              
              
              
              analysis. If your document contains sensitive personal information (SSNs, passwords, financial
              data, medical records), that text will be transmitted.
            </p>
            <p>
              By checking the box below you consent to this data flow. You can revoke consent at any time by
              clearing the file.
            </p>
            <label className="flex items-start space-x-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-0.5"
                aria-label="Consent to sending extracted text to Google Gemini for analysis"
              />
              <span className="text-slate-700 font-medium">{t('aiAnalyze.consentCheckbox', { defaultValue: 'I understand the extracted text will be sent to Google Gemini and I consent.' })}</span>
            </label>
          </div>
        </div>

        {/* Right Side: AI Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[420px] space-y-6">
            <div className="space-y-4 flex-1">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">{t('aiAnalyze.controlCenter', { defaultValue: 'AI Control Center' })}</h3>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => submitQuery('summary')}
                  disabled={!extractedText || aiLoading || !hasConsented}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    extractedText && !aiLoading && hasConsented
                      ? 'bg-amber-100/50 hover:bg-amber-100 border border-amber-200 text-amber-800 cursor-pointer'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 pointer-events-none'
                  }`}
                >
                  ✨ Complete Summary
                </button>

                {[
                  { label: '📌 Key Action Items', q: 'List all action items, decisions, and deadlines mentioned in this document.' },
                  { label: '📊 Financials & Numbers', q: 'Extract all financial figures, metrics, prices, and statistics mentioned in this text.' },
                  { label: '⚠️ Risks & Disclaimers', q: 'Highlight any potential risks, disclaimers, obligations, or warnings in this document.' },
                  { label: '📝 Executive Brief', q: 'Provide a 3-bullet point executive brief of this document for a senior manager.' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setQuery(item.q);
                      submitQuery(item.q);
                    }}
                    disabled={!extractedText || aiLoading || !hasConsented}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      extractedText && !aiLoading && hasConsented
                        ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 pointer-events-none'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Chat interaction input */}
              <div className="space-y-2">
                <label
                  htmlFor="ai_query_input"
                  className="text-xs font-bold text-slate-600 uppercase tracking-wider block"
                >
                  Ask anything about this document:
                </label>
                <div className="relative">
                  <input
                    id="ai_query_input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      extractedText
                        ? 'e.g., What are the main agreements in section 3?'
                        : 'Please load a file on the left first.'
                    }
                    className="w-full border border-slate-300 rounded-xl py-2.5 pl-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={!extractedText || aiLoading || !hasConsented}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitQuery('qa');
                    }}
                  />
                  <button
                    onClick={() => submitQuery('qa')}
                    disabled={!extractedText || !query.trim() || aiLoading || !hasConsented}
                    className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg text-white transition-colors ${
                      query.trim() && !aiLoading && hasConsented
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                        : 'bg-slate-300 pointer-events-none'
                    }`}
                    aria-label="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {error && (
                isQuotaError ? (
                  <div className="flex items-start gap-3 text-xs text-amber-800 bg-amber-50/50 border border-amber-200 p-4.5 rounded-2xl shadow-sm flex-col w-full">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="font-extrabold text-amber-900">{t("aiAnalyze.busyMessage")}</p>
                    </div>
                    <div className="pl-6 space-y-1 text-slate-600 font-medium leading-relaxed">
                      <p>{t("aiAnalyze.orUseOffline")} <Link to={ROUTES.HOME} className="underline text-emerald-700 hover:text-emerald-800 font-bold">{t("tools.mergePdf")} &amp; {t("tools.splitPdf")}</Link></p>
                      <p>{t('aiAnalyze.rateLimitReached', { defaultValue: 'Rate limit reached. Please wait a few minutes before trying again.' })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3.5 rounded-xl shadow-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{t('aiAnalyze.executionError', { defaultValue: 'Execution Error' })}</p>
                      <p className="mt-0.5">{error}</p>
                    </div>
                  </div>
                )
              )}

              {/* AI response panel */}
              {aiLoading ? (
                <div
                  className="flex flex-col items-center justify-center space-y-3 py-12 border border-dashed border-slate-200 rounded-xl"
                  id="ai_loader"
                >
                  <span className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs font-semibold text-slate-500">{t('aiAnalyze.geminiThinking', { defaultValue: 'Letting Gemini think...' })}</span>
                </div>
              ) : aiResult ? (
                <div
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-inner"
                  id="ai_response_box"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{t('aiAnalyze.geminiInsights', { defaultValue: 'Gemini Core Insights' })}</span>
                  </div>
                  <div className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap whitespace-pre-line prose max-w-none">
                    {aiResult}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <Sparkles className="w-7 h-7 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-medium max-w-sm">
                    No analysis performed yet. Click one of the summary profiles or Ask a question
                    above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
