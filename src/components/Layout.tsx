import {
  Merge,
  Scissors,
  Minimize2,
  RotateCw,
  Trash2,
  Bookmark,
  Hash,
  FilePlus,
  Shield,
  Lock,
  Image,
  Eye,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Move,
  FileCode2,
  Printer,
  FileText,
  Wrench,
  FilePenLine,
  ShieldBan,
  GitCompare,
} from 'lucide-react';
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { prefetchToolChunk } from '../config/homeConfig';
import { TOOLS_CATALOG as TOOLS } from '../config/seo-catalog';
import { useTheme } from '../contexts/ThemeContext';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
  getLocalizedPath,
} from '../i18n/config';
import { lazyWithRetry } from '../utils/lazyWithRetry';

import { SilentErrorBoundary } from './ErrorBoundary';
import { Footer } from './Footer';
import { Header } from './Header';
import InternalSEO, { Breadcrumbs } from './InternalSEO';
import LanguageSuggestionBanner from './LanguageSuggestionBanner';
import { RelatedBlogs } from './RelatedBlogs';
import { RelatedTools } from './RelatedTools';
import { ToolsSidebar } from './ToolsSidebar';

const MobileDrawer = lazyWithRetry(() =>
  import('./MobileDrawer').then((m) => ({ default: m.MobileDrawer }))
);
const FeedbackModal = lazyWithRetry(() =>
  import('./FeedbackModal').then((m) => ({ default: m.FeedbackModal }))
);
const ConsentManager = lazyWithRetry(() =>
  import('./ConsentManager').then((m) => ({ default: m.ConsentManager }))
);

const ToolContentSection = lazyWithRetry(() =>
  import('./ToolContentSection').then((m) => ({ default: m.ToolContentSection }))
);

interface ToolInfo {
  name: string;
  slug: string;
  description: string;
}

interface LayoutContextType {
  toolsList: ToolInfo[];
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    // Provide safe fallback instead of throwing error to prevent crashes during initial render/hydration
    return { toolsList: [] };
  }
  return context;
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, setTheme: setThemeSetting } = useTheme();
  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const rawLang = (i18n.language || DEFAULT_LOCALE).split('-')[0].toLowerCase();
  const activeLocale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLang)
    ? (rawLang as SupportedLocale)
    : DEFAULT_LOCALE;

  const iconMap = useMemo<Record<string, React.ComponentType<{ className?: string }>>>(
    () => ({
      Merge,
      Scissors,
      CheckSquare,
      Move,
      Minimize2,
      RotateCw,
      Trash2,
      Bookmark,
      Hash,
      FilePlus,
      Shield,
      Lock,
      Image,
      Eye,
      Sparkles,
      FileCode2,
      Printer,
      FileText,
      Wrench,
      FilePenLine,
      ShieldBan,
      GitCompare,
    }),
    []
  );

  const toolsList = useMemo<ToolInfo[]>(
    () =>
      TOOLS.filter((toolItem) => toolItem.type === 'tool').map((toolItem) => ({
        name: t(`tools.${toolItem.slug}.name`, { defaultValue: toolItem.name }),
        slug: toolItem.slug,
        description: t(`tools.${toolItem.slug}.desc`, { defaultValue: toolItem.shortDescription }),
      })),
    [t]
  );

  const menuItems = useMemo(
    () =>
      TOOLS.filter((toolItem) => toolItem.type === 'tool').map((toolItem) => ({
        slug: toolItem.slug,
        name: t(`tools.${toolItem.slug}.name`, { defaultValue: toolItem.name }),
        path: getLocalizedPath(toolItem.slug, activeLocale),
        icon: iconMap[toolItem.icon] || HelpCircle,
        desc: t(`tools.${toolItem.slug}.desc`, { defaultValue: toolItem.shortDescription }),
      })),
    [activeLocale, iconMap, t]
  );

  const layoutContextValue = useMemo(() => ({ toolsList }), [toolsList]);

  const activeToolSlug = useMemo(() => {
    let activeSlug = location.pathname.replace(/^\//, '').replace(/\/$/, '');
    for (const loc of SUPPORTED_LOCALES) {
      if (
        loc !== DEFAULT_LOCALE &&
        (activeSlug === loc || activeSlug.startsWith(`${loc}/`))
      ) {
        activeSlug = activeSlug.substring(loc.length + 1);
        break;
      }
    }
    const activeItem = TOOLS.find((t) => t.slug === activeSlug);
    return activeItem?.type === 'tool' ? activeItem.slug : null;
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const warmCriticalInteractiveChunks = () => {
      prefetchToolChunk('mobile-drawer');
      prefetchToolChunk('pricing');
      prefetchToolChunk('sign-in');
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(warmCriticalInteractiveChunks, { timeout: 2000 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warmCriticalInteractiveChunks, 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div
        className="min-h-screen flex flex-col bg-transparent text-on-background font-sans transition-colors duration-200 selection:bg-primary-fixed/30 overflow-x-hidden w-full relative"
        id="app_shell"
      >
        {/* Zero-filter GPU-friendly ambient mesh background */}
        <div
          className="fixed inset-0 -z-20 pointer-events-none bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-black dark:to-slate-950"
          aria-hidden="true"
        >
          <div className="hidden sm:block absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(20,184,166,0.12)_0%,transparent_45%),radial-gradient(circle_at_85%_40%,rgba(16,185,129,0.12)_0%,transparent_45%),radial-gradient(circle_at_45%_90%,rgba(59,130,246,0.10)_0%,transparent_50%)]" />
        </div>
        <LanguageSuggestionBanner />
        <Header
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {mobileMenuOpen && (
          <SilentErrorBoundary>
            <React.Suspense fallback={null}>
              <MobileDrawer
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                theme={theme}
                setThemeSetting={setThemeSetting}
                menuItems={menuItems}
              />
            </React.Suspense>
          </SilentErrorBoundary>
        )}

        {/* Primary Page Canvas Container with Left Tools Menu Bar */}
        <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row lg:items-start gap-6">
          <ToolsSidebar items={menuItems} activeToolSlug={activeToolSlug} />

          <main
            className="flex-1 min-w-0 w-full"
            id="main-content"
          >
            <div className="container-pdfminty py-1 sm:py-2 lg:py-3 relative z-10">
              <Breadcrumbs />
              <InternalSEO />
              {children}
              <div className="content-auto">
                {activeToolSlug && (
                  <SilentErrorBoundary>
                    <React.Suspense fallback={null}>
                      <ToolContentSection slug={activeToolSlug} />
                    </React.Suspense>
                  </SilentErrorBoundary>
                )}
                <SilentErrorBoundary>
                  <RelatedTools />
                  {activeToolSlug && <RelatedBlogs />}
                </SilentErrorBoundary>
              </div>
            </div>
          </main>
        </div>

        <Footer setShowFeedbackModal={setShowFeedbackModal} />

        {showFeedbackModal && (
          <SilentErrorBoundary>
            <React.Suspense fallback={null}>
              <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
            </React.Suspense>
          </SilentErrorBoundary>
        )}
        <SilentErrorBoundary>
          <React.Suspense fallback={null}>
            <ConsentManager />
          </React.Suspense>
        </SilentErrorBoundary>
      </div>
    </LayoutContext.Provider>
  );
};
