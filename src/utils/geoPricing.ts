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
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    rateToUsd: 86,
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

/**
 * Detect user country synchronously — always defaults to United States (USD $)
 * unless the user explicitly selected another supported currency in sessionStorage.
 */
export function detectCountrySync(): GeoLocationInfo {
  try {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('pdfminty_manual_currency_code');
      if (cached && cached !== 'BD' && COUNTRY_CURRENCY_MAP[cached]) {
        return COUNTRY_CURRENCY_MAP[cached];
      }
    }
  } catch {
    // Fallback on error
  }

  return DEFAULT_GEO;
}

/**
 * Returns the active country/currency preference (defaults to USD $)
 */
export async function detectCountryAsync(): Promise<GeoLocationInfo> {
  return detectCountrySync();
}

/**
 * Calculates rounded, formatted prices for a given country
 * Official USD baseline:
 * - Pro Monthly: $2.49/month
 * - Lifetime Deal: $50 one-time
 */
export function calculateLocalizedPricing(geo: GeoLocationInfo): LocalizedPricing {
  const { currencyCode, currencySymbol, rateToUsd } = geo;

  // Free plan is always 0
  const free = {
    amount: 0,
    formatted: `${currencySymbol}0`,
  };

  if (geo.countryCode === 'US') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 2.49,
        annualTotal: 29.88,
        formattedMonthly: '$2.49',
        formattedAnnual: '$29.88',
      },
      proMonthly: {
        amount: 2.49,
        formatted: '$2.49',
      },
      lifetime: {
        amount: 50,
        formatted: '$50',
      },
    };
  }

  if (geo.countryCode === 'IN') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 219,
        annualTotal: 2628,
        formattedMonthly: '₹219',
        formattedAnnual: '₹2,628',
      },
      proMonthly: {
        amount: 219,
        formatted: '₹219',
      },
      lifetime: {
        amount: 4290,
        formatted: '₹4,290',
      },
    };
  }

  if (geo.countryCode === 'GB') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 1.99,
        annualTotal: 23.88,
        formattedMonthly: '£1.99',
        formattedAnnual: '£23.88',
      },
      proMonthly: {
        amount: 1.99,
        formatted: '£1.99',
      },
      lifetime: {
        amount: 40,
        formatted: '£40',
      },
    };
  }

  if (currencyCode === 'EUR') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 2.29,
        annualTotal: 27.48,
        formattedMonthly: '€2.29',
        formattedAnnual: '€27.48',
      },
      proMonthly: {
        amount: 2.29,
        formatted: '€2.29',
      },
      lifetime: {
        amount: 46,
        formatted: '€46',
      },
    };
  }

  // Dynamic calculation for other currencies ($2.49/mo Pro, $50 Lifetime baseline)
  const isHighDenom = rateToUsd >= 50; // JPY, PKR, etc.

  const monthlyRaw = 2.49 * rateToUsd;
  const monthly = isHighDenom ? Math.round(monthlyRaw) : Math.round(monthlyRaw * 100) / 100;

  const annualTotalRaw = monthly * 12;
  const annualTotal = isHighDenom ? Math.round(annualTotalRaw / 10) * 10 : Math.round(annualTotalRaw * 100) / 100;

  const lifetimeRaw = 50 * rateToUsd;
  const lifetime = isHighDenom ? Math.round(lifetimeRaw / 10) * 10 : Math.round(lifetimeRaw);

  const format = (val: number) => {
    return isHighDenom
      ? `${currencySymbol}${val.toLocaleString()}`
      : `${currencySymbol}${val.toFixed(2)}`;
  };

  return {
    free,
    proAnnual: {
      monthlyEquivalent: monthly,
      annualTotal,
      formattedMonthly: format(monthly),
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
