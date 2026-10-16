import {
  Move,
  Download,
  AlertCircle,
  Sparkles,
  Loader2,
  RotateCw,
  RotateCcw,
  Trash2,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Undo2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../components/EmptyState';
import { FileUploader } from '../components/FileUploader';
import { SEO } from '../components/SEO';
import { ToolHeader } from '../components/ToolHeader';
import { TOOL_SIZE_LIMITS } from '../config/constants';
import { WorkerManager } from '../core/WorkerManager';
import { addActivityItem } from '../utils/activityStore';
import { downloadBlob } from '../utils/download';
import { logger } from '../utils/logger';

interface PageItem {
  id: string; // Unique ID to keep DOM identity stable during reorders
  page: number; // Original 1-based page index
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270 degrees
}

const parsePageSequence = (input: string, maxPages: number): number[] => {
  const result: number[] = [];
  const parts = input.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const rangeParts = trimmed.split('-');
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim(), 10);
        const end = parseInt(rangeParts[1].trim(), 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
          const step = start <= end ? 1 : -1;
          for (let i = start; step === 1 ? i <= end : i >= end; i += step) {
            if (i <= maxPages) {
              result.push(i);
            }
          }
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
        result.push(pageNum);
      }
    }
  }
  return result;
};

export const ReorderPdfPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const isBn = i18n.language === 'bn' || i18n.language?.startsWith('bn');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderingThumbnails, setRenderingThumbnails] = useState(false);
  const [items, setItems] = useState<PageItem[]>([]);
  const [deletedItems, setDeletedItems] = useState<PageItem[]>([]);
  const [originalBackup, setOriginalBackup] = useState<PageItem[]>([]);

  const [manualInput, setManualInput] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<PageItem | null>(null);
  // Grid density: 'compact' (4 cols) | 'normal' (3 cols) | 'large' (2 cols)
  const [gridDensity, setGridDensity] = useState<'compact' | 'normal' | 'large'>('normal');

  const operationTokenRef = useRef(0);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    urlsRef.current = [...items, ...deletedItems].map((item) => item.dataUrl);
  }, [items, deletedItems]);

  useEffect(() => {
    if (items.length > 0) {
      setManualInput(items.map((item) => item.page).join(', '));
    } else {
      setManualInput('');
    }
  }, [items]);

  useEffect(() => {
    const currentUrls = urlsRef.current;
    const token = operationTokenRef;
    return () => {
      token.current++;
      currentUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const myToken = ++operationTokenRef.current;
      items.forEach((item) => URL.revokeObjectURL(item.dataUrl));
      deletedItems.forEach((item) => URL.revokeObjectURL(item.dataUrl));

      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setItems([]);
      setDeletedItems([]);
      setOriginalBackup([]);
      setIsSuccess(false);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      setRenderingThumbnails(true);
      try {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        if (myToken !== operationTokenRef.current) return;
        const rendered = await WorkerManager.getInstance().runOperation<
          { page: number; imageBytes: Uint8Array }[]
        >('pdfToImage', { bytes: fileBytes, originalName: file.name, scale: 0.35 }, [
          fileBytes.buffer,
        ]);
        if (myToken !== operationTokenRef.current) return;

        const mapped: PageItem[] = rendered.map((item, idx) => {
          const blob = new Blob([item.imageBytes as unknown as BlobPart], { type: 'image/png' });
          return {
            id: `p-${item.page}-${idx}-${Date.now()}`,
            page: item.page,
            dataUrl: URL.createObjectURL(blob),
            rotation: 0,
          };
        });

        if (myToken !== operationTokenRef.current) return;
        setItems(mapped);
        setOriginalBackup(mapped);
      } catch (err: unknown) {
        if (myToken !== operationTokenRef.current) return;
        logger.error('Failed to render previews:', err);
        setError(
          isBn
            ? 'পৃষ্ঠার প্রিভিউ রেন্ডার করা যায়নি। আপনি ম্যানুয়ালি পেজ নম্বর ক্রম লিখতে পারেন।'
            : t('reorderPdf.previewWarning', {
                defaultValue:
                  'Error generating page layouts. You can still confirm standard sequencing if required.',
              })
        );
      } finally {
        if (myToken === operationTokenRef.current) {
          setRenderingThumbnails(false);
        }
      }
    }
  };

  // Reordering via Drag and Drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return;
    if (draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    setItems(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move page one position left or right
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(target, 0, removed);
    setItems(reordered);
  };

  // Rotate single page
  const handleRotateSingle = (index: number, angleChange: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const nextRotation = (it.rotation + angleChange + 360) % 360;
        return { ...it, rotation: nextRotation };
      })
    );
  };

  // Delete single page
  const handleDeleteSingle = (index: number) => {
    if (items.length <= 1) {
      setError(
        isBn
          ? 'ডকুমেন্টে কমপক্ষে একটি পৃষ্ঠা থাকতে হবে।'
          : 'You must keep at least one page in the document.'
      );
      return;
    }
    const itemToDelete = items[index];
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setDeletedItems((prev) => [...prev, itemToDelete]);
    setError(null);
  };

  // Restore deleted page
  const handleRestoreDeleted = (deletedIndex: number) => {
    const itemToRestore = deletedItems[deletedIndex];
    setDeletedItems((prev) => prev.filter((_, idx) => idx !== deletedIndex));
    setItems((prev) => [...prev, itemToRestore]);
  };

  // Restore all deleted pages
  const handleRestoreAll = () => {
    if (deletedItems.length === 0) return;
    setItems((prev) => [...prev, ...deletedItems]);
    setDeletedItems([]);
  };

  // Rotate all pages by 90 degrees
  const handleRotateAll = (angleChange = 90) => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        rotation: (it.rotation + angleChange + 360) % 360,
      }))
    );
  };

  // Invert / Reverse order of pages
  const handleReverseOrder = () => {
    setItems((prev) => [...prev].reverse());
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      handleMove(index, 'left');
      window.requestAnimationFrame(() => {
        document.getElementById(`reorder-item-${index - 1}`)?.focus();
      });
    } else if (e.key === 'ArrowRight' && index < items.length - 1) {
      e.preventDefault();
      handleMove(index, 'right');
      window.requestAnimationFrame(() => {
        document.getElementById(`reorder-item-${index + 1}`)?.focus();
      });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDeleteSingle(index);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      handleRotateSingle(index, 90);
    }
  };

  // Reset to original document sequence
  const resetOrder = () => {
    if (originalBackup.length > 0) {
      setItems(originalBackup.map((item) => ({ ...item, rotation: 0 })));
      setDeletedItems([]);
      setError(null);
    }
  };

  // Apply manual text input sequence (e.g. 1, 3, 2, 4-6)
  const applyManualSequence = () => {
    if (items.length === 0 && originalBackup.length === 0) return;
    const pool = originalBackup.length > 0 ? originalBackup : items;
    const maxPageNum = pool.length + deletedItems.length;

    const parsedPages = parsePageSequence(manualInput, maxPageNum);
    if (parsedPages.length === 0) {
      setError(
        isBn
          ? 'অবৈধ পেজ সিকোয়েন্স। উদাহরণ: 1, 3, 2, 4-6 লিখুন।'
          : 'Invalid page sequence. Please enter valid page numbers (e.g., 1, 3, 2, 4-6).'
      );
      return;
    }

    const newItems: PageItem[] = [];
    const usedIds = new Set<string>();

    parsedPages.forEach((pageNum) => {
      const originalItem = pool.find((item) => item.page === pageNum);
      if (originalItem) {
        newItems.push({
          ...originalItem,
          id: `p-${originalItem.page}-${Date.now()}-${Math.random()}`,
        });
        usedIds.add(originalItem.id);
      }
    });

    if (newItems.length > 0) {
      setItems(newItems);
      // Update deleted items to be any original items not included in sequence
      const notIncluded = pool.filter((it) => !newItems.some((n) => n.page === it.page));
      setDeletedItems(notIncluded);
      setError(null);
    } else {
      setError(isBn ? 'কোনো মিল পাওয়া যায়নি।' : 'No matching pages found in the sequence.');
    }
  };

  // Execute Reorder and Save PDF
  const handleReorder = async () => {
    if (!selectedFile) return;
    if (items.length === 0) {
      setError(
        isBn
          ? 'অনুগ্রহ করে প্রথমে এক বা একাধিক পৃষ্ঠা নির্বাচন করুন।'
          : 'Please select at least one page to save.'
      );
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
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      // Pass each page along with its custom rotation
      const newSequenceWithRotations = items.map((item) => ({
        page: item.page,
        rotation: item.rotation,
      }));

      const parsedBytes = await WorkerManager.getInstance().runOperation<Uint8Array>(
        'reorderPDF',
        { bytes: fileBytes, newOrder: newSequenceWithRotations },
        [fileBytes.buffer]
      );

      const blob = new Blob([parsedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const name = `pdfminty_organized_${selectedFile.name}`;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);

      // Record activity to user's dashboard history!
      addActivityItem({
        toolName: 'Organize & Reorder PDF',
        toolId: 'reorder',
        fileName: selectedFile.name,
        fileSizeFormatted: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'completed',
        tag: 'Edit',
        savings: `${items.length} pages arranged`,
      });

      await downloadBlob(blob, name);
      setIsSuccess(true);
    } catch (err: unknown) {
      logger.error('Reorder PDF failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message ||
          (isBn
            ? 'পৃষ্ঠাগুলো রি-অর্ডার ও সংরক্ষণ করতে ব্যর্থ হয়েছে।'
            : 'Failed to reorder document layout. Confirm pages structure.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Grid classes mapping based on density
  const gridClass =
    gridDensity === 'compact'
      ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
      : gridDensity === 'large'
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadein" id="reorder_page_container">
      <SEO slug="reorder-pdf" />
      <ToolHeader slug="reorder-pdf" limitMB={TOOL_SIZE_LIMITS['reorder-pdf'].maxSingleMB} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: File Upload & Visual Thumbnail Interactive Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {isBn ? 'ভিজ্যুয়াল পেজ অর্গানাইজার' : 'Visual Page Organizer'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'কার্ড ড্র্যাগ করে সাজান, সিঙ্গেল পেজ রোটেট করুন বা ডিলিট করুন'
                      : 'Drag cards to reorder, rotate individual sheets or delete specific pages'}
                  </p>
                </div>
              </div>

              {selectedFile && (
                <button
                  onClick={() => {
                    operationTokenRef.current++;
                    items.forEach((item) => URL.revokeObjectURL(item.dataUrl));
                    deletedItems.forEach((item) => URL.revokeObjectURL(item.dataUrl));
                    setSelectedFile(null);
                    setItems([]);
                    setDeletedItems([]);
                    setOriginalBackup([]);
                    setIsSuccess(false);
                    if (downloadUrl) {
                      URL.revokeObjectURL(downloadUrl);
                      setDownloadUrl(null);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  {isBn ? 'অন্য ফাইল' : t('toolCommon.changeFile', { defaultValue: 'Change File' })}
                </button>
              )}
            </div>

            {!selectedFile ? (
              <FileUploader
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
                maxSizeMB={TOOL_SIZE_LIMITS['reorder-pdf'].maxSingleMB}
              />
            ) : (
              <div
                className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between"
                id="loaded_reorder_file"
              >
                <div className="truncate pr-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {items.length}{' '}
                      {isBn ? 'পৃষ্ঠা সক্রিয়' : 'pages active'}
                      {deletedItems.length > 0 && ` (${deletedItems.length} deleted)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    100% {isBn ? 'অফলাইন' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div
              className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-emerald-900 dark:text-emerald-200 font-bold shadow-sm animate-fadein"
              id="reorder_success_banner"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-800 dark:text-emerald-100">
                    {isBn
                      ? 'অর্গানাইজ ও রি-অর্ডার সফল হয়েছে!'
                      : t('reorderPdf.successTitle', {
                          defaultValue: 'Pages Reordered Successfully! Your custom PDF is ready.',
                        })}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300 font-normal">
                    {isBn
                      ? `মোট ${items.length}টি পৃষ্ঠা নতুন ক্রমে সাজিয়ে ডাউনলোড তৈরি করা হয়েছে।`
                      : `Custom arrangement of ${items.length} pages generated securely in memory.`}
                  </p>
                </div>
              </div>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadName}
                  id="manual_download_link"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>
                    {isBn
                      ? 'পিডিএফ ডাউনলোড করুন'
                      : t('reorderPdf.downloadReordered', {
                          defaultValue: 'Download Reordered PDF',
                        })}
                  </span>
                </a>
              )}
            </div>
          )}

          {!selectedFile && (
            <EmptyState
              title={
                isBn
                  ? 'পৃষ্ঠা সাজাতে বা রোটেট করতে পিডিএফ আপলোড করুন'
                  : t('reorderPdf.emptyTitle', { defaultValue: 'Upload a PDF to reorder pages' })
              }
              description={
                isBn
                  ? 'ফাইল সিলেক্ট করার সাথে সাথে প্রতিটি পৃষ্ঠার ইন্টারঅ্যাক্টিভ থাম্বনেইল কার্ড ড্র্যাগ, রোটেট এবং ডিলিট কন্ট্রোল সহ প্রদর্শিত হবে।'
                  : t('reorderPdf.emptyDesc', {
                      defaultValue:
                        'Select a document above to drag, drop, and rearrange your PDF page order.',
                    })
              }
            />
          )}

          {/* Interactive Workspace Area */}
          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Batch Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotateAll(90)}
                    disabled={items.length === 0}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title={isBn ? 'সব পৃষ্ঠা ৯০° রোটেট করুন' : 'Rotate all pages 90° CW'}
                  >
                    <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isBn ? 'সব রোটেট ৯০°' : 'Rotate All 90°'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReverseOrder}
                    disabled={items.length <= 1}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title={isBn ? 'উল্টো ক্রমে সাজান' : 'Reverse page order'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isBn ? 'রিভার্স অর্ডার' : 'Reverse Order'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetOrder}
                    disabled={items.length === 0}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title={isBn ? 'আসল ক্রমে ফিরুন' : 'Reset to original layout'}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isBn ? 'রিসেট' : 'Reset'}</span>
                  </button>
                </div>

                {/* Density View Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-1">
                    {isBn ? 'ভিউ:' : 'View:'}
                  </span>
                  {(['compact', 'normal', 'large'] as const).map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setGridDensity(density)}
                      className={`px-2 py-0.5 rounded-lg text-xs capitalize transition-all cursor-pointer ${
                        gridDensity === density
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {density === 'compact'
                        ? isBn
                          ? 'ছোট'
                          : 'Compact'
                        : density === 'normal'
                          ? isBn
                            ? 'সাধারণ'
                            : 'Normal'
                          : isBn
                            ? 'বড়'
                            : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deleted Pages Tray (if any) */}
              {deletedItems.length > 0 && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-fadein">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <Trash2 className="w-4 h-4 text-amber-600" />
                    <span>
                      {isBn
                        ? `${deletedItems.length}টি পৃষ্ঠা ডিলিট করা হয়েছে`
                        : `${deletedItems.length} page(s) removed from layout`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {deletedItems.map((d, dIdx) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleRestoreDeleted(dIdx)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 text-[11px] font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                        title={isBn ? `পৃষ্ঠা ${d.page} রিস্টোর করুন` : `Restore page ${d.page}`}
                      >
                        <span>+ P.{d.page}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleRestoreAll}
                      className="py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সব রিস্টোর' : 'Restore All'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Sequence Input Bar */}
              {items.length > 0 && !renderingThumbnails && (
                <div
                  className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2"
                  id="manual_reorder_container"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label
                      htmlFor="manual-page-sequence-input"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {isBn
                          ? 'ম্যানুয়াল পেজ সিকোয়েন্স'
                          : t('reorderPdf.manualSequence', {
                              defaultValue: 'Manual Page Sequence',
                            })}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isBn
                        ? 'যেমন: 1, 3, 2, 4-6 (রেঞ্জ সাপোর্ট করে)'
                        : 'e.g., 1, 3, 2, 4-6 (Supports ranges & duplicates)'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="manual-page-sequence-input"
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyManualSequence();
                        }
                      }}
                      placeholder="e.g. 1, 3, 2, 4-6"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={applyManualSequence}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isBn
                        ? 'প্রয়োগ করুন'
                        : t('reorderPdf.applyOrder', { defaultValue: 'Apply Order' })}
                    </button>
                  </div>
                </div>
              )}

              {/* Thumbnail Rendering Loader */}
              {renderingThumbnails ? (
                <div
                  className="flex flex-col items-center justify-center p-16 space-y-3"
                  id="reorder_thumbnails_loader"
                >
                  <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'প্রতিটি পৃষ্ঠার হাই-কোয়ালিটি থাম্বনেইল রেন্ডার করা হচ্ছে...'
                      : t('reorderPdf.renderingPages', {
                          defaultValue: 'Rendering pages for workspace drag grids...',
                        })}
                  </p>
                </div>
              ) : items.length > 0 ? (
                /* Interactive Draggable Thumbnails Grid */
                <div
                  className={`grid ${gridClass} gap-4 sm:gap-5`}
                  id="reorder_draggable_grid"
                  role="listbox"
                  aria-label="Reorder PDF pages. Drag to arrange or use card action buttons."
                >
                  {items.map((item, index) => {
                    const isDragging = draggedIndex === index;
                    const isTarget = dragOverIndex === index && draggedIndex !== index;

                    return (
                      <div
                        key={item.id}
                        id={`reorder-item-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        tabIndex={0}
                        role="option"
                        aria-selected={isDragging}
                        className={`group relative bg-slate-50 dark:bg-slate-950/50 border-2 rounded-2xl p-2 flex flex-col justify-between transition-all select-none focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDragging
                            ? 'opacity-30 border-dashed border-emerald-500 scale-95 shadow-inner'
                            : isTarget
                              ? 'border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/20 scale-[1.02] shadow-xl'
                              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-md'
                        }`}
                      >
                        {/* Top Badges & Drag Gripper */}
                        <div className="flex items-center justify-between pb-1.5 z-10">
                          {/* New Position Badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-900 dark:bg-black text-white font-black text-[11px] rounded-lg shadow-sm border border-slate-700/60">
                              #{index + 1}
                            </span>
                            {item.rotation !== 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] rounded border border-amber-500/20">
                                {item.rotation}°
                              </span>
                            )}
                          </div>

                          {/* Drag Grip Handle */}
                          <div
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
                            title={isBn ? 'ড্র্যাগ করে সরান' : 'Drag to reorder'}
                          >
                            <span className="text-sm font-bold tracking-tighter select-none">
                              ⠿⠿
                            </span>
                          </div>
                        </div>

                        {/* Page Preview Thumbnail Image Container */}
                        <div
                          className="relative w-full aspect-[3/4] bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-inner cursor-pointer group/img"
                          onClick={() => setPreviewItem(item)}
                          title={isBn ? 'ক্লিক করে বড় প্রিভিউ দেখুন' : 'Click to inspect full page'}
                        >
                          <img
                            src={item.dataUrl}
                            alt={`Page ${item.page}`}
                            referrerPolicy="no-referrer"
                            style={{
                              transform: `rotate(${item.rotation}deg)`,
                              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            className="max-w-full max-h-full object-contain pointer-events-none"
                          />

                          {/* Hover Zoom Overlay */}
                          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-2 rounded-xl bg-white/90 text-slate-900 shadow-md flex items-center gap-1 text-[11px] font-bold">
                              <ZoomIn className="w-4 h-4 text-emerald-600" />
                              <span>{isBn ? 'জুম' : 'Inspect'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer: Original Page info & Action Buttons */}
                        <div className="pt-2 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {isBn ? 'মূল পৃ.' : 'Orig P.'}
                            {item.page}
                          </span>

                          {/* Quick Card Controls: Move Left, Rotate, Delete, Move Right */}
                          <div className="flex items-center gap-1">
                            {/* Move Left */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMove(index, 'left');
                              }}
                              disabled={index === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                              title={isBn ? 'বামে সরান' : 'Move Left'}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Rotate 90° Clockwise */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRotateSingle(index, 90);
                              }}
                              className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
                              title={isBn ? 'পৃষ্ঠা ৯০° রোটেট করুন' : 'Rotate 90° CW'}
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Page */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingle(index);
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              title={isBn ? 'এই পৃষ্ঠাটি বাদ দিন' : 'Remove this page'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Right */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMove(index, 'right');
                              }}
                              disabled={index === items.length - 1}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                              title={isBn ? 'ডানে সরান' : 'Move Right'}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'সবগুলো পৃষ্ঠা ডিলিট করা হয়েছে।'
                      : 'All pages have been removed from the layout.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleRestoreAll}
                    className="py-1.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow cursor-pointer hover:bg-emerald-700 transition-colors"
                  >
                    {isBn ? 'পৃষ্ঠাগুলো ফিরিয়ে আনুন' : 'Restore Pages'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Configuration Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isBn
                  ? 'লেআউট ও অ্যাসেম্বলি সামারি'
                  : t('reorderPdf.layoutSummary', { defaultValue: 'Layout Summary' })}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'ড্র্যাগ অ্যান্ড ড্রপ গ্রিডের মাধ্যমে উল্টো স্ক্যান পেজ ঠিক করা, অপ্রয়োজনীয় পেজ ডিলিট করা বা স্লাইড ক্রম বদলে নতুন পিডিএফ তৈরি করুন।'
                : 'Correct upside-down scans, remove unwanted pages, and build an immaculate presentation without uploading files.'}
            </p>

            <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isBn ? '১০০% ক্লায়েন্ট-সাইড প্রসেসিং' : 'Zero Server Uploads'}</span>
              </div>
              <p>
                {isBn
                  ? 'আপনার সব ডকুমেন্ট ব্রাউজার মেমরিতে সুরক্ষিত থাকে এবং ড্র্যাগ করা ক্রমে সাথে সাথে রেন্ডার হয়।'
                  : 'Page thumbnails and reassembled PDF trees are processed strictly inside your device.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{isBn ? 'সক্রিয় পৃষ্ঠা:' : 'Active Pages:'}</span>
                <span className="font-black text-slate-900 dark:text-white">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{isBn ? 'বাদ দেওয়া পৃষ্ঠা:' : 'Deleted Pages:'}</span>
                <span className="font-bold text-amber-600">{deletedItems.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{isBn ? 'রোটেট করা পৃষ্ঠা:' : 'Rotated Pages:'}</span>
                <span className="font-bold text-emerald-600">
                  {items.filter((it) => it.rotation !== 0).length}
                </span>
              </div>
            </div>

            {/* Ordering Matrix Output Pill preview */}
            {items.length > 0 && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isBn
                    ? 'আউটপুট সিকোয়েন্স প্রিভিউ'
                    : t('reorderPdf.outputMatrix', { defaultValue: 'Output Ordering Matrix' })}
                </p>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto no-scrollbar">
                  {items.map((item, index) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-[10px] rounded-lg inline-flex items-center gap-1 shadow-sm"
                    >
                      <span className="text-[9px] text-slate-400">#{index + 1}:</span> P.{item.page}
                      {item.rotation !== 0 && (
                        <span className="text-[9px] text-amber-500 font-bold">
                          ({item.rotation}°)
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button & Error State */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div className="flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-3 rounded-xl animate-fadein">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleReorder}
              disabled={!selectedFile || items.length === 0 || loading}
              className={`w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                loading ? 'cursor-not-allowed opacity-80' : 'hover:scale-[1.01] active:scale-[0.99]'
              }`}
              id="confirm-reorder-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {isBn
                      ? 'অর্গানাইজ ও প্রস্তুত হচ্ছে...'
                      : t('reorderPdf.processingButton', {
                          defaultValue: 'Reordering Assembling...',
                        })}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {isBn
                      ? `সংরক্ষণ করুন (${items.length} পৃষ্ঠা)`
                      : t('reorderPdf.reorderSaveButton', {
                          defaultValue: `Save Reordered PDF (${items.length} pages)`,
                        })}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL HIGH-RES PAGE INSPECTION / PREVIEW MODAL            */}
      {/* ========================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isBn
                    ? `মূল পৃষ্ঠা ${previewItem.page} — প্রিভিউ`
                    : `Original Page ${previewItem.page} Preview`}
                </h3>
                {previewItem.rotation !== 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                    {previewItem.rotation}°
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const idx = items.findIndex((it) => it.id === previewItem.id);
                    if (idx !== -1) {
                      handleRotateSingle(idx, -90);
                      setPreviewItem((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation - 90 + 360) % 360 } : null
                      );
                    }
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>-90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idx = items.findIndex((it) => it.id === previewItem.id);
                    if (idx !== -1) {
                      handleRotateSingle(idx, 90);
                      setPreviewItem((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null
                      );
                    }
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image display */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl">
              <img
                src={previewItem.dataUrl}
                alt={`Preview page ${previewItem.page}`}
                style={{
                  transform: `rotate(${previewItem.rotation}deg)`,
                  transition: 'transform 0.25s ease-out',
                }}
                className="max-h-[60vh] max-w-full object-contain shadow-lg rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>{isBn ? 'রেজোলিউশন: অপ্টিমাইজড ভেক্টর' : 'Rendered via local HTML5 Canvas'}</span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderPdfPage;
