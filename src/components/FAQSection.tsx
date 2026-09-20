import { ChevronDown, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FAQItem, getToolFaqs } from '../data/toolFaqs';

export interface FAQSectionProps {
  faqs?: Array<{ question?: string; q?: string; answer?: string; a?: string }>;
  toolId?: string;
  title?: string;
  description?: string;
  className?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  faqs: customFaqs,
  toolId,
  title: customTitle,
  description,
  className = '',
}) => {
  const { t } = useTranslation('faq');

  // Derive FAQs either from explicit prop, i18next translation, or toolFaqs.ts fallback
  const faqs: FAQItem[] = React.useMemo(() => {
    if (customFaqs && customFaqs.length > 0) {
      return customFaqs.map((f) => ({
        question: f.question || f.q || '',
        answer: f.answer || f.a || '',
      }));
    }
    if (toolId) {
      const translated = t(toolId, { returnObjects: true });
      if (
        Array.isArray(translated) &&
        translated.length > 0 &&
        typeof translated[0] === 'object' &&
        'question' in translated[0]
      ) {
        return translated as FAQItem[];
      }

      // Check alias (e.g. merge-pdf -> merge) if primary key wasn't matched in translation
      if (toolId === 'merge-pdf') {
        const aliasTranslated = t('merge', { returnObjects: true });
        if (
          Array.isArray(aliasTranslated) &&
          aliasTranslated.length > 0 &&
          typeof aliasTranslated[0] === 'object' &&
          'question' in aliasTranslated[0]
        ) {
          return aliasTranslated as FAQItem[];
        }
      }

      return getToolFaqs(toolId);
    }
    return [];
  }, [customFaqs, toolId, t]);

  // Derive title from customTitle prop or i18n
  const displayTitle =
    customTitle || t('sectionTitle', { defaultValue: 'Frequently Asked Questions' });

  // Track open state for accordion items
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]); // First item open by default

  const toggleItem = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className={`py-10 ${className}`} id="faq-section">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {displayTitle}
            </h2>
            {description && (
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Accordion list */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60" role="region" aria-label="FAQ Accordion">
          {faqs.map((faq, index) => {
            const isOpen = openIndexes.includes(index);
            const questionId = `faq-q-${index}`;
            const answerId = `faq-a-${index}`;

            return (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleItem(index)}
                  className="w-full text-left flex items-center justify-between gap-4 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
                >
                  <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    className="mt-2.5 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 pr-4"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
