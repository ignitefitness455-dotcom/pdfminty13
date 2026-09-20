import { Merge } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Visual Workspace Feature Section */}
      <div className="mt-24 border border-white/50 dark:border-white/10 rounded-[32px] p-8 md:p-12 bg-white/40 dark:bg-black/30 backdrop-blur-xl relative overflow-hidden z-20 shadow-2xl flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[10px] bg-security-green/10 text-security-green border border-security-green/20 px-3.5 py-1.5 rounded-full font-black tracking-widest uppercase animate-pulse">
            {t('home.howItWorks.badge', { defaultValue: '100% In-Browser Privacy' })}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight leading-tight">
            {t('home.howItWorks.title', { defaultValue: 'Fast, Private Document Processing' })}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed font-normal">
            {t('home.howItWorks.desc', {
              defaultValue:
                'PDFMinty processes your documents directly on your computer or phone. Because your files stay on your device, processing happens instantly with no upload delays, file size limits, or cloud storage risks. Process confidential contracts, tax forms, and financial records with guaranteed zero data leakage.',
            })}
          </p>
        </div>
        <div className="w-full md:w-80 shrink-0 border border-white/50 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white/50 dark:bg-black/40 backdrop-blur-md p-5">
          <div className="w-full h-44 bg-white/60 dark:bg-black/50 rounded-xl p-3.5 flex flex-col gap-3 border border-white/40 dark:border-white/10 shadow-inner relative overflow-hidden select-none">
            {/* Workspace header */}
            <div className="flex items-center justify-between border-b border-border-muted pb-1.5 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-critical-red"></div>
                <div className="w-2 h-2 rounded-full bg-warning-amber"></div>
                <div className="w-2 h-2 rounded-full bg-security-green"></div>
                <span className="text-[10px] text-on-surface-variant font-mono ml-2">
                  document.pdf
                </span>
              </div>
              <div className="px-2 py-0.5 rounded bg-security-green/10 text-security-green text-[9px] font-black uppercase">
                {t('home.howItWorks.offlineBadge', { defaultValue: '100% Offline' })}
              </div>
            </div>
            {/* Workspace body / dropzone representation */}
            <div className="flex-1 border border-dashed border-border-muted rounded-lg flex flex-col items-center justify-center p-2 text-center bg-surface-container-low/10">
              <Merge className="w-5 h-5 text-security-green mb-1 animate-bounce" aria-hidden="true" />
              <span className="text-xs font-bold text-primary">
                {t('home.howItWorks.dragDrop', { defaultValue: 'Drag & Drop PDF here' })}
              </span>
              <span className="text-[10px] text-on-surface-variant/70 mt-0.5">
                {t('home.howItWorks.orBrowse', { defaultValue: 'or click to browse locally' })}
              </span>
            </div>
            {/* Mini active items list */}
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="flex-1 bg-surface-container-lowest p-2 rounded-md border border-border-muted flex items-center justify-between shadow-sm">
                <span className="text-[10px] text-on-surface-variant font-bold max-w-[120px] truncate">
                  contract_draft.pdf
                </span>
                <span className="text-[9px] text-on-surface-variant/60 font-mono">1.2 MB</span>
              </div>
              <div className="w-6 h-6 rounded-md bg-security-green flex items-center justify-center text-background font-bold text-xs shadow-sm shrink-0 hover:bg-primary-fixed-dim transition-colors cursor-pointer">
                →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-24 relative z-20">
        <h2 className="text-2xl md:text-4xl font-black text-primary text-center tracking-tight mb-2 font-sans">
          {t('home.howItWorks.stepsHeading', { defaultValue: 'How It Works in 3 Simple Steps' })}
        </h2>
        <p className="text-on-surface-variant text-sm sm:text-base text-center mb-16 max-w-md mx-auto font-normal">
          {t('home.howItWorks.step1Desc', {
            defaultValue: 'Three simple steps to process your files entirely inside your browser.',
          })}
        </p>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {/* Timeline Connector Line */}
          <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-security-green/5 via-security-green/20 to-security-green/5 -z-10" />

          <div
            id="step-1-card"
            className="flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-border-muted shadow-lg hover:border-security-green transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-security-green border border-border-muted flex items-center justify-center font-bold text-lg mb-4 shadow-md z-10 font-mono">
              1
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2">
              {t('home.howItWorks.step1Title', { defaultValue: 'Select Tool' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs font-normal">
              {t('home.howItWorks.step1Desc', {
                defaultValue: 'Choose from 22+ dedicated PDF tools above for merging, splitting, editing, or securing your files.',
              })}
            </p>
          </div>
          <div
            id="step-2-card"
            className="flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-border-muted shadow-lg hover:border-security-green transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-security-green border border-border-muted flex items-center justify-center font-bold text-lg mb-4 shadow-md z-10 font-mono">
              2
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2">
              {t('home.howItWorks.step2Title', { defaultValue: 'Add Files' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs font-normal">
              {t('home.howItWorks.step2Desc', {
                defaultValue: 'Drag and drop your PDF files directly into your browser window. Everything stays local in memory.',
              })}
            </p>
          </div>
          <div
            id="step-3-card"
            className="flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-border-muted shadow-lg hover:border-security-green transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-security-green border border-border-muted flex items-center justify-center font-bold text-lg mb-4 shadow-md z-10 font-mono">
              3
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mb-2">
              {t('home.howItWorks.step3Title', { defaultValue: 'Download' })}
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs font-normal">
              {t('home.howItWorks.step3Desc', {
                defaultValue: 'Your PDF is processed instantly on your hardware. Click download to save the result immediately.',
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
