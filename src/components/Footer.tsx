import { ShieldCheck, BookOpen } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ROUTES } from '../config/routes';

import LanguageSwitcher from './LanguageSwitcher';

export const Footer: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-white/30 dark:bg-black/20 backdrop-blur-md border-t border-white/50 dark:border-white/10 pt-12 pb-8 font-sans text-on-surface-variant transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Security Statement */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center overflow-hidden">
                <img src="/logo.svg" alt="PdfMinty Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="font-black text-xl text-on-surface">
                {t('header.siteName', { defaultValue: 'PdfMinty' })}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              {t('footer.brandDescription', {
                defaultValue: 'Free, privacy-first PDF utility suite. Core document tools run 100% locally in your browser without uploads. AI and OCR features utilize secure, encrypted API processing.',
              })}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('footer.badges.privacyFirst', { defaultValue: 'In-Browser Privacy First' })}</span>
            </div>
          </div>

          {/* Col 2: Popular Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {t('footer.sections.popularTools', { defaultValue: 'Popular Tools' })}
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to={ROUTES.MERGE} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.mergePdf', { defaultValue: 'Merge PDF Files' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SPLIT} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.splitPdf', { defaultValue: 'Split PDF Pages' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.GRAYSCALE} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.grayscalePdf', { defaultValue: 'Grayscale PDF' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PROTECT} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.protectPdf', { defaultValue: 'Protect & Encrypt PDF' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PDF_TO_IMG} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.pdfToImg', { defaultValue: 'Convert PDF to Image' })}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Guides */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {t('footer.sections.resources', { defaultValue: 'Resources' })}
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to={ROUTES.BLOG} className="hover:text-emerald-500 transition-colors flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-500" />
                  <span>{t('footer.links.knowledgeHub', { defaultValue: 'Knowledge Hub' })}</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.COMPARE_SMALLPDF} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.compareSmallpdf', { defaultValue: 'PdfMinty vs SmallPDF' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.COMPARE_ILOVEPDF} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.compareIlovepdf', { defaultValue: 'PdfMinty vs iLovePDF' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ADOBE_SECURITY_ARTICLE} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.adobeSecurity', { defaultValue: 'Adobe vs Browser Security' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TRUST_ARTICLE} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.trustArticle', { defaultValue: 'Is Online PDF Safe?' })}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Important Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {t('footer.sections.companyLegal', { defaultValue: 'Company & Legal' })}
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to={ROUTES.ABOUT_US} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.aboutUs', { defaultValue: 'About Us' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.contactUs', { defaultValue: 'Contact Us' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.privacyPolicy', { defaultValue: 'Privacy Policy' })}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TERMS_OF_SERVICE} className="hover:text-emerald-500 transition-colors">
                  {t('footer.links.termsOfService', { defaultValue: 'Terms of Service' })}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-muted flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <LanguageSwitcher variant="footer" />
            <p>
              {t('footer.copyright', {
                year: new Date().getFullYear(),
                defaultValue: `© ${new Date().getFullYear()} PdfMinty. All rights reserved. Built for 100% file privacy.`,
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-on-surface-variant/80 font-medium">
            <span>{t('footer.badges.clientSide', { defaultValue: 'Client-side PDF Suite' })}</span>
            <span>•</span>
            <span>{t('footer.badges.zeroLogs', { defaultValue: 'Zero Data Logs' })}</span>
            <span>•</span>
            <span>{t('footer.badges.openFree', { defaultValue: 'Open & Free' })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
