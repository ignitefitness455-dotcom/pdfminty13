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
import { getToolLimit } from '../config/constants';
import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import type { ExtractedMarkdownImage, PdfToMarkdownResult } from '../core/pdf-operations';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';
import { recordDailyTask } from '../utils/usageLimit';

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

function renderMarkdownToJsx(
  markdown: string,
  t?: (key: string, options?: { defaultValue?: string }) => string
): React.ReactNode {
  if (!markdown.trim()) {
    return (
      <p className="text-slate-400 italic">
        {t
          ? t('pdfToMarkdown.noContent', { defaultValue: 'No content to display.' })
          : 'No content to display.'}
      </p>
    );
  }

  const blocks = markdown.split(/\n{2,}/);

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed === '---') {
          return <hr key={idx} className="border-t border-slate-200 dark:border-slate-700 my-4" />;
        }

        if (trimmed.startsWith('# ')) {
          return (
            <div
              key={idx}
              role="heading"
              aria-level={2}
              className="text-xl md:text-2xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2"
            >
              {renderInlineFormatting(trimmed.substring(2))}
            </div>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-2"
            >
              {renderInlineFormatting(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white">
              {renderInlineFormatting(trimmed.substring(4))}
            </h3>
          );
        }

        if (trimmed.startsWith('![') && trimmed.includes('](')) {
          const altMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(trimmed);
          return (
            <div
              key={idx}
              className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2.5 my-2"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Embedded Figure: {altMatch ? altMatch[2] : 'Image'}</span>
            </div>
          );
        }

        // Table block
        if (trimmed.includes('|') && trimmed.includes('---')) {
          const lines = trimmed
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          if (lines.length >= 2) {
            const headerCells = lines[0]
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean);
            const dataRows = lines.slice(2).map((row) =>
              row
                .split('|')
                .map((c) => c.trim())
                .filter(Boolean)
            );
            return (
              <div
                key={idx}
                className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <tr>
                      {headerCells.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          className="p-2.5 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                        >
                          {renderInlineFormatting(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0"
                          >
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
  const { user, isPro } = useAuth();
  const limitMB = getToolLimit('pdf-to-markdown', isPro, Boolean(user)).maxSingleMB;
  const { showToast } = useToast();
  const { canPerformTask, openLimitModal } = useUsageLimit();
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
  const isSubmittingRef = useRef<boolean>(false);

  React.useEffect(() => {
    const token = operationTokenRef;
    return () => {
      token.current++;
    };
  }, []);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      const candidate = files[0];
      if (candidate.size === 0) {
        setError(
          t('pdfToMarkdown.emptyFileError', {
            defaultValue: 'The selected PDF file is empty (0 bytes).',
          })
        );
        return;
      }
      operationTokenRef.current++;
      isSubmittingRef.current = false;
      setSelectedFile(candidate);
      setError(null);
      setIsEncryptedError(false);
      setIsScannedResult(false);
      setMarkdownText('');
      setImages([]);
      setProgress(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || loading || isSubmittingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }

    isSubmittingRef.current = true;
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
      recordDailyTask(null, 'pdf_to_markdown');
      addActivityItem({
        toolName: 'PDF to Markdown',
        toolId: 'pdf-to-markdown',
        fileName: sanitizeDownloadFilename(
          `${selectedFile.name.replace(/\.pdf$/i, '')}.md`,
          'document.md'
        ),
        fileSizeFormatted: `${(new Blob([result.markdown]).size / 1024).toFixed(1)} KB`,
        pages: result.pageCount || 1,
        status: 'completed',
        tag: 'Convert',
      });
      showToast(
        'Successfully converted PDF to Markdown Free — Convert PDF to Editable MD!',
        'success'
      );
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
      isSubmittingRef.current = false;
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
    const safeMdFilename = sanitizeDownloadFilename(`${baseName}.md`, 'document.md');

    if (extractImages && images.length > 0) {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      zip.file(safeMdFilename, markdownText);
      for (const img of images) {
        const safeImgFilename = sanitizeDownloadFilename(img.filename, 'image.png');
        zip.file(`images/${safeImgFilename}`, img.dataBytes);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const safeZipFilename = sanitizeDownloadFilename(
        `pdfminty_${baseName}_markdown.zip`,
        'pdfminty_markdown.zip'
      );
      await downloadBlob(zipBlob, safeZipFilename, { skipQuotaRecord: true });
      showToast('Downloaded Markdown + Images ZIP bundle!', 'success');
    } else {
      const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
      await downloadBlob(blob, safeMdFilename, { skipQuotaRecord: true });
      showToast('Downloaded clean Markdown file!', 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="pdf_to_markdown_container">
      <SEO slug="pdf-to-markdown" />
      <ToolHeader slug="pdf-to-markdown" limitMB={limitMB} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-100">
                <FileCode2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t('pdfToMarkdown.sourceDocument', { defaultValue: 'Source Document' })}
                </span>
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
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                id="loaded_markdown_file"
              >
                <div className="truncate pr-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    operationTokenRef.current++;
                    isSubmittingRef.current = false;
                    setSelectedFile(null);
                    setMarkdownText('');
                    setImages([]);
                    setError(null);
                    setIsEncryptedError(false);
                    setIsScannedResult(false);
                    setProgress(null);
                  }}
                  disabled={loading}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              </div>
            )}

            {loading && progress && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>
                    {t('pdfToMarkdown.extractingText', {
                      defaultValue: 'Extracting text structure...',
                    })}
                  </span>
                  <span>
                    Page {progress.current} of {progress.total} (
                    {Math.round((progress.current / Math.max(1, progress.total)) * 100)}%)
                  </span>
                </div>
                <progress
                  value={progress.current}
                  max={Math.max(1, progress.total)}
                  aria-label={t('pdfToMarkdown.extractingText', {
                    defaultValue: 'Extracting text structure...',
                  })}
                  className="w-full h-2.5 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-slate-100 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-emerald-600 [&::-moz-progress-bar]:bg-emerald-600"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('pdfToMarkdown.conversionOptions', { defaultValue: 'Conversion Options' })}
            </h3>

            <label
              htmlFor="extract_images_opt"
              aria-label="Extract images alongside markdown"
              className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
            >
              <input
                id="extract_images_opt"
                type="checkbox"
                checked={extractImages}
                onChange={(e) => setExtractImages(e.target.checked)}
                disabled={loading}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  {t('pdfToMarkdown.extractImagesToo', { defaultValue: 'Extract images too' })}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  {t('pdfToMarkdown.extractImagesDesc', {
                    defaultValue:
                      'Package embedded figures alongside Markdown links into a downloadable .zip archive.',
                  })}
                </span>
              </div>
            </label>

            {error && (
              <div className="flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold">{error}</p>
                  {isEncryptedError && (
                    <Link
                      to={ROUTES.UNLOCK}
                      className="inline-block font-bold underline text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                    >
                      Use Unlock PDF Tool →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleConvert}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/10 ${
                selectedFile && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 pointer-events-none shadow-none'
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
                  <span>
                    {t('toolCommon.process', { defaultValue: 'Convert to Markdown (100% Local)' })}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isScannedResult && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs md:text-sm text-amber-900 dark:text-amber-200">
              <p className="font-extrabold text-base text-amber-950 dark:text-amber-100">
                {t('pdfToMarkdown.scannedDetected')}
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                PDF to Markdown runs 100% locally in your browser without sending files to external
                servers, so it extracts selectable text layers only. For scanned or image-only PDFs,
                use our dedicated opt-in OCR PDF tool with explicit cloud AI consent.
              </p>
            </div>
          </div>

          <Link
            to={ROUTES.OCR_PDF}
            className="py-2.5 px-5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center space-x-2 transition-all shadow-sm flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Opt-In OCR PDF Tool →</span>
          </Link>
        </div>
      )}

      {markdownText && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {t('pdfToMarkdown.conversionOutput', { defaultValue: 'Conversion Output' })}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
              </span>
              {extractImages && images.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'} Extracted
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2 px-3.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="py-2 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {extractImages && images.length > 0
                    ? 'Download .zip (MD + Images)'
                    : 'Download .md'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t('pdfToMarkdown.renderedPreview', { defaultValue: 'Rendered Preview' })}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-inner max-h-[500px] overflow-y-auto">
                {renderMarkdownToJsx(markdownText, t)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <label htmlFor="raw_markdown_editor">{t('pdfToMarkdown.rawEditor')}</label>
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
