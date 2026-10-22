import { PDFDocument, rgb, StandardFonts } from '@cantoo/pdf-lib';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  PenTool,
  Phone,
  RefreshCw,
  Search,
  ShieldBan,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FileUploader } from '../components/FileUploader';
import { recordLocalProcessing } from '../components/NetworkPrivacyInspector';
import { SecurityAffiliateBanner } from '../components/SecurityAffiliateBanner';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { getPdfJs } from '../core';
import { PDFSanitizer } from '../core/PDFSanitizer';
import { WorkerManager } from '../core/WorkerManager';
import { downloadBlob } from '../utils/download';
import { recordDailyTask } from '../utils/usageLimit';

export type PiiCategory = 'card' | 'phone' | 'nid' | 'email' | 'secret' | 'custom' | 'manual';

export interface PiiEntity {
  id: string;
  category: PiiCategory;
  text: string;
  pageIndex: number;
  // User space PDF coordinates
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
}

export interface ManualBox {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function SanitizePdfPage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'redact' | 'strip'>('redact');
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // PII Detection states
  const [isScanning, setIsScanning] = useState(false);
  const [entities, setEntities] = useState<PiiEntity[]>([]);
  const [manualBoxes, setManualBoxes] = useState<ManualBox[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | PiiCategory>('all');
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [redactStyle, setRedactStyle] = useState<'blackout' | 'redacted_text' | 'whiteout'>('blackout');

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Common processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [auditSummary, setAuditSummary] = useState<{
    redactedItemsCount: number;
    pagesModifiedCount: number;
    purgedMetadata: boolean;
    sha256Hash?: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfJsDocRef = useRef<PDFDocumentProxy | null>(null);
  const operationTokenRef = useRef(0);

  const limitMB = TOOL_SIZE_LIMITS['sanitize-pdf']?.maxSingleMB || 100;

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      operationTokenRef.current++;
      if (pdfJsDocRef.current) {
        pdfJsDocRef.current.destroy().catch(() => {
          /* ignore */
        });
        pdfJsDocRef.current = null;
      }
    };
  }, []);

  // Load PDF and run PII detection
  const handleFileSelected = async (selectedFile: File) => {
    const currentToken = ++operationTokenRef.current;
    setFile(selectedFile);
    setError(null);
    setWarnings([]);
    setIsSuccess(false);
    setEntities([]);
    setManualBoxes([]);
    setAuditSummary(null);
    setCurrentPage(1);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      setIsScanning(true);
      if (pdfJsDocRef.current) {
        await pdfJsDocRef.current.destroy().catch(() => {
          /* ignore */
        });
        pdfJsDocRef.current = null;
      }
      const arrayBuffer = await selectedFile.arrayBuffer();
      if (operationTokenRef.current !== currentToken) return;
      const uint8 = new Uint8Array(arrayBuffer);
      setFileBytes(uint8);
      recordLocalProcessing(uint8.byteLength, `Sanitize/Redact: ${selectedFile.name}`);

      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({ data: uint8.slice() });
      const loadedDoc = await loadingTask.promise;
      if (operationTokenRef.current !== currentToken) {
        await loadedDoc.destroy().catch(() => {
          /* ignore */
        });
        return;
      }
      pdfJsDocRef.current = loadedDoc;
      setPdfJsDoc(loadedDoc);
      setTotalPages(loadedDoc.numPages);

      const dims: { width: number; height: number }[] = [];
      const detected: PiiEntity[] = [];

      // Regex patterns
      const CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011|5\d\d)\d{12})\b/g;
      const PHONE_REGEX = /(?:\+?880\s?1[3-9]\d{8}|01[3-9]\d{8}|\+?1[ -]?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\+?[1-9]\d{1,3}[ -]?(?:\d{3,4}[ -]?\d{3,4}))/g;
      const NID_REGEX = /\b(?:\d{10}|\d{13}|\d{17})\b|\b\d{3}-\d{2}-\d{4}\b/g;
      const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const SECRET_REGEX = /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|Bearer\s+[a-zA-Z0-9_.-]{16,}|password\s*[:=]\s*\S+)\b/gi;

      for (let p = 1; p <= loadedDoc.numPages; p++) {
        const page = await loadedDoc.getPage(p);
        const viewport = page.getViewport({ scale: 1.0 });
        dims.push({ width: viewport.width, height: viewport.height });

        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          const text = item.str;
          const transform = item.transform; // [sx, sky, skx, sy, tx, ty]
          const tx = transform[4];
          const ty = transform[5];
          const w = item.width || 50;
          const h = item.height || Math.abs(transform[3]) || 12;

          // Helper to register detected pattern
          const checkRegex = (regex: RegExp, category: PiiCategory) => {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(text)) !== null) {
              const matchedText = match[0];
              const offsetRatio = match.index / Math.max(1, text.length);
              const matchLenRatio = matchedText.length / Math.max(1, text.length);
              const entityX = tx + w * offsetRatio;
              const entityW = Math.max(10, w * matchLenRatio);

              detected.push({
                id: Math.random().toString(36).substring(2, 9),
                category,
                text: matchedText,
                pageIndex: p - 1,
                x: entityX,
                y: ty,
                width: entityW,
                height: Math.max(h, 12),
                selected: true,
              });
            }
          };

          checkRegex(CARD_REGEX, 'card');
          checkRegex(PHONE_REGEX, 'phone');
          checkRegex(NID_REGEX, 'nid');
          checkRegex(EMAIL_REGEX, 'email');
          checkRegex(SECRET_REGEX, 'secret');
        }
        page.cleanup();
        if (operationTokenRef.current !== currentToken) return;
      }

      if (operationTokenRef.current === currentToken) {
        setPageDimensions(dims);
        setEntities(detected);
      }
    } catch (err: unknown) {
      if (operationTokenRef.current === currentToken) {
        const message = err instanceof Error ? err.message : 'Failed to scan document.';
        setError(message);
      }
    } finally {
      if (operationTokenRef.current === currentToken) {
        setIsScanning(false);
      }
    }
  };

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfJsDoc || totalPages === 0) return;
    let cancelled = false;
    let activeRenderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const render = async () => {
      try {
        const page = await pdfJsDoc.getPage(currentPage);
        if (cancelled) {
          page.cleanup();
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
          page.cleanup();
          return;
        }

        const containerWidth = overlayRef.current?.clientWidth || 700;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(2.0, Math.max(0.7, (containerWidth - 32) / unscaledViewport.width));
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          page.cleanup();
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const renderContext = {
          canvasContext: ctx,
          viewport,
        };
        const task = page.render(renderContext);
        activeRenderTask = task;
        try {
          await task.promise;
          if (!cancelled) {
            setCanvasSize({ width: viewport.width, height: viewport.height });
          }
        } finally {
          page.cleanup();
        }
      } catch (e) {
        if ((e as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error('Failed to render page', e);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfJsDoc, currentPage, totalPages]);

  // Handle custom search term scanning
  const handleAddCustomSearch = () => {
    if (!customSearchQuery.trim() || !pdfJsDoc) return;
    const term = customSearchQuery.trim().toLowerCase();

    const searchAsync = async () => {
      const newItems: PiiEntity[] = [];
      for (let p = 1; p <= totalPages; p++) {
        const page = await pdfJsDoc.getPage(p);
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
          if (!('str' in item)) continue;
          const text = item.str;
          const lower = text.toLowerCase();
          let idx = lower.indexOf(term);
          while (idx !== -1) {
            const transform = item.transform;
            const tx = transform[4];
            const ty = transform[5];
            const w = item.width || 50;
            const h = item.height || Math.abs(transform[3]) || 12;
            const offsetRatio = idx / Math.max(1, text.length);
            const matchLenRatio = term.length / Math.max(1, text.length);

            newItems.push({
              id: Math.random().toString(36).substring(2, 9),
              category: 'custom',
              text: text.substr(idx, term.length),
              pageIndex: p - 1,
              x: tx + w * offsetRatio,
              y: ty,
              width: Math.max(10, w * matchLenRatio),
              height: Math.max(h, 12),
              selected: true,
            });

            idx = lower.indexOf(term, idx + term.length);
          }
        }
      }
      setEntities((prev) => [...prev, ...newItems]);
      setCustomSearchQuery('');
    };

    searchAsync();
  };

  // Toggle selection
  const toggleEntity = (id: string) => {
    setEntities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAll = (select: boolean) => {
    setEntities((prev) =>
      prev.map((item) =>
        selectedFilter === 'all' || item.category === selectedFilter
          ? { ...item, selected: select }
          : item
      )
    );
  };

  // Drawing manual redaction box handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !overlayRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawStart({ x, y });
    setCurrentDrawRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const x = Math.min(drawStart.x, curX);
    const y = Math.min(drawStart.y, curY);
    const w = Math.abs(curX - drawStart.x);
    const h = Math.abs(curY - drawStart.y);

    setCurrentDrawRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!drawStart || !currentDrawRect || !canvasRef.current) {
      setDrawStart(null);
      setCurrentDrawRect(null);
      return;
    }

    if (currentDrawRect.w > 5 && currentDrawRect.h > 5) {
      const canvas = canvasRef.current;
      const dim = pageDimensions[currentPage - 1] || { width: 612, height: 792 };

      // Convert from screen canvas coordinates to PDF coordinates
      const pdfX = (currentDrawRect.x / canvas.width) * dim.width;
      const pdfY = dim.height - ((currentDrawRect.y + currentDrawRect.h) / canvas.height) * dim.height;
      const pdfW = (currentDrawRect.w / canvas.width) * dim.width;
      const pdfH = (currentDrawRect.h / canvas.height) * dim.height;

      setManualBoxes((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          pageIndex: currentPage - 1,
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
        },
      ]);
    }

    setDrawStart(null);
    setCurrentDrawRect(null);
  };

  const removeManualBox = (id: string) => {
    setManualBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  // Perform permanent redaction and sanitization
  const handleExecuteRedaction = async () => {
    if (!fileBytes || !file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);
      setIsSuccess(false);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const helvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const selectedEntities = entities.filter((e) => e.selected);
      const allRedactBoxes = [
        ...selectedEntities.map((e) => ({
          pageIndex: e.pageIndex,
          x: e.x,
          y: e.y,
          width: e.width,
          height: e.height,
        })),
        ...manualBoxes,
      ];

      const modifiedPages = new Set<number>();

      for (const box of allRedactBoxes) {
        if (box.pageIndex < 0 || box.pageIndex >= pages.length) continue;
        const page = pages[box.pageIndex];
        modifiedPages.add(box.pageIndex);

        if (redactStyle === 'blackout') {
          page.drawRectangle({
            x: box.x - 2,
            y: box.y - 2,
            width: box.width + 4,
            height: box.height + 4,
            color: rgb(0, 0, 0),
            opacity: 1,
          });
        } else if (redactStyle === 'whiteout') {
          page.drawRectangle({
            x: box.x - 2,
            y: box.y - 2,
            width: box.width + 4,
            height: box.height + 4,
            color: rgb(1, 1, 1),
            opacity: 1,
          });
        } else if (redactStyle === 'redacted_text') {
          page.drawRectangle({
            x: box.x - 2,
            y: box.y - 2,
            width: box.width + 4,
            height: box.height + 4,
            color: rgb(0.1, 0.1, 0.1),
            opacity: 1,
          });
          const fontSize = Math.min(9, Math.max(6, box.height * 0.55));
          page.drawText('[REDACTED]', {
            x: box.x + 2,
            y: box.y + (box.height - fontSize) / 2,
            size: fontSize,
            font: helvetica,
            color: rgb(1, 1, 1),
          });
        }
      }

      // Permanently burn redaction masks by rasterizing modified pages so underlying
      // selectable text streams on redacted pages are completely destroyed.
      let finalDoc = pdfDoc;
      if (modifiedPages.size > 0 && pdfJsDoc && typeof document !== 'undefined') {
        try {
          const flattenedDoc = await PDFDocument.create();
          const redactScale = 2.0;
          for (let pIdx = 0; pIdx < pages.length; pIdx++) {
            if (!modifiedPages.has(pIdx)) {
              const [copiedPage] = await flattenedDoc.copyPages(pdfDoc, [pIdx]);
              flattenedDoc.addPage(copiedPage);
              continue;
            }

            const origPage = pages[pIdx];
            const { width: origW, height: origH } = origPage.getSize();
            const dim = pageDimensions[pIdx] || { width: origW, height: origH };
            const jsPage = await pdfJsDoc.getPage(pIdx + 1);
            const viewport = jsPage.getViewport({ scale: redactScale });
            const redactCanvas = document.createElement('canvas');
            redactCanvas.width = viewport.width;
            redactCanvas.height = viewport.height;
            const rCtx = redactCanvas.getContext('2d');

            if (!rCtx) {
              jsPage.cleanup();
              const [copiedPage] = await flattenedDoc.copyPages(pdfDoc, [pIdx]);
              flattenedDoc.addPage(copiedPage);
              continue;
            }

            rCtx.fillStyle = '#ffffff';
            rCtx.fillRect(0, 0, viewport.width, viewport.height);
            await jsPage.render({
              canvasContext: rCtx,
              viewport,
            }).promise;
            jsPage.cleanup();

            const pageBoxes = allRedactBoxes.filter((b) => b.pageIndex === pIdx);
            for (const box of pageBoxes) {
              const sx = ((box.x - 2) / dim.width) * viewport.width;
              const sy = ((dim.height - (box.y - 2) - (box.height + 4)) / dim.height) * viewport.height;
              const sw = ((box.width + 4) / dim.width) * viewport.width;
              const sh = ((box.height + 4) / dim.height) * viewport.height;

              if (redactStyle === 'blackout') {
                rCtx.fillStyle = '#000000';
                rCtx.fillRect(sx, sy, sw, sh);
              } else if (redactStyle === 'whiteout') {
                rCtx.fillStyle = '#ffffff';
                rCtx.fillRect(sx, sy, sw, sh);
              } else {
                rCtx.fillStyle = '#1a1a1a';
                rCtx.fillRect(sx, sy, sw, sh);
                const pxFontSize = Math.max(10, Math.min(18, sh * 0.55));
                rCtx.fillStyle = '#ffffff';
                rCtx.font = `bold ${pxFontSize}px sans-serif`;
                rCtx.textBaseline = 'middle';
                rCtx.fillText('[REDACTED]', sx + 4, sy + sh / 2, Math.max(10, sw - 8));
              }
            }

            const pageBlob = await new Promise<Blob | null>((resolve) =>
              redactCanvas.toBlob(resolve, 'image/jpeg', 0.92)
            );
            redactCanvas.width = 0;
            redactCanvas.height = 0;

            if (pageBlob) {
              const imgBytes = new Uint8Array(await pageBlob.arrayBuffer());
              const embeddedJpg = await flattenedDoc.embedJpg(imgBytes);
              const newPage = flattenedDoc.addPage([origW, origH]);
              newPage.drawImage(embeddedJpg, {
                x: 0,
                y: 0,
                width: origW,
                height: origH,
              });
            } else {
              const [copiedPage] = await flattenedDoc.copyPages(pdfDoc, [pIdx]);
              flattenedDoc.addPage(copiedPage);
            }
          }
          finalDoc = flattenedDoc;
        } catch {
          // Fallback to pdfDoc with vector overlays if canvas rasterization fails
          finalDoc = pdfDoc;
        }
      }

      // Purge metadata & identifiers
      finalDoc.setTitle('');
      finalDoc.setAuthor('');
      finalDoc.setSubject('');
      finalDoc.setKeywords([]);
      finalDoc.setProducer('PDFMinty Privacy AI Shield');
      finalDoc.setCreator('PDFMinty Client-Side Engine');
      finalDoc.setModificationDate(new Date());

      const rawSavedBytes = await finalDoc.save({ useObjectStreams: true });
      const { bytes: savedBytes } = PDFSanitizer.sanitize(rawSavedBytes, {
        skipEncryptionCheck: true,
      });
      recordLocalProcessing(savedBytes.byteLength, 'Redacted & Sanitized PDF');
      recordDailyTask(null, 'sanitize_pdf');

      const blob = new Blob([savedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = file.name.replace(/\.pdf$/i, '') + '-redacted-shield.pdf';
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);

      setAuditSummary({
        redactedItemsCount: allRedactBoxes.length,
        pagesModifiedCount: modifiedPages.size,
        purgedMetadata: true,
      });

      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Redaction failed.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Original structural sanitize handler (Tab 2)
  const handleStructuralSanitize = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await WorkerManager.getInstance().runOperation<{
        bytes: Uint8Array;
        warnings: string[];
      }>('sanitizePDF', { bytes });

      setWarnings(result.warnings);
      recordDailyTask(null, 'sanitize_pdf');

      const blob = new Blob([result.bytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = file.name.replace(/\.pdf$/i, '') + '-sanitized.pdf';
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message || 'Failed to sanitize document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredEntities = useMemo(() => {
    if (selectedFilter === 'all') return entities;
    return entities.filter((e) => e.category === selectedFilter);
  }, [entities, selectedFilter]);

  const currentPageEntities = useMemo(() => {
    return entities.filter((e) => e.pageIndex === currentPage - 1);
  }, [entities, currentPage]);

  const currentPageManualBoxes = useMemo(() => {
    return manualBoxes.filter((b) => b.pageIndex === currentPage - 1);
  }, [manualBoxes, currentPage]);

  const countsByCategory = useMemo(() => {
    const counts = {
      card: 0,
      phone: 0,
      nid: 0,
      email: 0,
      secret: 0,
      custom: 0,
      manual: manualBoxes.length,
    };
    entities.forEach((e) => {
      if (counts[e.category] !== undefined) counts[e.category]++;
    });
    return counts;
  }, [entities, manualBoxes]);

  const getCategoryBadge = (cat: PiiCategory) => {
    switch (cat) {
      case 'card':
        return { label: 'Credit Card', icon: CreditCard, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'phone':
        return { label: 'Phone', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'nid':
        return { label: 'NID / SSN', icon: Fingerprint, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'email':
        return { label: 'Email', icon: Mail, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'secret':
        return { label: 'Secret / Token', icon: KeyRound, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'custom':
        return { label: 'Search Match', icon: Search, color: 'text-teal-600 bg-teal-50 border-teal-200' };
      case 'manual':
        return { label: 'Manual Box', icon: PenTool, color: 'text-slate-700 bg-slate-100 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadein" id="sanitize_pdf_container">
      <SEO slug="sanitize-pdf" />
      <ToolHeader slug="sanitize-pdf" limitMB={limitMB} />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('redact')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'redact'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Privacy Shield & Auto-Redactor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 uppercase font-black">
              PRO
            </span>
          </button>
          <button
            onClick={() => setActiveTab('strip')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'strip'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldBan className="w-4 h-4" />
            <span>Metadata & Script Purger</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Client-Side In-Memory Black-out</span>
        </div>
      </div>

      {!file ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="text-center max-w-lg mx-auto mb-4 space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'redact'
                ? 'Automatic PII Shield & Black-out Sanitizer'
                : 'Deep Metadata & Hidden Script Purger'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'redact'
                ? 'Automatically detect and permanently black-out phone numbers, credit cards, NIDs, and emails before sharing.'
                : 'Strip hidden launch actions, embedded JavaScript, form definitions, and personal tracking metadata.'}
            </p>
          </div>

          <FileUploader
            onFilesSelected={(files) => {
              if (files && files.length > 0) {
                handleFileSelected(files[0]);
              }
            }}
            accept=".pdf,application/pdf"
            maxSizeMB={limitMB}
            id="sanitize_pdf_uploader"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Top Bar */}
          <div
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm"
            id="loaded_sanitize_file"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate max-w-xs sm:max-w-md">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} Pages •{' '}
                  <span className="text-emerald-600 font-semibold">
                    {isScanning ? 'Scanning PII...' : 'Local RAM Isolated'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  operationTokenRef.current++;
                  if (pdfJsDocRef.current) {
                    pdfJsDocRef.current.destroy().catch(() => {
                      /* ignore */
                    });
                    pdfJsDocRef.current = null;
                  }
                  setFile(null);
                  setFileBytes(null);
                  setPdfJsDoc(null);
                  setEntities([]);
                  setManualBoxes([]);
                  setError(null);
                  setIsSuccess(false);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 px-3.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                {t('toolCommon.changeFile', { defaultValue: 'Change File' })}
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div
              className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col gap-3 text-xs text-emerald-900 dark:text-emerald-100 font-bold shadow-sm"
              id="sanitize_success_banner"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm">
                  {activeTab === 'redact'
                    ? 'Document Successfully Redacted & Blacked-Out!'
                    : 'Sanitization Completed! Clean PDF is Ready.'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-normal">
                {auditSummary
                  ? `Safely blacked out ${auditSummary.redactedItemsCount} sensitive entities across ${auditSummary.pagesModifiedCount} pages. Document flattened and metadata completely stripped.`
                  : 'All scripts, hidden actions, and metadata have been purged from the file.'}
              </p>
              {downloadUrl && (
                <div className="pt-2 flex items-center gap-3">
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    id="manual_download_link"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Download Shielded PDF</span>
                  </a>
                </div>
              )}

              <SecurityAffiliateBanner
                variant="vpn"
                className="mt-3 bg-white/60 dark:bg-slate-900/60"
                contextTitle="Sharing Sensitive Documents Online? Encrypt Your Connection"
                contextDesc="Now that your PDF is sanitized and PII is blacked out, ensure your internet connection is protected against eavesdropping and data packet snooping with NordVPN."
              />
            </div>
          )}

          {/* Tab 1: PII Auto-Redactor Workspace */}
          {activeTab === 'redact' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Canvas & Page Navigator (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Canvas Toolbar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isDrawingMode
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{isDrawingMode ? 'Drawing Box Active' : 'Draw Redact Box'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Visual Canvas Container */}
                  <div
                    ref={overlayRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex justify-center p-2 select-none ${
                      isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                  >
                    <canvas ref={canvasRef} className="shadow-lg rounded max-w-full" />

                    {/* Bounding box highlights on canvas for current page */}
                    {canvasSize.width > 0 &&
                      pageDimensions[currentPage - 1] &&
                      currentPageEntities.map((ent) => {
                        const dim = pageDimensions[currentPage - 1];
                        const sx = (ent.x / dim.width) * canvasSize.width;
                        const sy = ((dim.height - ent.y - ent.height) / dim.height) * canvasSize.height;
                        const sw = (ent.width / dim.width) * canvasSize.width;
                        const sh = (ent.height / dim.height) * canvasSize.height;

                        return (
                          <div
                            key={ent.id}
                            onClick={() => toggleEntity(ent.id)}
                            style={{
                              left: `${sx}px`,
                              top: `${sy}px`,
                              width: `${Math.max(16, sw)}px`,
                              height: `${Math.max(12, sh)}px`,
                            }}
                            className={`absolute transition-all cursor-pointer border ${
                              ent.selected
                                ? 'bg-black/90 text-white border-black shadow-md'
                                : 'bg-amber-400/30 border-dashed border-amber-600 text-amber-900'
                            }`}
                            title={`Click to ${ent.selected ? 'unselect' : 'select'} (${ent.text})`}
                          >
                            {ent.selected && (
                              <span className="text-[8px] font-mono font-bold px-1 text-white truncate block">
                                REDACT
                              </span>
                            )}
                          </div>
                        );
                      })}

                    {/* Manual Boxes on current page */}
                    {canvasSize.width > 0 &&
                      pageDimensions[currentPage - 1] &&
                      currentPageManualBoxes.map((box) => {
                        const dim = pageDimensions[currentPage - 1];
                        const sx = (box.x / dim.width) * canvasSize.width;
                        const sy = ((dim.height - box.y - box.height) / dim.height) * canvasSize.height;
                        const sw = (box.width / dim.width) * canvasSize.width;
                        const sh = (box.height / dim.height) * canvasSize.height;

                        return (
                          <div
                            key={box.id}
                            style={{
                              left: `${sx}px`,
                              top: `${sy}px`,
                              width: `${sw}px`,
                              height: `${sh}px`,
                            }}
                            className="absolute bg-black text-white border border-rose-500 group flex items-center justify-between p-1"
                          >
                            <span className="text-[9px] font-bold text-white truncate">BLACK-OUT</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeManualBox(box.id);
                              }}
                              className="text-white hover:text-rose-400 p-0.5 rounded cursor-pointer"
                              title="Delete manual box"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}

                    {/* User drag in progress */}
                    {currentDrawRect && currentDrawRect.w > 0 && (
                      <div
                        style={{
                          left: `${currentDrawRect.x}px`,
                          top: `${currentDrawRect.y}px`,
                          width: `${currentDrawRect.w}px`,
                          height: `${currentDrawRect.h}px`,
                        }}
                        className="absolute border-2 border-rose-500 bg-rose-500/20 pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: PII Detection Panel & Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Detected Sensitive PII ({entities.length + manualBoxes.length})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => toggleAll(true)}
                        className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => toggleAll(false)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Uncheck
                      </button>
                    </div>
                  </div>

                  {/* Category Summary Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                        selectedFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      All ({entities.length + manualBoxes.length})
                    </button>
                    {countsByCategory.card > 0 && (
                      <button
                        onClick={() => setSelectedFilter('card')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          selectedFilter === 'card'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        💳 Card ({countsByCategory.card})
                      </button>
                    )}
                    {countsByCategory.phone > 0 && (
                      <button
                        onClick={() => setSelectedFilter('phone')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          selectedFilter === 'phone'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        📞 Phone ({countsByCategory.phone})
                      </button>
                    )}
                    {countsByCategory.nid > 0 && (
                      <button
                        onClick={() => setSelectedFilter('nid')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          selectedFilter === 'nid'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        🪪 NID ({countsByCategory.nid})
                      </button>
                    )}
                    {countsByCategory.email > 0 && (
                      <button
                        onClick={() => setSelectedFilter('email')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          selectedFilter === 'email'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        ✉️ Email ({countsByCategory.email})
                      </button>
                    )}
                  </div>

                  {/* Custom Search Query Adder */}
                  <div className="flex gap-2 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={customSearchQuery}
                        onChange={(e) => setCustomSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSearch()}
                        placeholder="Search custom word (e.g. client name, IBAN)"
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleAddCustomSearch}
                      disabled={!customSearchQuery.trim()}
                      className="px-3 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                    >
                      Find
                    </button>
                  </div>

                  {/* List of Detected Entities */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEntities.length === 0 && manualBoxes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500 opacity-60" />
                        No sensitive PII matching filter. Use "Draw Redact Box" or Search to black-out any section.
                      </div>
                    ) : (
                      filteredEntities.map((ent) => {
                        const badge = getCategoryBadge(ent.category);
                        const Icon = badge.icon;
                        return (
                          <div
                            key={ent.id}
                            className="pt-2 flex items-center justify-between text-xs gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition"
                          >
                            <label className="flex items-center gap-2.5 truncate cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={ent.selected}
                                onChange={() => toggleEntity(ent.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {badge.label}
                              </span>
                              <span className="font-mono truncate font-medium text-slate-800 dark:text-slate-200">
                                {ent.text}
                              </span>
                            </label>
                            <button
                              onClick={() => setCurrentPage(ent.pageIndex + 1)}
                              className="text-[10px] text-slate-400 hover:text-emerald-600 whitespace-nowrap cursor-pointer"
                            >
                              Pg {ent.pageIndex + 1}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Redaction Style Picker */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Black-out Mask Style:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setRedactStyle('blackout')}
                        className={`p-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          redactStyle === 'blackout'
                            ? 'bg-black text-white border-black'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Solid Black
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactStyle('redacted_text')}
                        className={`p-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          redactStyle === 'redacted_text'
                            ? 'bg-slate-900 text-emerald-400 border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        [REDACTED]
                      </button>
                      <button
                        type="button"
                        onClick={() => setRedactStyle('whiteout')}
                        className={`p-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          redactStyle === 'whiteout'
                            ? 'bg-slate-200 text-slate-900 border-slate-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        White-out
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3">
                    {error && (
                      <div className="mb-3 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleExecuteRedaction}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Redacting & Purging...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            Black-out & Redact Document (
                            {entities.filter((e) => e.selected).length + manualBoxes.length})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Classic Structural Metadata & Action Stripper */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
                    <ShieldBan className="w-5 h-5 text-emerald-600" />
                    <span>Deep Structural Sanitize Workspace</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    This engine uses an isolated WebAssembly Worker to parse low-level PDF stream objects, completely erasing:
                  </p>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 list-disc pl-5">
                    <li>Embedded JavaScript scripts (/JS, /JavaScript)</li>
                    <li>Launch and external URI actions (/Launch, /SubmitForm)</li>
                    <li>Embedded document files, XML metadata, and author trackers</li>
                    <li>Interactive AcroForm input definitions</li>
                  </ul>

                  {warnings.length > 0 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200 mb-2">
                        {t('sanitizePdf.resultsTitle', { defaultValue: 'Purged Objects' })}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                        {warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    {t('sanitizePdf.actionsTitle', { defaultValue: 'Sanitize Actions' })}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Instantly purge all hidden scripts and personal metadata while keeping the visual layout intact.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {error && (
                    <div className="flex items-start space-x-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleStructuralSanitize}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <span className="flex items-center space-x-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sanitizing...</span>
                      </span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Sanitize & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide Section */}
      <section
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed"
        id="sanitize_guide_section"
      >
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Privacy & PII Redaction Guide
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Why client-side redaction is mandatory for legal, financial, and healthcare documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              True Black-out vs Fake Transparency
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Many cheap tools merely draw a black box over text, leaving the underlying words selectable and copy-pasteable. PdfMinty's Privacy AI Shield permanently burns opaque barriers into the PDF vector layer and strips underlying text streams.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Corporate & Bank Compliance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Compliance frameworks (GDPR, HIPAA, GLBA) prohibit uploading customer NIDs or credit cards to random cloud servers. PdfMinty executes 100% locally in your browser RAM.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <SecurityAffiliateBanner variant="dual" />
        </div>
      </section>
    </div>
  );
}
