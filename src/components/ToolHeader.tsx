import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { TOOL_SIZE_LIMITS } from '../config/constants';
import { ROUTES } from '../config/routes';
import { TOOLS } from '../config/seo-data';

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
  const tool = TOOLS.find((item) => item.slug === slug);
  const sizeLimit =
    limitMB ||
    (TOOL_SIZE_LIMITS as Record<string, { maxSingleMB?: number }>)[slug]?.maxSingleMB ||
    50;

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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            {t('toolCommon.limit', { limit: sizeLimit, defaultValue: `Limit: ${sizeLimit}MB` })}
          </span>
        </div>
        {desc && (
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
};

export default ToolHeader;
