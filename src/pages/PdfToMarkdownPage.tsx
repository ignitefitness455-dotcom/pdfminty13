import JSZip from 'jszip';
import {
  FileCode2,
  AlertCircle,
  Copy,
  Download,
  Check,
  Eye,
  Code2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { ROUTES } from '../config/routes';
import { useToast } from '../contexts/ToastContext';
import type { ExtractedMarkdownImage, PdfToMarkdownResult } from '../core/pdf-operations';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Simple parser for **bold**, *italic*, ***bold italic***
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('***') && raw.endsWith('***')) {
      parts.push(
        <strong key={match.index} className="font-bold italic">
          {raw.slice(3, -3)}
        </strong>
      );
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {raw.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(raw);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}

function renderMarkdownToJsx(markdown: string): React.ReactNode {
  if (!markdown.trim()) {
    return <p className="text-slate-400 italic">{t('pdfToMarkdown.noContent', { defaultValue: 'No content to display.' })}</p>;
  }

  const blocks = markdown.split(/\n{2,}/);

  return (
    <div className="space-y-4 font-sans text-slate-800 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed === '---') {
          return <hr key={idx} className="border-t border-slate-200 my-4" />;
        }

        if (trimmed.startsWith('# ')) {
          return (
            <div key={idx} role="heading" aria-level={2} className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-200 pb-2">
              {renderInlineFormatting(trimmed.substring(2))}
            </div>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg md:text-xl font-extrabold text-slate-900 mt-2">
              {renderInlineFormatting(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900">
              {renderInlineFormatting(trimmed.substring(4))}
            </h3>
          );
        }

        if (trimmed.startsWith('![') && trimmed.includes('](')) {
          const altMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(trimmed);
          return (
            <div key={idx} className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 flex items-center gap-2.5 my-2">
              <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Embedded Figure: {altMatch ? altMatch[2] : 'Image'}</span>
            </div>
          );
        }

        // Table block
        if (trimmed.includes('|') && trimmed.includes('---')) {
          const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length >= 2) {
            const headerCells = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
            const dataRows = lines.slice(2).map((row) =>
              row.split('|').map((c) => c.trim()).filter(Boolean)
            );
            return (
              <div key={idx} className="overflow-x-auto my-3 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      {headerCells.map((cell, cIdx) => (
                        <th key={cIdx} className="p-2.5 border-r border-slate-200 last:border-r-0">
                          {renderInlineFormatting(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-slate-100 last:border-r-0">
                            {renderInlineFormatting(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // List block
        const lines = trimmed.split('\n');
        const isUnordered = lines.every((l) => l.trim().startsWith('- '));
        const isOrdered = lines.every((l) => /^\d+\.\s+/.test(l.trim()));

        if (isUnordered) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-sm">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>{renderInlineFormatting(l.trim().substring(2))}</li>
              ))}
            </ul>
          );
        }

        if (isOrdered) {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-sm">
              {lines.map((l, lIdx) => {
                const content = l.trim().replace(/^\d+\.\s+/, '');
                return <li key={lIdx}>{renderInlineFormatting(content)}</li>;
              })}
            </ol>
          );
        }

        return (
          <p key={idx} className="text-sm">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const PdfToMarkdownPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractImages, setExtractImages] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEncryptedError, setIsEncryptedError] = useState<boolean>(false);

  const [markdownText, setMarkdownText] = useState<string>('');
  const [images, setImages] = useState<ExtractedMarkdownImage[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isScannedResult, setIsScannedResult] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const operationTokenRef = useRef<number>(0);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
      setIsEncryptedError(false);
      setIsScannedResult(false);
      setMarkdownText('');
      setImages([]);
      setProgress(null);
    }
  };

  const handleRunAiOcr = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setIsEncryptedError(false);
    setProgress({ current: 1, total: 3 });
    const myToken = ++operationTokenRef.current;

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      const rendered = await WorkerManager.getInstance().runOperation<
        { page: number; imageBytes: Uint8Array }[]
      >(
        'pdfToImage',
        {
          bytes: fileBytes,
          originalName: selectedFile.name,
          scale: 1.5,
          maxPages: 6,
          format: 'image/jpeg',
          startPage: 1,
        }
      );

      if (myToken !== operationTokenRef.current) return;
      if (!rendered || rendered.length === 0) {
        throw new Error('Failed to render PDF page images for AI OCR recognition.');
      }

      setProgress({ current: 2, total: 3 });

      const base64Images = rendered.map((r) => {
        let binary = '';
        const len = r.imageBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(r.imageBytes[i]);
        }
        return `data:image/jpeg;base64,${btoa(binary)}`;
      });

      const res = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ocr',
          imagesBase64: base64Images,
        }),
      });

      if (myToken !== operationTokenRef.current) return;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `AI OCR request failed (${res.status})`);
      }

      const data = (await res.json()) as { success: boolean; result: string };
      setMarkdownText(data.result || '# AI OCR Transcribed Document\n\nNo text extracted.');
      setPageCount(rendered.length);
      setIsScannedResult(false);
      setProgress({ current: 3, total: 3 });
      showToast('Successfully extracted Markdown via Multimodal AI Vision OCR!', 'success');
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      logger.error('AI OCR error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to perform AI Vision OCR recognition.');
      showToast('AI OCR extraction failed.', 'error');
    } finally {
      if (myToken === operationTokenRef.current) {
        setLoading(false);
        setProgress(null);
      }
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setIsEncryptedError(false);
    setIsScannedResult(false);
    setProgress({ current: 0, total: 1 });
    const myToken = ++operationTokenRef.current;

    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      const result = await WorkerManager.getInstance().runOperation<PdfToMarkdownResult>(
        'pdfToMarkdown',
        {
          bytes: fileBytes,
          options: { extractImages },
        },
        [fileBytes.buffer],
        (prog) => {
          if (myToken === operationTokenRef.current) {
            setProgress(prog);
          }
        }
      );

      if (myToken !== operationTokenRef.current) return;

      setMarkdownText(result.markdown);
      setImages(result.images || []);
      setPageCount(result.pageCount || 1);
      setIsScannedResult(!!result.isScannedOrImageOnly);
      showToast('Successfully converted PDF to Markdown Free — Convert PDF to Editable MD!', 'success');
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      logger.error('PDF to Markdown error:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('SECURED_LOCKED') || msg.includes('password protected')) {
        setIsEncryptedError(true);
        setError('This PDF is password protected. Please unlock it before converting to Markdown.');
      } else {
        setError(msg || 'Failed to convert PDF to Markdown. The file may be corrupted.');
      }
      showToast('Conversion failed. Check error details below.', 'error');
    } finally {
      if (myToken === operationTokenRef.current) {
        setLoading(false);
        setProgress(null);
      }
    }
  };

  const handleCopy = async () => {
    if (!markdownText) return;
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      showToast('Markdown copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = async () => {
    if (!selectedFile || !markdownText) return;
    const baseName = selectedFile.name.replace(/\.pdf$/i, '');

    if (extractImages && images.length > 0) {
      const zip = new JSZip();
      zip.file(`${baseName}.md`, markdownText);
      for (const img of images) {
        zip.file(`images/${img.filename}`, img.dataBytes);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      await downloadBlob(zipBlob, `pdfminty_${baseName}_markdown.zip`);
      showToast('Downloaded Markdown + Images ZIP bundle!', 'success');
    } else {
      const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
      await downloadBlob(blob, `${baseName}.md`);
      showToast('Downloaded clean Markdown file!', 'success');
    }
  };

  const limitMB = TOOL_SIZE_LIMITS['pdf-to-markdown']?.maxSingleMB || 35;

  const isQuotaError = !!(
    error &&
    (error.toLowerCase().includes('quota') ||
      error.toLowerCase().includes('limit') ||
      error.toLowerCase().includes('429') ||
      error.toLowerCase().includes('exhausted') ||
      error.toLowerCase().includes('busy'))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="pdf_to_markdown_container">
      <SEO slug="pdf-to-markdown" />
      <ToolHeader slug="pdf-to-markdown" limitMB={limitMB} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-2 font-bold text-slate-800">
                <FileCode2 className="w-5 h-5 text-emerald-600" />
                <span>{t('pdfToMarkdown.sourceDocument', { defaultValue: 'Source Document' })}</span>
              </span>
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={limitMB}
              />
            ) : (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                id="loaded_markdown_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setMarkdownText('');
                    setImages([]);
                  }}
                  disabled={loading}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {loading && progress && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{t('pdfToMarkdown.extractingText', { defaultValue: 'Extracting text structure...' })}</span>
                  <span>
                    Page {progress.current} of {progress.total} (
                    {Math.round((progress.current / progress.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">{t('pdfToMarkdown.conversionOptions', { defaultValue: 'Conversion Options' })}</h3>

            <label
              htmlFor="extract_images_opt"
              aria-label="Extract images alongside markdown"
              className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors"
            >
              <input
                id="extract_images_opt"
                type="checkbox"
                checked={extractImages}
                onChange={(e) => setExtractImages(e.target.checked)}
                disabled={loading}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">{t('pdfToMarkdown.extractImagesToo', { defaultValue: 'Extract images too' })}</span>
                <span className="text-slate-500 block mt-0.5">{t('pdfToMarkdown.extractImagesDesc', { defaultValue: 'Package embedded figures alongside Markdown links into a downloadable .zip archive.' })}</span>
              </div>
            </label>

            {error && (
              isQuotaError ? (
                <div className="flex items-start gap-3 text-xs text-amber-800 bg-amber-50/50 border border-amber-200 p-4 rounded-xl shadow-sm flex-col w-full">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="font-extrabold text-amber-900">{t("pdfToMarkdown.busyMessage")}</p>
                  </div>
                  <div className="pl-6 space-y-1 text-slate-600 font-medium leading-relaxed">
                    <p>{t("pdfToMarkdown.orUseOffline")} <Link to={ROUTES.HOME} className="underline text-emerald-700 hover:text-emerald-800 font-bold">{t("tools.mergePdf")} &amp; {t("tools.splitPdf")}</Link></p>
                    <p>{t('pdfToMarkdown.rateLimitReached', { defaultValue: 'Rate limit reached. Please wait a few minutes before trying again.' })}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-bold">{error}</p>
                    {isEncryptedError && (
                      <Link
                        to={ROUTES.UNLOCK}
                        className="inline-block font-bold underline text-emerald-700 hover:text-emerald-800"
                      >
                        Use Unlock PDF Tool →
                      </Link>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConvert}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                selectedFile && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 pointer-events-none shadow-none'
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('toolCommon.processing', { defaultValue: 'Converting...' })}</span>
                </span>
              ) : (
                <>
                  <FileCode2 className="w-4 h-4" />
                  <span>{t('toolCommon.process', { defaultValue: 'Smart Layout Convert (Fast)' })}</span>
                </>
              )}
            </button>

            <button
              onClick={handleRunAiOcr}
              disabled={!selectedFile || loading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border ${
                selectedFile && !loading
                  ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-300 cursor-pointer'
                  : 'bg-slate-50 text-slate-400 border-slate-200 pointer-events-none'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t("pdfToMarkdown.aiVisionMode")}</span>
            </button>
          </div>
        </div>
      </div>

      {isScannedResult && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs md:text-sm text-amber-900">
              <p className="font-extrabold text-base text-amber-950">{t("pdfToMarkdown.scannedDetected")}</p>
              <p>
                Standard text-layer extraction yielded minimal text because this PDF is composed of scanned images. Use our Multimodal AI Vision OCR engine to transcribe pages and tables directly into clean Markdown.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunAiOcr}
            disabled={loading}
            className="py-2.5 px-5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center space-x-2 transition-all shadow-sm flex-shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('pdfToMarkdown.transcribeWithAI', { defaultValue: 'Transcribe with AI Vision OCR' })}</span>
          </button>
        </div>
      )}

      {markdownText && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-base">{t('pdfToMarkdown.conversionOutput', { defaultValue: 'Conversion Output' })}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
              </span>
              {extractImages && images.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'} Extracted
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="py-2 px-3.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-colors border border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="py-2 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {extractImages && images.length > 0 ? 'Download .zip (MD + Images)' : 'Download .md'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>{t('pdfToMarkdown.renderedPreview', { defaultValue: 'Rendered Preview' })}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner max-h-[500px] overflow-y-auto">
                {renderMarkdownToJsx(markdownText)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <label htmlFor="raw_markdown_editor">{t("pdfToMarkdown.rawEditor")}</label>
              </div>
              <textarea
                id="raw_markdown_editor"
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl p-5 border border-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 h-[500px] leading-relaxed resize-none"
                placeholder="Editable raw Markdown text..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
