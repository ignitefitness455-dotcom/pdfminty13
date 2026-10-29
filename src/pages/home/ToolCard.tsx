import { Sparkles, ArrowRight } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { iconMap, badgeColors, badgeLabels, prefetchToolChunk } from '../../config/homeConfig';
import { TOOLS_CATALOG as TOOLS } from '../../config/seo-catalog';
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
}

const TOOLS_BY_SLUG = new Map(TOOLS.map((item) => [item.slug, item]));

export const ToolCard: React.FC<ToolCardProps> = React.memo(({ tool, variant = 'studio' }) => {
  const { t, i18n } = useTranslation('common');
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
      to={targetPath}
      id={`tool-card-${toolId}`}
      onPointerDown={() => prefetchToolChunk(tool.slug)}
      onMouseEnter={() => prefetchToolChunk(tool.slug)}
      onFocus={() => prefetchToolChunk(tool.slug)}
      className={`rounded-2xl p-5 flex flex-col justify-between text-left group transition-all duration-200 hover:-translate-y-0.5 relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 no-underline border ${
        isFeaturedVariant
          ? 'bg-gradient-to-b from-white via-white to-emerald-50/25 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-emerald-950/20 border-emerald-500/25 dark:border-emerald-500/25 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 shadow-xs hover:shadow-md hover:shadow-emerald-500/10'
          : 'bg-white/95 dark:bg-slate-900/80 border-slate-200/85 dark:border-slate-800/85 hover:border-emerald-500/45 dark:hover:border-emerald-500/45 shadow-2xs hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2.5 mb-3.5">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 ${
              isFeaturedVariant
                ? 'bg-emerald-500/12 dark:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25'
            }`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
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

        <h3 className="text-[15px] sm:text-[16.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug mb-1.5 font-display">
          {localizedName}
        </h3>
        <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-[1.6] font-normal line-clamp-2 min-h-[2.6rem] font-sans">
          {localizedDesc}
        </p>
      </div>

      {/* Action Footer Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
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
});

ToolCard.displayName = 'ToolCard';
