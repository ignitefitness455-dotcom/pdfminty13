import { Sparkles, ArrowRight } from 'lucide-react';
import React, { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { iconMap, badgeColors, badgeLabels, prefetchToolChunk } from '../../config/homeConfig';
import { TOOLS_CATALOG as TOOLS } from '../../config/seo-catalog';
import { detectPerformanceMode, readStored3DPreference } from '../../hooks/useHero3D';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  SupportedLocale,
  getLocalizedPath,
} from '../../i18n/config';

interface ToolInfo {
  name: string;
  slug: string;
  description: string;
}

interface ToolCardProps {
  tool: ToolInfo;
  variant?: 'featured' | 'studio';
  cardIndex?: number;
  is3DEnabled?: boolean;
  performanceMode?: boolean;
}

const TOOLS_BY_SLUG = new Map(TOOLS.map((item) => [item.slug, item]));

export const ToolCard: React.FC<ToolCardProps> = React.memo(
  ({ tool, variant = 'studio', cardIndex = 0, is3DEnabled = true, performanceMode }) => {
    const { t, i18n } = useTranslation('common');
    const cardRef = useRef<HTMLAnchorElement | null>(null);
    const rafIdRef = useRef<number>(0);
    const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

    const isLowEndOrTouchLimited =
      performanceMode !== undefined
        ? performanceMode
        : detectPerformanceMode() && readStored3DPreference() !== true;

    const isPerformanceMode = !is3DEnabled || isLowEndOrTouchLimited;
    const effective3DEnabled = !isPerformanceMode;

    const cancelPendingFrame = useCallback(() => {
      if (rafIdRef.current && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
      pendingPointerRef.current = null;
    }, []);

    useEffect(() => {
      const el = cardRef.current;
      if (isPerformanceMode && el) {
        cancelPendingFrame();
        el.style.removeProperty('--hover-rx');
        el.style.removeProperty('--hover-ry');
        el.style.removeProperty('--hover-tz');
        el.style.removeProperty('--hover-scale');
        el.style.removeProperty('--card-rx');
        el.style.removeProperty('--card-ry');
        el.style.removeProperty('--card-rz');
        el.style.removeProperty('--card-tx');
        el.style.removeProperty('--card-ty');
        el.style.removeProperty('--card-tz');
        el.style.removeProperty('--card-scale');
      }
      return () => {
        cancelPendingFrame();
      };
    }, [isPerformanceMode, cancelPendingFrame]);

    const applyPointerRotationFrame = useCallback(() => {
      rafIdRef.current = 0;
      const el = cardRef.current;
      const coords = pendingPointerRef.current;
      if (!el || !coords || !effective3DEnabled) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const relX = (coords.clientX - rect.left) / rect.width - 0.5;
      const relY = (coords.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--hover-rx', `${(-relY * 10).toFixed(2)}deg`);
      el.style.setProperty('--hover-ry', `${(relX * 12).toFixed(2)}deg`);
      el.style.setProperty('--hover-tz', '18px');
      el.style.setProperty('--hover-scale', '1.02');
    }, [effective3DEnabled]);

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLAnchorElement>) => {
        if (!effective3DEnabled || e.pointerType === 'touch') return;
        cardRef.current = e.currentTarget;
        pendingPointerRef.current = { clientX: e.clientX, clientY: e.clientY };

        if (!rafIdRef.current && typeof window !== 'undefined') {
          if (typeof window.requestAnimationFrame === 'function') {
            rafIdRef.current = window.requestAnimationFrame(applyPointerRotationFrame);
          } else {
            applyPointerRotationFrame();
          }
        }
      },
      [effective3DEnabled, applyPointerRotationFrame]
    );

    const handlePointerLeave = useCallback(
      (e: React.PointerEvent<HTMLAnchorElement>) => {
        cancelPendingFrame();
        if (!effective3DEnabled) return;
        const el = e.currentTarget;
        el.style.setProperty('--hover-rx', '0deg');
        el.style.setProperty('--hover-ry', '0deg');
        el.style.setProperty('--hover-tz', '0px');
        el.style.setProperty('--hover-scale', '1');
      },
      [effective3DEnabled, cancelPendingFrame]
    );

    if (!tool || !tool.slug) return null;
    const toolSEO = TOOLS_BY_SLUG.get(tool.slug);
    if (!toolSEO) return null;

    const Icon = iconMap[toolSEO.icon] || Sparkles;
    const toolId = toolSEO.id;

    const localizedName = t(`tools.${tool.slug}.name`, { defaultValue: tool.name });
    const localizedDesc = t(`tools.${tool.slug}.desc`, { defaultValue: tool.description });

    let badge = null;
    if (toolSEO.badge) {
      badge = {
        text: badgeLabels[toolSEO.badge] || toolSEO.badge,
        color: badgeColors[toolSEO.badge] || 'bg-slate-400/10 text-slate-400 border-slate-400/20',
      };
    }

    const rawLang = (i18n.language || DEFAULT_LOCALE).split('-')[0].toLowerCase();
    const activeLocale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLang)
      ? (rawLang as SupportedLocale)
      : DEFAULT_LOCALE;
    const targetPath = getLocalizedPath(tool.slug, activeLocale);

    const isHighlighted = [
      'sign-pdf',
      'ocr-pdf',
      'ai-analyze-pdf',
      'merge-pdf',
      'split-pdf',
      'compress-pdf',
    ].includes(tool.slug);

    const isFeaturedVariant = variant === 'featured';
    const isAiHybrid = ['ai-analyze-pdf', 'ocr-pdf'].includes(tool.slug);

    return (
      <Link
        ref={cardRef}
        to={targetPath}
        id={`tool-card-${toolId}`}
        data-card-3d={effective3DEnabled ? 'true' : 'false'}
        data-performance-mode={isPerformanceMode ? 'true' : 'false'}
        data-3d-disabled={isPerformanceMode ? 'true' : 'false'}
        data-card-3d-index={cardIndex}
        onPointerDown={() => prefetchToolChunk(tool.slug)}
        onMouseEnter={(e) => {
          prefetchToolChunk(tool.slug);
          if (effective3DEnabled) {
            e.currentTarget.style.setProperty('--hover-scale', '1.02');
          }
        }}
        onPointerMove={effective3DEnabled ? handlePointerMove : undefined}
        onPointerLeave={effective3DEnabled ? handlePointerLeave : undefined}
        onFocus={() => prefetchToolChunk(tool.slug)}
        className={`pdf-tool-card-3d rounded-2xl p-5 flex flex-col justify-between text-left group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 no-underline border transition-transform duration-200 ${
          effective3DEnabled ? 'hover:scale-[1.02]' : ''
        } ${
          isFeaturedVariant
            ? 'bg-gradient-to-b from-white via-white to-emerald-50/35 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-emerald-950/25 border-emerald-500/25 dark:border-emerald-500/25 hover:border-emerald-500/65 dark:hover:border-emerald-400/65 shadow-xs'
            : 'bg-white/95 dark:bg-slate-900/85 border-slate-200/85 dark:border-slate-800/85 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-2xs'
        }`}
      >
        {/* Floating 3D Shadow Layer at translateZ(-32px) */}
        <span className="pdf-card-depth-shadow" aria-hidden="true" />

        {/* Scroll-angle Holographic Shimmer Overlay */}
        <span className="pdf-card-holographic-shimmer" aria-hidden="true" />

        {/* Viewport-Center Emerald Spotlight Border Glow */}
        <span className="pdf-card-spotlight-glow" aria-hidden="true" />

        <div className="pdf-card-3d-body relative z-10">
          <div className="pdf-card-3d-header flex items-center justify-between gap-2.5 mb-3.5">
            {/* 3D Floating Layer: Icon Box at translateZ(34px) */}
            <div
              data-layer-depth="34px"
              className={`pdf-layer-icon w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                isFeaturedVariant
                  ? 'bg-emerald-500/12 dark:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>

            {/* 3D Floating Layer: Badge at translateZ(28px) */}
            <div
              data-layer-depth="28px"
              className="pdf-layer-badge flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            >
              {isHighlighted ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide">
                  ★{' '}
                  {t('home.toolCard.highDemand', { defaultValue: 'Popular' })
                    .replace(/^★\s*/, '')
                    .trim()}
                </span>
              ) : (
                badge &&
                !['popular', 'ai_hybrid'].includes(toolSEO.badge || '') && (
                  <span className="text-slate-500 dark:text-slate-400 font-medium lowercase first-letter:uppercase">
                    {badge.text.toLowerCase()}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 3D Floating Layer: Title at translateZ(22px) */}
          <h3
            data-layer-depth="22px"
            className="pdf-layer-title text-[15px] sm:text-[16.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug mb-1.5 font-display"
          >
            {localizedName}
          </h3>
          <p className="pdf-layer-desc text-[13px] text-slate-600 dark:text-slate-400 leading-[1.6] font-normal line-clamp-2 min-h-[2.6rem] font-sans">
            {localizedDesc}
          </p>
        </div>

        {/* 3D Floating Layer: Action Footer Row (Open Tool →) at translateZ(26px) */}
        <div
          data-layer-depth="26px"
          className="pdf-layer-cta relative z-10 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
            <span>{t('home.toolCard.useTool', { defaultValue: 'Open Tool' })}</span>
            <ArrowRight
              className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-150"
              aria-hidden="true"
            />
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 select-none">
            {isAiHybrid ? 'AI · Consent' : 'Local RAM'}
          </span>
        </div>
      </Link>
    );
  }
);

ToolCard.displayName = 'ToolCard';
