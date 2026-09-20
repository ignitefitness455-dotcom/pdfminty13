import { Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const CtaSection: React.FC = () => {
  const { t } = useTranslation('common');

  const handleScrollToTools = () => {
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="mt-24 border border-white/50 dark:border-white/10 rounded-[32px] bg-white/40 dark:bg-black/30 backdrop-blur-xl p-10 md:p-14 text-center text-primary relative overflow-hidden z-20 shadow-2xl">
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, var(--custom-security-green) 0%, transparent 70%)' }} aria-hidden="true"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle, var(--custom-primary-fixed-dim) 0%, transparent 70%)' }} aria-hidden="true"></div>
      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight font-sans">
          {t('home.cta.title', { defaultValue: 'Ready to manage your PDFs with total privacy?' })}
        </h2>
        <p className="text-sm md:text-base text-on-surface-variant leading-relaxed font-normal">
          {t('home.cta.subtitle', {
            defaultValue:
              'Select any tool above to process your documents privately on your device. Fast performance, no subscriptions, and privacy-first client-side processing.',
          })}
        </p>
        <div className="pt-4">
          <button
            onClick={handleScrollToTools}
            className="px-8 py-3.5 rounded-xl bg-security-green hover:bg-primary-fixed-dim text-[#131313] font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-security-green/10 active:scale-95 cursor-pointer max-w-xs inline-flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-[#131111] text-[#131111]" aria-hidden="true" />
            <span>{t('home.cta.button', { defaultValue: 'Explore All Tools' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
