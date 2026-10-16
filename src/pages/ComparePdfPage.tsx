import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns,
  Copy,
  Download,
  FileText,
  GitCompare,
  Layers,
  List,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import { FileUploader } from '../components/FileUploader';
import { recordLocalProcessing } from '../components/NetworkPrivacyInspector';
import { SecurityAffiliateBanner } from '../components/SecurityAffiliateBanner';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { getPdfJs } from '../core';
import { recordDailyTask } from '../utils/usageLimit';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineA?: number;
  lineB?: number;
}

interface PageDiff {
  pageIndex: number;
  textA: string;
  textB: string;
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

// Simple fast Myers / LCS line diff algorithm
function computeLineDiff(linesA: string[], linesB: string[]): DiffLine[] {
  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (linesA[i].trim() === linesB[j].trim()) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1].trim() === linesB[j - 1].trim()) {
      result.unshift({
        type: 'unchanged',
        text: linesA[i - 1],
        lineA: i,
        lineB: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        text: linesB[j - 1],
        lineB: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        text: linesA[i - 1],
        lineA: i,
      });
      i--;
    }
  }

  return result;
}

export const ComparePdfPage: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);

  const [docA, setDocA] = useState<PDFDocumentProxy | null>(null);
  const [docB, setDocB] = useState<PDFDocumentProxy | null>(null);

  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageDiffs, setPageDiffs] = useState<PageDiff[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'side_by_side' | 'unified' | 'visual_canvas'>('side_by_side');
  const [showChangesOnly, setShowChangesOnly] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Visual canvas comparison refs
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);

  // Swap documents
  const handleSwap = () => {
    const tempFile = fileA;
    setFileA(fileB);
    setFileB(tempFile);

    const tempDoc = docA;
    setDocA(docB);
    setDocB(tempDoc);

    // Re-compare with flipped docs
    if (fileB && fileA) {
      runComparison(fileB, fileA);
    }
  };

  const runComparison = async (fA: File, fB: File) => {
    setIsComparing(true);
    setError(null);
    setPageDiffs([]);
    setCurrentPage(1);

    try {
      const pdfjs = await getPdfJs();

      const [bufA, bufB] = await Promise.all([fA.arrayBuffer(), fB.arrayBuffer()]);
      const bytesA = new Uint8Array(bufA);
      const bytesB = new Uint8Array(bufB);

      recordLocalProcessing(bytesA.byteLength + bytesB.byteLength, `PDF Diff: ${fA.name} vs ${fB.name}`);
      recordDailyTask(null, 'compare_pdf');

      const [loadedA, loadedB] = await Promise.all([
        pdfjs.getDocument({ data: bytesA }).promise,
        pdfjs.getDocument({ data: bytesB }).promise,
      ]);

      setDocA(loadedA);
      setDocB(loadedB);

      const maxPages = Math.max(loadedA.numPages, loadedB.numPages);
      const diffResults: PageDiff[] = [];

      for (let p = 1; p <= maxPages; p++) {
        let textA = '';
        let textB = '';

        if (p <= loadedA.numPages) {
          const pageA = await loadedA.getPage(p);
          const contentA = await pageA.getTextContent();
          textA = contentA.items
            .map((it) => ('str' in it ? it.str : ''))
            .filter((s) => s.trim().length > 0)
            .join('\n');
        }

        if (p <= loadedB.numPages) {
          const pageB = await loadedB.getPage(p);
          const contentB = await pageB.getTextContent();
          textB = contentB.items
            .map((it) => ('str' in it ? it.str : ''))
            .filter((s) => s.trim().length > 0)
            .join('\n');
        }

        const linesA = textA ? textA.split('\n') : [];
        const linesB = textB ? textB.split('\n') : [];

        const diffLines = computeLineDiff(linesA, linesB);
        let added = 0;
        let removed = 0;
        let unchanged = 0;

        diffLines.forEach((l) => {
          if (l.type === 'added') added++;
          else if (l.type === 'removed') removed++;
          else unchanged++;
        });

        diffResults.push({
          pageIndex: p - 1,
          textA,
          textB,
          lines: diffLines,
          addedCount: added,
          removedCount: removed,
          unchangedCount: unchanged,
        });
      }

      setPageDiffs(diffResults);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compare PDF documents.';
      setError(msg);
    } finally {
      setIsComparing(false);
    }
  };

  // Render visual page canvases when in visual_canvas mode
  useEffect(() => {
    if (viewMode !== 'visual_canvas' || !docA || !docB) return;
    let cancelled = false;

    const renderCanvases = async () => {
      try {
        if (currentPage <= docA.numPages && canvasARef.current) {
          const pA = await docA.getPage(currentPage);
          if (cancelled) return;
          const vpA = pA.getViewport({ scale: 1.0 });
          const scaleA = Math.min(1.5, 360 / vpA.width);
          const scaledVpA = pA.getViewport({ scale: scaleA });
          canvasARef.current.width = scaledVpA.width;
          canvasARef.current.height = scaledVpA.height;
          const ctxA = canvasARef.current.getContext('2d');
          if (ctxA) {
            ctxA.clearRect(0, 0, scaledVpA.width, scaledVpA.height);
            await pA.render({ canvasContext: ctxA, viewport: scaledVpA }).promise;
          }
        }

        if (currentPage <= docB.numPages && canvasBRef.current) {
          const pB = await docB.getPage(currentPage);
          if (cancelled) return;
          const vpB = pB.getViewport({ scale: 1.0 });
          const scaleB = Math.min(1.5, 360 / vpB.width);
          const scaledVpB = pB.getViewport({ scale: scaleB });
          canvasBRef.current.width = scaledVpB.width;
          canvasBRef.current.height = scaledVpB.height;
          const ctxB = canvasBRef.current.getContext('2d');
          if (ctxB) {
            ctxB.clearRect(0, 0, scaledVpB.width, scaledVpB.height);
            await pB.render({ canvasContext: ctxB, viewport: scaledVpB }).promise;
          }
        }
      } catch (e) {
        console.error('Error rendering visual diff canvases', e);
      }
    };

    renderCanvases();
    return () => {
      cancelled = true;
    };
  }, [viewMode, currentPage, docA, docB]);

  // Total diff metrics
  const totals = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    pageDiffs.forEach((p) => {
      added += p.addedCount;
      removed += p.removedCount;
      unchanged += p.unchangedCount;
    });
    const totalLines = added + removed + unchanged;
    const similarity = totalLines > 0 ? ((unchanged / totalLines) * 100).toFixed(1) : '100.0';
    return { added, removed, unchanged, similarity };
  }, [pageDiffs]);

  const activePageDiff = pageDiffs[currentPage - 1];

  const handleCopyReport = () => {
    if (!fileA || !fileB) return;
    const report = `# PDF Difference Report
Original (v1): ${fileA.name} (${docA?.numPages || 0} pages)
Modified (v2): ${fileB.name} (${docB?.numPages || 0} pages)
Date: ${new Date().toLocaleString()}
Document Similarity: ${totals.similarity}%
Total Additions (+): ${totals.added} lines
Total Deletions (-): ${totals.removed} lines

## Page-by-Page Summary:
${pageDiffs
  .map(
    (p) =>
      `Page ${p.pageIndex + 1}: +${p.addedCount} additions, -${p.removedCount} deletions (${
        p.addedCount === 0 && p.removedCount === 0 ? 'Identical' : 'Modified'
      })`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!fileA || !fileB) return;
    const reportText = `========================================================
PDFMINTY VISUAL PDF DIFF COMPARISON REPORT
========================================================
Original File (V1): ${fileA.name} (${(fileA.size / 1024).toFixed(1)} KB)
Revised File (V2):  ${fileB.name} (${(fileB.size / 1024).toFixed(1)} KB)
Comparison Time:    ${new Date().toLocaleString()}
Document Match:     ${totals.similarity}% Match
Summary:            +${totals.added} Additions | -${totals.removed} Deletions

========================================================
DETAILED LINE DIFF BY PAGE:
========================================================
${pageDiffs
  .map((p) => {
    const lines = p.lines
      .filter((l) => (showChangesOnly ? l.type !== 'unchanged' : true))
      .map((l) => {
        const prefix = l.type === 'added' ? '[+] ' : l.type === 'removed' ? '[-] ' : '    ';
        return `${prefix}${l.text}`;
      })
      .join('\n');
    return `--- PAGE ${p.pageIndex + 1} (${p.addedCount} additions, ${p.removedCount} deletions) ---\n${lines || '    (No text differences on this page)'}`;
  })
  .join('\n\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-diff-report-${fileA.name.replace(/\.pdf$/i, '')}-vs-${fileB.name.replace(/\.pdf$/i, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadein" id="compare_pdf_container">
      <SEO slug="compare-pdf" />
      <ToolHeader slug="compare-pdf" limitMB={100} />

      {/* Upload Zone (If files not yet both selected) */}
      {(!fileA || !fileB || pageDiffs.length === 0) && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Side-by-Side Visual Document Comparison</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Compare Two PDF Documents
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Upload original Version 1 and revised Version 2 to instantly highlight added clauses (green) and deleted terms (red). 100% private in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Box A: Original Document */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Document A (Original / V1)
                </span>
                {fileA && (
                  <button
                    onClick={() => setFileA(null)}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!fileA ? (
                <FileUploader
                  onFilesSelected={(files) => {
                    if (files && files.length > 0) {
                      setFileA(files[0]);
                      if (fileB) runComparison(files[0], fileB);
                    }
                  }}
                  accept=".pdf,application/pdf"
                  maxSizeMB={100}
                  id="uploader_file_a"
                />
              ) : (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-rose-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fileA.name}</p>
                    <p className="text-[11px] text-slate-400">{(fileA.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Box B: Revised Document */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Document B (Modified / V2)
                </span>
                {fileB && (
                  <button
                    onClick={() => setFileB(null)}
                    className="text-xs text-emerald-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!fileB ? (
                <FileUploader
                  onFilesSelected={(files) => {
                    if (files && files.length > 0) {
                      setFileB(files[0]);
                      if (fileA) runComparison(fileA, files[0]);
                    }
                  }}
                  accept=".pdf,application/pdf"
                  maxSizeMB={100}
                  id="uploader_file_b"
                />
              ) : (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fileB.name}</p>
                    <p className="text-[11px] text-slate-400">{(fileB.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trigger Compare Button */}
          {fileA && fileB && pageDiffs.length === 0 && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => runComparison(fileA, fileB)}
                disabled={isComparing}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition hover:scale-[1.02]"
              >
                {isComparing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Comparing Documents...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4" />
                    <span>Run Visual Side-by-Side Diff</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Comparison Workspace (Active once comparison is complete) */}
      {fileA && fileB && pageDiffs.length > 0 && (
        <div className="space-y-4">
          {/* Top Bar: Summary & Controls */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Document Names & Similarity Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {fileA.name}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">vs</span>
                  <span className="text-xs font-bold text-emerald-600 truncate max-w-[180px]">
                    {fileB.name}
                  </span>
                  <button
                    onClick={handleSwap}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                    title="Swap V1 and V2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">
                    {totals.similarity}% Match
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-mono font-bold">+{totals.added} Added</span>
                  <span>•</span>
                  <span className="text-rose-700 font-mono font-bold">-{totals.removed} Deleted</span>
                </div>
              </div>
            </div>

            {/* View Switchers & Export */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('side_by_side')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'side_by_side'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  onClick={() => setViewMode('unified')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'unified'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Unified Diff</span>
                </button>
                <button
                  onClick={() => setViewMode('visual_canvas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'visual_canvas'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Visual Pages</span>
                </button>
              </div>

              <button
                onClick={handleCopyReport}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Copy comparison summary"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition cursor-pointer"
                title="Download text diff report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Page Navigator & Filter Bar */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Page {currentPage} of {pageDiffs.length}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageDiffs.length, p + 1))}
                disabled={currentPage >= pageDiffs.length}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {activePageDiff && (
                <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  +{activePageDiff.addedCount} / -{activePageDiff.removedCount} on this page
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showChangesOnly}
                  onChange={(e) => setShowChangesOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Only Modified Lines</span>
              </label>

              <button
                onClick={() => {
                  setFileA(null);
                  setFileB(null);
                  setDocA(null);
                  setDocB(null);
                  setPageDiffs([]);
                }}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Compare New Pair
              </button>
            </div>
          </div>

          {/* MAIN DIFF DISPLAY */}
          {activePageDiff && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* VIEW 1: Side-by-Side View */}
              {viewMode === 'side_by_side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                  {/* Left: Original (V1) */}
                  <div className="p-4 space-y-1 bg-slate-50/40 dark:bg-slate-950/20 max-h-[600px] overflow-y-auto">
                    <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 py-1 px-2 border-b border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 font-bold font-sans flex items-center justify-between text-xs mb-2">
                      <span>Original Document (V1)</span>
                      <span className="text-[10px] font-mono">-{activePageDiff.removedCount} lines</span>
                    </div>

                    {activePageDiff.lines
                      .filter((l) => (showChangesOnly ? l.type !== 'unchanged' : true))
                      .map((l, idx) => {
                        if (l.type === 'added') return null; // Only show removed/unchanged on left
                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded flex items-start gap-2 leading-relaxed ${
                              l.type === 'removed'
                                ? 'bg-rose-100/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-2 border-rose-500'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 text-[10px] text-slate-400 select-none text-right">
                              {l.lineA || ''}
                            </span>
                            <span className="font-bold select-none">{l.type === 'removed' ? '-' : ' '}</span>
                            <span className="flex-1 break-words whitespace-pre-wrap">{l.text}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Right: Revised (V2) */}
                  <div className="p-4 space-y-1 bg-slate-50/40 dark:bg-slate-950/20 max-h-[600px] overflow-y-auto">
                    <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 py-1 px-2 border-b border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold font-sans flex items-center justify-between text-xs mb-2">
                      <span>Revised Document (V2)</span>
                      <span className="text-[10px] font-mono">+{activePageDiff.addedCount} lines</span>
                    </div>

                    {activePageDiff.lines
                      .filter((l) => (showChangesOnly ? l.type !== 'unchanged' : true))
                      .map((l, idx) => {
                        if (l.type === 'removed') return null; // Only show added/unchanged on right
                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded flex items-start gap-2 leading-relaxed ${
                              l.type === 'added'
                                ? 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-l-2 border-emerald-500'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 text-[10px] text-slate-400 select-none text-right">
                              {l.lineB || ''}
                            </span>
                            <span className="font-bold select-none">{l.type === 'added' ? '+' : ' '}</span>
                            <span className="flex-1 break-words whitespace-pre-wrap">{l.text}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* VIEW 2: Unified Diff View */}
              {viewMode === 'unified' && (
                <div className="p-4 space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto bg-slate-950 text-slate-200">
                  {activePageDiff.lines
                    .filter((l) => (showChangesOnly ? l.type !== 'unchanged' : true))
                    .map((l, idx) => (
                      <div
                        key={idx}
                        className={`p-1 rounded flex items-start gap-3 leading-relaxed ${
                          l.type === 'added'
                            ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                            : l.type === 'removed'
                              ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500'
                              : 'text-slate-400'
                        }`}
                      >
                        <span className="w-8 text-[10px] text-slate-500 select-none text-right">
                          {l.lineA ? `A:${l.lineA}` : l.lineB ? `B:${l.lineB}` : ''}
                        </span>
                        <span className="font-bold select-none text-sm leading-none">
                          {l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' '}
                        </span>
                        <span className="flex-1 break-words whitespace-pre-wrap">{l.text}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* VIEW 3: Visual Canvas Mode */}
              {viewMode === 'visual_canvas' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 dark:bg-slate-950 justify-items-center">
                  <div className="space-y-2 text-center">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      Page {currentPage} — {fileA.name}
                    </span>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
                      <canvas ref={canvasARef} className="max-w-full rounded" />
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Page {currentPage} — {fileB.name}
                    </span>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
                      <canvas ref={canvasBRef} className="max-w-full rounded" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <SecurityAffiliateBanner
        variant="vpn"
        contextTitle="Reviewing Confidential Legal Contracts or Agreements?"
        contextDesc="Ensure your device connection and outbound communications are encrypted with NordVPN. Protect sensitive business deals and non-disclosure documents from ISP snooping."
      />
    </div>
  );
};

export default ComparePdfPage;
