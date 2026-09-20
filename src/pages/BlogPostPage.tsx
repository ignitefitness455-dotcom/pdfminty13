import { ShieldCheck, Calendar, Clock, Share2, Check, UserCheck, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, Link } from 'react-router-dom';

import RelatedBlogs from '../components/RelatedBlogs';
import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';
import { TOOLS } from '../config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/config';

export const BlogPostPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const { postSlug, slug: paramSlug } = useParams<{ postSlug?: string; slug?: string }>();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  let currentPath = (location.pathname || '').replace(/^\//, '').replace(/\/$/, '');
  for (const loc of SUPPORTED_LOCALES) {
    if (loc !== DEFAULT_LOCALE && (currentPath === loc || currentPath.startsWith(`${loc}/`))) {
      currentPath = currentPath.substring(loc.length + 1);
      break;
    }
  }
  const targetSlug = postSlug || paramSlug || currentPath;

  const article = TOOLS.find((p) => {
    if (p.type !== 'article') return false;

    // Exact match on full path or ID
    if (p.slug === currentPath || p.id === currentPath) return true;

    // Match if slug / postSlug parameter matches
    if (targetSlug) {
      if (p.slug === targetSlug || p.id === targetSlug) return true;
      if (p.slug === `blog/${targetSlug}` || p.slug === `compare/${targetSlug}`) return true;
      if (p.slug.endsWith(`/${targetSlug}`)) return true;
    }

    return false;
  });

  // Clean HTML to guarantee strictly only ONE <h1> tag on the page
  const cleanArticleBody = React.useMemo(() => {
    if (!article) return '';
    const localizedBody = t(`articles.${article.id}.body`, {
      defaultValue: t(`articles.${article.slug}.body`, {
        defaultValue: article.longFormBody || article.shortDescription || '',
      }),
    });
    const raw = localizedBody;
    return raw
      .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '')
      .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>');
  }, [article, t]);

  if (!article) {
    return (
      <>
        <Helmet>
          <title>{t("blogPost.notFound", { defaultValue: "Article Not Found" })} | PDFMinty</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-2xl mb-4">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-on-surface mb-2">{t('blogPost.notFound', { defaultValue: 'Article Not Found' })}</h1>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{t('blogPost.notFoundDesc', { defaultValue: 'The requested guide or article could not be located in our knowledge hub.' })}</p>
        <Link
          to={ROUTES.BLOG}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all"
        >
          {t('blog.returnToHub', { defaultValue: 'Return to Knowledge Hub' })}
        </Link>
      </div>
      </>
    );
  }

  // Calculate read time
  const getReadingTime = (html: string): string => {
    const text = html ? html.replace(/<[^>]*>/g, '') : '';
    const words = text.trim().split(/\s+/).length;
    const time = Math.max(1, Math.ceil(words / 225));
    return t('blog.readTime', { count: time, defaultValue: `${time} min read` });
  };

  const getFormattedDate = (dateStr?: string): string => {
    const d = dateStr || '2026-07-16';
    try {
      const locale = i18n.language === 'bn' ? 'bn-BD' : i18n.language === 'de' ? 'de-DE' : 'en-US';
      return new Date(d).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const localizedArticleName = t(`articles.${article.id}.name`, {
    defaultValue: t(`articles.${article.slug}.name`, { defaultValue: article.h1 || article.name }),
  });

  const localizedArticleDesc = t(`articles.${article.id}.shortDesc`, {
    defaultValue: t(`articles.${article.slug}.shortDesc`, { defaultValue: article.shortDescription }),
  });

  const catKey = (article.category || 'guides').toLowerCase();
  const localizedCategory = t(`blog.categories.${catKey}`, { defaultValue: article.category || 'Guide' });

  return (
    <div className="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        slug={article.slug}
        titleOverride={`${localizedArticleName} | PdfMinty Knowledge Hub`}
        descriptionOverride={article.metaDescription || localizedArticleDesc}
      />

      <article className="max-w-4xl mx-auto space-y-10" id="blog-post-container">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium overflow-x-auto pb-1">
          <Link to={ROUTES.HOME} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
            {t('nav.home', { defaultValue: 'Home' })}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <Link to={ROUTES.BLOG} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
            {t('blog.knowledgeHub', { defaultValue: 'Knowledge Hub' })}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs">
            {localizedArticleName}
          </span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6 border-b border-border-muted pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {localizedCategory}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {getFormattedDate(article.datePublished)}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {getReadingTime(article.longFormBody || article.shortDescription)}
              </span>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-low border border-border-muted hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">{t('blog.linkCopied', { defaultValue: 'Link Copied!' })}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('blog.shareArticle', { defaultValue: 'Share Article' })}</span>
                </>
              )}
            </button>
          </div>

          <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.18] sm:leading-[1.12] text-slate-900 dark:text-white border-l-4 sm:border-l-8 border-emerald-500 pl-3.5 sm:pl-6 my-4">
            {localizedArticleName}
          </h1>

          <p className="text-base sm:text-xl font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            {localizedArticleDesc}
          </p>

          {/* Author Badge & In-Browser Guarantee */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low border border-border-muted">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-emerald-500/20">
                <img src="/logo.svg" alt="PDFMinty Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                  <span>{t('blog.editorialTeam', { defaultValue: 'PDFMinty Editorial Team' })}</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('blog.teamSubtitle', { defaultValue: 'Document Privacy & Security Analysis' })}
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('blog.privacyBadge', { defaultValue: '100% In-Browser Privacy Guarantee' })}</span>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div
          className="blog-prose prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: cleanArticleBody }}
        />

        {/* Closing CTA Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white p-8 sm:p-12 text-center space-y-6 shadow-2xl shadow-emerald-950/40 border-2 border-emerald-400/40 my-12">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black uppercase tracking-widest shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>{t('blog.ctaBadge', { defaultValue: 'Zero Uploads • 100% In-Browser' })}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md m-0">
              {t('blog.ctaTitle', { defaultValue: 'Ready to process your PDFs securely?' })}
            </h2>
            <p className="text-sm sm:text-base font-semibold text-emerald-50 max-w-xl mx-auto leading-relaxed drop-shadow-sm m-0">
              {t('blog.ctaSubtitle', { defaultValue: "Use PdfMinty's free, 100% private in-browser tools today. No uploads, zero server traces." })}
            </p>
            <div className="pt-2">
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-950 dark:!bg-white dark:!text-emerald-950 hover:dark:!bg-emerald-50 font-black text-sm sm:text-base rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 no-underline"
              >
                <span>{t('blog.ctaButton', { defaultValue: 'Explore All Free PDF Tools →' })}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Blog Posts */}
        <RelatedBlogs />
      </article>
    </div>
  );
};

export default BlogPostPage;
