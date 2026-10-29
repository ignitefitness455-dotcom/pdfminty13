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
import React, { useState, createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { TOOLS_CATALOG as TOOLS } from '../config/seo-catalog';
import { useTheme } from '../contexts/ThemeContext';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
  getLocalizedPath,
} from '../i18n/config';
import { lazyWithRetry } from '../utils/lazyWithRetry';

import { Footer } from './Footer';
import { Header } from './Header';
import InternalSEO, { Breadcrumbs } from './InternalSEO';
import LanguageSuggestionBanner from './LanguageSuggestionBanner';
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
const RelatedTools = lazyWithRetry(() =>
  import('./RelatedTools').then((m) => ({ default: m.RelatedTools }))
);
const RelatedBlogs = lazyWithRetry(() =>
  import('./RelatedBlogs').then((m) => ({ default: m.RelatedBlogs }))
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

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div
        className="min-h-screen flex flex-col bg-transparent text-on-background font-sans transition-colors duration-200 selection:bg-primary-fixed/30 overflow-x-hidden w-full relative"
        id="app_shell"
      >
        {/* Apple-style Premium Mesh Gradient Background with mobile-optimized blur */}
        <div className="fixed inset-0 -z-20 pointer-events-none transform-gpu bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-black dark:to-slate-950">
          <div className="hidden sm:block absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 dark:bg-teal-600/20 blur-[100px] sm:blur-[140px] transform-gpu" />
          <div className="hidden sm:block absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-400/20 dark:bg-emerald-600/20 blur-[100px] sm:blur-[140px] transform-gpu" />
          <div className="hidden sm:block absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-300/20 dark:bg-blue-900/20 blur-[100px] sm:blur-[140px] transform-gpu" />
        </div>
        <LanguageSuggestionBanner />
        <Header
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {mobileMenuOpen && (
          <React.Suspense fallback={null}>
            <MobileDrawer
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              theme={theme}
              setThemeSetting={setThemeSetting}
              menuItems={menuItems}
            />
          </React.Suspense>
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
                  <React.Suspense fallback={null}>
                    <ToolContentSection slug={activeToolSlug} />
                  </React.Suspense>
                )}
                <React.Suspense fallback={null}>
                  <RelatedTools />
                  <RelatedBlogs />
                </React.Suspense>
              </div>
            </div>
          </main>
        </div>

        <Footer setShowFeedbackModal={setShowFeedbackModal} />

        {showFeedbackModal && (
          <React.Suspense fallback={null}>
            <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
          </React.Suspense>
        )}
        <React.Suspense fallback={null}>
          <ConsentManager />
        </React.Suspense>
      </div>
    </LayoutContext.Provider>
  );
};
