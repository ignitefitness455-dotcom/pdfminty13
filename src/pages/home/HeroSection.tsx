import { ShieldCheck, Box, Loader2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HOMEPAGE_H1_PART1, HOMEPAGE_H1_PART2 } from '../../config/homeConfig';

export interface HeroSectionProps {
  enabled3D?: boolean;
  onToggle3D?: () => void;
  supported3D?: boolean;
  isLoading3D?: boolean;
  autoDisabledNotice?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  enabled3D = false,
  onToggle3D,
  supported3D = true,
  isLoading3D = false,
  autoDisabledNotice = false,
}) => {
  const { t } = useTranslation('common');

  const toggleLabel = enabled3D
    ? t('home.hero.disable3D', { defaultValue: 'Disable 3D' })
    : t('home.hero.enable3D', { defaultValue: 'Enable 3D' });

  return (
    <div
      id="homepage-hero-section"
      className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 relative pt-6 sm:pt-10 px-4"
    >
      {/* Accessible 3D Toggle Button in Hero Corner (hidden per user preference in favor of Scroll3DControlBar) */}
      {supported3D && onToggle3D && (
        <div className="absolute -top-2 right-2 sm:top-0 sm:right-0 z-20 flex flex-col items-end gap-1">
          <button
            type="button"
            id="hero-3d-toggle-btn"
            hidden
            aria-hidden="true"
            tabIndex={-1}
            aria-pressed={enabled3D}
            onClick={onToggle3D}
            className={`hidden items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              enabled3D
                ? 'bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:border-emerald-500/70'
                : 'bg-white/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {isLoading3D ? (
              <Loader2
                className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Box
                className={`w-3.5 h-3.5 shrink-0 ${
                  enabled3D
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
                aria-hidden="true"
              />
            )}
            <span>{toggleLabel}</span>
          </button>

          {autoDisabledNotice && (
            <div
              role="status"
              aria-live="polite"
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 dark:bg-slate-800/95 text-white text-[11px] font-medium shadow-xs border border-slate-700/60"
            >
              {t('home.hero.autoDisabled3D', {
                defaultValue: '3D turned off to keep things fast',
              })}
            </div>
          )}
        </div>
      )}

      {/* Unboxed eyebrow adhering to zero-pill discipline */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mb-4 sm:mb-5 select-none">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
        <span>
          {t('home.hero.badgeClient', { defaultValue: 'Client-Side In-Browser Processing' })}
        </span>
        <span className="text-slate-300 dark:text-slate-700 font-bold" aria-hidden="true">
          ·
        </span>
        <span className="text-slate-600 dark:text-slate-400">
          {t('home.hero.badgePrivate', { defaultValue: 'Zero Cloud Storage' })}
        </span>
      </div>

      <h1
        className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12] mb-5 font-display [text-wrap:balance]"
        id="homepage-main-h1"
      >
        {t('home.hero.h1Part1', { defaultValue: HOMEPAGE_H1_PART1 })}{' '}
        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent font-extrabold">
          {t('home.hero.h1Part2', { defaultValue: HOMEPAGE_H1_PART2 })}
        </span>
      </h1>

      <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-[1.0625rem] font-normal max-w-2xl mx-auto leading-[1.7] font-sans [text-wrap:pretty]">
        {t('home.hero.subtitle', {
          defaultValue:
            'Merge, split, and edit your documents directly in your web browser. PDFMinty processes standard PDF tasks locally on your device without server uploads. No accounts required—fast, privacy-first PDF tools that run in your browser.',
        })}
      </p>
    </div>
  );
};
