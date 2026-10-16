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
  Flame,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface CompressAnimationProps {
  fileName: string;
  originalSizeBytes: number;
  compressionMode: 'recommended' | 'extreme' | 'low';
}

interface FloatingBubble {
  id: number;
  label: string;
  x: number;
}

export const CompressAnimation: React.FC<CompressAnimationProps> = ({
  fileName,
  originalSizeBytes,
  compressionMode,
}) => {
  const { t } = useTranslation('common');

  // Elapsed time in seconds (formatted with English digits)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<number>(8);
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

  // Playful interactive Byte Squisher mini-interaction
  const [squishedKB, setSquishedKB] = useState<number>(0);
  const [squishCount, setSquishCount] = useState<number>(0);
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const bubbleIdRef = useRef<number>(0);

  // Determine estimated reduction %
  const estimatedSavingsPct =
    compressionMode === 'extreme' ? 85 : compressionMode === 'low' ? 35 : 70;
  const estimatedSizeBytes = Math.max(
    1024,
    Math.round(originalSizeBytes * (1 - estimatedSavingsPct / 100))
  );

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Timer & progress simulation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(elapsed);

      // Smooth progress curve approaching 95% asymptotically
      // Starts fast, decelerates gently as it waits for worker completion
      if (elapsed < 1.5) {
        setProgress(Math.min(25, 8 + elapsed * 12));
      } else if (elapsed < 3.5) {
        setProgress(Math.min(55, 25 + (elapsed - 1.5) * 15));
      } else if (elapsed < 6.0) {
        setProgress(Math.min(78, 55 + (elapsed - 3.5) * 9.2));
      } else if (elapsed < 10.0) {
        setProgress(Math.min(91, 78 + (elapsed - 6.0) * 3.25));
      } else {
        setProgress(Math.min(96, 91 + (elapsed - 10.0) * 0.4));
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Tip rotation
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % 5);
    }, 3800);
    return () => clearInterval(tipInterval);
  }, []);

  // Interactive Squisher handler
  const handleSquish = () => {
    const bonusKB = Math.floor(Math.random() * 384) + 128;
    setSquishedKB((prev) => prev + bonusKB);
    setSquishCount((prev) => prev + 1);

    const newBubble: FloatingBubble = {
      id: ++bubbleIdRef.current,
      label: `-${bonusKB} KB 💥`,
      x: (Math.random() - 0.5) * 80,
    };

    setBubbles((prev) => [...prev.slice(-4), newBubble]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 1200);
  };

  // Processing pipeline stages
  const stages = [
    {
      id: 1,
      name: t('compressAnimation.stage1', { defaultValue: 'Analyzing Document Structure' }),
      threshold: 15,
      icon: Layers,
    },
    {
      id: 2,
      name: t('compressAnimation.stage2', { defaultValue: 'Optimizing & Re-encoding Graphics' }),
      threshold: 40,
      icon: Sparkles,
    },
    {
      id: 3,
      name: t('compressAnimation.stage3', { defaultValue: 'Purging Redundant Metadata' }),
      threshold: 65,
      icon: Shield,
    },
    {
      id: 4,
      name: t('compressAnimation.stage4', { defaultValue: 'Compacting Streams & Cross-References' }),
      threshold: 85,
      icon: Zap,
    },
    {
      id: 5,
      name: t('compressAnimation.stage5', { defaultValue: 'Verifying Sharpness & Finalizing' }),
      threshold: 95,
      icon: Cpu,
    },
  ];

  const tips = [
    {
      badge: t('compressAnimation.tip1Badge', { defaultValue: 'Lossless Vector Fonts' }),
      text: t('compressAnimation.tip1Text', {
        defaultValue:
          'Text and font glyphs remain 100% crisp and readable at any zoom level, while heavy image raster data is streamlined.',
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
      badge: t('compressAnimation.tip3Badge', { defaultValue: 'Smart Downsampling' }),
      text: t('compressAnimation.tip3Text', {
        defaultValue:
          'Embedded photos are intelligently re-quantized to web/print DPI without introducing blurry color artifacts.',
      }),
    },
    {
      badge: t('compressAnimation.tip4Badge', { defaultValue: 'Metadata Compaction' }),
      text: t('compressAnimation.tip4Text', {
        defaultValue:
          'Hidden duplicate fonts, obsolete print color profiles, and redundant edit history streams are purged safely.',
      }),
    },
    {
      badge: t('compressAnimation.tip5Badge', { defaultValue: 'High-Speed Web Worker' }),
      text: t('compressAnimation.tip5Text', {
        defaultValue:
          'Multithreaded background processing ensures your browser interface stays fluid and responsive during compression.',
      }),
    },
  ];

  return (
    <div
      className="p-6 md:p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl shadow-emerald-950/20 text-white space-y-6 relative overflow-hidden animate-fadein"
      id="compress_animation_container"
    >
      {/* Background ambient lighting aura */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header with live timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
              <span>{t('compressAnimation.title', { defaultValue: 'Compressing Document' })}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                {compressionMode.toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0 truncate max-w-[260px] sm:max-w-md font-mono">
              {fileName}
            </p>
          </div>
        </div>

        {/* Elapsed Timer badge (numbers formatted in standard English digits) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-emerald-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{elapsedSeconds.toFixed(1)}s elapsed</span>
        </div>
      </div>

      {/* Holographic Compression Chamber */}
      <div className="relative z-10 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Left: Original Heavy File */}
          <div className="md:col-span-3 flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20">
            <div className="w-12 h-14 rounded-lg bg-rose-950/50 border border-rose-500/30 flex flex-col items-center justify-center text-rose-400 shrink-0 relative overflow-hidden">
              <FileText className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">PDF</span>
            </div>
            <div className="truncate flex-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                {t('compressAnimation.inputDocument', { defaultValue: 'Input Document' })}
              </span>
              <p className="text-sm font-bold text-white truncate m-0">{fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-300 bg-rose-500/10 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {formatSize(originalSizeBytes)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('compressAnimation.uncompressed', { defaultValue: 'Original size' })}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Dynamic Compression Laser Core & Particle Stream */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0 relative">
            <div className="relative w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-compress-squeeze shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />

              {/* Particle flow indicator */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-byteflow" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 tracking-widest mt-2">
              <span>{Math.round(progress)}%</span>
              <ArrowRight className="w-3 h-3 text-emerald-400 inline" />
            </div>
          </div>

          {/* Right: Optimized Target File */}
          <div className="md:col-span-3 flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <div className="w-12 h-14 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400 shrink-0 relative overflow-hidden animate-float-gentle">
              {/* Laser scan line sweeping across */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanbeam" />
              <FileText className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">MIN</span>
            </div>
            <div className="truncate flex-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                {t('compressAnimation.targetOptimized', { defaultValue: 'Optimized Target' })}
              </span>
              <p className="text-sm font-bold text-white truncate m-0">
                {fileName.replace(/\.pdf$/i, '')}-compressed.pdf
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                  ~{formatSize(estimatedSizeBytes)}
                </span>
                <span className="text-[10px] font-black text-emerald-400">
                  (-{estimatedSavingsPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Smooth Shimmer Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t('compressAnimation.optimizingEngine', {
                defaultValue: 'Lossless Vector & Image Downsampling Active',
              })}
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 overflow-hidden border border-slate-700/80 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer light bar */}
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slide" />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time 5-Step Pipeline Tracker */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {stages.map((stage) => {
          const isDone = progress >= stage.threshold;
          const isCurrent =
            progress < stage.threshold &&
            (stage.id === 1 || progress >= (stages[stage.id - 2]?.threshold ?? 0));
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
                    isDone ? 'text-emerald-400' : isCurrent ? 'text-emerald-300 animate-pulse' : 'text-slate-600'
                  }`}
                />
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono">0{stage.id}</span>
                )}
              </div>
              <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Playful Interactive Byte Squisher Mini-Game (Eliminates boredom!) */}
      <div className="relative z-10 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>{t('compressAnimation.squisherTitle', { defaultValue: 'Byte Squisher Mini-Game' })}</span>
              <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.2 rounded bg-amber-400/10">
                Interactive
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0">
              {squishCount === 0
                ? t('compressAnimation.squisherPrompt', {
                    defaultValue: 'Tap the button to crush redundant bloat while you wait!',
                  })
                : t('compressAnimation.squisherScore', {
                    defaultValue: `You've squished ${(squishedKB / 1024).toFixed(2)} MB of virtual junk!`,
                  })}
            </p>
          </div>
        </div>

        {/* Interactive Clicker Button with animated floating popups */}
        <div className="relative">
          {bubbles.map((b) => (
            <div
              key={b.id}
              className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none text-xs font-black text-amber-300 bg-amber-950/90 border border-amber-500/40 px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/30 whitespace-nowrap animate-float-gentle"
              style={{ transform: `translate(${b.x}px, -20px)` }}
            >
              {b.label}
            </div>
          ))}

          <button
            type="button"
            onClick={handleSquish}
            id="byte_squisher_btn"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>💥 Squish Bloat!</span>
            {squishCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950/30 text-slate-950 font-bold text-[10px]">
                {squishCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Rotating Pro Tips Carousel */}
      <div className="relative z-10 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 transition-opacity duration-300">
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block mb-0.5">
            💡 {tips[currentTipIndex].badge}
          </span>
          <p className="text-slate-300 m-0 leading-relaxed text-[11px]">
            {tips[currentTipIndex].text}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 self-center">
          {tips.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentTipIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentTipIndex ? 'bg-emerald-400 w-3' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`View tip ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
