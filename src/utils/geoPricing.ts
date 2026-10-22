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

export const DEFAULT_GEO: GeoLocationInfo = COUNTRY_CURRENCY_MAP.BD;

/**
 * Detect user country synchronously — defaults to Bangladesh (BDT 299.99)
 * unless the user explicitly selected another currency in sessionStorage.
 */
export function detectCountrySync(): GeoLocationInfo {
  try {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('pdfminty_manual_currency_code');
      if (cached && COUNTRY_CURRENCY_MAP[cached]) {
        return COUNTRY_CURRENCY_MAP[cached];
      }
    }
  } catch {
    // Fallback on error
  }

  return DEFAULT_GEO;
}

/**
 * Returns the active country/currency preference (defaults to BDT 299.99)
 */
export async function detectCountryAsync(): Promise<GeoLocationInfo> {
  return detectCountrySync();
}

/**
 * Calculates rounded, formatted prices for a given country
 */
export function calculateLocalizedPricing(geo: GeoLocationInfo): LocalizedPricing {
  const { currencyCode, currencySymbol, rateToUsd } = geo;

  // Free plan is always 0
  const free = {
    amount: 0,
    formatted: geo.countryCode === 'BD' ? 'BDT 0' : `${currencySymbol}0`,
  };

  // Official BDT baseline:
  // Pro Monthly: BDT 299.99/month
  // Pro Annual: BDT 1,799/year (BDT 149.99/month)
  // Lifetime: BDT 3,490 one-time

  // Special optimized commercial pricing for popular regions:
  if (geo.countryCode === 'BD') {
    return {
      free,
      proAnnual: {
        monthlyEquivalent: 149.99,
        annualTotal: 1799,
        formattedMonthly: 'BDT 149.99',
        formattedAnnual: 'BDT 1,799',
      },
      proMonthly: {
        amount: 299.99,
        formatted: 'BDT 299.99',
      },
      lifetime: {
        amount: 3490,
        formatted: 'BDT 3,490',
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
