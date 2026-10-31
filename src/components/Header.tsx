import { Moon, Sun, ShieldCheck, Menu, X, User, LogOut, Zap, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { prefetchToolChunk } from '../config/homeConfig';
import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  getLocalizedPath,
} from '../i18n/config';

import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(
  ({ mobileMenuOpen = false, setMobileMenuOpen }) => {
    const { t, i18n } = useTranslation('common');
    const { isDark, toggleTheme } = useTheme();
    const { user, isPro, upgradeToPro, logout } = useAuth();
    const { tier, tasksRemaining, openLimitModal } = useUsageLimit();
    const [logoLoaded, setLogoLoaded] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const rawLang = (i18n.language || DEFAULT_LOCALE).split('-')[0].toLowerCase();
    const activeLocale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLang)
      ? (rawLang as SupportedLocale)
      : DEFAULT_LOCALE;
    const homePath = getLocalizedPath('', activeLocale);

    const handleUpgradeClick = async () => {
      if (isUpgrading) return;
      setIsUpgrading(true);
      try {
        await upgradeToPro();
      } catch (err) {
        console.warn('[Checkout] Upgrade flow cancelled or failed:', err);
      } finally {
        setIsUpgrading(false);
      }
    };

    return (
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark & Monogram */}
          <Link
            to={homePath}
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 -ml-1 transition-all"
            id="header-logo-link"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden shrink-0">
              {logoLoaded ? (
                <img
                  src="/logo.svg"
                  alt="PdfMinty Logo"
                  width="36"
                  height="36"
                  className="w-full h-full object-contain p-0.5"
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                  PM
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('header.siteName', { defaultValue: 'PdfMinty' })}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase -mt-0.5 hidden sm:inline-block">
                {t('header.tagline', { defaultValue: 'Privacy-First PDF Tools' })}
              </span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links (Single-Line, Zero-Pill) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
            <Link
              to={homePath}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.home', { defaultValue: 'Home' })}
            </Link>
            <Link
              to={`${homePath}#all-tools`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.tools', { defaultValue: 'Tools' })}
            </Link>
            <Link
              to={ROUTES.PRICING}
              onMouseEnter={() => prefetchToolChunk('pricing')}
              onPointerDown={() => prefetchToolChunk('pricing')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.pricing', { defaultValue: 'Pricing' })}
            </Link>
            <Link
              to={ROUTES.BLOG}
              onMouseEnter={() => prefetchToolChunk('blog')}
              onPointerDown={() => prefetchToolChunk('blog')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.blog', { defaultValue: 'Knowledge Hub' })}
            </Link>
            <Link
              to={ROUTES.ABOUT_US}
              onMouseEnter={() => prefetchToolChunk('about-us')}
              onPointerDown={() => prefetchToolChunk('about-us')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.about', { defaultValue: 'About' })}
            </Link>
            <Link
              to={ROUTES.CONTACT}
              onMouseEnter={() => prefetchToolChunk('contact')}
              onPointerDown={() => prefetchToolChunk('contact')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('header.nav.contact', { defaultValue: 'Contact' })}
            </Link>
            {user && (
              <Link
                to={ROUTES.DASHBOARD}
                onMouseEnter={() => prefetchToolChunk('dashboard')}
                onPointerDown={() => prefetchToolChunk('dashboard')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition-colors"
              >
                {t('header.nav.dashboard', { defaultValue: 'Dashboard' })}
              </Link>
            )}
          </nav>

        {/* Zone 3: Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Pro Action / Badge */}
          {isPro ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide select-none shrink-0"
              id="header-pro-badge"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>PRO</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={isUpgrading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-60 shrink-0 shadow-sm shadow-emerald-600/20"
              id="header-upgrade-pro-btn"
              title="Upgrade to Pro ($2.49/month)"
            >
              <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="sm:hidden">Pro</span>
              <span className="hidden sm:inline">Upgrade to Pro</span>
            </button>
          )}

          {/* Daily Task Quota Indicator */}
          <button
            type="button"
            onClick={() => openLimitModal({ reason: 'task_limit' })}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer select-none"
            title={
              isPro || tier === 'pro'
                ? t('usageLimits.header.proTitle', {
                    defaultValue: 'Pro Tier: Unlimited daily tasks & 500MB file uploads',
                  })
                : tier === 'free'
                  ? t('usageLimits.header.freeTitle', {
                      count: tasksRemaining,
                      defaultValue: `Free Account: 10 daily tasks (${tasksRemaining} left) & 150MB file uploads`,
                    })
                  : t('usageLimits.header.guestTitle', {
                      count: tasksRemaining,
                      defaultValue: `Guest: 5 daily tasks (${tasksRemaining} left) & 100MB file uploads`,
                    })
            }
          >
            {isPro || tier === 'pro' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Unlimited</span>
              </>
            ) : tier === 'free' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{tasksRemaining}/10 tasks</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span>{tasksRemaining}/5 tasks</span>
              </>
            )}
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to={ROUTES.DASHBOARD}
                onMouseEnter={() => prefetchToolChunk('dashboard')}
                onPointerDown={() => prefetchToolChunk('dashboard')}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50/80 dark:bg-slate-900/60 text-xs font-semibold text-slate-900 dark:text-white transition-all shrink-0"
                title={user.displayName ? `${user.displayName} — Workspace` : 'Workspace'}
              >
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline max-w-[96px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="hidden sm:inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-xs text-slate-500 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to={ROUTES.SIGN_IN}
              onMouseEnter={() => prefetchToolChunk('login')}
              onPointerDown={() => prefetchToolChunk('login')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50/80 dark:bg-slate-900/60 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shrink-0"
              id="header-signin-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          <LanguageSwitcher variant="header" className="hidden sm:inline-block" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            aria-label={t('header.themeToggle.ariaLabel', { defaultValue: 'Toggle dark mode' })}
            title={
              isDark
                ? t('header.themeToggle.switchToLight', { defaultValue: 'Switch to Light Mode' })
                : t('header.themeToggle.switchToDark', { defaultValue: 'Switch to Dark Mode' })
            }
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          {setMobileMenuOpen && (
            <button
              type="button"
              onMouseEnter={() => prefetchToolChunk('mobile-drawer')}
              onPointerDown={() => prefetchToolChunk('mobile-drawer')}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 lg:hidden transition-colors cursor-pointer flex items-center justify-center shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile_drawer"
              aria-label={
                mobileMenuOpen
                  ? t('header.mobileMenu.close', { defaultValue: 'Close menu' })
                  : t('header.mobileMenu.open', { defaultValue: 'Open menu' })
              }
              title={
                mobileMenuOpen
                  ? t('header.mobileMenu.close', { defaultValue: 'Close menu' })
                  : t('header.mobileMenu.open', { defaultValue: 'Open menu' })
              }
              id="menu-toggle-btn"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-emerald-500" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
  }
);

Header.displayName = 'Header';

export default Header;
