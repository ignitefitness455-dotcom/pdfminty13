import { Sparkles, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HOMEPAGE_H1_PART1, HOMEPAGE_H1_PART2 } from '../../config/homeConfig';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="text-center max-w-3xl mx-auto mb-16 relative pt-4">
      <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide select-none shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <span>{t('home.hero.badgeClient', { defaultValue: '🔒 Client-Side In-Browser Processing' })}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-container-low border border-border-muted rounded-full text-security-green text-xs font-bold tracking-wide select-none shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-security-green" aria-hidden="true" />
          <span>{t('home.hero.badgePrivate', { defaultValue: 'Private In-Browser Tools' })}</span>
        </div>
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight leading-none mb-6 font-sans" id="homepage-main-h1">
        {t('home.hero.h1Part1', { defaultValue: HOMEPAGE_H1_PART1 })}
        <span className="text-primary-fixed font-black">
          {t('home.hero.h1Part2', { defaultValue: HOMEPAGE_H1_PART2 })}
        </span>
      </h1>
      <p className="text-on-surface-variant text-base sm:text-lg font-normal max-w-2xl mx-auto leading-relaxed">
        {t('home.hero.subtitle', {
          defaultValue:
            'Merge, split, and edit your documents directly in your web browser. PDFMinty processes standard PDF tasks locally on your device without server uploads. No accounts required—fast, privacy-first PDF tools that run in your browser.',
        })}
      </p>
    </div>
  );
};
