import { useEffect, useState } from 'react';

const FONTS_STYLESHEET_ID = 'pdfminty-signature-fonts';
const PRECONNECT_GSTATIC_ID = 'pdfminty-preconnect-gstatic';
const PRECONNECT_GOOGLEAPIS_ID = 'pdfminty-preconnect-googleapis';

const ALL_SIGNATURE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Homemade+Apple&family=Pacifico&family=Satisfy&display=swap';

/**
 * Injects preconnect hints for Google Fonts CDN if not already present.
 */
export function ensureFontPreconnect(): void {
  if (typeof document === 'undefined') return;

  if (!document.getElementById(PRECONNECT_GOOGLEAPIS_ID)) {
    const linkApi = document.createElement('link');
    linkApi.id = PRECONNECT_GOOGLEAPIS_ID;
    linkApi.rel = 'preconnect';
    linkApi.href = 'https://fonts.googleapis.com';
    document.head.appendChild(linkApi);
  }

  if (!document.getElementById(PRECONNECT_GSTATIC_ID)) {
    const linkGstatic = document.createElement('link');
    linkGstatic.id = PRECONNECT_GSTATIC_ID;
    linkGstatic.rel = 'preconnect';
    linkGstatic.href = 'https://fonts.gstatic.com';
    linkGstatic.crossOrigin = 'anonymous';
    document.head.appendChild(linkGstatic);
  }
}

/**
 * Dynamically loads the 6 signature handwriting fonts only when needed.
 * Prevents render-blocking on other pages.
 */
export function loadSignatureFonts(): void {
  if (typeof document === 'undefined') return;

  ensureFontPreconnect();

  if (document.getElementById(FONTS_STYLESHEET_ID)) {
    return; // Already injected
  }

  const link = document.createElement('link');
  link.id = FONTS_STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = ALL_SIGNATURE_FONTS_URL;
  link.media = 'all';

  document.head.appendChild(link);
}

/**
 * Optional on-demand loader for individual fonts (bonus optimization).
 * e.g., loadSingleSignatureFont('Caveat')
 */
export function loadSingleSignatureFont(fontName: string): void {
  if (typeof document === 'undefined') return;

  const fontId = `pdfminty-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId) || document.getElementById(FONTS_STYLESHEET_ID)) {
    return;
  }

  ensureFontPreconnect();

  const formattedName = fontName.replace(/\s+/g, '+');
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;
  link.media = 'all';

  document.head.appendChild(link);
}

/**
 * Checks and waits until a specific font is loaded and ready in document.fonts.
 * Fallback to resolve after timeout if network is slow or offline.
 */
export async function ensureFontLoaded(fontFamily: string, sampleText = 'Signature'): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return true;
  }

  const fontSpec = `16px "${fontFamily}"`;
  if (document.fonts.check(fontSpec, sampleText)) {
    return true;
  }

  try {
    const loadPromise = document.fonts.load(fontSpec, sampleText);
    const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000));
    await Promise.race([loadPromise, timeoutPromise]);
    return document.fonts.check(fontSpec, sampleText);
  } catch {
    return false;
  }
}

/**
 * React hook to trigger signature fonts loading on component mount (e.g. in SignPdfPage or SignatureDialog).
 */
export function useSignatureFonts(): { isLoaded: boolean } {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSignatureFonts();

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready
        .then(() => setIsLoaded(true))
        .catch(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  }, []);

  return { isLoaded };
}
