import { Globe, ArrowRight, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
  getSwitchLocalePath,
} from '../i18n/config';

interface BannerContent {
  prompt: string;
  actionText: string;
  dismissText: string;
}

const BANNER_MESSAGES: Record<SupportedLocale, BannerContent> = {
  es: {
    prompt: '¿Prefieres usar PdfMinty en Español?',
    actionText: 'Cambiar a Español',
    dismissText: 'Continuar en Inglés',
  },
  de: {
    prompt: 'Möchten Sie PdfMinty auf Deutsch nutzen?',
    actionText: 'Auf Deutsch wechseln',
    dismissText: 'Auf Englisch bleiben',
  },
  fr: {
    prompt: 'Préférez-vous utiliser PdfMinty en Français ?',
    actionText: 'Passer en Français',
    dismissText: 'Continuer en Anglais',
  },
  en: {
    prompt: 'Would you prefer to use PdfMinty in English?',
    actionText: 'Switch to English',
    dismissText: 'Keep current',
  },
  bn: {
    prompt: 'আপনি কি পিডিএফমিন্টি বাংলা ভাষায় ব্যবহার করতে চান?',
    actionText: 'বাংলায় পরিবর্তন করুন',
    dismissText: 'ইংরেজিতে চালিয়ে যান',
  },
  hi: {
    prompt: 'क्या आप PdfMinty का उपयोग हिंदी में करना पसंद करेंगे?',
    actionText: 'हिंदी में बदलें',
    dismissText: 'अंग्रेज़ी में जारी रखें',
  },
  zh: {
    prompt: '您想使用中文版的 PdfMinty 吗？',
    actionText: '切换到中文',
    dismissText: '保留当前语言',
  },
};


const STORAGE_KEY = 'pdfminty_lang_suggestion_dismissed';

export const LanguageSuggestionBanner: React.FC = () => {
  const { i18n } = useTranslation();
  const [suggestedLocale, setSuggestedLocale] = useState<SupportedLocale | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (isDismissed) return;
    } catch {
      // Ignore localStorage errors
    }

    // Determine active page locale from path or i18n
    const pathname = window.location.pathname.split('?')[0];
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    const activeLocale: SupportedLocale =
      firstSegment &&
      (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment) &&
      firstSegment !== DEFAULT_LOCALE
        ? (firstSegment as SupportedLocale)
        : (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
          ? (i18n.language as SupportedLocale)
          : DEFAULT_LOCALE;

    // Detect browser languages
    const browserLangs =
      typeof navigator !== 'undefined'
        ? navigator.languages && navigator.languages.length > 0
          ? navigator.languages
          : [navigator.language]
        : [];

    let matchedLocale: SupportedLocale | null = null;
    for (const lang of browserLangs) {
      if (!lang) continue;
      const primaryLang = lang.toLowerCase().split('-')[0];
      if ((SUPPORTED_LOCALES as readonly string[]).includes(primaryLang)) {
        matchedLocale = primaryLang as SupportedLocale;
        break;
      }
    }

    // Only show banner if matched browser locale is different from current page locale
    if (matchedLocale && matchedLocale !== activeLocale) {
      setSuggestedLocale(matchedLocale);
      setVisible(true);
    }
  }, [i18n.language]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleSwitchLanguage = () => {
    if (!suggestedLocale) return;

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('pdfminty_locale', suggestedLocale);
      localStorage.setItem('i18nextLng', suggestedLocale);
    } catch {
      // Ignore
    }

    i18n.changeLanguage(suggestedLocale);
    const targetPath = getSwitchLocalePath(window.location.pathname, suggestedLocale);
    window.location.assign(targetPath);
  };

  if (!visible || !suggestedLocale) return null;

  const content = BANNER_MESSAGES[suggestedLocale] || BANNER_MESSAGES.es;

  return (
    <aside
      id="language-suggestion-banner"
      aria-label="Language suggestion banner"
      className="relative z-40 bg-white/40 dark:bg-black/40 backdrop-blur-xl text-slate-800 dark:text-white shadow-sm border-b border-white/50 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left info badge & message */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="font-semibold leading-snug">
            {content.prompt}
          </p>
        </div>

        {/* Right CTA and Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSwitchLanguage}
            id="lang-banner-switch-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm border border-emerald-500/50"
          >
            <span>{content.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            id="lang-banner-dismiss-btn"
            aria-label="Dismiss language suggestion"
            title={content.dismissText}
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LanguageSuggestionBanner;
