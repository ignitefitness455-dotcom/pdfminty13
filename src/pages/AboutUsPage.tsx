import { Heart, Lock, Zap, CheckCircle, ArrowRight, Sparkles, MapPin, Github, Mail, UserCheck, ShieldCheck, Code2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { PRIMARY_AUTHOR } from '../config/author';
import { ROUTES } from '../config/routes';

export const AboutUsPage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="About Us — Privacy-First PDF Tools | PdfMinty"
        descriptionOverride="Learn about PdfMinty: a fast, privacy-first PDF utility suite built to process files 100% locally in your web browser. Zero server uploads, zero signups."
      />

      <div className="max-w-4xl mx-auto space-y-16" id="about-us-container">
        {/* Header Hero */}
        <header className="text-center space-y-6 border-b border-border-muted pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            <span>{t('aboutUs.missionBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-on-surface tracking-tight leading-tight max-w-3xl mx-auto">
            {t('aboutUs.mainTitle')}{' '}
            <span className="text-emerald-500">
              {t('aboutUs.zeroUploads', { defaultValue: 'Zero Uploads. Zero Compromise.' })}
            </span>
          </h1>

          <p className="text-base sm:text-xl font-medium text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            {t('aboutUs.intro')}
          </p>
        </header>

        {/* The Problem & Solution */}
        <section className="grid sm:grid-cols-2 gap-8 items-stretch">
          <div className="bg-surface-container-low border border-border-muted p-8 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-lg">
                ⚠️
              </div>
              <h2 className="text-xl font-extrabold text-on-surface">
                {t('aboutUs.traditionalProblem', { defaultValue: 'The Traditional Problem' })}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                {t('aboutUs.problemDesc')}
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low border border-emerald-500/30 p-8 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg">
                🛡️
              </div>
              <h2 className="text-xl font-extrabold text-on-surface">
                {t('aboutUs.pdfmintySolution', { defaultValue: 'The PdfMinty Solution' })}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                {t('aboutUs.solutionDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="space-y-8 bg-surface-container-low border border-border-muted p-8 sm:p-10 rounded-3xl shadow-sm">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {t('aboutUs.coreValues', { defaultValue: 'Our Core Values' })}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              {t('aboutUs.designDecision', {
                defaultValue:
                  'Every design decision at PdfMinty is guided by three non-negotiable promises.',
              })}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-3 p-4 rounded-2xl bg-surface-container-high/50 border border-border-muted/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-on-surface">
                {t('aboutUs.inBrowserPrivacy', { defaultValue: 'In-Browser Privacy' })}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {t('aboutUs.standardToolsPrivacy', {
                  defaultValue:
                    'Standard PDF tools process files directly in your browser memory on your local device.',
                })}
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-surface-container-high/50 border border-border-muted/50">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-on-surface">
                {t('aboutUs.fastExecution', { defaultValue: 'Fast Local Execution' })}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {t('aboutUs.noWaiting', {
                  defaultValue:
                    'No waiting for uploads or downloads. Processing happens instantly on your device.',
                })}
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-surface-container-high/50 border border-border-muted/50">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-on-surface">{t('aboutUs.freeAccessible')}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {t('aboutUs.freeForever', {
                  defaultValue:
                    'No signups, paywalls, or hidden watermarks. Professional PDF tools for everyone.',
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Accessible Accessibility Features */}
        <section className="space-y-6 bg-surface-container-low border border-border-muted p-8 sm:p-10 rounded-3xl shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {t('aboutUs.builtForEveryone', { defaultValue: 'Built for Everyone' })}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              {t('aboutUs.accessibleDesc', {
                defaultValue:
                  'PdfMinty is designed from the ground up to be accessible, fast, and easy to use for all visitors.',
              })}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs font-semibold text-on-surface-variant">
            <div className="p-4 rounded-xl bg-surface-container-high border border-border-muted flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{t('aboutUs.keyboardNav')}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-high border border-border-muted flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{t('aboutUs.screenReader')}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-high border border-border-muted flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                {t('aboutUs.skipLinks', { defaultValue: 'Skip Navigation Links for Efficiency' })}
              </span>
            </div>
          </div>
        </section>

        {/* Meet the Creator & Engineering Team (AdSense E-E-A-T & Transparency) */}
        <section
          id="creator"
          className="space-y-8 bg-surface-container-low border border-border-muted p-8 sm:p-10 rounded-3xl shadow-sm"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4" />
              <span>{t('aboutUs.creatorBadge', { defaultValue: 'Founder & Engineering Accountability' })}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {t('aboutUs.creatorTitle', { defaultValue: 'Who Builds & Maintains PdfMinty' })}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              {t('aboutUs.creatorSubtitle', {
                defaultValue:
                  'Behind every line of code at PdfMinty is human dedication to open web security, transparency, and personal data sovereignty.',
              })}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-high/60 border border-border-muted space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border-muted/70">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider">
                    <span>TM</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-on-surface">
                      {PRIMARY_AUTHOR.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                      {t('aboutUs.founderBadge', { defaultValue: 'Founder & Lead Engineer' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                    {PRIMARY_AUTHOR.jobTitle}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{PRIMARY_AUTHOR.city}, {PRIMARY_AUTHOR.country} 🇧🇩</span>
                  </div>
                </div>
              </div>

              {/* Direct Social & Contact Channels */}
              <div className="flex items-center gap-3">
                <a
                  href={PRIMARY_AUTHOR.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository & Profile"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-muted text-xs font-bold text-on-surface transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href={`mailto:${PRIMARY_AUTHOR.email}`}
                  aria-label="Contact Founder directly"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Developer</span>
                </a>
              </div>
            </div>

            {/* Backstory & Philosophy */}
            <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <p>
                {t('aboutUs.creatorBioP1', {
                  defaultValue:
                    'PdfMinty was engineered and founded by Mohammed Tanveer Munshi, a full-stack software engineer and open-web security researcher based in Dhaka, Bangladesh. With over 6 years of expertise building browser-native architectures and high-performance WebAssembly applications, Tanveer created PdfMinty after witnessing countless online conversion sites silently store private contracts, tax records, and medical files on third-party cloud servers.',
                })}
              </p>
              <p>
                {t('aboutUs.creatorBioP2', {
                  defaultValue:
                    'Rather than building another subscription-gated cloud service, PdfMinty was architected with a strict zero-upload mandate. All core operations execute directly inside the user’s browser memory via compiled WebAssembly and Web Workers. We believe software developers have a responsibility to design tools that respect user autonomy and privacy by default.',
                })}
              </p>
            </div>

            {/* Technical Verification Highlights */}
            <div className="pt-4 border-t border-border-muted/60 grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-container/60 border border-border-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t('aboutUs.humanAccountability', { defaultValue: 'Human Accountability & E-E-A-T' })}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  {t('aboutUs.humanDesc', {
                    defaultValue:
                      'All algorithms, blog tutorials, and tools are actively maintained and code-reviewed by real software engineers. We maintain transparent contact channels for security audits and bug reports.',
                  })}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container/60 border border-border-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('aboutUs.coreTechStack', { defaultValue: 'Core Technology Stack' })}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  {t('aboutUs.techDesc', {
                    defaultValue:
                      'Built using TypeScript, React 18, WebAssembly (Wasm), Web Workers, and the Web Cryptography API (AES-GCM) with zero persistent server-side file buffers.',
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {t('aboutUs.readyToExperience', {
              defaultValue: 'Ready to experience private PDF processing?',
            })}
          </h2>
          <p className="text-base sm:text-lg font-bold text-emerald-100 max-w-xl mx-auto">
            {t('aboutUs.tryTools')}
          </p>
          <div className="pt-2">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-900 dark:!bg-white dark:!text-emerald-900 hover:dark:!bg-emerald-50 font-black text-base rounded-2xl transition-all shadow-lg hover:bg-emerald-50 hover:scale-105 active:scale-100"
            >
              <span>{t('aboutUs.exploreTools', { defaultValue: 'Explore All PDF Tools' })}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;
