import { ArrowLeft, Crown } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getToolLimit } from '../config/constants';
import { ROUTES } from '../config/routes';
import { TOOLS } from '../config/seo-data';
import { useAuth } from '../contexts/AuthContext';

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
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const isPro = user?.plan === 'pro';
  const isLoggedIn = !!user;
  const tool = TOOLS.find((item) => item.slug === slug);
  const sizeLimit = limitMB || getToolLimit(slug, isPro, isLoggedIn).maxSingleMB;

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

  return (
    <div className="space-y-4 mb-6" id={`tool_header_${slug}`}>
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
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
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
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
        </div>
        {desc && (
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
        )}
      </div>
    </div>
  );
};

export default ToolHeader;
