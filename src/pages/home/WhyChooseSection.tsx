import { Shield, UserX, Gift, Layers, WifiOff, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TOOLS } from '../../config/seo-data';

export const WhyChooseSection: React.FC = () => {
  const { t } = useTranslation('common');
  const toolsCount = TOOLS.filter((t) => t.type === 'tool').length;

  return (
    <div className="my-24 relative z-20 -mx-4 px-6 py-20 bg-white/30 dark:bg-black/20 backdrop-blur-xl border-y border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[40px]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-black text-primary text-center tracking-tight mb-2">
          {t('home.whyChoose.title', { defaultValue: 'Why Choose PDFMinty?' })}
        </h2>
        <p className="text-on-surface-variant text-sm sm:text-base text-center mb-16 max-w-md mx-auto font-normal">
          {t('home.whyChoose.subtitle', {
            defaultValue: 'Professional-grade document tools with zero security compromises.',
          })}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            id="why-card-privacy"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <Shield className="w-6 h-6 text-security-green fill-security-green/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.privacyTitle', { defaultValue: 'Privacy First' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.privacyDesc', {
                defaultValue:
                  'Your standard documents stay on your device. Local PDF operations run in browser memory for privacy-first handling.',
              })}
            </p>
          </div>

          <div
            id="why-card-account"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <UserX className="w-6 h-6 text-critical-red fill-critical-red/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.noAccountTitle', { defaultValue: 'No Account Required' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.noAccountDesc', {
                defaultValue:
                  'Skip signups and passwords. Access fast, direct tools instantly without creating an account or leaving personal data.',
              })}
            </p>
          </div>

          <div
            id="why-card-free"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <Gift className="w-6 h-6 text-warning-amber fill-warning-amber/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.freeTitle', { defaultValue: 'Completely Free' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.freeDesc', {
                defaultValue:
                  'Enjoy file editing and organizing with no paywalls, subscriptions, artificial limits, or watermarks.',
              })}
            </p>
          </div>

          <div
            id="why-card-tools"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <Layers className="w-6 h-6 text-primary-fixed fill-primary-fixed/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.toolsCountTitle', { defaultValue: `${toolsCount} Tools` })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.toolsCountDesc', {
                defaultValue:
                  'From merging and splitting to encryption, OCR, and compression — complete every PDF workflow right here.',
              })}
            </p>
          </div>

          <div
            id="why-card-offline"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <WifiOff className="w-6 h-6 text-[#00FFC2] fill-[#00FFC2]/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.offlineTitle', { defaultValue: 'Works Offline' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.offlineDesc', {
                defaultValue:
                  'Once loaded, core tools process your PDF files locally on your computer even without an active internet connection.',
              })}
            </p>
          </div>

          <div
            id="why-card-speed"
            className="bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/50 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-lg shadow-black/5 text-center flex flex-col items-center hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center mb-5 shadow-inner">
              <Zap className="w-6 h-6 text-tertiary-fixed-dim fill-tertiary-fixed-dim/10" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2.5">
              {t('home.whyChoose.fastTitle', { defaultValue: 'Instant Processing' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed font-normal">
              {t('home.whyChoose.fastDesc', {
                defaultValue:
                  'No waiting for uploads or cloud queues. Your device processor handles files immediately with zero transfer lag.',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
