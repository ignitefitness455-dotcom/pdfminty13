import { Shield, Key, ExternalLink } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NORD_AFFILIATE_LINKS } from '../../config/constants';

export const RecommendedToolsSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section className="my-20 max-w-6xl mx-auto px-4" id="recommended-tools">
      <div className="text-center space-y-3 mb-10">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 select-none">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>{t('home.recommended.badge', { defaultValue: 'Recommended Security' })}</span>
          <span className="text-slate-300 dark:text-slate-700 font-bold">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            {t('affiliate.sponsored', { defaultValue: 'Affiliate Partner' })}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('home.recommended.title', { defaultValue: 'Recommended Tools' })}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
          {t('home.recommended.subtitle', {
            defaultValue:
              'Trusted privacy and security services to safeguard your sensitive documents and digital identity.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: NordVPN */}
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-8 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('home.recommended.nordVpnTitle', {
                  defaultValue: 'Browse Securely with NordVPN',
                })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.recommended.nordVpnDesc', {
                  defaultValue:
                    'Protect your connection while working with sensitive documents. Military-grade encryption, no logs policy.',
                })}
              </p>
            </div>
          </div>
          <div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDVPN}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <span>{t('home.recommended.nordVpnCta', { defaultValue: 'Get NordVPN' })}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Card 2: NordPass */}
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 p-6 sm:p-8 rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('home.recommended.nordPassTitle', { defaultValue: 'Secure Your Passwords' })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {t('home.recommended.nordPassDesc', {
                  defaultValue:
                    'Manage passwords, passkeys, and credit cards with end-to-end encryption. Never lose track of PDF passwords.',
                })}
              </p>
            </div>
          </div>
          <div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDPASS}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <span>{t('home.recommended.nordPassCta', { defaultValue: 'Get NordPass' })}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
