import { ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { LazyPDFPage } from './LazyPDFPage';

interface DocumentPreviewProps {
  pdfDoc: PDFDocumentProxy;
  pageCount: number;
  selectedPages?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  rotations?: Record<number, number>;
  scale?: number;
  label?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  pdfDoc,
  pageCount,
  selectedPages,
  onSelectionChange,
  rotations = {},
  scale = 0.3,
  label,
}) => {
  const { t } = useTranslation('common');
  const [internalSelection, setInternalSelection] = useState<Set<number>>(
    selectedPages ?? new Set()
  );

  const lastSelectedRef = useRef<number | null>(null);

  const [zoom, setZoom] = useState<number>(scale);

  const handleZoomChange = (amount: number) => {
    setZoom((prev) => Math.max(0.1, Math.min(1.2, prev + amount)));
  };

  const isControlled = selectedPages !== undefined && onSelectionChange !== undefined;
  const currentSelection = isControlled ? selectedPages : internalSelection;

  const handleSelect = useCallback(
    (index: number, event?: React.MouseEvent | React.KeyboardEvent) => {
      if (event?.shiftKey && lastSelectedRef.current !== null) {
        const start = Math.min(lastSelectedRef.current, index);
        const end = Math.max(lastSelectedRef.current, index);
        setInternalSelection((prev) => {
          const merged = new Set(prev);
          for (let i = start; i <= end; i++) merged.add(i);
          if (onSelectionChange) onSelectionChange(merged);
          return merged;
        });
      } else {
        setInternalSelection((prev) => {
          const next = new Set(prev);
          if (next.has(index)) next.delete(index);
          else next.add(index);
          if (onSelectionChange) onSelectionChange(next);
          return next;
        });
      }
      lastSelectedRef.current = index;
    },
    [onSelectionChange, setInternalSelection]
  );

  const selectAll = useCallback(() => {
    const all = new Set<number>();
    for (let i = 0; i < pageCount; i++) all.add(i);
    setInternalSelection(all);
    if (onSelectionChange) onSelectionChange(all);
  }, [pageCount, onSelectionChange, setInternalSelection]);

  const clearAll = useCallback(() => {
    setInternalSelection(new Set());
    if (onSelectionChange) onSelectionChange(new Set());
    lastSelectedRef.current = null;
  }, [onSelectionChange, setInternalSelection]);

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 shadow-xs">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{label ?? t('preview.pagesCount', { count: pageCount, defaultValue: `${pageCount} page${pageCount !== 1 ? 's' : ''}` })}</span>
          {currentSelection.size > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">
              · {t('preview.selectedCount', { count: currentSelection.size, defaultValue: `${currentSelection.size} selected` })}
            </span>
          )}
        </span>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          {/* Zoom controls with elegant look */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <button
              onClick={() => handleZoomChange(-0.05)}
              disabled={zoom <= 0.15}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title={t('preview.zoomOut', { defaultValue: 'Zoom Out' })}
              aria-label={t('preview.zoomOut', { defaultValue: 'Zoom Out' })}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 min-w-[42px] text-center select-none">
              {Math.round(zoom * 333)}%
            </span>
            <button
              onClick={() => handleZoomChange(0.05)}
              disabled={zoom >= 1.2}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title={t('preview.zoomIn', { defaultValue: 'Zoom In' })}
              aria-label={t('preview.zoomIn', { defaultValue: 'Zoom In' })}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={() => setZoom(scale)}
              disabled={zoom === scale}
              className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:pointer-events-none px-1.5 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title={t('preview.resetZoomTitle', { defaultValue: 'Reset to default scale' })}
            >
              {t('preview.resetZoom', { defaultValue: 'Reset' })}
            </button>
          </div>

          {onSelectionChange ? (
            <div className="flex gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-4">
              <button
                onClick={selectAll}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs cursor-pointer hover:border-emerald-500/30"
              >
                {t('preview.selectAll', { defaultValue: 'All' })}
              </button>
              <button
                onClick={clearAll}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 transition-all bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs cursor-pointer hover:border-rose-500/30"
              >
                {t('preview.clearSelection', { defaultValue: 'Clear' })}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid Canvas with Auto Fill layout */}
      <div 
        className="grid gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl overflow-y-auto max-h-[65vh] justify-center"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(480 * zoom)}px, 1fr))`,
        }}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <div key={i} className="flex flex-col items-center justify-center">
            <div className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-950 p-1">
              <LazyPDFPage
                pdfDoc={pdfDoc}
                pageNumber={i + 1}
                pageIndex={i}
                rotation={rotations[i] ?? 0}
                isSelected={currentSelection.has(i)}
                onSelect={handleSelect}
                scale={zoom}
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-lg pointer-events-none select-none shadow-sm backdrop-blur-xs">
                {t('preview.pageLabel', { count: i + 1, defaultValue: `Page ${i + 1}` })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentSelection.size > 0 && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          {t('preview.shiftTip', { defaultValue: 'Tip: Hold Shift and click to select a range of pages.' })}
        </p>
      )}
    </div>
  );
};

export default DocumentPreview;
