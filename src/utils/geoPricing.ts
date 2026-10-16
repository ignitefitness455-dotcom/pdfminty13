/**
 * Geolocation & Localized Currency Utility
 * Automatically detects user country & displays pricing in the local currency.
 */

export interface GeoLocationInfo {
  countryCode: string;
  countryName: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  rateToUsd: number;
  isApproximate?: boolean;
}

export interface LocalizedPricing {
  free: {
    amount: number;
    formatted: string;
  };
  proAnnual: {
    monthlyEquivalent: number;
    annualTotal: number;
    formattedMonthly: string;
    formattedAnnual: string;
  };
  proMonthly: {
    amount: number;
    formatted: string;
  };
  lifetime: {
    amount: number;
    formatted: string;
  };
}

// Preset database for popular countries with friendly rounded commercial pricing
export const COUNTRY_CURRENCY_MAP: Record<string, GeoLocationInfo> = {
  BD: {
    countryCode: 'BD',
    countryName: 'Bangladesh',
    flag: '🇧🇩',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    rateToUsd: 120,
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    rateToUsd: 86,
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    rateToUsd: 1,
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    rateToUsd: 0.79,
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    rateToUsd: 1.38,
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    rateToUsd: 1.52,
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    rateToUsd: 0.92,
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    currencyCode: 'EUR',
    currencySymbol: '€',
    rateToUsd: 0.92,
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    flag: '🇪🇸',
    currencyCode: 'EUR',
    currencySymbol: '€',
    rateToUsd: 0.92,
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    flag: '🇮🇹',
    currencyCode: 'EUR',
    currencySymbol: '€',
    rateToUsd: 0.92,
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    rateToUsd: 155,
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    rateToUsd: 3.67,
  },
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    flag: '🇸🇦',
    currencyCode: 'SAR',
    currencySymbol: 'SAR',
    rateToUsd: 3.75,
  },
  PK: {
    countryCode: 'PK',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    currencyCode: 'PKR',
    currencySymbol: '₨',
    rateToUsd: 280,
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    flag: '🇧🇷',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    rateToUsd: 5.6,
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    rateToUsd: 1.34,
  },
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    flag: '🇲🇾',
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    rateToUsd: 4.4,
  },
};

export const DEFAULT_GEO: GeoLocationInfo = COUNTRY_CURRENCY_MAP.US;

// Timezone to Country Code mapping for instant client-side detection without network calls
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Dhaka': 'BD',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Asia/Tokyo': 'JP',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Karachi': 'PK',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'America/Sao_Paulo': 'BR',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
};

/**
 * Detect user country synchronously from browser environment (Timezone & Locale)
 */
export function detectCountrySync(): GeoLocationInfo {
  try {
    // 1. Check cached preference
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('pdfminty_user_geo_code');
      if (cached && COUNTRY_CURRENCY_MAP[cached]) {
        return COUNTRY_CURRENCY_MAP[cached];
      }
    }

    // 2. Check timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      const code = TIMEZONE_TO_COUNTRY[tz];
      if (COUNTRY_CURRENCY_MAP[code]) {
        return COUNTRY_CURRENCY_MAP[code];
      }
    }

    // 3. Check browser locale (e.g. "en-BD", "bn-BD", "en-IN", "hi-IN", "en-GB")
    if (typeof navigator !== 'undefined' && navigator.language) {
      const parts = navigator.language.split('-');
      if (parts.length > 1) {
        const countryCandidate = parts[1].toUpperCase();
        if (COUNTRY_CURRENCY_MAP[countryCandidate]) {
          return COUNTRY_CURRENCY_MAP[countryCandidate];
        }
      }
    }
  } catch {
    // Fallback on error
  }

  return DEFAULT_GEO;
}

/**
 * Asynchronously refine user country using free IP lookup API with 2.5s timeout
 */
export async function detectCountryAsync(): Promise<GeoLocationInfo> {
  const syncFallback = detectCountrySync();

  if (typeof window === 'undefined') {
    return syncFallback;
  }

  // If already verified in sessionStorage, reuse
  const cachedCode = sessionStorage.getItem('pdfminty_user_geo_code');
  if (cachedCode && COUNTRY_CURRENCY_MAP[cachedCode]) {
    return COUNTRY_CURRENCY_MAP[cachedCode];
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    // Primary: api.country.is (very lightweight, CORS-friendly)
    const res = await fetch('https://api.country.is', {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      const code = data.country?.toUpperCase();
      if (code && COUNTRY_CURRENCY_MAP[code]) {
        sessionStorage.setItem('pdfminty_user_geo_code', code);
        return COUNTRY_CURRENCY_MAP[code];
      }
    }
  } catch {
    // Fail silently to syncFallback
  }

  return syncFallback;
}

/**
 * Calculates rounded, formatted prices for a given country
 */
export function calculateLocalizedPricing(geo: GeoLocationInfo): LocalizedPricing {
  const { currencyCode, currencySymbol, rateToUsd } = geo;

  // Free plan is always 0
  const free = {
    amount: 0,
    formatted: `${currencySymbol}0`,
  };

  // USD baseline:
  // Pro Annual: $14.99/year (~$1.25/month)
  // Pro Monthly: $2.49/month
  // Lifetime: $29 one-time

  // Special optimized commercial pricing for popular regions:
  if (geo.countryCode === 'BD') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 149,
        annualTotal: 1790,
        formattedMonthly: '৳149',
        formattedAnnual: '৳1,790',
      },
      proMonthly: {
        amount: 299,
        formatted: '৳299',
      },
      lifetime: {
        amount: 3490,
        formatted: '৳3,490',
      },
    };
  }

  if (geo.countryCode === 'IN') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 109,
        annualTotal: 1299,
        formattedMonthly: '₹109',
        formattedAnnual: '₹1,299',
      },
      proMonthly: {
        amount: 219,
        formatted: '₹219',
      },
      lifetime: {
        amount: 2490,
        formatted: '₹2,490',
      },
    };
  }

  if (geo.countryCode === 'GB') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 0.99,
        annualTotal: 11.99,
        formattedMonthly: '£0.99',
        formattedAnnual: '£11.99',
      },
      proMonthly: {
        amount: 1.99,
        formatted: '£1.99',
      },
      lifetime: {
        amount: 23,
        formatted: '£23',
      },
    };
  }

  if (currencyCode === 'EUR') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 1.15,
        annualTotal: 13.99,
        formattedMonthly: '€1.15',
        formattedAnnual: '€13.99',
      },
      proMonthly: {
        amount: 2.29,
        formatted: '€2.29',
      },
      lifetime: {
        amount: 27,
        formatted: '€27',
      },
    };
  }

  if (geo.countryCode === 'US') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 1.25,
        annualTotal: 14.99,
        formattedMonthly: '$1.25',
        formattedAnnual: '$14.99',
      },
      proMonthly: {
        amount: 2.49,
        formatted: '$2.49',
      },
      lifetime: {
        amount: 29,
        formatted: '$29',
      },
    };
  }

  // Dynamic calculation for other currencies
  const isHighDenom = rateToUsd >= 50; // JPY, PKR, etc.

  const annualTotalRaw = 14.99 * rateToUsd;
  const annualTotal = isHighDenom ? Math.round(annualTotalRaw / 10) * 10 : Math.round(annualTotalRaw * 100) / 100;
  const monthlyEquiv = isHighDenom ? Math.round(annualTotal / 12) : Math.round((annualTotal / 12) * 100) / 100;

  const monthlyRaw = 2.49 * rateToUsd;
  const monthly = isHighDenom ? Math.round(monthlyRaw) : Math.round(monthlyRaw * 100) / 100;

  const lifetimeRaw = 29 * rateToUsd;
  const lifetime = isHighDenom ? Math.round(lifetimeRaw / 10) * 10 : Math.round(lifetimeRaw);

  const format = (val: number) => {
    return isHighDenom
      ? `${currencySymbol}${val.toLocaleString()}`
      : `${currencySymbol}${val.toFixed(2)}`;
  };

  return {
    free,
    proAnnual: {
      monthlyEquivalent: monthlyEquiv,
      annualTotal,
      formattedMonthly: format(monthlyEquiv),
      formattedAnnual: format(annualTotal),
    },
    proMonthly: {
      amount: monthly,
      formatted: format(monthly),
    },
    lifetime: {
      amount: lifetime,
      formatted: isHighDenom ? `${currencySymbol}${lifetime.toLocaleString()}` : `${currencySymbol}${lifetime}`,
    },
  };
}

export function getStoredGeoPricing(): { geo: GeoLocationInfo; pricing: LocalizedPricing } {
  const geo = detectCountrySync();
  const pricing = calculateLocalizedPricing(geo);
  return { geo, pricing };
}
