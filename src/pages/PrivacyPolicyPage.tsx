import { Shield, Lock, EyeOff, Server, HardDrive, Globe, Database, HelpCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="Privacy Policy — 100% Zero-Data Collection | PdfMinty"
        descriptionOverride="Read PdfMinty's Privacy Policy. We do not collect, upload, store, or transmit your PDF files. All processing happens 100% locally inside your web browser. Includes Google AdSense and cookie disclosures."
      />

      <div className="max-w-4xl mx-auto space-y-12" id="privacy-policy-container">
        {/* Header Hero */}
        <div className="text-center space-y-4 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Shield className="w-4 h-4" />
            <span>{t('privacyPolicy.badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">
            {t('privacyPolicy.title', { defaultValue: 'Privacy Policy' })}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-on-surface-variant max-w-xl mx-auto">
            {t('privacyPolicy.updated')}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
              ✓
            </div>
            <h2 className="text-lg font-extrabold text-on-surface">
              {t('privacyPolicy.shortVersion', { defaultValue: 'The Short Version' })}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            {t('privacyPolicy.summary')}
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 bg-surface-container-low border border-border-muted p-6 sm:p-10 rounded-3xl shadow-sm text-xs sm:text-sm leading-relaxed text-on-surface-variant font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec1Title')}
            </h2>
            <p>{t('privacyPolicy.sec1Desc')}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec2Title')}
            </h2>
            <p>{t('privacyPolicy.sec2Desc')}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec3Title')}
            </h2>
            <p>{t('privacyPolicy.sec3Desc')}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec4Title')}
            </h2>
            <div className="space-y-3">
              <p>{t('privacyPolicy.sec4Intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('privacyPolicy.sec4Li1')}</li>
                <li>{t('privacyPolicy.sec4Li2')}</li>
                <li>
                  {t('privacyPolicy.sec4OptOut')}{' '}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Ads Settings
                  </a>{' '}
                  {t('privacyPolicy.sec4Or')}{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    www.aboutads.info
                  </a>
                  .
                </li>
                <li>
                  {t('privacyPolicy.sec4Partner')}{' '}
                  <a
                    href="https://policies.google.com/technologies/partner-sites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    How Google uses information from sites or apps that use our services
                  </a>
                  .
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.secCmpTitle', {
                defaultValue: 'Consent Management Platform & Cookie Preferences (EEA & UK)',
              })}
            </h2>
            <div className="space-y-3">
              <p>
                {t('privacyPolicy.secCmpIntro', {
                  defaultValue:
                    'For visitors located in the European Economic Area (EEA), the United Kingdom, and Switzerland, PdfMinty deploys a Google-Certified Consent Management Platform (CMP) — Cookiebot by Usercentrics (CMP ID: 134) — in strict adherence to the IAB Europe Transparency and Consent Framework (TCF v2.2) and Google Consent Mode v2.',
                })}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>CMP Provider &amp; Certification:</strong> Our consent management
                  infrastructure is provided by{' '}
                  <a
                    href="https://www.cookiebot.com/en/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Cookiebot by Usercentrics
                  </a>{' '}
                  (IAB TCF ID: 134), certified under Google&apos;s Consent Management Requirements
                  for publishers serving ads in the EEA and UK.
                </li>
                <li>
                  <strong>Default Privacy Protection:</strong> Under Google Consent Mode v2, all
                  advertising signals (<code>ad_storage</code>, <code>ad_user_data</code>, and{' '}
                  <code>ad_personalization</code>) remain denied by default until you grant
                  affirmative consent. Core PDF processing runs 100% locally in your browser and
                  requires no cookies.
                </li>
                <li>
                  <strong>Granular Controls:</strong> You can independently control permissions for
                  advertising cookies, user identifiers, and anonymous analytics storage (
                  <code>analytics_storage</code>).
                </li>
                <li>
                  <strong>Revisiting or Revoking Consent:</strong> You have the right to modify or
                  revoke your consent at any time. You can click the button below, use the
                  &ldquo;Cookie &amp; Privacy Preferences&rdquo; link in our footer, or clear your
                  browser cache.
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const win = window as unknown as { openCookiePreferences?: () => void };
                    if (typeof win.openCookiePreferences === 'function') {
                      win.openCookiePreferences();
                    } else {
                      window.dispatchEvent(new CustomEvent('open-cmp-preferences'));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {t('consentBanner.managePreferences', {
                      defaultValue: 'Manage Cookie & Privacy Preferences',
                    })}
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec5Title')}
            </h2>
            <p>{t('privacyPolicy.sec5Desc')}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec6Title')}
            </h2>
            <div className="space-y-3">
              <p>{t('privacyPolicy.sec6Intro')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>{t('privacyPolicy.sec6Li1Title')}</strong> {t('privacyPolicy.sec6Li1')}
                </li>
                <li>
                  <strong>{t('privacyPolicy.sec6Li2Title')}</strong> {t('privacyPolicy.sec6Li2')}
                </li>
                <li>
                  <strong>{t('privacyPolicy.sec6Li3Title')}</strong> {t('privacyPolicy.sec6Li3')}
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec7Title')}
            </h2>
            <p>{t('privacyPolicy.sec7Desc')}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              {t('privacyPolicy.sec8Title')}
            </h2>
            <p>
              {t('privacyPolicy.sec8Desc')}{' '}
              <Link
                to={ROUTES.CONTACT}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {t('privacyPolicy.contactPage')}
              </Link>{' '}
              {t('privacyPolicy.orEmail')}{' '}
              <span className="font-semibold text-on-surface">support@pdfminty.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
