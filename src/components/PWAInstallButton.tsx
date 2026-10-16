import { Download, Share, PlusSquare, X, Check, Laptop } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'mobile' | 'hero' | 'compact';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  onInstalled,
}) => {
  const { t } = useTranslation('common');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and launched as standalone app, suppress the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        onInstalled?.();
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In browsers where beforeinstallprompt hasn't fired yet or inside desktop Chrome/Edge without prompt
      setShowIOSModal(true);
    }
  };

  const buttonText = installSuccess
    ? t('pwa.installed', { defaultValue: 'Installed!' })
    : t('pwa.installApp', { defaultValue: 'Install App' });

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:scale-105 active:scale-95 ${className}`}
          title={t('pwa.installTooltip', {
            defaultValue: 'Install PDFMinty as a desktop/mobile app for 100% offline access',
          })}
          aria-label={buttonText}
        >
          {installSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{buttonText}</span>
          <span className="hidden xl:inline-block px-1.5 py-0.2 rounded-md bg-emerald-600/15 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Offline
          </span>
        </button>
      )}

      {variant === 'mobile' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-slate-800 dark:text-white transition-all hover:bg-emerald-500/20 cursor-pointer shadow-xs ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black block">
                {t('pwa.installMobileTitle', { defaultValue: 'Install PDFMinty App' })}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                {t('pwa.installMobileSubtitle', { defaultValue: 'Work 100% offline without internet' })}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
            {installSuccess ? 'Done' : 'Install'}
          </span>
        </button>
      )}

      {variant === 'hero' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:scale-105 active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>{t('pwa.installApp', { defaultValue: 'Install Offline App' })}</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-muted text-on-surface transition-all cursor-pointer hover:scale-105 active:scale-95 ${className}`}
          title={t('pwa.installApp', { defaultValue: 'Install App' })}
          aria-label={t('pwa.installApp', { defaultValue: 'Install App' })}
        >
          <Download className="w-4 h-4 text-emerald-500" />
        </button>
      )}

      {/* Interactive Install Guide Modal for iOS Safari / Unsupported Browsers */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-white space-y-4">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                      In Apple Safari browser, tap the{' '}
                      <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Share icon at the
                      bottom or top toolbar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold block">Select "Add to Home Screen"</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Scroll down the options list and select{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-500" />{' '}
                      <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="leading-relaxed">
                    To install in Google Chrome, Microsoft Edge, or Brave:
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li>
                      Click the <strong>Install App</strong> icon in the address bar (right side).
                    </li>
                    <li>
                      Or open browser menu (⋮) → select <strong>Install PDFMinty...</strong>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              {t('common.gotIt', { defaultValue: 'Got it' })}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
