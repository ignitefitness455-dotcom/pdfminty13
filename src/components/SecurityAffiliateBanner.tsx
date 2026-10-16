import { Shield, Key, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NORD_AFFILIATE_LINKS } from '../config/constants';

export interface SecurityAffiliateBannerProps {
  variant?: 'vpn' | 'pass' | 'dual' | 'compact' | 'editorial';
  className?: string;
  contextTitle?: string;
  contextDesc?: string;
}

export const SecurityAffiliateBanner: React.FC<SecurityAffiliateBannerProps> = ({
  variant = 'compact',
  className = '',
  contextTitle,
  contextDesc,
}) => {
  const { t } = useTranslation('common');

  if (variant === 'compact') {
    return (
      <div
        className={`p-4 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs transition-colors ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {contextTitle || t('home.recommended.nordVpnTitle', { defaultValue: 'Browse Securely with NordVPN' })}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                {t('affiliate.label', { defaultValue: 'Sponsored' })}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
              {contextDesc || t('home.recommended.nordVpnDesc', {
                defaultValue: 'Protect your connection while working with sensitive documents. Military-grade encryption, no logs policy.',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href={NORD_AFFILIATE_LINKS.NORDVPN}
            target="_blank"
            rel="nofollow sponsored noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <span>{t('home.recommended.nordVpnCta', { defaultValue: 'Get NordVPN' })}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'pass') {
    return (
      <div
        className={`p-4 sm:p-5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs transition-colors ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {contextTitle || t('home.recommended.nordPassTitle', { defaultValue: 'Secure Your Passwords with NordPass' })}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                {t('affiliate.label', { defaultValue: 'Sponsored' })}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
              {contextDesc || t('home.recommended.nordPassDesc', {
                defaultValue: 'Manage passwords, passkeys, and credit cards with end-to-end encryption. Never lose track of PDF passwords.',
              })}
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <a
            href={NORD_AFFILIATE_LINKS.NORDPASS}
            target="_blank"
            rel="nofollow sponsored noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <span>{t('home.recommended.nordPassCta', { defaultValue: 'Get NordPass' })}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'vpn') {
    return (
      <div
        className={`p-4 sm:p-5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs transition-colors ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {contextTitle || t('home.recommended.nordVpnTitle', { defaultValue: 'Browse Securely with NordVPN' })}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                {t('affiliate.label', { defaultValue: 'Sponsored' })}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
              {contextDesc || t('home.recommended.nordVpnDesc', {
                defaultValue: 'Protect your connection while working with sensitive documents. Military-grade encryption, no logs policy.',
              })}
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <a
            href={NORD_AFFILIATE_LINKS.NORDVPN}
            target="_blank"
            rel="nofollow sponsored noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <span>{t('home.recommended.nordVpnCta', { defaultValue: 'Get NordVPN' })}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'editorial') {
    return (
      <div
        className={`bg-surface-container-low dark:bg-slate-900/60 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">
                {contextTitle || 'Beyond Browser Security: Total Network Encryption'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Recommended by cybersecurity professionals for confidential file sharing
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 self-start sm:self-auto rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Affiliate Partner
          </span>
        </div>

        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
          {contextDesc ||
            'While PDFMinty handles your PDFs completely inside your browser RAM, your internet connection itself can be vulnerable on public Wi-Fi or untrusted networks. NordVPN encrypts all outbound network traffic with next-generation cryptography.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface border border-border-muted space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>NordVPN</span>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Next-generation ChaCha20 encryption</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Threat Protection (blocks malicious links & ads)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Strict audited no-logs policy</span>
                </li>
              </ul>
            </div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDVPN}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span>Get NordVPN Protection</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border-muted space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>NordPass</span>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero-knowledge XChaCha20 password vault</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Secure storage for encrypted PDF passwords</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cross-platform sync & breach scanner</span>
                </li>
              </ul>
            </div>
            <a
              href={NORD_AFFILIATE_LINKS.NORDPASS}
              target="_blank"
              rel="nofollow sponsored noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span>Get NordPass Password Vault</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dual card
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      <div className="p-5 bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 hover:border-emerald-500/40 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            {t('home.recommended.nordVpnTitle', { defaultValue: 'Browse Securely with NordVPN' })}
          </h4>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
            {t('home.recommended.nordVpnDesc', {
              defaultValue: 'Protect your connection while working with sensitive documents. Military-grade encryption, no logs policy.',
            })}
          </p>
        </div>
        <a
          href={NORD_AFFILIATE_LINKS.NORDVPN}
          target="_blank"
          rel="nofollow sponsored noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <span>{t('home.recommended.nordVpnCta', { defaultValue: 'Get NordVPN' })}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-5 bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 hover:border-emerald-500/40 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            {t('home.recommended.nordPassTitle', { defaultValue: 'Secure Your Passwords' })}
          </h4>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
            {t('home.recommended.nordPassDesc', {
              defaultValue: 'Manage passwords, passkeys, and credit cards with end-to-end encryption. Never lose track of PDF passwords.',
            })}
          </p>
        </div>
        <a
          href={NORD_AFFILIATE_LINKS.NORDPASS}
          target="_blank"
          rel="nofollow sponsored noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          <span>{t('home.recommended.nordPassCta', { defaultValue: 'Get NordPass' })}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default SecurityAffiliateBanner;
