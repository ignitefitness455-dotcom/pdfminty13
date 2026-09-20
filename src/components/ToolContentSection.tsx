import {
  HelpCircle,
  ChevronDown,
  Check,
  Shield,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Cpu,
  Laptop,
  FileCode,
  ExternalLink,
  Calendar,
  Lock,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { NORD_AFFILIATE_LINKS } from '../config/constants';
import { ToolSEOInfo } from '../config/seo-data';

interface ToolContentSectionProps {
  tool: ToolSEOInfo;
}

export const ToolContentSection: React.FC<ToolContentSectionProps> = ({ tool }) => {
  const { t, i18n } = useTranslation('common');

  if (!tool) return null;

  const isEn = !i18n.language || i18n.language === 'en';

  const {
    name,
    howTo,
    faqs,
    problemSolved,
    primaryCtaText,
    supportedFormats,
    technicalNotes,
    privacyNote,
    troubleshooting,
    relatedLinks,
    lastReviewedDate = 'August 2026 • Verified by Security & Product Architecture Team',
    longFormBody,
    slug,
  } = tool;

  const toolName = t(`tools.${slug}.name`, { defaultValue: name });

  const localizedProblemSolved = t(`tools.${slug}.problemSolved`, { defaultValue: problemSolved });
  const localizedCtaText = t(`tools.${slug}.primaryCtaText`, {
    defaultValue: primaryCtaText || `Start ${toolName} Now`,
  });
  const localizedHowToName = t(`tools.${slug}.howTo.name`, {
    defaultValue: howTo?.name || `How to Use ${toolName}`,
  });
  const localizedLimits = t(`tools.${slug}.limits`, {
    defaultValue: supportedFormats?.limits || '',
  });
  const localizedDeviceBrowser = t(`tools.${slug}.deviceBrowser`, {
    defaultValue: technicalNotes?.deviceBrowser || '',
  });
  const localizedFileSizeMemory = t(`tools.${slug}.fileSizeMemory`, {
    defaultValue: technicalNotes?.fileSizeMemory || '',
  });
  const localizedAccessibility = t(`tools.${slug}.accessibility`, {
    defaultValue: technicalNotes?.accessibility || '',
  });
  const localizedPrivacyNote = t(`tools.${slug}.privacyNote`, {
    defaultValue: privacyNote || '',
  });
  const localizedLongFormBody = t(`tools.${slug}.longFormBody`, {
    defaultValue: isEn ? longFormBody : '',
  });

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const uploaderEl =
      document.getElementById('file-uploader-deck') ||
      document.getElementById('file-uploader-input') ||
      document.getElementById('main-tool-workspace') ||
      document.querySelector('input[type="file"]');

    if (uploaderEl) {
      uploaderEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (uploaderEl instanceof HTMLInputElement) {
        uploaderEl.click();
      } else {
        const inputInside = uploaderEl.querySelector('input[type="file"]') as HTMLInputElement | null;
        if (inputInside) inputInside.click();
      }
    }
  };

  return (
    <div className="mt-16 pt-12 border-t border-border-muted space-y-12 sm:space-y-16" id="tool-content-section">
      {/* 1. Problem Solved & Primary CTA Banner */}
      {problemSolved && (
        <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-border-muted shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('toolContent.problemSolved', { defaultValue: 'Problem Solved' })}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
              {t('toolContent.whyUse', { name: toolName, defaultValue: `Why Use ${toolName}?` })}
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed font-normal">
              {localizedProblemSolved}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border-muted/60">
            <a
              href="#file-uploader-deck"
              onClick={handleCtaClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer text-sm sm:text-base"
              aria-label={`Primary CTA: ${localizedCtaText}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{localizedCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-on-surface-variant/80">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>
                {t('toolContent.lastReviewed', {
                  date: lastReviewedDate,
                  defaultValue: `Last reviewed: ${lastReviewedDate}`,
                })}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 2. Step-by-step instructions */}
      {howTo && howTo.steps && howTo.steps.length > 0 && (
        <section className="space-y-8" id="tool-howto-section">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {localizedHowToName}
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base">
              {t('toolContent.howToSubtitle', {
                defaultValue: 'Follow these clear, step-by-step instructions to complete your document task safely.',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {howTo.steps.map((step, index) => {
              const stepText = t(`tools.${slug}.howTo.steps.${index}`, { defaultValue: step });
              return (
                <div
                  key={index}
                  className="relative bg-surface-container-low p-6 sm:p-7 rounded-2xl border border-border-muted shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-border-muted flex items-center justify-center font-mono font-black text-on-surface text-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
                      0{index + 1}
                    </div>
                    <p className="text-on-surface-variant text-sm sm:text-base font-medium leading-relaxed">
                      {stepText}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center space-x-1.5 text-xs uppercase tracking-wider font-bold text-on-surface-variant/80">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{t('toolContent.stepComplete', { defaultValue: 'Step Complete' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Specifications: Formats & Limitations */}
      {supportedFormats && (
        <section className="space-y-6" id="tool-formats-specs">
          <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t('toolContent.supportedFormats', { defaultValue: 'Supported Formats & File Specifications' })}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                {t('toolContent.supportedInputs', { defaultValue: 'Supported Inputs' })}
              </span>
              <ul className="text-sm text-on-surface-variant space-y-2 font-medium">
                {supportedFormats.input.map((inp, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                {t('toolContent.outputFormats', { defaultValue: 'Output Formats' })}
              </span>
              <ul className="text-sm text-on-surface-variant space-y-2 font-medium">
                {supportedFormats.output.map((outp, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>{outp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                {t('toolContent.limitations', { defaultValue: 'Realistic Limitations' })}
              </span>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                {localizedLimits}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Device, Browser, File Size, Memory, and Accessibility Notes */}
      {technicalNotes && (
        <section className="space-y-6" id="tool-technical-notes">
          <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t('toolContent.compatibility', { defaultValue: 'Device, Browser & Accessibility Compatibility' })}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-on-surface uppercase tracking-wider">
                <Laptop className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('toolContent.devicesBrowsers', { defaultValue: 'Devices & Browsers' })}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                {localizedDeviceBrowser}
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-on-surface uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('toolContent.fileSizeMemory', { defaultValue: 'File Size & Memory' })}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                {localizedFileSizeMemory}
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-border-muted space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-on-surface uppercase tracking-wider">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('toolContent.accessibility', { defaultValue: 'Accessibility' })}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                {localizedAccessibility}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. Verified Privacy Explanation */}
      {privacyNote && (
        <section className="bg-emerald-500/10 border border-emerald-500/20 p-6 sm:p-7 rounded-2xl space-y-3" id="tool-privacy-note">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{t('toolContent.privacyGuarantee', { defaultValue: 'Verified Technical Privacy Guarantee' })}</span>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant font-normal leading-relaxed">
            {localizedPrivacyNote}
          </p>
        </section>
      )}

      {/* 6. Troubleshooting Section */}
      {troubleshooting && troubleshooting.length > 0 && (
        <section className="space-y-6" id="tool-troubleshooting-section">
          <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{t('toolContent.troubleshooting', { defaultValue: 'Troubleshooting Common Issues' })}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {troubleshooting.map((item, idx) => {
              const issueText = t(`tools.${slug}.troubleshooting.${idx}.issue`, { defaultValue: item.issue });
              const resolutionText = t(`tools.${slug}.troubleshooting.${idx}.resolution`, { defaultValue: item.resolution });
              return (
                <div key={idx} className="bg-surface-container-low p-5 sm:p-6 rounded-2xl border border-border-muted space-y-2.5">
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{issueText}</span>
                  </p>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-normal pt-2 border-t border-border-muted/50">
                    <strong className="font-bold text-on-surface">{t('toolContent.resolution', { defaultValue: 'Resolution:' })}</strong>{' '}
                    {resolutionText}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. FAQs Accordion Section */}
      {faqs && faqs.length > 0 && (
        <section className="space-y-8 max-w-3xl mx-auto" id="tool-faq-section">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight flex items-center justify-center gap-2.5">
              <HelpCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <span>{t('toolContent.faqs', { defaultValue: 'Frequently Asked Questions' })}</span>
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base">
              {t('toolContent.faqsSubtitle', {
                defaultValue: 'Real questions answered directly with verified technical details.',
              })}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const question = t(`tools.${slug}.faqs.${index}.q`, { defaultValue: faq.q });
              const answer = t(`tools.${slug}.faqs.${index}.a`, { defaultValue: faq.a });
              return (
                <details
                  key={index}
                  className="group border border-border-muted rounded-2xl bg-surface-container-low shadow-sm open:border-emerald-500/40 transition-all overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between p-5 sm:p-6 font-bold text-on-surface text-sm sm:text-base cursor-pointer hover:bg-surface-container-high/50 select-none list-none outline-none focus:ring-2 focus:ring-emerald-500/25">
                    <span className="pr-4 leading-snug">{question}</span>
                    <ChevronDown className="w-5 h-5 text-on-surface-variant group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-border-muted/50 bg-surface-container-high/20 text-on-surface-variant text-sm sm:text-base leading-relaxed">
                    <p>{answer}</p>
                  </div>
                </details>
              );
            })}
          </div>

          {/* Third-party Sponsored / Affiliate Disclosure box below tool experience */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-border-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('toolContent.sponsoredTitle', { defaultValue: 'Recommended Network Security [Sponsored Partner]' })}</span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
                {t('toolContent.sponsoredDesc', {
                  defaultValue: 'Keep your internet connection encrypted on public Wi-Fi networks when handling PDF documents.',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs sm:text-sm font-bold">
              <a
                href={NORD_AFFILIATE_LINKS.NORDVPN}
                target="_blank"
                rel="nofollow sponsored noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>NordVPN ({t("affiliate.label", { defaultValue: "Affiliate" })})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-border-muted">|</span>
              <a
                href={NORD_AFFILIATE_LINKS.NORDPASS}
                target="_blank"
                rel="nofollow sponsored noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>NordPass ({t("affiliate.label", { defaultValue: "Affiliate" })})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 8. Related Tools & Related Guides */}
      {relatedLinks && relatedLinks.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-border-muted" id="tool-contextual-links">
          {(() => {
            const relatedToolsList = relatedLinks.filter(l => l.type === 'tool');
            const relatedGuidesList = relatedLinks.filter(l => l.type !== 'tool' && l.type !== 'home');

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {relatedToolsList.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>{t('toolContent.relatedTools', { defaultValue: 'Related Tools' })}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {relatedToolsList.map((link, idx) => {
                        const toolSlug = link.url.replace(/^\//, '');
                        const localizedTitle = t(`tools.${toolSlug}.name`, { defaultValue: link.title });
                        return (
                          <Link
                            key={idx}
                            to={link.url}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-muted text-xs sm:text-sm font-bold text-on-surface hover:text-emerald-600 transition-colors"
                          >
                            <span>{localizedTitle}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {relatedGuidesList.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" />
                      <span>{t('toolContent.relatedGuides', { defaultValue: 'Related Guides & Articles' })}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {relatedGuidesList.map((link, idx) => (
                        <Link
                          key={idx}
                          to={link.url}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-border-muted text-xs sm:text-sm font-bold text-on-surface hover:text-emerald-600 transition-colors"
                        >
                          <span>{link.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* 9. Long form body if additional explanatory text exists */}
      {localizedLongFormBody && (
        <article
          className="max-w-3xl mx-auto pt-8 border-t border-border-muted
            [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-on-surface dark:[&_h2]:text-slate-100 [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-4 
            [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-on-surface dark:[&_h3]:text-slate-100 [&_h3]:mt-8 [&_h3]:mb-3 
            [&_p]:text-on-surface-variant dark:[&_p]:text-slate-300 [&_p]:text-sm sm:[&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-6
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2.5 [&_ul]:mb-6 [&_ul_li]:text-on-surface-variant dark:[&_ul_li]:text-slate-300 [&_ul_li]:text-sm sm:[&_ul_li]:text-base [&_ul_li]:leading-relaxed
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2.5 [&_ol]:mb-6 [&_ol_li]:text-on-surface-variant dark:[&_ol_li]:text-slate-300 [&_ol_li]:text-sm sm:[&_ol_li]:text-base [&_ol_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-on-surface dark:[&_strong]:text-white
            [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline hover:[&_a]:opacity-80"
          dangerouslySetInnerHTML={{
            __html: localizedLongFormBody
              .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '')
              .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>'),
          }}
        />
      )}

      {/* 10. Clear Bottom Conversion CTA */}
      <section className="bg-surface-container-low p-6 sm:p-10 rounded-2xl border border-emerald-500/20 shadow-sm text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
          {t('toolContent.readyToUse', { name: toolName, defaultValue: `Ready to Use ${toolName}?` })}
        </h3>
        <p className="text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto font-normal">
          {t('toolContent.readySubtitle', {
            defaultValue: 'Zero software installation, no account registration, and 100% private in-browser document processing.',
          })}
        </p>
        <div className="pt-2">
          <a
            href="#file-uploader-deck"
            onClick={handleCtaClick}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer text-sm sm:text-base"
            aria-label={`Bottom CTA: ${localizedCtaText}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{localizedCtaText}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default ToolContentSection;
