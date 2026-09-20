import { HelpCircle, ChevronDown, Check, Shield } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NORD_AFFILIATE_LINKS } from '../config/constants';
import { TOOLS } from '../config/seo-data';

interface ToolGuideProps {
  slug: string;
}

export const ToolGuide: React.FC<ToolGuideProps> = ({ slug }) => {
  const { t } = useTranslation();
  // Find the matching tool
  const tool = TOOLS.find((t) => t.slug === slug);

  // If no matching tool, or it lacks both howTo and faqs, render nothing
  if (!tool || (!tool.howTo && !tool.faqs)) {
    return null;
  }

  const { name, howTo, faqs } = tool;

  return (
    <div className="mt-16 pt-12 border-t border-border-muted space-y-16" id="tool-guide-wrapper">
      {/* "How it works" Steps Section */}
      {howTo && howTo.steps && howTo.steps.length > 0 && (
        <section className="space-y-8" id="tool-guide-howto-section">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">
              {t(`tools.${tool.slug}.howTo.name`, { defaultValue: howTo.name || `How to Use ${name}` })}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {t('toolGuide.howtoSubtitle', { defaultValue: 'Follow these simple, secure steps to process your documents locally in seconds.' })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howTo.steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-surface-container-low p-6 rounded-2xl border border-border-muted shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                id={`howto-step-card-${index + 1}`}
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-border-muted flex items-center justify-center font-mono font-black text-on-surface text-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                    0{index + 1}
                  </div>
                  <p className="text-on-surface-variant text-sm font-semibold leading-relaxed">
                    {t(`tools.${tool.slug}.howTo.steps.${index}`, { defaultValue: step })}
                  </p>
                </div>
                <div className="pt-4 flex items-center space-x-1 text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('toolGuide.stepComplete', { defaultValue: 'Step Complete' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs Accordion Section */}
      {faqs && faqs.length > 0 && (
        <section className="space-y-8 max-w-3xl mx-auto" id="tool-guide-faq-section">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-on-surface tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <span>{t('toolGuide.faqTitle', { defaultValue: 'Frequently Asked Questions' })}</span>
            </h2>
            <p className="text-on-surface-variant text-sm">
              {t('toolGuide.faqSubtitle', { defaultValue: 'Have questions about privacy, capabilities, or technical details? We have direct answers.' })}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group border border-border-muted rounded-2xl bg-surface-container-low shadow-sm open:border-emerald-500/40 transition-all overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                id={`faq-details-item-${index + 1}`}
              >
                <summary className="flex items-center justify-between p-5 font-bold text-on-surface text-sm md:text-base cursor-pointer hover:bg-surface-container-high/50 select-none list-none outline-none focus:ring-2 focus:ring-emerald-500/25">
                  <span className="pr-4 leading-snug">{t(`tools.${tool.slug}.faqs.${index}.q`, { defaultValue: faq.q })}</span>
                  <ChevronDown className="w-5 h-5 text-on-surface-variant group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 pt-1 border-t border-border-muted/50 bg-surface-container-high/20 text-on-surface-variant text-sm leading-relaxed">
                  <p>{t(`tools.${tool.slug}.faqs.${index}.a`, { defaultValue: faq.a })}</p>
                </div>
              </details>
            ))}
          </div>

          {/* Recommended Security Tools Box */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>{t('toolGuide.securityTools', { defaultValue: 'Recommended Security Tools' })}</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                {t('toolGuide.securityToolsDesc', { defaultValue: 'Ensure document confidentiality on any network with VPN encryption & password management.' })}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
              <a
                href={NORD_AFFILIATE_LINKS.NORDVPN}
                target="_blank"
                rel="nofollow sponsored noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                NordVPN &rarr;
              </a>
              <span className="text-border-muted">|</span>
              <a
                href={NORD_AFFILIATE_LINKS.NORDPASS}
                target="_blank"
                rel="nofollow sponsored noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                NordPass &rarr;
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ToolGuide;
