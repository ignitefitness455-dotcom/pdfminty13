import { ArrowLeft, BookOpen, Search, Clock, Calendar, Shield, Cpu, FileSignature, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { SEO } from '../components/SEO';
import { ROUTES } from '../config/routes';
import { TOOLS, ToolSEOInfo } from '../config/seo-data';

export const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Security' | 'Privacy' | 'Optimization' | 'Tutorials'>('all');

  // Filter to find all individual articles except the blog index page itself (sorted newest first)
  const blogPosts = useMemo(() => {
    const staticPageIds = ['blog', 'about-us', 'contact', 'privacy-policy', 'terms-of-service', 'adobe-acrobat-alternative'];
    const posts = TOOLS.filter((t) => t.type === 'article' && !staticPageIds.includes(t.id));
    return [...posts].sort((a, b) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const dateA = new Date(a.datePublished || todayStr).getTime();
      const dateB = new Date(b.datePublished || todayStr).getTime();
      if (dateB !== dateA) {
        return dateB - dateA; // Newest date first
      }
      return posts.indexOf(b) - posts.indexOf(a); // Higher array index (newest added) first if dates are identical
    });
  }, []);

  // Map post IDs to clean user-facing categories
  const getPostCategory = (id: string): 'Security' | 'Privacy' | 'Optimization' | 'Tutorials' => {
    switch (id) {
      case 'trust-article':
      case 'blog-protect-pdf-password':
        return 'Security';
      case 'blog-privacy':
      case 'blog-privacy-2026':
      case 'blog-free-esignature':
      case 'blog-remove-metadata':
      case 'blog-ilovepdf-vs-smallpdf-vs-pdfminty':
      case 'compare-pdfminty-vs-smallpdf':
      case 'compare-pdfminty-vs-ilovepdf':
        return 'Privacy';
      case 'blog-compress':
      case 'blog-batch-processing':
      case 'blog-best-free-pdf-compressor':
      case 'blog-how-to-compress-a-pdf-without-losing-quality-2026':
      case 'blog-pdf-size-limit-email-upload':
        return 'Optimization';
      case 'blog-metadata':
      case 'blog-merge-pdf':
      case 'blog-pdf-form-wont-let-me-type':
      case 'blog-how-to-convert-pdf-to-word-for-free-2026':
      case 'how-to-add-page-numbers-to-a-pdf-for-free':
        return 'Tutorials';
      default:
        return 'Tutorials';
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: blogPosts.length,
      Security: 0,
      Privacy: 0,
      Optimization: 0,
      Tutorials: 0,
    };
    blogPosts.forEach((post) => {
      const cat = getPostCategory(post.id);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [blogPosts]);

  // Get icons matching categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <Shield className="w-3.5 h-3.5" />;
      case 'Privacy':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'Optimization':
        return <Clock className="w-3.5 h-3.5" />;
      case 'Tutorials':
        return <FileSignature className="w-3.5 h-3.5" />;
      default:
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  // Estimate reading time from HTML longFormBody content
  const getReadingTime = (html: string): string => {
    const text = html ? html.replace(/<[^>]*>/g, '') : '';
    const words = text.trim().split(/\s+/).length;
    const time = Math.max(1, Math.ceil(words / 225)); // average 225 words per minute
    return t('blog.readTime', { count: time, defaultValue: `${time} min read` });
  };

  // Format the publication dates beautifully
  const getFormattedDate = (post: ToolSEOInfo): string => {
    const dateStr = post.datePublished || '2026-07-16';
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

  const getArticleTitle = useCallback((post: ToolSEOInfo) => {
    return t(`articles.${post.id}.name`, {
      defaultValue: t(`articles.${post.slug}.name`, { defaultValue: post.name }),
    });
  }, [t]);

  const getArticleDesc = useCallback((post: ToolSEOInfo) => {
    return t(`articles.${post.id}.shortDesc`, {
      defaultValue: t(`articles.${post.slug}.shortDesc`, { defaultValue: post.shortDescription }),
    });
  }, [t]);

  const getCategoryLabel = (category: string) => {
    return t(`blog.categories.${category.toLowerCase()}`, {
      defaultValue: category === 'all' ? 'All Articles' : category,
    });
  };

  // Filtered posts based on search query and category selection
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const category = getPostCategory(post.id);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const title = getArticleTitle(post).toLowerCase();
      const desc = getArticleDesc(post).toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        post.name.toLowerCase().includes(query) ||
        post.shortDescription.toLowerCase().includes(query) ||
        title.includes(query) ||
        desc.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [blogPosts, selectedCategory, searchQuery, getArticleTitle, getArticleDesc]);

  // Separate featured post (first post when no active search & 'all' selected)
  const showFeaturedHero = selectedCategory === 'all' && !searchQuery && filteredPosts.length > 0;
  const featuredPost = showFeaturedHero ? filteredPosts[0] : null;
  const regularPosts = showFeaturedHero ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-10 animate-fadein" id="blog-landing-container">
      <SEO slug="blog" />

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          id="back-to-home-link"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('toolCommon.returnToDashboard', { defaultValue: 'Return to Tools Dashboard' })}</span>
        </Link>
      </div>

      {/* Main Hero & Description */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>{t('blog.hubBadge', { defaultValue: 'Knowledge Hub & Security Guides' })}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-50">
          {t('blog.hubTitle', { defaultValue: 'PDFMinty Knowledge Hub' })}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          {t('blog.hubSubtitle', {
            defaultValue: 'Expert guides, privacy-first tutorials, and technical insights on secure PDF processing, offline browser cryptography, and document workflow optimization.',
          })}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 bg-surface-container-low border border-border-muted rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('blog.searchPlaceholder', { defaultValue: 'Search guides, tutorials, or comparisons...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 bg-background border border-border-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              id="blog-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {t('blog.clearSearch', { defaultValue: 'Clear' })}
              </button>
            )}
          </div>

          {/* Article Count Indicator */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('blog.showingArticles', { count: filteredPosts.length, defaultValue: `Showing ${filteredPosts.length} articles` })}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none" id="category-filters">
          {(['all', 'Security', 'Privacy', 'Optimization', 'Tutorials'] as const).map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-background hover:bg-surface-container-high border-border-muted text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{getCategoryLabel(cat)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Article Banner (Top Priority Highlight) */}
      {featuredPost && (
        <article className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl border border-slate-700/60 shadow-xl group transition-all duration-300 hover:border-emerald-500/50">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-emerald-400" />
          </div>

          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {t('blog.featuredArticle', { defaultValue: 'Featured Article' })}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-emerald-300">
                {getCategoryIcon(getPostCategory(featuredPost.id))}
                {getCategoryLabel(getPostCategory(featuredPost.id))}
              </span>
            </div>

            <Link to={`/${featuredPost.slug}/`} className="block group-hover:text-emerald-300 transition-colors">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                {getArticleTitle(featuredPost)}
              </h2>
            </Link>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 font-normal">
              {getArticleDesc(featuredPost)}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    <img src="/logo.svg" alt="PDFMinty Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-emerald-300 font-bold">{t('blog.editorialTeam', { defaultValue: 'PDFMinty Editorial Team' })}</span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {getFormattedDate(featuredPost)}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {getReadingTime(featuredPost.longFormBody)}
                </span>
              </div>

              <Link
                to={`/${featuredPost.slug}/`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md group-hover:translate-x-1"
              >
                <span>{t('blog.readFullArticle', { defaultValue: 'Read Full Article' })}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* Blog Cards Grid */}
      {regularPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="blog-posts-grid">
          {regularPosts.map((post) => {
            const category = getPostCategory(post.id);
            const readingTime = getReadingTime(post.longFormBody);
            const formattedDate = getFormattedDate(post);
            const targetPath = `/${post.slug}/`;

            return (
              <article
                key={post.id}
                className="group flex flex-col justify-between p-6 bg-surface-container-low border border-border-muted rounded-2xl hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Category and Meta info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high border border-border-muted rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      {getCategoryIcon(category)}
                      {getCategoryLabel(category)}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link to={targetPath} className="block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                      {getArticleTitle(post)}
                    </h2>
                  </Link>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {getArticleDesc(post)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5 mt-5 border-t border-border-muted text-xs font-semibold">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      <img src="/logo.svg" alt="PDFMinty Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[11px] font-bold">{t('blog.editorialTeam', { defaultValue: 'PDFMinty Team' })}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {readingTime}
                    </span>
                  </div>

                  <Link
                    to={targetPath}
                    className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <span>{t('blog.readArticle', { defaultValue: 'Read Article' })}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface-container-low border border-border-muted rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('blog.noArticlesMatch', { defaultValue: 'No articles match your search criteria' })}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">{t('blog.tryAdjusting', { defaultValue: 'Try adjusting your search query or selecting a different category to explore our guides.' })}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all shadow-md"
          >
            {t('blog.resetFilters', { defaultValue: 'Reset Filters' })}
          </button>
        </div>
      )}

      {/* In-Browser Security & Privacy Callout */}
      <div className="p-6 sm:p-8 bg-surface-container-low border border-border-muted rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>{t('blog.privacyCalloutBadge', { defaultValue: 'Privacy Guarantee' })}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{t('blog.privacyCalloutTitle', { defaultValue: 'Looking for private, serverless PDF tools?' })}</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('blog.privacyCalloutDesc', {
              defaultValue: 'All PDFMinty tools process your documents completely inside your browser memory using client-side WebAssembly. No registration required, zero tracking, and no cloud uploads.',
            })}
          </p>
        </div>

        <Link
          to={ROUTES.HOME}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('blog.privacyCalloutButton', { defaultValue: 'Explore All Free Tools' })}</span>
        </Link>
      </div>
    </div>
  );
};

export default BlogPage;
