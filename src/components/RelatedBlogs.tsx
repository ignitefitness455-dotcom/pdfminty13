import { BookOpen, ArrowRight, Clock, Calendar } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { TOOLS_CATALOG as TOOLS, ToolCatalogItem } from '../config/seo-catalog';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/config';

export const RelatedBlogs: React.FC = () => {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation('common');

  const relatedBlogs = useMemo(() => {
    const articles = TOOLS.filter(
      (t) =>
        t.type === 'article' &&
        t.category !== 'info' &&
        t.category !== 'static' &&
        t.id !== 'blog' &&
        t.id !== 'trust-article' &&
        t.id !== 'about-us'
    );
    let currentSlug = (pathname || '').replace(/^\//, '').replace(/\/$/, '');
    for (const loc of SUPPORTED_LOCALES) {
      if (loc !== DEFAULT_LOCALE && (currentSlug === loc || currentSlug.startsWith(`${loc}/`))) {
        currentSlug = currentSlug.substring(loc.length + 1);
        break;
      }
    }

    const currentItem = TOOLS.find((t) => t.slug === currentSlug);
    const currentTokens = currentSlug
      .replace(/^(blog|compare)\//, '')
      .split('-')
      .filter((w) => w.length > 2 && !['pdf', 'how', 'the', 'for', 'and', 'free', '2026', 'guide', 'online', 'with', 'without'].includes(w));

    const scoreArticle = (a: ToolCatalogItem): number => {
      let score = 0;
      if (currentItem) {
        if (currentItem.type === 'tool' && a.relatedTools?.includes(currentItem.slug)) {
          score += 12;
        }
        if (a.category && currentItem.category && a.category === currentItem.category) {
          score += 5;
        }
        if (currentItem.relatedTools && a.relatedTools) {
          const shared = a.relatedTools.filter((rt) => currentItem.relatedTools?.includes(rt)).length;
          score += shared * 3;
        }
      }
      if (currentTokens.length > 0) {
        const hay = `${a.slug} ${a.name} ${a.keywords?.join(' ') || ''}`.toLowerCase();
        for (const tok of currentTokens) {
          if (hay.includes(tok)) {
            score += 4;
          }
        }
      }
      return score;
    };

    // Filter out current article if viewing a blog post
    const filtered = articles.filter((a) => a.slug !== currentSlug);

    // Sort by topical relevance score first, then newest date
    const sorted = [...filtered].sort((a, b) => {
      const scoreDiff = scoreArticle(b) - scoreArticle(a);
      if (scoreDiff !== 0) return scoreDiff;
      const dateA = new Date(a.datePublished || '2026-07-15').getTime();
      const dateB = new Date(b.datePublished || '2026-07-15').getTime();
      if (dateB !== dateA) return dateB - dateA;
      return articles.indexOf(b) - articles.indexOf(a);
    });

    // Return 3 articles
    return sorted.slice(0, 3);
  }, [pathname]);

  const getReadingTime = (post: ToolCatalogItem): string => {
    const time = post.readingTimeMinutes || 1;
    return t('relatedBlogs.readTime', { count: time, defaultValue: `${time} min read` });
  };

  const getFormattedDate = (post: ToolCatalogItem): string => {
    const dateStr = post.dateModified || post.datePublished || '2026-09-21';
    try {
      const locale = i18n.language === 'bn' ? 'bn-BD' : i18n.language === 'de' ? 'de-DE' : 'en-US';
      return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryLabel = (category?: string) => {
    const catKey = (category || 'guides').toLowerCase();
    return t(`blog.categories.${catKey}`, { defaultValue: category || 'Guide' });
  };

  const isDefaultLocale =
    !i18n.language || i18n.language === 'en' || i18n.language.startsWith('en-');

  const getArticleTitle = (post: ToolCatalogItem) => {
    if (isDefaultLocale) return post.name;
    return t(`articles.${post.id}.name`, {
      defaultValue: t(`articles.${post.slug}.name`, { defaultValue: post.name }),
    });
  };

  const getArticleDesc = (post: ToolCatalogItem) => {
    if (isDefaultLocale) return post.shortDescription;
    return t(`articles.${post.id}.shortDesc`, {
      defaultValue: t(`articles.${post.slug}.shortDesc`, { defaultValue: post.shortDescription }),
    });
  };

  const isHomePage =
    pathname === '/' ||
    SUPPORTED_LOCALES.some((loc) => pathname === `/${loc}` || pathname === `/${loc}/`);

  if (isHomePage || pathname === '/blog' || pathname.endsWith('/blog') || relatedBlogs.length === 0)
    return null;

  return (
    <div className="mt-12 pt-8 border-t border-border-muted" id="related_blogs_box">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>{t('relatedBlogs.title', { defaultValue: 'Recommended Guides & Articles' })}</span>
        </h3>
        <Link
          to={ROUTES.BLOG}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 group"
        >
          <span>{t('relatedBlogs.exploreAll', { defaultValue: 'Explore All' })}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {relatedBlogs.map((post) => (
          <Link
            key={post.id}
            to={`/${post.slug}/`}
            className="group flex flex-col justify-between p-5 bg-surface-container-low border border-border-muted rounded-2xl hover:border-emerald-500/50 hover:shadow-lg transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                  {getCategoryLabel(post.category)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getFormattedDate(post)}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                {getArticleTitle(post)}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {getArticleDesc(post)}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-border-muted flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono font-normal">
                <Clock className="w-3 h-3" />
                {getReadingTime(post)}
              </span>
              <span className="inline-flex items-center gap-1 font-bold">
                <span>{t('relatedBlogs.read', { defaultValue: 'Read' })}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedBlogs;
