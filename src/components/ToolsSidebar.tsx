import { Wrench, ChevronRight, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { prefetchToolChunk } from '../config/homeConfig';

export interface ToolSidebarItem {
  slug: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ToolsSidebarProps {
  items: ToolSidebarItem[];
  activeToolSlug: string | null;
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = React.memo(
  ({ items, activeToolSlug }) => {
    const { t } = useTranslation('common');
    const [mobileOpen, setMobileOpen] = useState(false);

    const sectionTitle = t('mobileDrawer.sectionTools', { defaultValue: 'PDF Tools' });

    return (
      <>
        {/* Mobile & Tablet Left-Menu Trigger Bar (< lg) */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="tools-left-drawer"
            id="mobile-tools-sidebar-trigger"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">{sectionTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Mobile & Tablet Left Slide-Over Sidebar (< lg) */}
        {mobileOpen && (
          <div
            id="tools-left-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={sectionTitle}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <button
              type="button"
              aria-label={t('header.mobileMenu.close', { defaultValue: 'Close menu' })}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs border-0 cursor-default"
            />
            <aside className="relative z-10 w-64 max-w-[80vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-extrabold tracking-wide text-slate-900 dark:text-white">
                    {sectionTitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('header.mobileMenu.close', { defaultValue: 'Close menu' })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav
                aria-label={sectionTitle}
                className="flex-1 overflow-y-auto p-2.5 space-y-0.5"
              >
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeToolSlug === item.slug;
                  return (
                    <Link
                      key={item.slug}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      onPointerDown={() => prefetchToolChunk(item.slug)}
                      onMouseEnter={() => prefetchToolChunk(item.slug)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-emerald-600 dark:hover:text-emerald-400 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Desktop Persistent Left Sidebar Menu (lg+) */}
        <aside
          id="tools-left-sidebar"
          aria-label={sectionTitle}
          className="hidden lg:block w-56 xl:w-60 shrink-0"
        >
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/75 backdrop-blur-md shadow-2xs overflow-hidden">
            <div className="px-3.5 py-3 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center gap-2">
              <Wrench
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {sectionTitle}
              </span>
            </div>
            <nav
              aria-label={sectionTitle}
              className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin"
            >
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeToolSlug === item.slug;
                return (
                  <Link
                    key={item.slug}
                    to={item.path}
                    id={`sidebar-tool-${item.slug}`}
                    onPointerDown={() => prefetchToolChunk(item.slug)}
                    onMouseEnter={() => prefetchToolChunk(item.slug)}
                    onFocus={() => prefetchToolChunk(item.slug)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors group whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-emerald-600 dark:hover:text-emerald-400 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </>
    );
  }
);

ToolsSidebar.displayName = 'ToolsSidebar';
