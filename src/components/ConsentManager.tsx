import { Shield, Cookie, Sliders, Check, X, ExternalLink } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ROUTES } from '../config/routes';

export interface ConsentSettings {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  timestamp: string;
  version: string;
}

const STORAGE_KEY = 'pdfminty_consent_v2';
const CURRENT_VERSION = '2.2';

/**
 * Dispatches Google Consent Mode v2 updates, dataLayer events, and IAB TCF notifications.
 */
export function applyConsentSettings(settings: ConsentSettings) {
  if (typeof window === 'undefined') return;

  const win = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __notifyTCFListeners?: () => void;
  };

  // 1. Google Consent Mode v2 update
  if (typeof win.gtag === 'function') {
    win.gtag('consent', 'update', {
      ad_storage: settings.ad_storage,
      ad_user_data: settings.ad_user_data,
      ad_personalization: settings.ad_personalization,
      analytics_storage: settings.analytics_storage,
    });
  }

  // 2. dataLayer event for tag triggers
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({
    event: 'consent_updated',
    consent_settings: settings,
  });

  // 3. IAB TCF v2.2 listener notification
  if (typeof win.__notifyTCFListeners === 'function') {
    win.__notifyTCFListeners();
  }

  // 4. LocalStorage persistence
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Handle local storage restrictions gracefully
  }
}

export const ConsentManager: React.FC = () => {
  const { t } = useTranslation('common');
  const [hasStoredConsent, setHasStoredConsent] = useState<boolean>(true); // start true to avoid SSR/first-paint layout shift
  const [preferencesOpen, setPreferencesOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Granular preference state
  const [analyticsGranted, setAnalyticsGranted] = useState<boolean>(true);
  const [adStorageGranted, setAdStorageGranted] = useState<boolean>(false);
  const [adUserDataGranted, setAdUserDataGranted] = useState<boolean>(false);
  const [adPersonalizationGranted, setAdPersonalizationGranted] = useState<boolean>(false);

  // Check storage on client-side mount
  useEffect(() => {
    setMounted(true);
    let stored: ConsentSettings | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch {
      // storage unavailable
    }

    if (stored) {
      setHasStoredConsent(true);
      setAnalyticsGranted(stored.analytics_storage === 'granted');
      setAdStorageGranted(stored.ad_storage === 'granted');
      setAdUserDataGranted(stored.ad_user_data === 'granted');
      setAdPersonalizationGranted(stored.ad_personalization === 'granted');
    } else {
      setHasStoredConsent(false);
    }

    // Expose global preference opening function for footer and privacy page links
    const handleOpenPreferences = () => {
      setPreferencesOpen(true);
    };

    window.addEventListener('open-cmp-preferences', handleOpenPreferences);
    (window as unknown as { openCookiePreferences?: () => void }).openCookiePreferences =
      handleOpenPreferences;

    return () => {
      window.removeEventListener('open-cmp-preferences', handleOpenPreferences);
      delete (window as unknown as { openCookiePreferences?: () => void }).openCookiePreferences;
    };
  }, []);

  // Handle Escape key to close preferences modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && preferencesOpen) {
        setPreferencesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferencesOpen]);

  // Actions
  const handleAcceptAll = useCallback(() => {
    const settings: ConsentSettings = {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    applyConsentSettings(settings);
    setAnalyticsGranted(true);
    setAdStorageGranted(true);
    setAdUserDataGranted(true);
    setAdPersonalizationGranted(true);
    setHasStoredConsent(true);
    setPreferencesOpen(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    const settings: ConsentSettings = {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    applyConsentSettings(settings);
    setAnalyticsGranted(false);
    setAdStorageGranted(false);
    setAdUserDataGranted(false);
    setAdPersonalizationGranted(false);
    setHasStoredConsent(true);
    setPreferencesOpen(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const settings: ConsentSettings = {
      ad_storage: adStorageGranted ? 'granted' : 'denied',
      ad_user_data: adUserDataGranted ? 'granted' : 'denied',
      ad_personalization: adPersonalizationGranted ? 'granted' : 'denied',
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    applyConsentSettings(settings);
    setHasStoredConsent(true);
    setPreferencesOpen(false);
  }, [adStorageGranted, adUserDataGranted, adPersonalizationGranted, analyticsGranted]);

  if (!mounted) return null;

  return (
    <>
      {/* 1. Bottom-Fixed Consent Banner (Shown if no choice made yet) */}
      {!hasStoredConsent && (
        <aside
          id="pdfminty-consent-banner"
          aria-label={t('consentBanner.title', { defaultValue: 'We respect your privacy' })}
          className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="max-w-5xl mx-auto pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border-default/80 dark:border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-on-surface">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              {/* Text info */}
              <div className="space-y-2 flex-1 pr-0 lg:pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Cookie className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-on-surface">
                    {t('consentBanner.title', { defaultValue: 'We respect your privacy' })}
                  </h3>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                    TCF v2.2 &amp; CMP
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('consentBanner.description', {
                    defaultValue:
                      'PdfMinty processes files 100% locally in your web browser with zero server uploads for core tools. We and our certified partners use cookies and device identifiers to analyze site traffic, measure usage, and deliver relevant advertisements in compliance with the IAB Europe Transparency and Consent Framework (TCF v2.2) and Google Consent Mode v2.',
                  })}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/80 pt-0.5">
                  <span>{t('consentBanner.learnMore', { defaultValue: 'Learn more in our' })}</span>
                  <Link
                    to={ROUTES.PRIVACY_POLICY}
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    {t('consentBanner.privacyPolicy', { defaultValue: 'Privacy Policy' })}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setPreferencesOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl border border-border-default hover:bg-surface-variant/60 active:scale-95 transition-all text-on-surface cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>
                    {t('consentBanner.managePreferences', { defaultValue: 'Manage Preferences' })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl border border-border-default hover:bg-surface-variant/60 active:scale-95 transition-all text-on-surface cursor-pointer flex items-center justify-center"
                >
                  {t('consentBanner.rejectAll', { defaultValue: 'Reject All' })}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('consentBanner.acceptAll', { defaultValue: 'Accept All' })}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Granular Preferences Dialog (Accessible Modal) */}
      {preferencesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmp-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white dark:bg-zinc-900 border border-border-default dark:border-zinc-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-on-surface">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default/60 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="cmp-modal-title" className="text-base font-bold text-on-surface">
                    {t('consentBanner.preferencesTitle', {
                      defaultValue: 'Cookie & Privacy Preferences',
                    })}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    {t('consentBanner.cmpNotice', {
                      defaultValue:
                        'Google-Certified CMP (Cookiebot / Usercentrics, CMP ID 134) • IAB TCF v2.2 Compliant',
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                aria-label={t('consentBanner.close', { defaultValue: 'Close' })}
                className="w-8 h-8 rounded-lg hover:bg-surface-variant/80 text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Granular Toggles */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-on-surface-variant leading-relaxed">
                {t('consentBanner.preferencesSubtitle', {
                  defaultValue:
                    'Manage your consent choices for cookies and technical data processing. Changes take effect immediately across all tools.',
                })}
              </p>

              <div className="divide-y divide-border-default/40 dark:divide-zinc-800 border border-border-default/60 dark:border-zinc-800 rounded-xl overflow-hidden">
                {/* 1. Necessary (Always Active) */}
                <div className="p-4 bg-surface-variant/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">
                        {t('consentBanner.categories.necessaryTitle', {
                          defaultValue: 'Strictly Necessary (Functional)',
                        })}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {t('consentBanner.categories.alwaysActive', {
                          defaultValue: 'Always Active',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      {t('consentBanner.categories.necessaryDesc', {
                        defaultValue:
                          'Essential for core site navigation, security verification, client-side WebAssembly execution, and language preferences. These cannot be disabled.',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    aria-label="Strictly necessary cookies - always active"
                    className="w-4 h-4 mt-1 accent-emerald-500 cursor-not-allowed opacity-80"
                  />
                </div>

                {/* 2. Analytics Storage */}
                <label className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-variant/10 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-on-surface">
                      {t('consentBanner.categories.analyticsTitle', {
                        defaultValue: 'Analytics Storage (analytics_storage)',
                      })}
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      {t('consentBanner.categories.analyticsDesc', {
                        defaultValue:
                          'Enables anonymous usage statistics to help us measure site performance and optimize PDF processing speed.',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsGranted}
                    onChange={(e) => setAnalyticsGranted(e.target.checked)}
                    aria-label="Analytics storage consent"
                    className="w-4 h-4 mt-1 accent-emerald-500 cursor-pointer"
                  />
                </label>

                {/* 3. Advertising Storage */}
                <label className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-variant/10 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-on-surface">
                      {t('consentBanner.categories.adStorageTitle', {
                        defaultValue: 'Advertising Storage (ad_storage)',
                      })}
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      {t('consentBanner.categories.adStorageDesc', {
                        defaultValue:
                          'Allows storage of cookies or device identifiers related to displaying advertisements.',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={adStorageGranted}
                    onChange={(e) => setAdStorageGranted(e.target.checked)}
                    aria-label="Advertising storage consent"
                    className="w-4 h-4 mt-1 accent-emerald-500 cursor-pointer"
                  />
                </label>

                {/* 4. Ad User Data */}
                <label className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-variant/10 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-on-surface">
                      {t('consentBanner.categories.adUserDataTitle', {
                        defaultValue: 'Ad User Data (ad_user_data)',
                      })}
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      {t('consentBanner.categories.adUserDataDesc', {
                        defaultValue:
                          'Permits sending technical device identifiers to Google for advertising measurement.',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={adUserDataGranted}
                    onChange={(e) => setAdUserDataGranted(e.target.checked)}
                    aria-label="Ad user data consent"
                    className="w-4 h-4 mt-1 accent-emerald-500 cursor-pointer"
                  />
                </label>

                {/* 5. Ad Personalization */}
                <label className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-variant/10 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-on-surface">
                      {t('consentBanner.categories.adPersonalizationTitle', {
                        defaultValue: 'Ad Personalization (ad_personalization)',
                      })}
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      {t('consentBanner.categories.adPersonalizationDesc', {
                        defaultValue:
                          'Enables personalized advertising and targeted recommendations based on your preferences.',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={adPersonalizationGranted}
                    onChange={(e) => setAdPersonalizationGranted(e.target.checked)}
                    aria-label="Ad personalization consent"
                    className="w-4 h-4 mt-1 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border-default/60 dark:border-zinc-800 bg-surface-variant/10">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-border-default hover:bg-surface-variant/60 active:scale-95 transition-all text-on-surface cursor-pointer text-center"
                >
                  {t('consentBanner.rejectAll', { defaultValue: 'Reject All' })}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-border-default hover:bg-surface-variant/60 active:scale-95 transition-all text-on-surface cursor-pointer text-center"
                >
                  {t('consentBanner.acceptAll', { defaultValue: 'Accept All' })}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setPreferencesOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-surface-variant/60 text-on-surface-variant active:scale-95 transition-all cursor-pointer"
                >
                  {t('consentBanner.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {t('consentBanner.savePreferences', { defaultValue: 'Save Preferences' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsentManager;
