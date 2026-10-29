import { Shield, UserX, Gift, Layers, WifiOff, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TOOLS_CATALOG as TOOLS } from '../../config/seo-catalog';

export const WhyChooseSection: React.FC = () => {
  const { t } = useTranslation('common');
  const toolsCount = TOOLS.filter((t) => t.type === 'tool').length;

  return (
    <div className="my-20 relative z-20 max-w-6xl mx-auto px-4">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          {t('home.whyChoose.title', { defaultValue: 'Why Choose PDFMinty?' })}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto font-normal leading-relaxed">
          {t('home.whyChoose.subtitle', {
            defaultValue: 'Professional-grade document tools with zero security compromises.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        <div
          id="why-card-privacy"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-5 shrink-0">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.privacyTitle', { defaultValue: 'Privacy First' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.whyChoose.privacyDesc', {
                defaultValue:
                  'Your standard documents stay on your device. Local PDF operations run in browser memory for privacy-first handling.',
              })}
            </p>
          </div>
        </div>

        <div
          id="why-card-account"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-slate-500/10 dark:bg-slate-500/15 border border-slate-500/20 flex items-center justify-center mb-5 shrink-0">
              <UserX className="w-5 h-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.noAccountTitle', { defaultValue: 'No Account Required' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.whyChoose.noAccountDesc', {
                defaultValue:
                  'Skip signups and passwords. Access fast, direct tools instantly without creating an account or leaving personal data.',
              })}
            </p>
          </div>
        </div>

        <div
          id="why-card-free"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 shrink-0">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.freeTitle', { defaultValue: 'Completely Free' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.whyChoose.freeDesc', {
                defaultValue:
                  'Enjoy file editing and organizing with no paywalls, subscriptions, artificial limits, or watermarks.',
              })}
            </p>
          </div>
        </div>

        <div
          id="why-card-tools"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 flex items-center justify-center mb-5 shrink-0">
              <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.toolsCountTitle', { defaultValue: `${toolsCount} Tools` })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.whyChoose.toolsCountDesc', {
                defaultValue:
                  'From merging and splitting to encryption, OCR, and document signing — complete every PDF workflow right here.',
              })}
            </p>
          </div>
        </div>

        <div
          id="why-card-offline"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center mb-5 shrink-0">
              <WifiOff className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.offlineTitle', { defaultValue: 'Works Offline' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.whyChoose.offlineDesc', {
                defaultValue:
                  'Once loaded, core tools process your PDF files locally on your computer even without an active internet connection.',
              })}
            </p>
          </div>
        </div>

        <div
          id="why-card-speed"
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 text-left flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-5 shrink-0">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.whyChoose.fastTitle', { defaultValue: 'Instant Processing' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
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
