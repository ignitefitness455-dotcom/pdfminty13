import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { AuthorBio } from '../components/AuthorBio';
import { RelatedBlogs } from '../components/RelatedBlogs';
import { SecurityAffiliateBanner } from '../components/SecurityAffiliateBanner';
import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';
import { TOOLS } from '../config/seo-data';

export const IsSafePdfArticlePage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const trustArticle = TOOLS.find((item) => item.id === 'trust-article');
  const isDefaultLocale =
    !i18n.language || i18n.language === 'en' || i18n.language.startsWith('en-');

  const cleanBody = React.useMemo(() => {
    const raw = trustArticle?.longFormBody || '';
    return raw
      .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '')
      .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>');
  }, [trustArticle]);

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        slug="blog/is-it-safe-to-upload-pdf-to-online-tools"
        titleOverride={
          isDefaultLocale
            ? trustArticle?.metaTitle || 'Is It Safe to Upload PDFs to Online Tools? | PDFMinty'
            : t('isSafePdf.title', {
                defaultValue: 'Is It Safe to Upload PDFs to Online Tools? | PDFMinty',
              })
        }
        descriptionOverride={
          trustArticle?.metaDescription ||
          'Sending PDFs to remote servers poses real privacy hazards. Learn why in-browser PDF processing is the safest way to edit sensitive documents online.'
        }
      />

      <div className="max-w-4xl mx-auto space-y-12" id="is-safe-article-container">
        {/* Navigation back link */}
        <Link
          to={ROUTES.BLOG}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('isSafePdf.backToTools', { defaultValue: 'Back to Knowledge Hub' })}</span>
        </Link>

        {/* Article Header */}
        <header className="space-y-6 border-b border-border-muted pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide uppercase">
              <Shield className="w-4 h-4" />
              <span>
                {t('isSafePdf.securityAnalysis', { defaultValue: 'Document Security Analysis' })}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published {trustArticle?.datePublished || '2026-09-21'}</span>
            </span>
            {trustArticle?.dateModified && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                <span>• Updated {trustArticle.dateModified}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>8 min read</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight leading-tight">
            {isDefaultLocale
              ? trustArticle?.h1 ||
                'Is It Safe to Upload PDF Files to Online Tools? An In-Depth Safety Analysis'
              : t('isSafePdf.title', {
                  defaultValue:
                    'Is It Safe to Upload PDF Files to Online Tools? An In-Depth Safety Analysis',
                })}
          </h1>

          <p className="text-base sm:text-xl font-medium text-on-surface-variant leading-relaxed">
            {isDefaultLocale ? trustArticle?.shortDescription : t('isSafePdf.headerDesc')}
          </p>
        </header>

        {/* Section 1: The Cloud Server Problem */}
        <section className="space-y-4 bg-surface-container-low border border-border-muted p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">
              {t('isSafePdf.whatHappens', {
                defaultValue: 'What Happens When You Upload a PDF to the Cloud?',
              })}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            When you use traditional web tools, your document travels over the internet to a
            third-party remote server. There, software processes your file before sending the output
            back to your browser. Even if a site claims to delete files within an hour, your
            sensitive data temporarily lives on an external machine subject to data leaks, server
            logs, or employee access.
          </p>
        </section>

        {/* Section 2: In-Browser Safety */}
        <section className="space-y-4 bg-surface-container-low border border-emerald-500/30 p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">
              {t('isSafePdf.saferAlternative')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            {t('isSafePdf.saferDesc')}
          </p>
        </section>

        {/* Full In-Depth Analysis from seo-data.ts */}
        {cleanBody && (
          <div
            className="blog-prose prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanBody }}
          />
        )}

        {/* Recommended Security Partner */}
        <SecurityAffiliateBanner variant="editorial" />

        {/* Author Bio */}
        <AuthorBio />

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {t('isSafePdf.keepDocsSafe', { defaultValue: 'Keep your sensitive documents safe.' })}
          </h2>
          <p className="text-base sm:text-lg font-bold text-emerald-100 max-w-xl mx-auto">
            {t('isSafePdf.processLocally', {
              defaultValue: 'Process your standard PDFs locally in browser memory with PDFMinty.',
            })}
          </p>
          <div className="pt-2">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-900 dark:!bg-white dark:!text-emerald-900 hover:dark:!bg-emerald-50 font-black text-base rounded-2xl transition-all shadow-lg hover:bg-emerald-50 hover:scale-105 active:scale-100"
            >
              <span>{t('isSafePdf.startUsing', { defaultValue: 'Start Using Free Tools' })}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <RelatedBlogs />
      </div>
    </div>
  );
};

export default IsSafePdfArticlePage;
