import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
  isI18nToolSlug,
  getCanonicalUrl,
  getHreflangs,
  HreflangEntry,
} from '../i18n/config';

export interface UseHreflangResult {
  currentLocale: SupportedLocale;
  baseSlug: string;
  canonicalUrl: string;
  isI18nEnabled: boolean;
  hreflangs: HreflangEntry[];
}

/**
 * Reusable hook driven by the i18n config to derive current active locale,
 * canonical URL (self-referencing), and reciprocal hreflang alternate links.
 */
export function useHreflang(
  slugOverride?: string,
  siteUrl = 'https://pdfminty.com'
): UseHreflangResult {
  const location = useLocation();
  const { i18n } = useTranslation();

  return useMemo(() => {
    const pathWithoutQuery = (location?.pathname || '').split('?')[0];
    const segments = pathWithoutQuery.split('/').filter(Boolean);

    const hasLocalePrefix =
      segments.length > 0 &&
      (SUPPORTED_LOCALES as readonly string[]).includes(segments[0]) &&
      segments[0] !== DEFAULT_LOCALE;

    const currentLocale: SupportedLocale = hasLocalePrefix
      ? (segments[0] as SupportedLocale)
      : (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
        ? (i18n.language as SupportedLocale)
        : DEFAULT_LOCALE;

    let baseSlug = slugOverride;
    if (!baseSlug) {
      const baseSegments = hasLocalePrefix ? segments.slice(1) : segments;
      baseSlug = baseSegments.join('/');
    }
    const cleanSlug = (baseSlug || '').replace(/^\//, '').replace(/\/$/, '');

    const isI18nEnabled = cleanSlug === '' || isI18nToolSlug(cleanSlug);
    const canonicalUrl = cleanSlug
      ? getCanonicalUrl(cleanSlug, currentLocale, siteUrl)
      : currentLocale === DEFAULT_LOCALE
        ? `${siteUrl}/`
        : `${siteUrl}/${currentLocale}/`;

    const hreflangs = isI18nEnabled ? getHreflangs(cleanSlug, siteUrl) : [];

    return {
      currentLocale,
      baseSlug: cleanSlug,
      canonicalUrl,
      isI18nEnabled,
      hreflangs,
    };
  }, [location?.pathname, i18n.language, slugOverride, siteUrl]);
}
