import { ArrowLeft, Search } from 'lucide-react';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { TOOLS } from '../config/seo-data';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation('common');
  const popularTools = TOOLS.filter((t) => t.type === 'tool').slice(0, 6);

  return (
    <>
      <Helmet>
        <title>{t("notFound.title", { defaultValue: "Page Not Found" })} | PDFMinty</title>
        <meta name="description" content="The page you are looking for could not be found. Browse our free PDF tools instead." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-3xl mb-6">
          404
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-on-surface mb-3">{t('notFound.title', { defaultValue: 'Page Not Found' })}</h1>
        <p className="text-sm text-on-surface-variant max-w-md mb-8">{t('notFound.description', { defaultValue: 'The page you\'re looking for doesn\'t exist or has been moved. Try one of our popular PDF tools below.' })}</p>
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('notFound.backToHome', { defaultValue: 'Back to Home' })}</span>
        </Link>

        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 justify-center">
            <Search className="w-4 h-4" />
            <span>{t('notFound.popularTools', { defaultValue: 'Popular Tools' })}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {popularTools.map((tool) => (
              <Link
                key={tool.slug}
                to={`/${tool.slug}/`}
                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
