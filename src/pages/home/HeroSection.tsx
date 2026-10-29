import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HOMEPAGE_H1_PART1, HOMEPAGE_H1_PART2 } from '../../config/homeConfig';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 relative pt-6 sm:pt-10 px-4">
      {/* Unboxed eyebrow adhering to zero-pill discipline */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mb-4 sm:mb-5 select-none">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
        <span>{t('home.hero.badgeClient', { defaultValue: 'Client-Side In-Browser Processing' })}</span>
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
