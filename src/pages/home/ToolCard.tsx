import { Sparkles, ArrowRight } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { iconMap, badgeColors, badgeLabels, prefetchToolChunk } from '../../config/homeConfig';
import { TOOLS } from '../../config/seo-data';

interface ToolInfo {
  name: string;
  slug: string;
  description: string;
}

interface ToolCardProps {
  tool: ToolInfo;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  if (!tool || !tool.slug) return null;
  const toolSEO = TOOLS.find((t) => t.slug === tool.slug);
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

  const handleLaunch = () => {
    window.scrollTo(0, 0);
    navigate(`/${tool.slug}/`);
  };

  const isHighlighted = ['sign-pdf', 'ocr-pdf', 'ai-analyze-pdf', 'merge-pdf', 'split-pdf'].includes(tool.slug);

  return (
    <button
      type="button"
      id={`tool-card-${toolId}`}
      onClick={handleLaunch}
      onMouseEnter={() => prefetchToolChunk(tool.slug)}
      onFocus={() => prefetchToolChunk(tool.slug)}
      className={`page-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-left group transition-all duration-300 transform hover:-translate-y-1 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${
        isHighlighted
          ? 'border-emerald-500/30 dark:border-emerald-500/30 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 bg-white/60 dark:bg-black/40 backdrop-blur-lg'
          : 'border-white/50 dark:border-white/10 hover:border-emerald-500/40 shadow-sm hover:shadow-lg bg-white/50 dark:bg-slate-900/40 backdrop-blur-md'
      }`}
    >
      {isHighlighted && (
        <div className="absolute top-0 left-6 right-6 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-b-full" />
      )}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isHighlighted && (
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400 rounded-full border border-amber-500/25 uppercase shrink-0 whitespace-nowrap shadow-2xs">
                {t('home.toolCard.highDemand', { defaultValue: '★ HIGH DEMAND' })}
              </span>
            )}
            {badge && !['popular', 'ai_hybrid'].includes(toolSEO.badge || '') && (
              <span
                className={`text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full border uppercase shrink-0 whitespace-nowrap ${badge.color}`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight mb-2 font-sans">
          {localizedName}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal line-clamp-2 min-h-[2.5rem]">
          {localizedDesc}
        </p>
      </div>

      <div className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:border-emerald-600 dark:group-hover:border-emerald-500 text-slate-700 dark:text-slate-200 group-hover:text-white transition-all duration-200 flex items-center justify-between text-xs sm:text-sm font-bold shadow-2xs">
        <span>{t('home.toolCard.useTool', { defaultValue: 'Use Tool' })}</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
      </div>
    </button>
  );
};
