import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { RELATED_TOOL_MAPPING } from '../config/seo-data';

import { useLayout } from './Layout';

export const RelatedTools: React.FC = () => {
  const { t } = useTranslation('common');
  const { pathname = '/' } = useLocation() || {};
  const { toolsList = [] } = useLayout() || {};

  const related = useMemo(() => {
    if (!pathname || pathname === '/' || !Array.isArray(toolsList) || toolsList.length === 0) return [];
    const segments = pathname.toLowerCase().split('/').filter(Boolean);
    const activeTool = toolsList.find((t) => t && t.slug && segments.includes(t.slug.toLowerCase()));

    if (!activeTool) return [];

    const curatedSlugs = RELATED_TOOL_MAPPING[activeTool.slug];

    if (curatedSlugs) {
      // Filter existing tools matching the curated slugs in order
      const curatedList = curatedSlugs
        .map(slug => toolsList.find(t => t.slug === slug))
        .filter((t): t is typeof toolsList[number] => !!t && t.slug !== activeTool.slug);
      
      if (curatedList.length >= 3) {
        return curatedList.slice(0, 5);
      }
    }

    const list = toolsList.filter((t) => t.slug !== activeTool.slug);
    const currentIdx = toolsList.indexOf(activeTool);
    const fallbackIdx = currentIdx !== -1 ? currentIdx : 0;

    return list.slice(fallbackIdx % list.length, (fallbackIdx % list.length) + 4);
  }, [toolsList, pathname]);

  if (pathname === '/' || related.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800" id="related_tools_box">
      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-4">
        {t('relatedTools.title', { defaultValue: 'Related PDF Tools' })}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {related.map((tool) => (
          <Link
            key={tool.slug}
            to={`/${tool.slug}/`}
            className="p-3.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                {t(`tools.${tool.slug}.name`, { defaultValue: tool.name })}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block line-clamp-2 mt-1">
                {t(`tools.${tool.slug}.desc`, { defaultValue: tool.shortDescription || tool.description })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

