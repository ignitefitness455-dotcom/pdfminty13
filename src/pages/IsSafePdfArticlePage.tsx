import { Shield, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const IsSafePdfArticlePage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="Are Online PDF Converters Safe? The Privacy Hazards Explained"
        descriptionOverride="Sending PDFs to remote servers poses real privacy hazards. Learn why in-browser PDF processing is the safest way to edit sensitive documents online."
      />

      <div className="max-w-4xl mx-auto space-y-12" id="is-safe-article-container">
        {/* Navigation back link */}
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('isSafePdf.backToTools', { defaultValue: 'Back to All PDF Tools' })}</span>
        </Link>

        {/* Article Header */}
        <header className="space-y-6 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide uppercase">
            <Shield className="w-4 h-4" />
            <span>{t('isSafePdf.securityAnalysis', { defaultValue: 'Document Security Analysis' })}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight leading-tight">{t('isSafePdf.title', { defaultValue: 'Are Online PDF Converters Safe? The Privacy Hazards Explained' })}</h1>

          <p className="text-base sm:text-xl font-medium text-on-surface-variant leading-relaxed">
            {t("isSafePdf.headerDesc")}
          </p>
        </header>

        {/* Section 1: The Cloud Server Problem */}
        <section className="space-y-4 bg-surface-container-low border border-border-muted p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">{t('isSafePdf.whatHappens', { defaultValue: 'What Happens When You Upload a PDF to the Cloud?' })}</h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            When you use traditional web tools, your document travels over the internet to a third-party remote server. There, software processes your file before sending the output back to your browser. Even if a site claims to delete files within an hour, your sensitive data temporarily lives on an external machine subject to data leaks, server logs, or employee access.
          </p>
        </section>

        {/* Section 2: In-Browser Safety */}
        <section className="space-y-4 bg-surface-container-low border border-emerald-500/30 p-6 sm:p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface">{t("isSafePdf.saferAlternative")}</h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            {t("isSafePdf.saferDesc")}
          </p>
        </section>

        {/* Comparison Table */}
        <section className="space-y-6 bg-surface-container-low border border-border-muted p-6 sm:p-8 rounded-3xl shadow-sm">
          <h2 className="text-xl font-extrabold text-on-surface">{t("isSafePdf.compTitle")}</h2>
          <div className="overflow-x-auto rounded-2xl border border-border-muted bg-surface">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface-container-high/60">
                  <th className="py-3.5 px-4 font-bold text-on-surface">{t("isSafePdf.featCol")}</th>
                  <th className="py-3.5 px-4 font-bold text-rose-500">{t("isSafePdf.tradCol")}</th>
                  <th className="py-3.5 px-4 font-bold text-emerald-500 bg-emerald-500/5">{t("isSafePdf.colMinty")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted text-on-surface-variant font-medium">
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.uploadReq")}</td>
                  <td className="py-3 px-4 text-rose-500 font-bold">{t("isSafePdf.yesRemote")}</td>
                  <td className="py-3 px-4 text-emerald-500 font-bold bg-emerald-500/5">{t("isSafePdf.noLocal")}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.dataPriv")}</td>
                  <td className="py-3 px-4">{t("isSafePdf.reliesPromises")}</td>
                  <td className="py-3 px-4 text-emerald-500 font-bold bg-emerald-500/5">{t("isSafePdf.guaranteedArch")}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.offlineAvail")}</td>
                  <td className="py-3 px-4">{t("isSafePdf.noInternet")}</td>
                  <td className="py-3 px-4 text-emerald-500 font-bold bg-emerald-500/5">{t("isSafePdf.yesOffline")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t('isSafePdf.keepDocsSafe', { defaultValue: 'Keep your sensitive documents safe.' })}</h2>
          <p className="text-base sm:text-lg font-bold text-emerald-100 max-w-xl mx-auto">{t('isSafePdf.processLocally', { defaultValue: 'Process your standard PDFs locally in browser memory with PDFMinty.' })}</p>
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
      </div>
    </div>
  );
};

export default IsSafePdfArticlePage;
