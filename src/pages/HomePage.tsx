import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EmailJoinForm } from '../components/EmailJoinForm';
import { useLayout } from '../components/Layout';
import { SEO } from '../components/SEO';
import { SeoResourcesSection } from '../components/SeoResourcesSection';
import { TOOLS_CATALOG as TOOLS } from '../config/seo-catalog';
import { useDebounce } from '../hooks/useDebounce';

import { CtaSection } from './home/CtaSection';
import { FaqSection } from './home/FaqSection';
import { HeroSection } from './home/HeroSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { RecommendedToolsSection } from './home/RecommendedToolsSection';
import { SearchBar } from './home/SearchBar';
import { ToolGrid, CORE_ESSENTIAL_SLUGS } from './home/ToolGrid';
import { TrustBadgeSection } from './home/TrustBadgeSection';
import { WhyChooseSection } from './home/WhyChooseSection';

const CATEGORIES = [
  { id: 'all', nameKey: 'home.categories.all', defaultName: 'All Tools' },
  { id: 'essential', nameKey: 'home.categories.workflows', defaultName: 'Core Essentials' },
  { id: 'specialist', nameKey: 'home.categories.specialist', defaultName: 'Advanced & AI' },
  { id: 'organize', nameKey: 'home.categories.organize', defaultName: 'Organize PDF' },
  { id: 'optimize', nameKey: 'home.categories.optimize', defaultName: 'Optimize PDF' },
  { id: 'convert', nameKey: 'home.categories.convert', defaultName: 'Convert PDF' },
  { id: 'edit', nameKey: 'home.categories.edit', defaultName: 'Edit PDF' },
  { id: 'security', nameKey: 'home.categories.security', defaultName: 'PDF Security' },
  { id: 'intelligence', nameKey: 'home.categories.intelligence', defaultName: 'PDF Intelligence' },
];

const isToolInCategory = (slug: string, categoryId: string): boolean => {
  if (categoryId === 'all') return true;
  if (categoryId === 'essential' || categoryId === 'workflows') {
    return CORE_ESSENTIAL_SLUGS.has(slug);
  }
  if (categoryId === 'specialist') {
    return !CORE_ESSENTIAL_SLUGS.has(slug);
  }

  switch (categoryId) {
    case 'organize':
      return [
        'reorder-pdf',
        'extract-pages-pdf',
        'delete-pages-pdf',
        'rotate-pdf',
        'add-blank-page',
      ].includes(slug);
    case 'optimize':
      return [
        'compress-pdf',
        'grayscale-pdf',
        'repair-pdf',
        'sanitize-pdf',
        'flatten-pdf',
      ].includes(slug);
    case 'convert':
      return ['image-to-pdf', 'pdf-to-image', 'pdf-to-markdown'].includes(slug);
    case 'edit':
      return [
        'watermark-pdf',
        'add-page-numbers',
        'edit-pdf-metadata',
        'sign-pdf',
        'compare-pdf',
      ].includes(slug);
    case 'security':
      return ['protect-pdf', 'unlock-pdf', 'flatten-pdf', 'sanitize-pdf'].includes(slug);
    case 'intelligence':
      return ['ai-analyze-pdf', 'ocr-pdf'].includes(slug);
    default:
      return false;
  }
};

const TOOL_RANK_MAP = new Map(TOOLS.map((t) => [t.slug, t.homeRank ?? 999]));

export const HomePage: React.FC = () => {
  const { toolsList = [] } = useLayout() || {};
  const { t, i18n } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { debouncedValue, isDebouncing } = useDebounce(searchQuery, 200);
  const isBn = (i18n.language || '').startsWith('bn');

  const sortedTools = useMemo(() => {
    if (!Array.isArray(toolsList)) return [];
    return [...toolsList].sort((a, b) => {
      if (!a || !a.slug) return 0;
      if (!b || !b.slug) return 0;
      const rankA = TOOL_RANK_MAP.get(a.slug) ?? 999;
      const rankB = TOOL_RANK_MAP.get(b.slug) ?? 999;
      return rankA - rankB;
    });
  }, [toolsList]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of CATEGORIES) {
      counts[category.id] = sortedTools.filter(
        (tool) => tool && tool.slug && isToolInCategory(tool.slug, category.id)
      ).length;
    }
    return counts;
  }, [sortedTools]);

  const filteredTools = useMemo(() => {
    const cleanQuery = (debouncedValue || '').toLowerCase().trim();

    // First filter by category
    const categoryFiltered = sortedTools.filter((tool) => {
      return tool && tool.slug && isToolInCategory(tool.slug, selectedCategory);
    });

    if (!cleanQuery) return categoryFiltered;

    return categoryFiltered.filter((tool) => {
      const locName = t(`tools.${tool.slug}.name`, { defaultValue: tool.name });
      const locDesc = t(`tools.${tool.slug}.desc`, { defaultValue: tool.description });
      return (
        (tool.name || '').toLowerCase().includes(cleanQuery) ||
        (tool.description || '').toLowerCase().includes(cleanQuery) ||
        locName.toLowerCase().includes(cleanQuery) ||
        locDesc.toLowerCase().includes(cleanQuery)
      );
    });
  }, [sortedTools, debouncedValue, selectedCategory, t]);

  const getCategoryLabel = (category: (typeof CATEGORIES)[number]) => {
    if (category.id === 'essential') {
      return isBn ? 'মূল ও জনপ্রিয়' : 'Core Essentials';
    }
    if (category.id === 'specialist') {
      return isBn ? 'অ্যাডভান্সড ও AI' : 'Advanced & AI';
    }
    return t(category.nameKey, { defaultValue: category.defaultName });
  };

  const showTwoSections = selectedCategory === 'all' && !(debouncedValue || '').trim();

  return (
    <div className="animate-fadein relative z-10 font-sans text-on-background bg-transparent pb-12 overflow-x-hidden">
      <SEO />

      {/* Decorative Glow Elements */}
      <div
        className="absolute top-[-150px] left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[450px] pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,var(--custom-security-green)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      <HeroSection />

      <section aria-labelledby="all-tools-heading">
        <h2 id="all-tools-heading" className="sr-only">
          {t('homePage.srToolsHeading', { defaultValue: 'Free In-Browser PDF Tools' })}
        </h2>

        <div className="mb-7 max-w-lg mx-auto px-4" id="all-tools">
          <SearchBar value={searchQuery} onChange={setSearchQuery} isDebouncing={isDebouncing} />
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10 max-w-5xl mx-auto px-4" id="tool-categories">
          <div className="flex items-center sm:justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto scrollbar-none select-none">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;
              const count = categoryCounts[category.id] ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span>{getCategoryLabel(category)}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isActive
                        ? 'text-emerald-600/80 dark:text-emerald-400/80 font-bold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ToolGrid
          filteredTools={filteredTools}
          showTwoSections={showTwoSections}
          onClearSearch={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      </section>

      <div className="content-auto">
        <HowItWorksSection />
      </div>

      <div className="content-auto">
        <WhyChooseSection />
      </div>

      <div className="content-auto">
        <RecommendedToolsSection />
      </div>

      <div className="content-auto">
        <SeoResourcesSection />
      </div>

      <div className="content-auto">
        <FaqSection />
      </div>

      <div className="mt-16 max-w-4xl mx-auto px-4 content-auto">
        <EmailJoinForm />
      </div>

      <div className="content-auto">
        <CtaSection />
      </div>

      <div className="content-auto">
        <TrustBadgeSection />
      </div>
    </div>
  );
};

export default HomePage;
