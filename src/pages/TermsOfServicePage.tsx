import { FileText, CheckCircle2, Shield, Scale, HelpCircle, Bot, AlertTriangle, Mail } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="Terms of Service — PdfMinty"
        descriptionOverride="Read PdfMinty's Terms of Service. Understand our terms of use, privacy guarantee, acceptable use policy, and crawler guidelines."
      />

      <div className="max-w-4xl mx-auto space-y-12" id="terms-of-service-container">
        {/* Header Hero */}
        <div className="text-center space-y-4 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Scale className="w-4 h-4" />
            <span>{t("termsOfService.badge")}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">{t('termsOfService.title', { defaultValue: 'Terms of Service' })}</h1>
          <p className="text-xs sm:text-sm font-semibold text-on-surface-variant max-w-xl mx-auto">
            {t("termsOfService.updated")}
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-8 bg-surface-container-low border border-border-muted p-6 sm:p-10 rounded-3xl shadow-sm text-xs sm:text-sm leading-relaxed text-on-surface-variant font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec1Title")}
            </h2>
            <p>
              {t("termsOfService.sec1Desc")}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec2Title")}
            </h2>
            <p>
              {t("termsOfService.sec2Desc")}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec3Title")}
            </h2>
            <div className="space-y-3">
              <p>
                {t("termsOfService.sec3Intro")}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>{t("termsOfService.sec3Li1Title")}</strong> {t("termsOfService.sec3Li1Desc")}
                </li>
                <li>
                  <span dangerouslySetInnerHTML={{ __html: t("tos.aiDocs") }} />
                </li>
                <li>
                  <strong>{t("termsOfService.sec3Li3Title")}</strong> {t("termsOfService.sec3Li3Desc")}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec4Title")}
            </h2>
            <p>
              {t("termsOfService.sec4Desc")}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec5Title")}
            </h2>
            <p>
              {t("termsOfService.sec5Desc")}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec6Title")}
            </h2>
            <p>
              {t("termsOfService.sec6Desc")}
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              {t("termsOfService.sec7Title")}
            </h2>
            <p>
              {t("termsOfService.sec7Desc")}{' '}
              <Link to={ROUTES.CONTACT} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                {t("termsOfService.contactPage")}
              </Link>{' '}
              {t("termsOfService.orEmail")} <span className="font-semibold text-on-surface">support@pdfminty.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
