import {
  FileText,
  Sparkles,
  Zap,
  Shield,
  Layers,
  CheckCircle2,
  Cpu,
  Clock,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface CompressAnimationProps {
  fileName: string;
  originalSizeBytes: number;
  compressionMode: 'recommended' | 'extreme' | 'low';
  onCancel?: () => void;
}

export const CompressAnimation: React.FC<CompressAnimationProps> = ({
  fileName,
  originalSizeBytes,
  compressionMode,
  onCancel,
}) => {
  const { t } = useTranslation('common');

  // Real elapsed time in seconds (formatted with tabular numerals)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Real elapsed timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Tip rotation
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % 5);
    }, 3800);
    return () => clearInterval(tipInterval);
  }, []);

  // Processing pipeline stages (cycled by elapsed time without fabricating completion %)
  const activeStageIndex = Math.min(4, Math.floor(elapsedSeconds / 1.8));
  const stages = [
    {
      id: 1,
      name: t('compressAnimation.stage1', { defaultValue: 'Analyzing Document Structure' }),
      icon: Layers,
    },
    {
      id: 2,
      name: t('compressAnimation.stage2', { defaultValue: 'Optimizing & Re-encoding Graphics' }),
      icon: Sparkles,
    },
    {
      id: 3,
      name: t('compressAnimation.stage3', { defaultValue: 'Purging Redundant Metadata' }),
      icon: Shield,
    },
    {
      id: 4,
      name: t('compressAnimation.stage4', {
        defaultValue: 'Compacting Streams & Cross-References',
      }),
      icon: Zap,
    },
    {
      id: 5,
      name: t('compressAnimation.stage5', { defaultValue: 'Verifying Output Size & Integrity' }),
      icon: Cpu,
    },
  ];

  const tips = [
    {
      badge: t('compressAnimation.tip1Badge', { defaultValue: 'Lossless Vector Fonts' }),
      text: t('compressAnimation.tip1Text', {
        defaultValue:
          'Structural compression preserves vector text and links, while adaptive rasterization only applies if it genuinely reduces file size.',
      }),
    },
    {
      badge: t('compressAnimation.tip2Badge', { defaultValue: '100% Client-Side Privacy' }),
      text: t('compressAnimation.tip2Text', {
        defaultValue:
          'Your file is compressed entirely on your device with WebAssembly. No files are uploaded to any external server.',
      }),
    },
    {
      badge: t('compressAnimation.tip3Badge', { defaultValue: 'Smart Size Guard' }),
      text: t('compressAnimation.tip3Text', {
        defaultValue:
          'Every candidate output is compared against your original file size so the result is never inflated.',
      }),
    },
    {
      badge: t('compressAnimation.tip4Badge', { defaultValue: 'Metadata Compaction' }),
      text: t('compressAnimation.tip4Text', {
        defaultValue:
          'Redundant cross-reference streams and unreferenced objects are compacted into modern PDF object streams.',
      }),
    },
    {
      badge: t('compressAnimation.tip5Badge', { defaultValue: 'High-Speed Web Worker' }),
      text: t('compressAnimation.tip5Text', {
        defaultValue:
          'Background processing keeps your browser responsive while optimizing pages locally.',
      }),
    },
  ];

  return (
    <div
      className="p-5 sm:p-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl shadow-emerald-950/20 text-white space-y-5 relative overflow-hidden animate-fadein"
      id="compress_animation_container"
      role="status"
      aria-live="polite"
    >
      {/* Top Header with live timer and Cancel button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5 animate-spin" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2 m-0 flex-wrap">
              <span>{t('compressAnimation.title', { defaultValue: 'Compressing Document' })}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                {compressionMode.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0 truncate max-w-[220px] sm:max-w-md font-mono">
              {fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Elapsed Timer badge (tabular numerals) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono tabular-nums text-emerald-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" aria-hidden="true" />
            <span>{elapsedSeconds.toFixed(1)}s elapsed</span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              id="cancel_compress_btn"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('toolCommon.cancel', { defaultValue: 'Cancel' })}</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Transformation Overview */}
      <div className="relative z-10 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Left: Original Input File */}
          <div className="md:col-span-3 flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70">
            <div className="w-11 h-13 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-300 shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">PDF</span>
            </div>
            <div className="truncate flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('compressAnimation.inputDocument', { defaultValue: 'Input Document' })}
              </span>
              <p className="text-sm font-bold text-white truncate m-0">{fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono tabular-nums text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {formatSize(originalSizeBytes)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('compressAnimation.uncompressed', { defaultValue: 'Original size' })}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Active Processing Indicator */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-1 md:py-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowRight className="w-5 h-5 animate-pulse" aria-hidden="true" />
            </div>
          </div>

          {/* Right: Output Target (No fabricated savings before validation) */}
          <div className="md:col-span-3 flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <div className="w-11 h-13 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">OUT</span>
            </div>
            <div className="truncate flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                {t('compressAnimation.targetOptimized', { defaultValue: 'Output Candidate' })}
              </span>
              <p className="text-sm font-bold text-white truncate m-0">
                {fileName.replace(/\.pdf$/i, '')}-compressed.pdf
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {t('compressAnimation.evaluatingSize', {
                    defaultValue: 'Evaluating best stream size…',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Indeterminate Progress Indicator */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stages[activeStageIndex].name}
            </span>
            <span className="font-mono text-emerald-400 text-xs">
              {t('compressAnimation.workingInBrowser', { defaultValue: 'Processing in browser…' })}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={t('compressAnimation.title', { defaultValue: 'Compressing Document' })}
            aria-valuetext={stages[activeStageIndex].name}
            className="w-full h-2.5 rounded-full bg-slate-800/80 p-0.5 overflow-hidden border border-slate-700/80 relative"
          >
            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-600/40 via-emerald-400 to-teal-500/40 animate-pulse relative overflow-hidden" />
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Tracker */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {stages.map((stage, idx) => {
          const isDone = idx < activeStageIndex;
          const isCurrent = idx === activeStageIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                    ? 'bg-slate-900 border-emerald-400/80 text-white shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isDone
                      ? 'text-emerald-400'
                      : isCurrent
                        ? 'text-emerald-300 animate-pulse'
                        : 'text-slate-600'
                  }`}
                />
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono tabular-nums">
                    0{stage.id}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rotating Technical Notes Carousel */}
      <div className="relative z-10 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 transition-opacity duration-300">
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block mb-0.5">
            {tips[currentTipIndex].badge}
          </span>
          <p className="text-slate-300 m-0 leading-relaxed text-[11px]">
            {tips[currentTipIndex].text}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 self-center">
          {tips.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentTipIndex(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === currentTipIndex ? 'bg-emerald-400 w-3.5' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`View tip ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
