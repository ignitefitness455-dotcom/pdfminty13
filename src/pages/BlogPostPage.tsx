import {
  ShieldCheck,
  Calendar,
  Clock,
  Share2,
  Check,
  UserCheck,
  ChevronRight,
  MapPin,
  Minimize2,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, Link } from 'react-router-dom';

import AuthorBio from '../components/AuthorBio';
import RelatedBlogs from '../components/RelatedBlogs';
import SEO from '../components/SEO';
import { PRIMARY_AUTHOR } from '../config/author';
import { ROUTES } from '../config/routes';
import { TOOLS_CATALOG, type ToolCatalogItem } from '../config/seo-catalog';
import type { ToolSEOInfo } from '../config/seo-data';
import { getCachedFullTools, loadFullToolsCatalog } from '../config/seo-data-loader';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  loadLocalizedArticleBodies,
} from '../i18n/config';

function matchesArticleRoute(
  p: { id: string; slug: string; type: 'tool' | 'article' },
  currentPath: string,
  targetSlug: string
): boolean {
  if (p.type !== 'article') return false;
  if (p.slug === currentPath || p.id === currentPath) return true;
  if (targetSlug) {
    if (p.slug === targetSlug || p.id === targetSlug) return true;
    if (p.slug === `blog/${targetSlug}` || p.slug === `compare/${targetSlug}`) return true;
    if (p.slug.endsWith(`/${targetSlug}`)) return true;
  }
  return false;
}

export const BlogPostPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const { postSlug, slug: paramSlug } = useParams<{ postSlug?: string; slug?: string }>();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [localizedBodies, setLocalizedBodies] = useState<Record<string, string> | null>(null);
  const [fullTools, setFullTools] = useState<ToolSEOInfo[] | null>(getCachedFullTools);

  let currentPath = (location.pathname || '').replace(/^\//, '').replace(/\/$/, '');
  for (const loc of SUPPORTED_LOCALES) {
    if (loc !== DEFAULT_LOCALE && (currentPath === loc || currentPath.startsWith(`${loc}/`))) {
      currentPath = currentPath.substring(loc.length + 1);
      break;
    }
  }
  const targetSlug = postSlug || paramSlug || currentPath;

  const catalogArticle: ToolCatalogItem | undefined = TOOLS_CATALOG.find((p) =>
    matchesArticleRoute(p, currentPath, targetSlug)
  );
  const fullArticle: ToolSEOInfo | undefined = fullTools?.find((p) =>
    matchesArticleRoute(p, currentPath, targetSlug)
  );
  const article: (ToolCatalogItem & Partial<ToolSEOInfo>) | undefined =
    fullArticle || catalogArticle;

  React.useEffect(() => {
    if (!catalogArticle || getCachedFullTools()) return;
    let active = true;
    void loadFullToolsCatalog().then((loaded) => {
      if (active) setFullTools(loaded);
    });
    return () => {
      active = false;
    };
  }, [catalogArticle]);

  const isDefaultLocale =
    !i18n.language || i18n.language === 'en' || i18n.language.startsWith('en-');

  React.useEffect(() => {
    if (isDefaultLocale) {
      setLocalizedBodies(null);
      return;
    }
    let active = true;
    void loadLocalizedArticleBodies(i18n.language).then((data) => {
      if (active) {
        setLocalizedBodies(data);
      }
    });
    return () => {
      active = false;
    };
  }, [i18n.language, isDefaultLocale]);

  // Clean HTML to guarantee strictly only ONE title heading on the page and add section anchor IDs
  const { cleanArticleBody, articleSections } = React.useMemo(() => {
    if (!article) return { cleanArticleBody: '', articleSections: [] as Array<{ id: string; title: string }> };
    const canonicalBody = article.longFormBody || article.shortDescription || '';
    const localizedBody = isDefaultLocale
      ? canonicalBody
      : localizedBodies?.[article.id] ||
        localizedBodies?.[article.slug] ||
        t(`articles.${article.id}.body`, {
          defaultValue: t(`articles.${article.slug}.body`, {
            defaultValue: canonicalBody,
          }),
        });
    const strippedLeadHeading = localizedBody
      .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '')
      .replace(/^\s*<h2\b[^>]*>[\s\S]*?<\/h2>\s*(?=<p\b)/i, '')
      .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>');

    const sections: Array<{ id: string; title: string }> = [];
    let sectionIdx = 0;
    const bodyWithIds = strippedLeadHeading.replace(
      /<h2(\b[^>]*)>([\s\S]*?)<\/h2>/gi,
      (fullMatch, attrs: string, innerHtml: string) => {
        const plainTitle = innerHtml
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        if (!plainTitle) return fullMatch;
        sectionIdx += 1;
        const slugId =
          plainTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 48) || `part-${sectionIdx}`;
        const sectionId = `section-${sectionIdx}-${slugId}`;
        sections.push({ id: sectionId, title: plainTitle });
        if (/\bid\s*=/i.test(attrs)) {
          return fullMatch;
        }
        return `<h2 id="${sectionId}" class="scroll-mt-24"${attrs}>${innerHtml}</h2>`;
      }
    );

    return { cleanArticleBody: bodyWithIds, articleSections: sections };
  }, [article, isDefaultLocale, localizedBodies, t]);

  const shouldRenderStructuredFaqs = React.useMemo(() => {
    if (!article || !article.faqs || article.faqs.length === 0) return false;
    const firstQuestionProbe = article.faqs[0].q.slice(0, 28).toLowerCase();
    return !cleanArticleBody.toLowerCase().includes(firstQuestionProbe);
  }, [article, cleanArticleBody]);

  if (!article) {
    return (
      <>
        <Helmet>
          <title>{t('blogPost.notFound', { defaultValue: 'Article Not Found' })} | PDFMinty</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-2xl mb-4">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface mb-2">
            {t('blogPost.notFound', { defaultValue: 'Article Not Found' })}
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">
            {t('blogPost.notFoundDesc', {
              defaultValue:
                'The requested guide or article could not be located in our knowledge hub.',
            })}
          </p>
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

  // Calculate read time (falls back to precomputed catalog readingTimeMinutes while async body chunk loads)
  const getReadingTime = (html: string): string => {
    if (!html && catalogArticle?.readingTimeMinutes) {
      const precomputed = catalogArticle.readingTimeMinutes;
      return t('blog.readTime', { count: precomputed, defaultValue: `${precomputed} min read` });
    }
    const text = html ? html.replace(/<[^>]*>/g, '') : '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const time = Math.max(1, Math.ceil(words / 225));
    return t('blog.readTime', { count: time, defaultValue: `${time} min read` });
  };

  const getFormattedDate = (dateStr?: string): string => {
    const d = dateStr || '2026-09-21';
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

  const localizedArticleName = isDefaultLocale
    ? article.h1 || article.name
    : t(`articles.${article.id}.name`, {
        defaultValue: t(`articles.${article.slug}.name`, {
          defaultValue: article.h1 || article.name,
        }),
      });

  const localizedArticleDesc = isDefaultLocale
    ? article.shortDescription
    : t(`articles.${article.id}.shortDesc`, {
        defaultValue: t(`articles.${article.slug}.shortDesc`, {
          defaultValue: article.shortDescription,
        }),
      });

  const catKey = (article.category || 'guides').toLowerCase();
  const localizedCategory = t(`blog.categories.${catKey}`, {
    defaultValue: article.category || 'Guide',
  });

  const isAiOrOcrArticle =
    article.id === 'how-to-make-a-scanned-pdf-searchable' ||
    article.slug.includes('scanned-pdf-searchable');

  return (
    <div className="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        slug={article.slug}
        titleOverride={
          isDefaultLocale ? article.metaTitle : `${localizedArticleName} | PdfMinty Knowledge Hub`
        }
        descriptionOverride={
          isDefaultLocale
            ? article.metaDescription || localizedArticleDesc
            : localizedArticleDesc || article.metaDescription
        }
      />

      <article className="max-w-4xl mx-auto space-y-10" id="blog-post-container">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium overflow-x-auto pb-1">
          <Link
            to={ROUTES.HOME}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            {t('nav.home', { defaultValue: 'Home' })}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <Link
            to={ROUTES.BLOG}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            {t('blog.knowledgeHub', { defaultValue: 'Knowledge Hub' })}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs">
            {localizedArticleName}
          </span>
        </nav>

        {/* Article Header */}
        <header className="space-y-5 border-b border-border-muted pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                {localizedCategory}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {t('blog.publishedLabel', { defaultValue: 'Published' })}{' '}
                  {getFormattedDate(article.datePublished)}
                </span>
              </span>
              {article.dateModified && article.dateModified !== article.datePublished && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    <span>
                      {t('blog.updatedLabel', { defaultValue: 'Updated' })}{' '}
                      {getFormattedDate(article.dateModified)}
                    </span>
                  </span>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {getReadingTime(cleanArticleBody)}
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
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('blog.linkCopied', { defaultValue: 'Link Copied!' })}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('blog.shareArticle', { defaultValue: 'Share Article' })}</span>
                </>
              )}
            </button>
          </div>

          <h1 className="text-[28px] sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.16] sm:leading-[1.12] text-slate-900 dark:text-white my-3">
            {localizedArticleName}
          </h1>

          <p className="text-base sm:text-xl font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
            {localizedArticleDesc}
          </p>

          {/* Author Badge & In-Browser Guarantee */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low border border-border-muted">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-black text-xs tracking-wider">
                  <span>TM</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <span>{PRIMARY_AUTHOR.name}</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-rose-500 inline" />
                    <span>
                      {PRIMARY_AUTHOR.city}, {PRIMARY_AUTHOR.country}
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{PRIMARY_AUTHOR.jobTitle}</span>
                  <span>·</span>
                  <span>
                    {t('blog.teamSubtitle', { defaultValue: 'Reviewed by Security Team' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {isAiOrOcrArticle
                  ? t('blog.optInAiPrivacyBadge', {
                      defaultValue: 'Explicit Consent AI OCR • Zero Server Retention',
                    })
                  : t('blog.privacyBadge', {
                      defaultValue: '100% Local Processing (Standard Tools)',
                    })}
              </span>
            </div>
          </div>
        </header>

        {/* Quick Tool Launcher if article is related to compression or optimization */}
        {(article.id.includes('compress') ||
          article.slug.includes('compress') ||
          article.slug.includes('size') ||
          article.slug.includes('large') ||
          article.slug.includes('batch-process') ||
          article.slug.includes('scanned-documents') ||
          (article.relatedLinks &&
            article.relatedLinks.some((l) => l.url.includes('compress-pdf')))) && (
          <div className="not-prose my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-emerald-500/5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Minimize2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white m-0 tracking-tight">
                  {t('blog.compressToolPromptTitle', {
                    defaultValue: 'Need to shrink a PDF file right now?',
                  })}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 m-0 mt-0.5 font-normal">
                  {t('blog.compressToolPromptSubtitle', {
                    defaultValue:
                      'Compress PDFs locally in your browser without blurry text or server uploads.',
                  })}
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.COMPRESS}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0 no-underline"
            >
              <span>
                {t('blog.openCompressTool', { defaultValue: 'Open Compress PDF →' })}
              </span>
            </Link>
          </div>
        )}

        {/* Table of Contents (In This Guide) */}
        {articleSections.length >= 3 && (
          <nav
            aria-label="Table of Contents"
            className="not-prose my-6 p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-border-muted"
          >
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
              {t('blog.inThisGuide', { defaultValue: 'In This Guide' })}
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm list-none m-0 p-0">
              {articleSections.map((sec, idx) => (
                <li key={sec.id} className="m-0 p-0">
                  <a
                    href={`#${sec.id}`}
                    className="inline-flex items-baseline gap-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors no-underline"
                  >
                    <span className="font-mono text-[11px] font-bold text-emerald-600/80 dark:text-emerald-400/80 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="leading-snug">{sec.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Article Body */}
        {!cleanArticleBody && !fullArticle ? (
          <div className="space-y-4 py-6 animate-pulse" aria-busy="true" aria-live="polite">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-11/12" />
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/5 mt-8" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6" />
          </div>
        ) : (
          <div
            className="blog-prose prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanArticleBody }}
          />
        )}

        {/* Visible Structured FAQs when defined in seo-data.ts but not already embedded in longFormBody */}
        {shouldRenderStructuredFaqs && article.faqs && (
          <section
            aria-label="Frequently Asked Questions"
            className="my-10 p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-border-muted space-y-5"
          >
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0">
              {t('blog.faqHeading', { defaultValue: 'Frequently Asked Questions' })}
            </h2>
            <div className="space-y-4">
              {article.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl bg-surface border border-border-muted space-y-2"
                >
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                    {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Tools Box */}
        {article.relatedLinks &&
          article.relatedLinks.filter((l) => l.type === 'tool').length > 0 && (
            <div className="my-8 p-6 rounded-2xl bg-surface-container-low border border-border-muted space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span>
                  {t('blog.relatedToolsTitle', {
                    defaultValue: 'Related Free PDF Tools Mentioned in this Guide',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {article.relatedLinks
                  .filter((l) => l.type === 'tool')
                  .map((toolLink, idx) => (
                    <Link
                      key={idx}
                      to={toolLink.url}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-surface hover:bg-surface-container-high border border-border-muted hover:border-emerald-500/40 transition-all group no-underline"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {toolLink.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
              </div>
            </div>
          )}

        {/* Real Author Bio Box - Fix for AdSense E-E-A-T */}
        <div className="my-10">
          <AuthorBio />
        </div>

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
              {t('blog.ctaSubtitle', {
                defaultValue:
                  "Use PdfMinty's free, 100% private in-browser tools today. No uploads, zero server traces.",
              })}
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
