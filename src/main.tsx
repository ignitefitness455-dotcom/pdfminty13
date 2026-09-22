import './polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { setupErrorTelemetry, FileProcessingProvider } from './error-handler';
import i18n, { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n/config';
import './index.css';

// Initialize global error telemetry
setupErrorTelemetry();

// Handle Vite dynamic chunk preload errors (stale assets after new deployment)
if (typeof window !== 'undefined') {
  const PRELOAD_RELOAD_KEY = 'pdfminty-preload-reload';
  try {
    sessionStorage.removeItem(PRELOAD_RELOAD_KEY);
  } catch {
    // Ignore storage issues
  }

  window.addEventListener('vite:preloadError', async () => {
    if (!sessionStorage.getItem(PRELOAD_RELOAD_KEY)) {
      sessionStorage.setItem(PRELOAD_RELOAD_KEY, '1');
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k.startsWith('pdfminty-')).map((k) => caches.delete(k))
          );
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.update();
          }
        }
      } catch {
        // Non-blocking cleanup
      }
      window.location.reload();
    }
  });
}

// Determine basename for React Router based on current URL path prefix
const getBasename = (): string => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const first = segments[0] as (typeof SUPPORTED_LOCALES)[number];

  if (first && first !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(first)) {
    i18n.changeLanguage(first);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = first;
    }
    return `/${first}`;
  }

  // Unprefixed routes default to DEFAULT_LOCALE (en)
  i18n.changeLanguage(DEFAULT_LOCALE);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = DEFAULT_LOCALE;
  }
  return '/';
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <BrowserRouter basename={getBasename()}>
          <ThemeProvider>
            <ToastProvider>
              <FileProcessingProvider>
                <ErrorBoundary resetKey="root-app">
                  <App />
                </ErrorBoundary>
              </FileProcessingProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </I18nextProvider>
  </React.StrictMode>
);
