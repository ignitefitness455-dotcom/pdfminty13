import { ArrowLeft, Crown } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getToolLimit } from '../config/constants';
import { TOOLS_CATALOG as TOOLS } from '../config/seo-catalog';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  getLocalizedPath,
} from '../i18n/config';

interface ToolHeaderProps {
  slug: string;
  limitMB?: number;
  overrideTitle?: string;
  overrideDesc?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  slug,
  limitMB,
  overrideTitle,
  overrideDesc,
}) => {
  const { t, i18n } = useTranslation('common');
  const { user, isPro: authIsPro } = useAuth();
  const isPro = Boolean(authIsPro || user?.isPro === true || user?.plan === 'pro');
  const isLoggedIn = Boolean(user);
  const tool = TOOLS.find((item) => item.slug === slug);
  const tierLimitMB = getToolLimit(slug, isPro, isLoggedIn).maxSingleMB;
  const sizeLimit =
    isPro || isLoggedIn ? Math.max(limitMB || 0, tierLimitMB) : limitMB || tierLimitMB;

  const rawLang = (i18n.language || DEFAULT_LOCALE).split('-')[0].toLowerCase();
  const activeLocale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLang)
    ? (rawLang as SupportedLocale)
    : DEFAULT_LOCALE;
  const homePath = getLocalizedPath('', activeLocale);

  const title =
    overrideTitle ||
    t(`tools.${slug}.h1`, {
      defaultValue: t(`tools.${slug}.name`, {
        defaultValue: tool?.h1 || tool?.name || 'PDF Tool',
      }),
    });

  const desc =
    overrideDesc ||
    t(`tools.${slug}.desc`, {
      defaultValue: tool?.shortDescription || '',
    });

  const isCloudAiTool = slug === 'ai-analyze-pdf' || slug === 'ocr-pdf';

  return (
    <div className="space-y-3 mb-6" id={`tool_header_${slug}`}>
      <Link
        to={homePath}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 min-h-[36px] py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('toolCommon.returnToDashboard', { defaultValue: 'Return to Dashboard' })}</span>
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">·</span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
              isPro
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isPro && <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
            <span>
              {isPro
                ? `PRO Limit: ${sizeLimit}MB`
                : t('toolCommon.limit', { limit: sizeLimit, defaultValue: `Limit: ${sizeLimit}MB` })}
            </span>
          </span>
          <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">·</span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isCloudAiTool
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <span>
              {isCloudAiTool
                ? t('toolHeader.optInCloud', { defaultValue: 'Opt-in Gemini AI Proxy' })
                : t('toolHeader.localOnly', { defaultValue: '100% Local In-Browser' })}
            </span>
          </span>
        </div>
        {desc && (
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">{desc}</p>
        )}
      </div>
    </div>
  );
};

export default ToolHeader;
