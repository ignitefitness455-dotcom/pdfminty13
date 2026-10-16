import {
  Sun,
  Moon,
  User,
  Sparkles,
  Home,
  Wrench,
  X,
  LogOut,
  ShieldCheck,
  CreditCard,
  UserPlus,
  Zap,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { useModal } from '../hooks/useModal';

import LanguageSwitcher from './LanguageSwitcher';
import { PWAInstallButton } from './PWAInstallButton';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

interface MobileDrawerProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setThemeSetting: (theme: 'light' | 'dark') => void;
  menuItems?: MenuItem[];
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  theme,
  setThemeSetting,
}) => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { user, logout } = useAuth();
  const { tier, tasksRemaining, openLimitModal } = useUsageLimit();
  const { modalRef, onKeyDown } = useModal(mobileMenuOpen, () => {
    setMobileMenuOpen(false);
  });

  if (!mobileMenuOpen) return null;

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col justify-end sm:justify-start sm:pt-20 animate-fadein outline-none"
      id="mobile_drawer"
    >
      {/* Click outside backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent border-0"
        onClick={() => setMobileMenuOpen(false)}
        aria-label="Close menu backdrop"
      />

      {/* Main Drawer Container */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <img src="/logo.svg" alt="PDFMinty" width="24" height="24" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block font-sans">
                PDFMinty
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Menu & Access
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DAILY USAGE & QUOTA CARD */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-emerald-500" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {tier === 'pro'
                  ? t('usageLimits.mobile.proTitle', { defaultValue: 'PRO Plan (Unlimited)' })
                  : tier === 'free'
                    ? t('usageLimits.mobile.freeTitle', { count: tasksRemaining, defaultValue: `Free: ${tasksRemaining}/10 Tasks Left` })
                    : t('usageLimits.mobile.guestTitle', { count: tasksRemaining, defaultValue: `Guest: ${tasksRemaining}/5 Tasks Left` })}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {tier === 'pro'
                  ? t('usageLimits.mobile.proLimit', { defaultValue: 'Max 500 MB per file' })
                  : tier === 'free'
                    ? t('usageLimits.mobile.freeLimit', { defaultValue: 'Max 150 MB per file' })
                    : t('usageLimits.mobile.guestLimit', { defaultValue: 'Max 100 MB per file' })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openLimitModal({ reason: 'task_limit' });
            }}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {t('usageLimits.mobile.view', { defaultValue: 'View' })}
          </button>
        </div>

        {/* PWA 100% Offline App Install Button */}
        <PWAInstallButton
          variant="mobile"
          onInstalled={() => setMobileMenuOpen(false)}
        />

        {/* PRIMARY ACTION BUTTONS: SIGN IN & SIGN UP */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Account & Access
          </p>
          {user ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block truncate max-w-[170px]">
                      {user.displayName || 'Member'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block truncate max-w-[170px]">
                      {user.email || 'Signed In'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  {user.plan === 'pro' ? 'Pro Member' : 'Free Plan'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                <Link
                  to={ROUTES.DASHBOARD}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition-colors shadow-sm"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Sign In Primary Button */}
              <Link
                to={ROUTES.SIGN_IN}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                id="sidebar-signin-button"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>

              {/* Sign Up / Register Button */}
              <Link
                to={ROUTES.SIGN_UP}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                id="sidebar-signup-button"
              >
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>

        {/* PRICING BUTTON & PAGE LINK */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Subscription & Upgrades
          </p>
          <Link
            to={ROUTES.PRICING}
            onClick={() => setMobileMenuOpen(false)}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-teal-500/20 border-2 border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col gap-2 group block"
            id="sidebar-pricing-button"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-sm text-slate-900 dark:text-white block group-hover:text-emerald-500 transition-colors">
                    Pricing Plans & Pro
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                    Affordable plans for power workflows
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                $2.49/mo
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold pt-1 border-t border-emerald-500/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>500MB Batch Processing &bull; Gemini AI &bull; OCR Text</span>
            </div>
          </Link>
        </div>

        {/* ESSENTIAL NAVIGATION BUTTONS */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={ROUTES.HOME}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-colors ${
                location.pathname === ROUTES.HOME
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-500" />
              <span>Home</span>
            </Link>

            <Link
              to={ROUTES.HOME}
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('all-tools')?.scrollIntoView({ behavior: 'smooth' });
                }, 120);
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              <Wrench className="w-4 h-4 text-emerald-500" />
              <span>All 23 Tools</span>
            </Link>
          </div>
        </div>

        {/* DISPLAY SETTINGS & THEME BUTTON */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Appearance
            </span>
            <button
              type="button"
              onClick={() => setThemeSetting(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Language</span>
            <LanguageSwitcher variant="mobile" onSelect={() => setMobileMenuOpen(false)} />
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Client-Side Privacy & Bull Offline Capable</span>
          </div>
        </div>
      </div>
    </div>
  );
};
