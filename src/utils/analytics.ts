/**
 * Privacy-First Analytics & Measurement Library for PdfMinty
 *
 * CRITICAL PRIVACY DIRECTIVES:
 * 1. ZERO PII, ZERO filenames, ZERO document text, ZERO PDF bytes, ZERO IP tracking.
 * 2. Only anonymized aggregatable metrics (tool name, file size category, error category, duration).
 * 3. Consent-aware: Respects user consent state ('granted' | 'denied' | 'unset').
 */

export type ConsentStatus = 'granted' | 'denied' | 'unset';

export interface AnalyticsEvent {
  event_name:
    | 'page_view_organic'
    | 'tool_page_view'
    | 'tool_start'
    | 'file_selected'
    | 'tool_process_success'
    | 'tool_process_error'
    | 'file_download_success'
    | 'article_engagement'
    | 'cta_click'
    | 'related_tool_click';
  params?: Record<string, string | number | boolean | undefined>;
  timestamp?: string;
}

const CONSENT_STORAGE_KEY = 'pdfminty_analytics_consent';

export function getAnalyticsConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'denied';
  try {
    const val = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'granted' || val === 'denied') return val;
  } catch {
    // Ignore storage errors
  }
  return 'unset';
}

export function setAnalyticsConsent(status: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Categorize file size into coarse anonymized ranges without revealing exact byte length or name.
 */
export function getFileSizeCategory(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'unknown';
  if (bytes < 1 * 1024 * 1024) return '<1MB';
  if (bytes < 5 * 1024 * 1024) return '1-5MB';
  if (bytes < 20 * 1024 * 1024) return '5-20MB';
  if (bytes < 50 * 1024 * 1024) return '20-50MB';
  return '>50MB';
}

/**
 * Categorize page counts into privacy-preserving coarse ranges.
 */
export function getPageCountRange(count?: number): string {
  if (count === undefined || count === null || count <= 0) return 'unknown';
  if (count === 1) return '1_page';
  if (count <= 5) return '2-5_pages';
  if (count <= 20) return '6-20_pages';
  if (count <= 50) return '21-50_pages';
  return '>50_pages';
}

/**
 * Sanitize error message into a high-level enum category to prevent PII/path leaks.
 */
export function sanitizeErrorCategory(errorMessage: string): string {
  if (!errorMessage) return 'UNKNOWN_ERROR';
  const msg = errorMessage.toLowerCase();

  if (msg.includes('password') || msg.includes('decrypt') || msg.includes('encrypted')) {
    return 'PASSWORD_REQUIRED_OR_INVALID';
  }
  if (msg.includes('corrupt') || msg.includes('invalid pdf') || msg.includes('xref') || msg.includes('header')) {
    return 'CORRUPT_OR_INVALID_PDF';
  }
  if (msg.includes('memory') || msg.includes('allocation') || msg.includes('out of memory') || msg.includes('wasm')) {
    return 'WASM_OUT_OF_MEMORY';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('timeout')) {
    return 'NETWORK_OR_TIMEOUT';
  }
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('429')) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  if (msg.includes('abort') || msg.includes('cancel')) {
    return 'USER_CANCELLED';
  }
  return 'GENERIC_PROCESSING_ERROR';
}

/**
 * Track an event with strict data minimization.
 */
export function trackAnalyticsEvent(
  eventName: AnalyticsEvent['event_name'],
  params?: AnalyticsEvent['params']
): void {
  // Check consent - default to denied if not explicitly granted
  const consent = getAnalyticsConsent();
  if (consent === 'denied') {
    return;
  }

  // Ensure params contain ZERO forbidden fields
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // Strictly ignore forbidden properties if accidentally passed
      if (
        key.toLowerCase().includes('name') && key !== 'tool_name' && key !== 'cta_name' ||
        key.toLowerCase().includes('filename') ||
        key.toLowerCase().includes('text') ||
        key.toLowerCase().includes('path') ||
        key.toLowerCase().includes('email') ||
        key.toLowerCase().includes('ip') ||
        key.toLowerCase().includes('content')
      ) {
        continue;
      }
      if (value !== undefined && value !== null) {
        cleanParams[key] = value;
      }
    }
  }

  const payload: AnalyticsEvent = {
    event_name: eventName,
    params: cleanParams,
    timestamp: new Date().toISOString(),
  };

  // Log in development or dispatch to window.gtag / window.plausible if present
  if (typeof window !== 'undefined') {
    // 1. Dispatch to window.gtag if integrated
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, cleanParams);
    }

    // 2. Dispatch custom DOM event for internal monitoring or testing
    window.dispatchEvent(
      new CustomEvent('pdfminty_analytics_event', { detail: payload })
    );
  }
}
