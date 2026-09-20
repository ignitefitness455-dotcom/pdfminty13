import { Award, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const TrustBadgeSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section
      id="featured-community-section"
      aria-labelledby="featured-badge-title"
      className="mt-16 mb-6 max-w-4xl mx-auto px-4"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/30 backdrop-blur-xl p-8 sm:p-10 text-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* Subtle decorative background glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 pointer-events-none opacity-20 dark:opacity-10 blur-3xl -z-10 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--custom-security-green, #10b981) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-4">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('home.trustBadge.eyebrow', { defaultValue: 'Community Verified' })}</span>
          </div>

          {/* Title */}
          <h3 id="featured-badge-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('home.trustBadge.title', { defaultValue: 'Recognized & Featured Across Leading Platforms' })}
          </h3>

          {/* Trust Subtext */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t('home.trustBadge.description', {
              defaultValue:
                'PdfMinty is recognized on top product directories as a trusted privacy-first, client-side PDF utility. Your documents are processed entirely in your browser and never touch a remote server.',
            })}
          </p>

          {/* Featured Badges Grid/Flex */}
          <div className="pt-4 pb-2 flex flex-wrap justify-center items-center gap-5 sm:gap-8">
            {/* LaunchBuff Featured Badge */}
            <a
              id="launchbuff-featured-link"
              href="https://launchbuff.com/products/pdfminty-8g15b8"
              target="_blank"
              rel="noopener noreferrer"
              title={t('home.trustBadge.launchbuffTitle', { defaultValue: 'Featured on LaunchBuff' })}
              className="group inline-block transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-2xl"
            >
              <img
                src="https://launchbuff.com/badge-featured-dark.svg"
                alt="Featured on LaunchBuff"
                width="256"
                height="80"
                className="h-14 sm:h-16 w-auto object-contain rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                loading="lazy"
              />
            </a>

            {/* Launchstag Featured Badge (User Requested Code) */}
            <a
              id="launchstag-featured-link"
              href="https://launchstag.com/p/pdfminty"
              target="_blank"
              rel="noopener noreferrer"
              title={t('home.trustBadge.launchstagTitle', { defaultValue: 'Featured on Launchstag' })}
              className="group inline-block transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-2xl"
            >
              <img
                src="https://launchstag.com/badge-light.svg"
                alt="Featured on Launchstag"
                width="198"
                height="62"
                className="h-14 sm:h-16 w-auto object-contain rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300 dark:hidden"
                loading="lazy"
              />
              <img
                src="https://launchstag.com/badge-dark.svg"
                alt="Featured on Launchstag"
                width="198"
                height="62"
                className="h-14 sm:h-16 w-auto object-contain rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300 hidden dark:inline-block"
                loading="lazy"
              />
            </a>
          </div>

          {/* Trust Reassurance Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{t('home.trustBadge.privacyBadge', { defaultValue: '100% In-Browser Privacy' })}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{t('home.trustBadge.verifiedBadge', { defaultValue: 'Verified Directory Listings' })}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{t('home.trustBadge.loggingBadge', { defaultValue: 'Zero Data Logging' })}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
