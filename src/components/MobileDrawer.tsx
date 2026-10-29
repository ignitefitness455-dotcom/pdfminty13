import {
  Sun,
  Moon,
  User,
  X,
  LogOut,
  ShieldCheck,
  CreditCard,
  UserPlus,
  Zap,
  Layers,
  Scissors,
  Lock,
  KeyRound,
  ShieldBan,
  FilePenLine,
  GitCompare,
  Minimize2,
  BookOpen,
  ChevronRight,
  Info,
  Mail,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { useModal } from '../hooks/useModal';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  getLocalizedPath,
} from '../i18n/config';

import LanguageSwitcher from './LanguageSwitcher';

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
  const { t, i18n } = useTranslation('common');
  const rawLang = (i18n.language || DEFAULT_LOCALE).split('-')[0].toLowerCase();
  const activeLocale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLang)
    ? (rawLang as SupportedLocale)
    : DEFAULT_LOCALE;
  const isBn = activeLocale === 'bn';
  const homePath = getLocalizedPath('', activeLocale);
  const mergePath = getLocalizedPath('merge-pdf', activeLocale);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { tier, tasksRemaining, openLimitModal } = useUsageLimit();
  const { modalRef, onKeyDown } = useModal(mobileMenuOpen, () => {
    setMobileMenuOpen(false);
  });

  if (!mobileMenuOpen) return null;

  const quickTools = [
    { name: t('tools.merge-pdf.name', { defaultValue: 'Merge PDF' }), path: mergePath, icon: Layers, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: t('tools.split-pdf.name', { defaultValue: 'Split PDF' }), path: ROUTES.SPLIT, icon: Scissors, color: 'text-sky-500 bg-sky-500/10' },
    { name: t('tools.protect-pdf.name', { defaultValue: 'Protect PDF' }), path: ROUTES.PROTECT, icon: Lock, color: 'text-amber-500 bg-amber-500/10' },
    { name: t('tools.unlock-pdf.name', { defaultValue: 'Unlock PDF' }), path: ROUTES.UNLOCK, icon: KeyRound, color: 'text-teal-500 bg-teal-500/10' },
    { name: t('tools.sanitize-pdf.name', { defaultValue: 'Sanitize & PII' }), path: ROUTES.SANITIZE_PDF, icon: ShieldBan, color: 'text-rose-500 bg-rose-500/10' },
    { name: t('tools.sign-pdf.name', { defaultValue: 'Sign & Stamp' }), path: ROUTES.SIGN_PDF, icon: FilePenLine, color: 'text-indigo-500 bg-indigo-500/10' },
    { name: t('tools.compare-pdf.name', { defaultValue: 'Compare PDF' }), path: ROUTES.COMPARE_PDF, icon: GitCompare, color: 'text-purple-500 bg-purple-500/10' },
    { name: t('tools.compress-pdf.name', { defaultValue: 'Compress PDF' }), path: ROUTES.COMPRESS, icon: Minimize2, color: 'text-emerald-600 bg-emerald-600/10' },
  ];

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col justify-end sm:justify-start sm:pt-16 sm:pb-8 animate-fadein outline-none"
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
      <div className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <Link
            to={homePath}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <img src="/logo.svg" alt="PDFMinty" width="24" height="24" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white font-sans group-hover:text-emerald-500 transition-colors">
                  PDFMinty
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  100% Private
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider block">
                {isBn ? 'ক্লায়েন্ট-সাইড ওয়ার্কস্পেস' : 'In-Browser PDF Suite'}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. ACCOUNT & QUOTA CARD */}
        {user ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-slate-900 dark:text-white block truncate">
                    {user.displayName || 'Member'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                    {user.email || 'Signed In'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                {user.plan === 'pro' ? 'Pro Member' : 'Free Plan'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
              <Link
                to={ROUTES.DASHBOARD}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
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
          <div className="space-y-3">
            {/* Guest Quota Bar */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-emerald-500" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {isBn
                      ? `গেস্ট কোটা: ${tasksRemaining}/৫ টি টাস্ক বাকি`
                      : `Guest Quota: ${tasksRemaining}/5 Tasks Left`}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    {isBn ? 'সর্বোচ্চ ১০০ মেগাবাইট • ১০০% ফ্রি' : 'Max 100 MB per file • Zero server uploads'}
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
                {isBn ? 'দেখুন' : 'View'}
              </button>
            </div>

            {/* Sign In & Sign Up Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={ROUTES.SIGN_IN}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
                id="sidebar-signin-button"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isBn ? 'সাইন ইন' : 'Sign In'}</span>
              </Link>

              <Link
                to={ROUTES.SIGN_UP}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all text-center"
                id="sidebar-signup-button"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isBn ? 'ফ্রি একাউন্ট' : 'Create Account'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* 2. PRO UPGRADE CARD (For Guest / Free users) */}
        {tier !== 'pro' && (
          <Link
            to={ROUTES.PRICING}
            onClick={() => setMobileMenuOpen(false)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 transition-all flex items-center justify-between gap-3 group block"
            id="sidebar-pricing-button"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-slate-900 dark:text-white block group-hover:text-emerald-500 transition-colors">
                    PDFMinty Pro
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                    BDT 299.99/mo
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                  {isBn ? 'আনলিমিটেড টাস্ক, Gemini AI ও ৫০০MB ফাইল' : 'Unlimited tasks, Gemini AI, OCR & 500MB batch'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}

        {/* 3. POPULAR TOOLS (QUICK DIRECTORY) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isBn ? 'জনপ্রিয় PDF টুলস' : 'Popular PDF Tools'}
            </span>
            <Link
              to={homePath}
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('all-tools')?.scrollIntoView({ behavior: 'smooth' });
                }, 120);
              }}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>{isBn ? 'সবগুলো দেখুন' : 'All 23 Tools'}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <Link
                  key={tool.path}
                  to={tool.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    location.pathname === tool.path
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg ${tool.color} flex items-center justify-center shrink-0`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{tool.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. ESSENTIAL PAGES & RESOURCES */}
        <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            {isBn ? 'রিসোর্স ও তথ্য' : 'Resources & Guides'}
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link
              to={ROUTES.BLOG}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{isBn ? 'ব্লগ ও গাইড' : 'Knowledge Hub'}</span>
            </Link>

            <Link
              to={ROUTES.ADOBE_ALTERNATIVE}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Shield className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="truncate">{isBn ? 'অ্যাডোবি অল্টারনেটিভ' : 'vs Adobe Acrobat'}</span>
            </Link>

            <Link
              to={ROUTES.ABOUT_US}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{isBn ? 'আমাদের সম্পর্কে' : 'About Us'}</span>
            </Link>

            <Link
              to={ROUTES.CONTACT}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{isBn ? 'যোগাযোগ' : 'Contact Support'}</span>
            </Link>
          </div>
        </div>

        {/* 5. DISPLAY SETTINGS (APPEARANCE & LANGUAGE) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isBn ? 'থিম / ডার্ক মোড' : 'Appearance'}
            </span>
            <button
              type="button"
              onClick={() => setThemeSetting(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isBn ? 'ভাষা নির্বাচন' : 'Language'}
            </span>
            <LanguageSwitcher variant="mobile" onSelect={() => setMobileMenuOpen(false)} />
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Client-Side Privacy • Zero Server Uploads</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
