import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { SITE_URL, SITE_NAME, TOOLS } from '../config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/config';

export const Breadcrumbs: React.FC = () => {
  const { pathname = '/' } = useLocation() || {};
  const { t } = useTranslation('common');
  const homePath = '/';
  const blogPath = ROUTES.BLOG;
  
  const cleanSlug = useMemo(() => {
    if (!pathname || pathname === '/') return '';
    let slug = pathname.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
    for (const loc of SUPPORTED_LOCALES) {
      if (loc !== DEFAULT_LOCALE && (slug === loc || slug.startsWith(`${loc}/`))) {
        slug = slug.substring(loc.length + 1);
        break;
      }
    }
    return slug;
  }, [pathname]);

  if (!cleanSlug) {
    return null;
  }

  const currentItem = TOOLS.find((t) => t && t.slug && t.slug.toLowerCase() === cleanSlug);

  const homeLabel = t('header.nav.home', { defaultValue: 'Home' });
  const toolsLabel = t('header.nav.tools', { defaultValue: 'Tools' });
  const blogLabel = t('header.nav.blog', { defaultValue: 'Knowledge Hub' });

  const breadcrumbAria = t('breadcrumbs.label', { defaultValue: 'Breadcrumb' });

  if (cleanSlug === 'blog') {
    return (
      <nav aria-label={breadcrumbAria} className="flex text-[11px] sm:text-xs text-slate-400/80 mb-6 gap-2 font-bold font-sans tracking-wide">
        <Link to={homePath} className="hover:text-emerald-600 transition-colors uppercase font-sans">
          {homeLabel}
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-400 uppercase font-sans">
          {blogLabel}
        </span>
      </nav>
    );
  }

  if (cleanSlug === 'about-us' || cleanSlug === 'contact' || cleanSlug === 'privacy-policy' || cleanSlug === 'terms-of-service') {
    const title = cleanSlug === 'about-us'
      ? t('header.nav.about', { defaultValue: 'About Us' })
      : cleanSlug === 'contact'
      ? t('header.nav.contact', { defaultValue: 'Contact Us' })
      : cleanSlug === 'privacy-policy'
      ? t('footer.links.privacyPolicy', { defaultValue: 'Privacy Policy' })
      : t('footer.links.termsOfService', { defaultValue: 'Terms of Service' });

    return (
      <nav aria-label={breadcrumbAria} className="flex text-[11px] sm:text-xs text-slate-400/80 mb-6 gap-2 font-bold font-sans tracking-wide">
        <Link to={homePath} className="hover:text-emerald-600 transition-colors uppercase font-sans">
          {homeLabel}
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-400 uppercase font-sans">
          {title}
        </span>
      </nav>
    );
  }

  if (!currentItem) {
    return null;
  }

  const isArticle = currentItem.type === 'article';
  const itemName = t(`tools.${currentItem.slug}.name`, { defaultValue: currentItem.name });

  return (
    <nav aria-label={breadcrumbAria} className="flex text-[11px] sm:text-xs text-slate-400/80 mb-6 gap-2 font-bold font-sans tracking-wide">
      <Link to={homePath} className="hover:text-emerald-600 transition-colors uppercase font-sans">
        {homeLabel}
      </Link>
      <span>/</span>
      {isArticle ? (
        <>
          <Link to={blogPath} className="hover:text-emerald-600 transition-colors uppercase font-sans">
            {blogLabel}
          </Link>
          <span>/</span>
        </>
      ) : (
        <>
          <Link to={homePath} className="hover:text-emerald-600 transition-colors uppercase font-sans">
            {toolsLabel}
          </Link>
          <span>/</span>
        </>
      )}
      <span className="text-slate-600 dark:text-slate-400 uppercase font-sans truncate max-w-[200px] sm:max-w-xs">
        {itemName}
      </span>
    </nav>
  );
};

export default function InternalSEO() {
  const location = useLocation();

  const nonce = React.useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const scriptWithNonce = document.querySelector('script[nonce]') as HTMLScriptElement | null;
    if (scriptWithNonce) {
      return scriptWithNonce.nonce || scriptWithNonce.getAttribute('nonce') || undefined;
    }
    return undefined;
  }, []);

  const rawPath = (location?.pathname || '').replace(/^\//, '').replace(/\/$/, '');
  let currentLocale = DEFAULT_LOCALE;
  let baseSlug = rawPath;

  for (const loc of SUPPORTED_LOCALES) {
    if (loc !== DEFAULT_LOCALE && (rawPath === loc || rawPath.startsWith(`${loc}/`))) {
      currentLocale = loc;
      baseSlug = rawPath === loc ? '' : rawPath.substring(loc.length + 1);
      break;
    }
  }

  const structuredData: Record<string, unknown>[] = [];
  const homeUrl = currentLocale === DEFAULT_LOCALE ? `${SITE_URL}/` : `${SITE_URL}/${currentLocale}/`;

  // 1. Homepage (`/` or `/${currentLocale}/`)
  if (!baseSlug) {
    structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: homeUrl,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-192.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@pdfminty.com',
          contactType: 'customer support',
        },
      }
      // FAQPage is provided in static HTML by homepageFaqSchema
    );
  } else if (baseSlug === 'blog') {
    // 2. Blog Index (`/blog/`)
    structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'PdfMinty Knowledge Hub',
        url: `${SITE_URL}/blog/`,
        description: 'Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: `${SITE_URL}/logo-192.png`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Knowledge Hub',
            item: `${SITE_URL}/blog/`,
          },
        ],
      }
    );
  } else {
    // 3. Tool, Article, or Static Page
    const seoInfo = TOOLS.find((t) => t && t.slug === baseSlug);
    if (!seoInfo) return null;

    const pageCanonicalUrl = currentLocale === DEFAULT_LOCALE ? `${SITE_URL}/${seoInfo.slug}/` : `${SITE_URL}/${currentLocale}/${seoInfo.slug}/`;

    if (seoInfo.type === 'tool') {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: `PdfMinty - ${seoInfo.name}`,
        description: seoInfo.shortDescription || seoInfo.metaDescription,
        url: pageCanonicalUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires HTML5, WebAssembly',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        featureList: [
          '100% client-side processing for standard tools',
          'Zero file uploads for our standard PDF tools',
          'The AI Analyze tool only sends extracted text to Google Gemini after you explicitly check a consent box',
          'Free to use',
          'No registration required',
        ],
      });

      if (seoInfo.howTo) {
        structuredData.push({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: seoInfo.howTo.name,
          totalTime: seoInfo.howTo.totalTime,
          step: seoInfo.howTo.steps.map((stepText, index) => ({
            '@type': 'HowToStep',
            url: `${pageCanonicalUrl}#step${index + 1}`,
            name: stepText,
            itemListElement: [{ '@type': 'HowToDirection', text: stepText }],
          })),
        });
      }

      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: homeUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: seoInfo.name,
            item: pageCanonicalUrl,
          },
        ],
      });

      if (seoInfo.faqs && seoInfo.faqs.length > 0) {
        structuredData.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: seoInfo.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a,
            },
          })),
        });
      }
    } else if (baseSlug === 'about-us') {
      structuredData.push(
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: seoInfo.metaTitle,
          description: seoInfo.metaDescription,
          url: `${SITE_URL}/about-us/`,
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_URL}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'About Us',
              item: `${SITE_URL}/about-us/`,
            },
          ],
        }
      );
    } else if (baseSlug === 'contact') {
      structuredData.push(
        {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: seoInfo.metaTitle,
          description: seoInfo.metaDescription,
          url: `${SITE_URL}/contact/`,
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_URL}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Contact Us',
              item: `${SITE_URL}/contact/`,
            },
          ],
        }
      );
    } else if (baseSlug === 'privacy-policy' || baseSlug === 'terms-of-service') {
      structuredData.push(
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: seoInfo.metaTitle,
          description: seoInfo.metaDescription,
          url: `${SITE_URL}/${baseSlug}/`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_URL}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: seoInfo.name,
              item: `${SITE_URL}/${baseSlug}/`,
            },
          ],
        }
      );
    } else if (seoInfo.type === 'article') {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: seoInfo.h1 || seoInfo.name,
        description: seoInfo.metaDescription,
        url: `${SITE_URL}/${seoInfo.slug}/`,
        datePublished: seoInfo.datePublished || '2026-07-16',
        dateModified: seoInfo.dateModified || seoInfo.datePublished || '2026-08-08',
        author: {
          '@type': 'Organization',
          name: 'PdfMinty Editorial Team',
          url: `${SITE_URL}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo-192.png`,
          },
        },
        image: {
          '@type': 'ImageObject',
          url: seoInfo.ogImage ? `${SITE_URL}${seoInfo.ogImage}` : `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/${seoInfo.slug}/`,
        },
      });

      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Knowledge Hub',
            item: `${SITE_URL}/blog/`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: seoInfo.name,
            item: `${SITE_URL}/${seoInfo.slug}/`,
          },
        ],
      });

      if (seoInfo.faqs && seoInfo.faqs.length > 0) {
        structuredData.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: seoInfo.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a,
            },
          })),
        });
      }
    }
  }

  if (structuredData.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
