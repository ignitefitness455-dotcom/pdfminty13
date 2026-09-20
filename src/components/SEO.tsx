import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { HOMEPAGE_META } from '../config/homeConfig';
import { TOOLS, SITE_URL, SITE_NAME } from '../config/seo-data';
import { useHreflang } from '../hooks/useHreflang';
import { DEFAULT_LOCALE } from '../i18n/config';

interface SEOProps {
  slug?: string;
  titleOverride?: string;
  descriptionOverride?: string;
}

/**
 * Renders <title>, meta description, canonical, reciprocal hreflangs, Open Graph, and Twitter card tags.
 *
 * JSON-LD structured data is intentionally NOT emitted here — that is owned by
 * <InternalSEO /> to avoid duplicate/conflicting schema on tool pages. The
 * homepage's WebSite schema is emitted by index.html and not duplicated here.
 */
export const SEO: React.FC<SEOProps> = ({ slug, titleOverride, descriptionOverride }) => {
  const { currentLocale, baseSlug, canonicalUrl, hreflangs } = useHreflang(slug, SITE_URL);
  const { t } = useTranslation(baseSlug || 'common');

  const item = TOOLS.find((t) => t.slug === baseSlug);

  const currentToolIndex = TOOLS.findIndex((t) => t.slug === baseSlug);
  const prevTool = currentToolIndex > 0 ? TOOLS[currentToolIndex - 1] : null;
  const nextTool = currentToolIndex >= 0 && currentToolIndex < TOOLS.length - 1 ? TOOLS[currentToolIndex + 1] : null;

  // Localized SEO strings for pages with translations available when not default locale
  let localizedTitle: string | undefined;
  let localizedDescription: string | undefined;

  if (currentLocale !== DEFAULT_LOCALE && baseSlug === 'merge-pdf') {
    const tTitle = t('seo.metaTitle', { ns: 'merge-pdf', defaultValue: '' });
    if (tTitle && tTitle !== 'seo.metaTitle') {
      localizedTitle = tTitle;
    }
    const tDesc = t('seo.metaDescription', { ns: 'merge-pdf', defaultValue: '' });
    if (tDesc && tDesc !== 'seo.metaDescription') {
      localizedDescription = tDesc;
    }
  } else if (currentLocale !== DEFAULT_LOCALE && baseSlug === 'sign-pdf') {
    const tTitle = t('signPdf.title', { ns: 'common', defaultValue: '' });
    if (tTitle && tTitle !== 'signPdf.title') {
      localizedTitle = `${tTitle} - ${SITE_NAME}`;
    }
    const tDesc = t('signPdf.description', { ns: 'common', defaultValue: '' });
    if (tDesc && tDesc !== 'signPdf.description') {
      localizedDescription = tDesc;
    }
  } else if (currentLocale !== DEFAULT_LOCALE && baseSlug) {
    const tH1 = t(`tools.${baseSlug}.h1`, { ns: 'common', defaultValue: '' });
    const tName = t(`tools.${baseSlug}.name`, { ns: 'common', defaultValue: '' });
    const tDesc = t(`tools.${baseSlug}.desc`, { ns: 'common', defaultValue: '' });
    if (tH1 && tH1 !== `tools.${baseSlug}.h1`) {
      localizedTitle = `${tH1} | ${SITE_NAME}`;
    } else if (tName && tName !== `tools.${baseSlug}.name`) {
      localizedTitle = `${tName} | ${SITE_NAME}`;
    }
    if (tDesc && tDesc !== `tools.${baseSlug}.desc`) {
      localizedDescription = tDesc;
    }
  }

  // Default values for homepage or custom non-tool pathways.
  const title =
    titleOverride ||
    localizedTitle ||
    item?.metaTitle ||
    HOMEPAGE_META.title;
  const description =
    descriptionOverride ||
    localizedDescription ||
    item?.metaDescription ||
    HOMEPAGE_META.description;

  const ogType = item?.type === 'article' ? 'article' : 'website';

  // Per-tool og:image if declared in seo-data, else generic.
  const ogImage = item?.ogImage ? `${SITE_URL}${item.ogImage}` : `${SITE_URL}/og-image.png`;
  const keywords = item?.keywords
    ? (Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords)
    : item?.name
      ? `${item.name.toLowerCase()}, ${item.slug.replace(/-/g, ' ')}, pdf tools`
      : 'pdf toolkit, client-side pdf editor, privacy pdf tools, local pdf tools, free browser pdf tools';

  return (
    <Helmet>
      {/* General Title and Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="author" content="PDFMinty" />
      <meta name="publisher" content="PDFMinty" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Reciprocal hreflang tags for multi-locale pages */}
      {hreflangs.map((entry) => (
        <link
          key={entry.hreflang}
          rel="alternate"
          hrefLang={entry.hreflang}
          href={entry.href}
        />
      ))}

      {prevTool && <link rel="prev" href={`${SITE_URL}/${prevTool.slug}/`} />}
      {nextTool && <link rel="next" href={`${SITE_URL}/${nextTool.slug}/`} />}

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
