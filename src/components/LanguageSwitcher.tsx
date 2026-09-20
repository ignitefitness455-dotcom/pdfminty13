import { Globe, Check, ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
  LOCALE_METADATA,
  getSwitchLocalePath,
} from '../i18n/config';

interface LanguageSwitcherProps {
  variant?: 'header' | 'mobile' | 'footer';
  onSelect?: () => void;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  onSelect,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive current locale from pathname or fallback to active i18n language
  const currentPathWithoutQuery = window.location.pathname.split('?')[0];
  const firstPathSegment = currentPathWithoutQuery.split('/').filter(Boolean)[0];
  const isPrefixed =
    firstPathSegment &&
    (SUPPORTED_LOCALES as readonly string[]).includes(firstPathSegment) &&
    firstPathSegment !== DEFAULT_LOCALE;

  const activeLocale: SupportedLocale = isPrefixed
    ? (firstPathSegment as SupportedLocale)
    : (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? (i18n.language as SupportedLocale)
      : DEFAULT_LOCALE;

  const currentMetadata = LOCALE_METADATA[activeLocale] || {
    code: activeLocale,
    name: activeLocale,
    nativeName: activeLocale,
  };

  // Sync active locale to document root lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLocale;
    }
  }, [activeLocale]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If only one locale is supported, do not render language switch controls
  if (SUPPORTED_LOCALES.length <= 1) {
    return null;
  }

  const handleLocaleChange = (targetLocale: SupportedLocale) => {
    setIsOpen(false);
    if (onSelect) onSelect();
    if (targetLocale === activeLocale) {
      return;
    }

    // Persist chosen locale
    try {
      localStorage.setItem('pdfminty_locale', targetLocale);
      localStorage.setItem('i18nextLng', targetLocale);
    } catch {
      // Ignore localStorage restrictions if any
    }

    i18n.changeLanguage(targetLocale);

    // Navigate to target path using hard reload to load correct static HTML and reset React Router basename
    const targetPath = getSwitchLocalePath(window.location.pathname, targetLocale);
    window.location.assign(targetPath);
  };

  // Mobile list view variant (e.g. within MobileDrawer)
  if (variant === 'mobile') {
    return (
      <div className={`space-y-1.5 ${className}`} id="mobile-language-switcher">
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LOCALES.map((localeCode) => {
            const meta = LOCALE_METADATA[localeCode] || {
              code: localeCode,
              name: localeCode,
              nativeName: localeCode,
            };
            const isSelected = activeLocale === localeCode;
            return (
              <button
                key={localeCode}
                type="button"
                onClick={() => handleLocaleChange(localeCode)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-border-muted bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{meta.nativeName}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Footer variant
  if (variant === 'footer') {
    return (
      <div
        ref={dropdownRef}
        className={`relative inline-block text-left ${className}`}
        id="footer-language-switcher"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-muted bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>{currentMetadata.nativeName}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute bottom-full mb-2 left-0 sm:right-0 sm:left-auto w-40 rounded-xl bg-surface-container-highest border border-border-muted shadow-xl py-1 z-50 animate-fadein backdrop-blur-md"
          >
            {SUPPORTED_LOCALES.map((localeCode) => {
              const meta = LOCALE_METADATA[localeCode] || {
                code: localeCode,
                name: localeCode,
                nativeName: localeCode,
              };
              const isSelected = activeLocale === localeCode;
              return (
                <button
                  key={localeCode}
                  type="button"
                  onClick={() => handleLocaleChange(localeCode)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex flex-col">
                    <span>{meta.nativeName}</span>
                    <span className="text-[10px] text-on-surface-variant opacity-70">
                      {meta.name}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default Header variant
  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
      id="header-language-switcher"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-muted text-on-surface transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 text-xs font-bold"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="language-switcher-btn"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
        <span className="font-semibold text-xs tracking-tight">
          {currentMetadata.nativeName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-surface/95 dark:bg-surface-container-highest/95 border border-border-muted shadow-2xl p-1.5 z-50 animate-fadein backdrop-blur-md"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Select Language
          </div>
          <div className="space-y-0.5">
            {SUPPORTED_LOCALES.map((localeCode) => {
              const meta = LOCALE_METADATA[localeCode] || {
                code: localeCode,
                name: localeCode,
                nativeName: localeCode,
              };
              const isSelected = activeLocale === localeCode;
              return (
                <button
                  key={localeCode}
                  type="button"
                  onClick={() => handleLocaleChange(localeCode)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{meta.nativeName}</span>
                    <span className="text-[11px] text-on-surface-variant/70 font-normal">
                      ({meta.name})
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
