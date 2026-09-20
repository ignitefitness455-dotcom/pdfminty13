import { HelpCircle, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FAQS } from '../../config/seo-data';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation('common');

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const rawFaqItems = t('home.faq.items', { returnObjects: true, defaultValue: FAQS });
  const faqItems = (Array.isArray(rawFaqItems) ? rawFaqItems : FAQS) as Array<{ q: string; a: string }>;

  return (
    <div className="mt-24 relative z-20 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-4 h-4" />
          <span>{t('home.faq.badge', { defaultValue: 'Frequently Asked Questions' })}</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-primary tracking-tight font-sans">
          {t('home.faq.title', { defaultValue: 'Got Questions? We Have Answers.' })}
        </h2>
        <p className="text-on-surface-variant text-sm md:text-base mt-2 font-normal">
          {t('home.faq.subtitle', {
            defaultValue: "Everything you need to know about PDFMinty's private, in-browser PDF tools.",
          })}
        </p>
      </div>

      <div className="space-y-4">
        {faqItems.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-white/50 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 backdrop-blur-xl overflow-hidden shadow-sm transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base md:text-lg text-primary hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-on-surface-variant shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-500' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-2 text-sm md:text-base text-on-surface-variant leading-relaxed border-t border-border-muted/50 font-normal">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
