import './polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { UsageLimitProvider } from './contexts/UsageLimitContext';
import { setupErrorTelemetry, FileProcessingProvider } from './error-handler';
import i18n, { getInitialLocale } from './i18n/config';
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

// Sync initial i18n language and document lang from URL path prefix or persisted locale preference
const syncInitialLocaleFromPath = (): void => {
  const targetLocale = getInitialLocale();

  if (i18n.language !== targetLocale) {
    void i18n.changeLanguage(targetLocale);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = targetLocale;
  }
};

syncInitialLocaleFromPath();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <BrowserRouter
          future={{ v7_startTransition: false, v7_relativeSplatPath: true }}
        >
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <UsageLimitProvider>
                  <FileProcessingProvider>
                    <ErrorBoundary resetKey="root-app">
                      <App />
                    </ErrorBoundary>
                  </FileProcessingProvider>
                </UsageLimitProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </I18nextProvider>
  </React.StrictMode>
);
