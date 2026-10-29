import { Merge } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Visual Workspace Feature Section */}
      <div className="mt-20 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md relative overflow-hidden z-20 shadow-xs flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{t('home.howItWorks.badge', { defaultValue: '100% In-Browser Privacy' })}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('home.howItWorks.title', { defaultValue: 'Fast, Private Document Processing' })}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {t('home.howItWorks.desc', {
              defaultValue:
                'PDFMinty processes your documents directly on your computer or phone. Because your files stay on your device, processing happens instantly with no upload delays, file size limits, or cloud storage risks. Process confidential contracts, tax forms, and financial records with guaranteed zero data leakage.',
            })}
          </p>
        </div>
        <div className="w-full md:w-80 shrink-0 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-950/60 p-4">
          <div className="w-full h-44 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 flex flex-col gap-3 border border-slate-200/60 dark:border-slate-800/60 select-none">
            {/* Workspace header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-[11px] text-slate-500 font-mono ml-2">
                  document.pdf
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {t('home.howItWorks.offlineBadge', { defaultValue: '100% Offline' })}
              </span>
            </div>
            {/* Workspace body / dropzone representation */}
            <div className="flex-1 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-slate-800/30">
              <Merge
                className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1"
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('home.howItWorks.dragDrop', { defaultValue: 'Drag & Drop PDF here' })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {t('home.howItWorks.orBrowse', { defaultValue: 'or click to browse locally' })}
              </span>
            </div>
            {/* Mini active items list */}
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="flex-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium max-w-[120px] truncate">
                  contract_draft.pdf
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1.2 MB</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0 transition-colors">
                →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-20 relative z-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight mb-3 font-sans">
          {t('home.howItWorks.stepsHeading', { defaultValue: 'How It Works in 3 Simple Steps' })}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base text-center mb-12 sm:mb-16 max-w-md mx-auto font-normal leading-relaxed">
          {t('home.howItWorks.stepsSubtitle', {
            defaultValue: 'Three simple steps to process your files directly inside your browser.',
          })}
        </p>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div
            id="step-1-card"
            className="flex flex-col p-6 sm:p-7 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm mb-4 font-mono">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.howItWorks.step1Title', { defaultValue: 'Pick a Tool' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.howItWorks.step1Desc', {
                defaultValue:
                  'Choose from 24 PDF tools above to merge, split, compress, sign, or protect your document.',
              })}
            </p>
          </div>
          <div
            id="step-2-card"
            className="flex flex-col p-6 sm:p-7 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm mb-4 font-mono">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.howItWorks.step2Title', { defaultValue: 'Add Your Files' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.howItWorks.step2Desc', {
                defaultValue:
                  'Drag and drop your PDF files into the browser window. Standard tools keep your files in local memory.',
              })}
            </p>
          </div>
          <div
            id="step-3-card"
            className="flex flex-col p-6 sm:p-7 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm mb-4 font-mono">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('home.howItWorks.step3Title', { defaultValue: 'Save Your Result' })}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
              {t('home.howItWorks.step3Desc', {
                defaultValue:
                  'Your browser finishes the job in seconds. Click download to save your updated PDF right away.',
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
