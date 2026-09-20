import { Shield, Key, ExternalLink } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NORD_AFFILIATE_LINKS } from '../../config/constants';

export const RecommendedToolsSection: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section className="my-16 max-w-6xl mx-auto px-4" id="recommended-tools">
      <div className="text-center space-y-2 mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          {t('home.recommended.badge', { defaultValue: 'Recommended Security' })}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
          {t('home.recommended.title', { defaultValue: 'Recommended Tools' })}
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto font-medium">
          {t('home.recommended.subtitle', {
            defaultValue: 'Trusted privacy and security services to safeguard your sensitive documents and digital identity.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: NordVPN */}
        <div className="bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 hover:border-emerald-500/40 p-6 sm:p-8 rounded-[24px] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('home.recommended.nordVpnTitle', { defaultValue: 'Browse Securely with NordVPN' })}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t('home.recommended.nordVpnDesc', {
                  defaultValue: 'Protect your connection while working with sensitive documents. Military-grade encryption, no logs policy.',
                })}
              </p>
            </div>
          </div>
          <div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDVPN}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <span>{t('home.recommended.nordVpnCta', { defaultValue: 'Get NordVPN' })}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Card 2: NordPass */}
        <div className="bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 hover:border-emerald-500/40 p-6 sm:p-8 rounded-[24px] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('home.recommended.nordPassTitle', { defaultValue: 'Secure Your Passwords' })}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t('home.recommended.nordPassDesc', {
                  defaultValue: 'Manage passwords, passkeys, and credit cards with end-to-end encryption. Never lose track of PDF passwords.',
                })}
              </p>
            </div>
          </div>
          <div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDPASS}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <span>{t('home.recommended.nordPassCta', { defaultValue: 'Get NordPass' })}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
