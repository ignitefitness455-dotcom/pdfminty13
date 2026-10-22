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

import { TOOLS } from '../config/seo-data';
import { useTheme } from '../contexts/ThemeContext';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/config';

import { ConsentManager } from './ConsentManager';
import { FeedbackModal } from './FeedbackModal';
import { Footer } from './Footer';
import { Header } from './Header';
import InternalSEO, { Breadcrumbs } from './InternalSEO';
import LanguageSuggestionBanner from './LanguageSuggestionBanner';
import { MobileDrawer } from './MobileDrawer';

const ToolContentSection = React.lazy(() =>
  import('./ToolContentSection').then((m) => ({ default: m.ToolContentSection }))
);
const RelatedTools = React.lazy(() =>
  import('./RelatedTools').then((m) => ({ default: m.RelatedTools }))
);
const RelatedBlogs = React.lazy(() =>
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
  const { t } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, setTheme: setThemeSetting } = useTheme();
  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
        name: t(`tools.${toolItem.slug}.name`, { defaultValue: toolItem.name }),
        path: `/${toolItem.slug}/`,
        icon: iconMap[toolItem.icon] || HelpCircle,
        desc: t(`tools.${toolItem.slug}.desc`, { defaultValue: toolItem.shortDescription }),
      })),
    [iconMap, t]
  );

  return (
    <LayoutContext.Provider value={{ toolsList }}>
      <div
        className="min-h-screen flex flex-col bg-transparent text-on-background font-sans transition-colors duration-200 selection:bg-primary-fixed/30 overflow-x-hidden w-full relative"
        id="app_shell"
      >
        {/* Apple-style Premium Mesh Gradient Background */}
        <div className="fixed inset-0 -z-20 pointer-events-none bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-black dark:to-slate-950">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 dark:bg-teal-600/20 blur-[100px] sm:blur-[140px]" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-400/20 dark:bg-emerald-600/20 blur-[100px] sm:blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-300/20 dark:bg-blue-900/20 blur-[100px] sm:blur-[140px]" />
        </div>
        <LanguageSuggestionBanner />
        <Header
          theme={theme}
          setThemeSetting={setThemeSetting}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <MobileDrawer
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          theme={theme}
          setThemeSetting={setThemeSetting}
          menuItems={menuItems}
        />

        {/* Primary Page Canvas Container */}
        <main
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
          id="main-content"
        >
          <div className="container-pdfminty py-2 sm:py-4 lg:py-6 relative z-10">
            <Breadcrumbs />
            <InternalSEO />
            {children}
            {(() => {
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
              return (
                <React.Suspense fallback={null}>
                  {activeItem?.type === 'tool' && <ToolContentSection tool={activeItem} />}
                  <RelatedTools />
                  <RelatedBlogs />
                </React.Suspense>
              );
            })()}
          </div>
        </main>

        <Footer setShowFeedbackModal={setShowFeedbackModal} />

        <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
        <ConsentManager />
      </div>
    </LayoutContext.Provider>
  );
};
