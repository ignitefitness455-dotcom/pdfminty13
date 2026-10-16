import { Download, X, Sparkles, Share, PlusSquare, Laptop, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISS_KEY = 'pdfminty_pwa_top_banner_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const PWAInstallTopBanner: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const isBn = i18n.language === 'bn';
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [dismissed, setDismissed] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // If running in standalone PWA, never show banner
    if (isInstalled) {
      setDismissed(true);
      return;
    }

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timePassed = Date.now() - parseInt(dismissedAt, 10);
        if (timePassed < SEVEN_DAYS_MS) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setDismissed(true), 2500);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <>
      <aside
        aria-label="App installation banner"
        className="relative z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-900 border-b border-emerald-500/30 text-white shadow-md transition-all duration-300 animate-in slide-in-from-top-2"
        id="pwa-top-install-banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 text-xs">
          {/* Left badge & message */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
              <span className="font-extrabold tracking-tight text-white flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                {isBn ? 'PDFMinty অ্যাপ ইনস্টল করুন' : 'Install PDFMinty App'}
              </span>
              <span className="hidden md:inline-block text-white/70">•</span>
              <span className="text-emerald-50 dark:text-emerald-200/90 truncate font-medium">
                {isBn
                  ? 'ইন্টারনেট ছাড়াই ১০০% অফলাইনে ও দ্রুততম গতিতে সমস্ত PDF টুল সরাসরি আপনার ডিভাইসে ব্যবহার করুন।'
                  : 'Access all 23 PDF tools 100% offline with instant load speeds directly on your device.'}
              </span>
            </div>
          </div>

          {/* Right action button & close button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              {installSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'ইনস্টল সম্পন্ন!' : 'Installed!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isBn ? 'ইনস্টল করুন' : 'Install App'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              title="Dismiss"
              className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Guide Modal for iOS Safari / Unsupported Browsers */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadein"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-white space-y-4">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {isIOS ? <Share className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black">
                  {isIOS
                    ? t('pwa.iosModalTitle', { defaultValue: 'Install on iPhone & iPad' })
                    : t('pwa.desktopModalTitle', { defaultValue: 'Install PDFMinty App' })}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('pwa.offlineBenefit', {
                    defaultValue: 'Access all PDF tools 100% offline without network.',
                  })}
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold block">Tap the Share Button</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      In Apple Safari, tap the{' '}
                      <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Share icon at
                      the bottom or top toolbar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold block">Select &quot;Add to Home Screen&quot;</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Scroll down and tap{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-500" />{' '}
                      <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  To install PDFMinty on your desktop browser, click the install icon in your address
                  bar (or browser menu &gt; <strong>Install PDFMinty</strong>).
                </p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Runs 100% offline with zero server data storage!
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {isBn ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallTopBanner;
