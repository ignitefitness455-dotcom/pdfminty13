import {
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  BookOpen,
  Scale,
  Table as TableIcon,
  ShieldAlert,
  HelpCircle,
  Languages,
  Layers,
  ChevronRight,
  Eye,
  CornerDownLeft,
  Crown,
  StopCircle,
  Lock,
  Zap,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { getPdfJs } from '../core/index';
import { PDFSanitizer } from '../core/PDFSanitizer';
import { sanitizeDownloadFilename } from '../utils/download';
import { logger } from '../utils/logger';
import { recordDailyTask } from '../utils/usageLimit';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  presetTitle?: string;
  isStreaming?: boolean;
}

interface PageMeta {
  pageNumber: number;
  textSnippet: string;
  charCount: number;
  thumbnailDataUrl?: string;
}

/**
 * Lightweight, safe Markdown renderer for structured AI output.
 * Formats headers, bold, italics, bullet points, blockquotes, code blocks,
 * and renders Markdown tables as responsive styled HTML tables.
 */
function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let codeBlockLines: string[] = [];
  let inCodeBlock = false;

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows
      .slice(1)
      .filter((row) => !row.every((cell) => /^[-:| ]+$/.test(cell)));

    renderedElements.push(
      <div
        key={`table-${keyIndex}`}
        className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs"
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              {headerRow.map((col, idx) => (
                <th key={idx} className="p-2.5 font-bold tracking-wide">
                  {col.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {dataRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={
                  rIdx % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50/60 dark:bg-slate-800/40'
                }
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  const flushCodeBlock = (keyIndex: number) => {
    if (codeBlockLines.length === 0) return;
    renderedElements.push(
      <pre
        key={`code-${keyIndex}`}
        className="p-3 my-2.5 bg-slate-900 text-emerald-400 dark:bg-black dark:text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
    codeBlockLines = [];
    inCodeBlock = false;
  };

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(index);
      } else {
        if (inTable) flushTable(index);
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Handle Markdown tables: lines with pipes
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line.trim().slice(1, -1).split('|');
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(index);
    }

    // Headers
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h4 key={index} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
          {line.replace(/^### /, '')}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h3
          key={index}
          className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1"
        >
          {line.replace(/^## /, '')}
        </h3>
      );
      return;
    }
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h2
          key={index}
          className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-4 mb-2"
        >
          {line.replace(/^# /, '')}
        </h2>
      );
      return;
    }

    // Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().replace(/^[-*]\s+/, '');
      renderedElements.push(
        <div
          key={index}
          className="flex items-start space-x-2 my-1 text-slate-700 dark:text-slate-300 text-sm"
        >
          <span className="text-emerald-500 font-bold mt-1 text-xs">•</span>
          <span className="flex-1 leading-relaxed">{formatInlineMarkdown(bulletText)}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      renderedElements.push(
        <div
          key={index}
          className="flex items-start space-x-2 my-1 text-slate-700 dark:text-slate-300 text-sm"
        >
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed">{formatInlineMarkdown(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={index}
          className="border-l-3 border-emerald-500 pl-3 py-1 my-2 text-xs italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-r-lg"
        >
          {line.replace(/^>\s+/, '')}
        </blockquote>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      renderedElements.push(<div key={index} className="h-2" />);
      return;
    }

    // Regular paragraph
    renderedElements.push(
      <p key={index} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-1">
        {formatInlineMarkdown(line)}
      </p>
    );
  });

  if (inTable) flushTable(lines.length);
  if (inCodeBlock) flushCodeBlock(lines.length);

  return <div className="space-y-1">{renderedElements}</div>;
}

function formatInlineMarkdown(text: string): React.ReactNode {
  // Simple regex for bold (**bold**), code (`code`), italic (*italic*)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)$/);

    if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
      if (boldMatch[1]) parts.push(<span key={idx++}>{boldMatch[1]}</span>);
      parts.push(
        <strong key={idx++} className="font-semibold text-slate-900 dark:text-slate-100">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
      continue;
    }

    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={idx++}>{codeMatch[1]}</span>);
      parts.push(
        <code
          key={idx++}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }

    parts.push(<span key={idx++}>{remaining}</span>);
    break;
  }

  return parts;
}

export const AiAnalyzePage: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [hasConsented, setHasConsented] = useState(false); // Require explicit opt-in consent
  const [activePagePreview, setActivePagePreview] = useState<number | null>(null);

  // Conversational Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Usage quota state & real-time Firestore Pro status
  const { user, firebaseUser, isPro, upgradeToPro } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const maxAllowedPages = isPro ? 50 : 15;
  const PRO_DAILY_AI_LIMIT = 50;

  const handleUpgradeClick = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      await upgradeToPro();
    } catch (err) {
      logger.error('Upgrade to Pro error:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getProAiUsedToday = (): number => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem('pdfminty_pro_ai_daily');
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { date?: string; count?: number };
      return parsed.date === todayKey ? parsed.count || 0 : 0;
    } catch {
      return 0;
    }
  };

  const [proAiUsed, setProAiUsed] = useState<number>(() => getProAiUsedToday());

  const operationTokenRef = useRef(0);
  const aiQueryTokenRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Refresh usage when updated
  useEffect(() => {
    const handleUsageUpdated = () => {
      setProAiUsed(getProAiUsedToday());
    };
    window.addEventListener('pdfminty-usage-updated', handleUsageUpdated);
    return () => {
      window.removeEventListener('pdfminty-usage-updated', handleUsageUpdated);
    };
  }, []);

  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiLoading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (!isPro) {
      setError(
        'AI Analyze is a Pro-only feature. Please upgrade to PDFMinty Pro (BDT 299.99/month) to unlock AI document analysis.'
      );
      return;
    }
    if (files.length === 0) return;
    const myToken = ++operationTokenRef.current;
    const file = files[0];
    setSelectedFile(file);
    setIsExtracting(true);
    setExtractionProgress(10);
    setExtractedText('');
    setPagesMeta([]);
    setMessages([]);
    setError(null);

    let pdf: PDFDocumentProxy | null = null;
    try {
      const pdfjs = await getPdfJs();
      const rawBytes = new Uint8Array(await file.arrayBuffer());

      // Sanitize the PDF before handing it to pdfjs for safety
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

      setExtractionProgress(25);
      const loadingTask = pdfjs.getDocument({ data: sanitizedBytes });
      pdf = await loadingTask.promise;
      if (myToken !== operationTokenRef.current) return;
      setTotalPages(pdf.numPages);

      // Support up to 50 pages for Pro users, 15 pages for Guest/Free users
      const maxPages = Math.min(pdf.numPages, maxAllowedPages);
      let textBuffer = '';
      const collectedMeta: PageMeta[] = [];

      for (let i = 1; i <= maxPages; i++) {
        if (myToken !== operationTokenRef.current) break;
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (item as { str?: string }).str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        textBuffer += `--- PAGE ${i} ---\n${pageText}\n\n`;

        // Render a lightweight thumbnail canvas for page inspection
        let thumbUrl: string | undefined = undefined;
        try {
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            thumbUrl = canvas.toDataURL('image/jpeg', 0.65);
          }
        } catch {
          // Non-blocking thumbnail fallback
        }

        collectedMeta.push({
          pageNumber: i,
          textSnippet: pageText.slice(0, 180),
          charCount: pageText.length,
          thumbnailDataUrl: thumbUrl,
        });

        page.cleanup();
        setExtractionProgress(25 + Math.round((i / maxPages) * 70));
      }

      if (myToken !== operationTokenRef.current) return;
      setExtractedText(textBuffer.slice(0, isPro ? 60000 : 30000));
      setPagesMeta(collectedMeta);

      // Generate a welcome introduction message
      const estWords = textBuffer.split(/\s+/).filter(Boolean).length;
      const initialAssistantMessage: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: `👋 **Welcome! I've loaded "${file.name}"** (${Math.min(pdf.numPages, maxAllowedPages)} of ${pdf.numPages} pages, ~${estWords.toLocaleString()} words indexed).\n\nI am powered by **Google Gemini Flash**${isPro ? ' (**Pro Priority Mode: Up to 50 pages/PDF & 50 daily AI queries**)' : ''}. You can ask me any specific question about your document, or click one of the quick innovation buttons below to get started!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialAssistantMessage]);
    } catch (err: unknown) {
      if (myToken !== operationTokenRef.current) return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Text extraction error:', err);
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
            'Failed to extract text structures. Make sure document contains selectable text or run OCR PDF first.'
        );
      }
    } finally {
      if (myToken === operationTokenRef.current) {
        setIsExtracting(false);
        setExtractionProgress(100);
      }
      if (pdf) {
        try {
          await pdf.destroy();
        } catch {
          // ignore
        }
      }
    }
  };

  /**
   * Submits a query to the AI proxy (Gemini 3.8 Flash).
   * Supports multi-turn chat and preset innovation prompts.
   */
  const submitChat = async (userPrompt: string, presetTitle?: string) => {
    if (!isPro) {
      setError(
        'AI Analyze is a Pro-only feature. Please upgrade to PDFMinty Pro (BDT 299.99/month) to unlock AI document analysis.'
      );
      return;
    }
    if (!hasConsented) {
      setError(
        'Please acknowledge the Cloud AI consent checkbox before sending document text to Google Gemini.'
      );
      return;
    }
    const trimmed = userPrompt.trim();
    if (!trimmed || !extractedText) return;

    if (isPro && proAiUsed >= PRO_DAILY_AI_LIMIT) {
      setError(
        `Daily Pro AI Fair-Use limit reached (${PRO_DAILY_AI_LIMIT}/${PRO_DAILY_AI_LIMIT} queries today). Your quota resets automatically at midnight.`
      );
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const myToken = ++aiQueryTokenRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      presetTitle,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery('');
    setAiLoading(true);
    setError(null);

    try {
      // Build conversational payload
      const chatMessagesPayload = newHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8) // Send up to last 8 turns for context
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (firebaseUser && typeof firebaseUser.getIdToken === 'function') {
        const idToken = await firebaseUser.getIdToken();
        if (idToken) {
          requestHeaders.Authorization = `Bearer ${idToken}`;
        }
      }

      const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          textContent: extractedText,
          query: trimmed,
          mode: 'chat',
          messages: chatMessagesPayload,
        }),
        signal: controller.signal,
      });

      if (myToken !== aiQueryTokenRef.current) return;

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI server rejected query. Please try again.');
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.result || 'No response returned from the model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        if (isPro) {
          const todayKey = new Date().toISOString().slice(0, 10);
          const nextCount = getProAiUsedToday() + 1;
          localStorage.setItem(
            'pdfminty_pro_ai_daily',
            JSON.stringify({ date: todayKey, count: nextCount })
          );
          setProAiUsed(nextCount);
        }
        recordDailyTask(user, 'ai_analyze');
      } catch {
        // Non-blocking
      }
    } catch (err: unknown) {
      if (myToken !== aiQueryTokenRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Gemini Chat error:', err);
      setError(message || 'An unexpected error occurred while communicating with Gemini.');
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

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiLoading(false);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_|[\]]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const exportContent = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? 'YOU' : 'PDFMINTY GEMINI AI'}:\n${m.content}\n\n`
      )
      .join('---\n\n');

    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeDownloadFilename(
      `${selectedFile ? selectedFile.name.replace(/\.pdf$/i, '') : 'document'}-chat-notes.md`,
      'document-chat-notes.md'
    );
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    if (extractedText && selectedFile) {
      setMessages([
        {
          id: `reset-${Date.now()}`,
          role: 'assistant',
          content: `Chat history cleared. I still have "${selectedFile.name}" ready in memory. Ask any new question or choose a prompt!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // High-value viral innovation presets directly fulfilling user requirements
  const INNOVATION_PROMPTS = [
    {
      id: 'exec_summary',
      icon: BookOpen,
      title: 'Executive Summary',
      titleBn: 'নির্বাহী সারসংক্ষেপ',
      desc: 'High-level synthesis with core objectives and takeaways',
      query:
        'Please provide an executive summary of this document. Break down the core objectives, 3 major highlights, key dates/deadlines, and concluding takeaways in bullet points.',
    },
    {
      id: 'contract_clauses',
      icon: Scale,
      title: 'Clauses & Obligations',
      titleBn: 'চুক্তির ধারা ও শর্তাবলী',
      desc: 'Examines clause terms, liabilities, penalties & termination',
      query:
        'Analyze the contractual terms in this document. Specifically summarize Clause 3 (or the principal operational terms), liability caps, termination policies, and financial commitments.',
    },
    {
      id: 'financial_tables',
      icon: TableIcon,
      title: 'Extract Financial Tables',
      titleBn: 'আর্থিক রিপোর্ট ও টেবিল ডেটা',
      desc: 'Extract numbers, balances, prices & metrics into tables',
      query:
        'Scan this document for all financial figures, revenue, costs, balances, or structured metrics, and extract them into cleanly formatted Markdown tables with column headers.',
    },
    {
      id: 'compliance_risks',
      icon: ShieldAlert,
      title: 'Risks & Disclaimers',
      titleBn: 'ঝুঁকি ও সতর্কতা নিরীক্ষা',
      desc: 'Detects legal pitfalls, disclaimers & compliance flags',
      query:
        'Identify all potential legal risks, disclaimers, penalty clauses, dispute resolution procedures, and confidentiality obligations mentioned in this text.',
    },
    {
      id: 'study_qa',
      icon: HelpCircle,
      title: '5 Crucial Q&As',
      titleBn: 'গুরুত্বপূর্ণ প্রশ্নোত্তর',
      desc: 'Top 5 questions someone would ask with exact answers',
      query:
        'Generate the top 5 most important questions anyone reading this document would need to know, followed by clear, authoritative answers based on the document.',
    },
    {
      id: 'bengali_insights',
      icon: Languages,
      title: 'বাংলা সারসংক্ষেপ',
      titleBn: 'বাংলায় মূল বক্তব্য',
      desc: 'Explain document in fluent Bengali with bullet points',
      query:
        'এই পিডিএফ ডকুমেন্টটির প্রধান মূল বক্তব্য, আর্থিক ও আইনি শর্তাবলী এবং গুরুত্বপূর্ণ সিদ্ধান্তগুলো বাংলায় সহজ ও সাবলীল ভাষায় বিস্তারিত পয়েন্ট আকারে তুলে ধরুন।',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4" id="ai_analyze_page">
      <SEO slug="ai-analyze-pdf" />
      <ToolHeader
        slug="ai-analyze-pdf"
        limitMB={isPro ? 500 : TOOL_SIZE_LIMITS['ai-analyze'].maxSingleMB}
      />

      {/* Top Banner: Gemini AI Engine status & User Task Quota */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30 border border-emerald-500/20 dark:border-emerald-700/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Chat with PDF & AI Smart Summarizer
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Gemini Flash
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Interactive document dialogue • Clause deep dive • Markdown table extraction
            </p>
          </div>
        </div>

        {/* User Tier & Pro Badge / Upgrade Button */}
        <div className="flex items-center space-x-3 text-xs">
          {isPro ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-500/30 shadow-xs">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-400">
                Pro ({Math.max(0, PRO_DAILY_AI_LIMIT - proAiUsed)}/{PRO_DAILY_AI_LIMIT} AI Queries •
                50 Pages/PDF)
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={isUpgrading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Upgrade to Pro (BDT 299.99/month)</span>
            </button>
          )}
          <Link
            to={ROUTES.DASHBOARD}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Pro Feature Gate Banner when isPro is false */}
      {!isPro && (
        <div
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/40 dark:from-slate-900 dark:via-emerald-950/20 dark:to-amber-950/20 border-2 border-amber-500/40 shadow-xl space-y-5 text-center max-w-3xl mx-auto"
          id="ai_analyze_pro_gate"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Pro-Only Feature</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Unlock AI Document Analysis with PDFMinty Pro
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Summarize complex contracts, extract financial tables into Markdown, and ask deep
              questions across up to 50 pages per PDF with 500MB file-size limits using Google
              Gemini 2.5 Flash.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={isUpgrading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              id="ai_gate_upgrade_btn"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>
                {isUpgrading ? 'Redirecting to Checkout...' : 'Upgrade to Pro (BDT 299.99/month)'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${!isPro ? 'opacity-60 pointer-events-none select-none' : ''}`}
      >
        {/* Left Column (5 cols): File Upload, Document Inspector & Page Thumbnails */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{t('aiAnalyze.documentUpload', { defaultValue: 'Source Document' })}</span>
              </span>
              {selectedFile && (
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              )}
            </h3>

            {!selectedFile ? (
              <div className="space-y-3">
                <FileUploader
                  onFilesSelected={handleFilesSelected}
                  accept=".pdf,application/pdf"
                  maxSizeMB={isPro ? 500 : TOOL_SIZE_LIMITS['ai-analyze'].maxSingleMB}
                />
                <EmptyState />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active File Card */}
                <div
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2"
                  id="loaded_ai_file"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {Math.min(totalPages, maxAllowedPages)} of {totalPages} pages indexed
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      operationTokenRef.current++;
                      aiQueryTokenRef.current++;
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                        abortControllerRef.current = null;
                      }
                      setSelectedFile(null);
                      setExtractedText('');
                      setPagesMeta([]);
                      setMessages([]);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1 px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    {t('toolCommon.changeFile', { defaultValue: 'Change' })}
                  </button>
                </div>

                {isExtracting ? (
                  <div
                    className="space-y-2 py-4 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                    id="extraction_spinner"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center space-x-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Parsing document text locally...</span>
                      </span>
                      <span className="font-bold">{extractionProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${extractionProgress}%` }}
                      />
                    </div>
                  </div>
                ) : extractedText ? (
                  <div className="space-y-3">
                    {/* Page limit notice if > maxAllowedPages */}
                    {totalPages > maxAllowedPages && (
                      <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Analysis is anchored on the first {maxAllowedPages} of {totalPages} pages
                          for rapid response.
                          {!isPro && ' Upgrade to Pro to index up to 50 pages per document!'}
                        </span>
                      </div>
                    )}

                    {/* Page Thumbnails Preview Grid */}
                    {pagesMeta.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center space-x-1">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Page Thumbnails ({pagesMeta.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Click to inspect</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
                          {pagesMeta.map((p) => (
                            <button
                              key={p.pageNumber}
                              type="button"
                              onClick={() =>
                                setActivePagePreview(
                                  activePagePreview === p.pageNumber ? null : p.pageNumber
                                )
                              }
                              className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center ${
                                activePagePreview === p.pageNumber
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                              }`}
                            >
                              {p.thumbnailDataUrl ? (
                                <img
                                  src={p.thumbnailDataUrl}
                                  alt={`Page ${p.pageNumber}`}
                                  className="w-full h-20 object-contain rounded bg-white shadow-2xs"
                                />
                              ) : (
                                <div className="w-full h-20 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400">
                                  P.{p.pageNumber}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                                Page {p.pageNumber}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Page Inspector Drawer */}
                    {activePagePreview && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Inspecting Page {activePagePreview}</span>
                          </span>
                          <button
                            type="button"
                            disabled={!hasConsented || aiLoading}
                            onClick={() =>
                              submitChat(
                                `What is the main information and data on Page ${activePagePreview}? Summarize it thoroughly.`
                              )
                            }
                            className="text-[11px] text-emerald-600 hover:underline font-bold disabled:opacity-50 disabled:pointer-events-none"
                          >
                            Ask AI about this page →
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-4 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                          {pagesMeta.find((p) => p.pageNumber === activePagePreview)?.textSnippet ||
                            'No text on this page.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Privacy & Opt-in Consent Disclosure */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl space-y-2.5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-normal">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Retention Privacy Protection</span>
            </div>
            <p>
              Your PDF is processed 100% locally in your browser for text indexing. When you ask a
              question, only extracted text is encrypted and transmitted directly to Google Gemini
              to craft the answer. No documents are permanently stored on our servers.
            </p>
            <label className="flex items-start space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-0.5 accent-emerald-600 rounded"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                I understand and consent to sending selected text to Google Gemini for AI analysis.
              </span>
            </label>
          </div>

          {/* Game-Changing Innovation Presets List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ⚡ Game-Changing AI Presets
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {INNOVATION_PROMPTS.map((prompt) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => submitChat(prompt.query, prompt.title)}
                    disabled={!extractedText || aiLoading || !hasConsented}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 cursor-pointer ${
                      extractedText && !aiLoading && hasConsented
                        ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 bg-slate-50/50 dark:bg-slate-800/30'
                        : 'border-slate-200 dark:border-slate-800 opacity-50 pointer-events-none'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {prompt.title}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ({prompt.titleBn})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {prompt.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Full Conversational Chat Thread & Action Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[740px] overflow-hidden">
            {/* Chat Thread Header & Actions */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {selectedFile ? `Chat with ${selectedFile.name}` : 'Document Chat Console'}
                </span>
                {messages.length > 1 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {messages.length} messages
                  </span>
                )}
              </div>

              {/* Chat Actions: Export & Clear */}
              <div className="flex items-center space-x-2">
                {messages.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportChat}
                      title="Export conversation as Markdown"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearChat}
                      title="Clear chat history"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-12 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-7 h-7 animate-bounce" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    Load a PDF to Start Conversing
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                    Upload any contract, financial report, research paper, or textbook. You can ask
                    specific questions (e.g., <em>"What is the key takeaway of clause 3?"</em>),
                    extract tables, or generate instant summaries in English or Bengali.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {/* Message meta & preset badge */}
                      <div className="flex items-center justify-between text-[11px] opacity-75 pb-1 border-b border-black/10 dark:border-white/10">
                        <span className="font-semibold">
                          {msg.role === 'user' ? 'You' : 'Gemini 3.8 Flash'}
                          {msg.presetTitle && ` • ${msg.presetTitle}`}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Content view */}
                      {msg.role === 'user' ? (
                        <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="text-sm prose dark:prose-invert max-w-none">
                          <MarkdownView content={msg.content} />
                        </div>
                      )}

                      {/* Assistant action buttons: Copy & Speak */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold text-[11px]">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          {'speechSynthesis' in window && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                                  <span className="text-[11px] text-rose-500 font-semibold">
                                    Stop
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Listen</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                        U
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* In-Flight Thinking Indicator */}
              {aiLoading && (
                <div className="flex items-start space-x-3 justify-start" id="ai_loader">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 rounded-tl-xs space-y-2 shadow-2xs">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gemini 3.8 Flash is analyzing your document...</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reading clauses, evaluating tables, and formulating response.
                    </p>
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="flex items-center space-x-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer pt-1"
                    >
                      <StopCircle className="w-3 h-3" />
                      <span>Stop generation</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-start space-x-2 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Error Processing AI Query</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Chat Input Form */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              {/* Quick Prompt Suggestion Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 font-medium">
                  Try asking:
                </span>
                {[
                  'What is the key takeaway of clause 3?',
                  'Summarize financial metrics in a table',
                  'What are the obligations & deadlines?',
                  'এই চুক্তির মূল শর্তাবলী বাংলায় বলুন',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setInputQuery(chip);
                      submitChat(chip);
                    }}
                    disabled={!extractedText || aiLoading || !hasConsented}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Main Input Box */}
              <div className="relative flex items-center">
                <input
                  id="ai_query_input"
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    extractedText
                      ? 'Ask anything (e.g., "What does section 3 state?", "Extract table data")...'
                      : 'Upload a PDF on the left to start chatting...'
                  }
                  disabled={!extractedText || aiLoading || !hasConsented}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitChat(inputQuery);
                    }
                  }}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl py-3 pl-4 pr-24 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => submitChat(inputQuery)}
                    disabled={!extractedText || !inputQuery.trim() || aiLoading || !hasConsented}
                    className={`p-2 rounded-lg text-white transition-all flex items-center justify-center ${
                      inputQuery.trim() && !aiLoading && hasConsented
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-400 pointer-events-none'
                    }`}
                    aria-label="Send message"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                <span className="flex items-center space-x-1">
                  <CornerDownLeft className="w-3 h-3" />
                  <span>Press Enter to send</span>
                </span>
                <span>Powered by Gemini 3.8 Flash Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalyzePage;
