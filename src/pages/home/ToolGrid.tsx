import React from 'react';
import { useTranslation } from 'react-i18next';

import { ToolCard } from './ToolCard';

export const CORE_ESSENTIAL_SLUGS = new Set([
  'merge-pdf',
  'compress-pdf',
  'split-pdf',
  'sign-pdf',
  'pdf-to-image',
  'image-to-pdf',
  'protect-pdf',
  'unlock-pdf',
]);

interface ToolInfo {
  name: string;
  slug: string;
  description: string;
}

interface ToolGridProps {
  filteredTools: ToolInfo[];
  onClearSearch: () => void;
  showTwoSections?: boolean;
}

const SECTION_COPY: Record<
  string,
  {
    part1Label: string;
    part1Title: string;
    part1Desc: string;
    part1Meta: string;
    part2Label: string;
    part2Title: string;
    part2Desc: string;
    part2Meta: string;
  }
> = {
  en: {
    part1Label: 'Most Used Tools',
    part1Title: 'Everyday PDF Essentials',
    part1Desc:
      'Combine files, shrink large attachments, split page ranges, sign contracts, convert images, and lock documents directly in your browser.',
    part1Meta: '8 Core Tools · Runs Locally in Browser',
    part2Label: 'Page Control, Security & AI',
    part2Title: 'More PDF Tools & Document Utilities',
    part2Desc:
      'Reorder or rotate pages, add watermarks and page numbers, strip hidden metadata, compare two PDFs side by side, or run opt-in OCR and AI document Q&A.',
    part2Meta: 'Page Editing, Metadata & Opt-in AI',
  },
  bn: {
    part1Label: 'সবচেয়ে জনপ্রিয় টুলস',
    part1Title: 'দৈনন্দিন কাজের মূল পিডিএফ টুলস',
    part1Desc:
      'পিডিএফ মার্জ, কম্প্রেস, স্প্লিট, ই-স্বাক্ষর, ছবি কনভার্ট এবং পাসওয়ার্ড লক করার সর্বাধিক ব্যবহৃত ৮টি টুল।',
    part1Meta: '৮টি মূল টুল · লোকাল ব্রাউজার প্রসেসিং',
    part2Label: 'পেজ কন্ট্রোল, সিকিউরিটি ও AI',
    part2Title: 'অতিরিক্ত পিডিএফ এডিটিং ও বিশেষায়িত টুলস',
    part2Desc:
      'পেজ সাজানো, ওয়াটারমার্ক, পেজ নম্বর, মেটাডেটা ক্লিনিং, পিডিএফ তুলনা (Compare) এবং অপ্ট-ইন AI অ্যানালাইসিস ও OCR টুলস।',
    part2Meta: 'পেজ এডিটিং, সিকিউরিটি ও অপ্ট-ইন AI',
  },
  de: {
    part1Label: 'Meistgenutzte Werkzeuge',
    part1Title: 'Wichtige PDF-Tools für jeden Tag',
    part1Desc:
      'Unsere 8 beliebtesten Werkzeuge zum Zusammenfügen, Komprimieren, Teilen, Signieren, Konvertieren und Schützen.',
    part1Meta: '8 Kern-Tools · Lokal im Browser',
    part2Label: 'Seitensteuerung, Sicherheit & KI',
    part2Title: 'Weitere PDF-Werkzeuge & Spezialfunktionen',
    part2Desc:
      'Werkzeuge für Seitensortierung, Wasserzeichen, Seitenzahlen, Metadaten-Bereinigung, PDF-Vergleich sowie optionale KI & OCR.',
    part2Meta: 'Seitenbearbeitung, Schutz & KI',
  },
  fr: {
    part1Label: 'Outils les Plus Utilisés',
    part1Title: 'Outils PDF Essentiels au Quotidien',
    part1Desc:
      'Nos 8 outils principaux pour fusionner, compresser, diviser, signer, convertir et protéger vos PDF directement dans le navigateur.',
    part1Meta: '8 Outils Phares · Traitement Local',
    part2Label: 'Pages, Sécurité & IA',
    part2Title: 'Autres Outils PDF & Fonctions Avancées',
    part2Desc:
      'Outils pour réorganiser, numéroter, filigraner, nettoyer les métadonnées, comparer des PDF et analyser par IA & OCR.',
    part2Meta: 'Édition de Pages, Sécurité & IA',
  },
  es: {
    part1Label: 'Herramientas Más Usadas',
    part1Title: 'Herramientas PDF Esenciales para el Día a Día',
    part1Desc:
      'Nuestras 8 herramientas principales para unir, comprimir, dividir, firmar, convertir y proteger archivos PDF en tu navegador.',
    part1Meta: '8 Herramientas Clave · Procesamiento Local',
    part2Label: 'Páginas, Seguridad e IA',
    part2Title: 'Más Herramientas y Utilidades PDF',
    part2Desc:
      'Utilidades para reordenar páginas, marcas de agua, numeración, limpieza de metadatos, comparar PDF y análisis con IA y OCR.',
    part2Meta: 'Edición de Páginas, Seguridad e IA',
  },
  hi: {
    part1Label: 'सबसे लोकप्रिय टूल्स',
    part1Title: 'रोज़मर्रा के मुख्य PDF टूल्स',
    part1Desc:
      'पीडीएफ मर्ज, कंप्रेस, स्प्लिट, ई-साइन, इमेज कन्वर्ट और पासवर्ड सुरक्षा के लिए हमारे 8 सबसे अधिक उपयोग किए जाने वाले टूल्स।',
    part1Meta: '8 मुख्य टूल्स · लोकल ब्राउज़र प्रोसेसिंग',
    part2Label: 'पेज कंट्रोल, सुरक्षा और AI',
    part2Title: 'अन्य PDF एडिटिंग और विशेष टूल्स',
    part2Desc:
      'पेज रीऑर्डर, वॉटरमार्क, पेज नंबर, मेटाडेटा सफाई, पीडीएफ तुलना (Compare) और AI विश्लेषण व OCR के लिए विशेष टूल्स।',
    part2Meta: 'पेज एडिटिंग, सुरक्षा और AI',
  },
  zh: {
    part1Label: '最常用工具',
    part1Title: '日常核心 PDF 工具',
    part1Desc:
      '最常用的 8 款核心工具，涵盖 PDF 合并、压缩、拆分、电子签名、图片互转与密码保护。',
    part1Meta: '8 款核心工具 · 浏览器本地处理',
    part2Label: '页面管理、安全与 AI',
    part2Title: '更多 PDF 编辑与专业工具',
    part2Desc:
      '提供页面重排、水印、页码、元数据清理、PDF 对比以及可选的 Gemini AI 分析与 OCR 识别工具。',
    part2Meta: '页面编辑、安全清理与 AI',
  },
};

export const ToolGrid: React.FC<ToolGridProps> = ({
  filteredTools,
  onClearSearch,
  showTwoSections = false,
}) => {
  const { t, i18n } = useTranslation('common');
  const langKey = (i18n.language || 'en').split('-')[0].toLowerCase();
  const copy = SECTION_COPY[langKey] || SECTION_COPY.en;

  if (filteredTools.length === 0) {
    return (
      <div
        aria-live="polite"
        className="text-center py-20 border-2 border-dashed border-white/50 dark:border-white/10 rounded-[32px] max-w-lg mx-auto bg-white/40 dark:bg-black/30 backdrop-blur-xl shadow-xl"
      >
        <p className="text-primary font-black text-lg mb-2 font-display">
          {t('home.noToolsFound.title', { defaultValue: 'No tools found' })}
        </p>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed font-semibold">
          {t('home.noToolsFound.desc', {
            defaultValue:
              "We couldn't find any tools matching your search. Try checking your spelling or search for something else.",
          })}
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-6 px-6 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-border-muted font-extrabold text-xs text-primary-fixed rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-security-green"
        >
          {t('home.noToolsFound.clearSearch', { defaultValue: 'Clear Search' })}
        </button>
      </div>
    );
  }

  const essentialTools = filteredTools.filter((tool) => CORE_ESSENTIAL_SLUGS.has(tool.slug));
  const specialistTools = filteredTools.filter((tool) => !CORE_ESSENTIAL_SLUGS.has(tool.slug));

  if (showTwoSections && essentialTools.length > 0 && specialistTools.length > 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
        {/* Part 1: Essential & Daily PDF Tools */}
        <section
          aria-labelledby="essential-tools-heading"
          className="rounded-3xl p-5 sm:p-8 bg-slate-100/60 dark:bg-slate-900/45 border border-slate-200/80 dark:border-slate-800/80"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70">
            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5">
                {copy.part1Label}
              </div>
              <h3
                id="essential-tools-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display"
              >
                {copy.part1Title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
                {copy.part1Desc}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
              {copy.part1Meta}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {essentialTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} variant="featured" />
            ))}
          </div>
        </section>

        {/* Part 2: Advanced Page Control, Security & AI Suite */}
        <section
          aria-labelledby="specialist-tools-heading"
          className="rounded-3xl p-5 sm:p-8 bg-white/60 dark:bg-slate-900/25 border border-slate-200/70 dark:border-slate-800/70"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70">
            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5">
                {copy.part2Label}
              </div>
              <h3
                id="specialist-tools-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display"
              >
                {copy.part2Title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
                {copy.part2Desc}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
              {copy.part2Meta}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {specialistTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} variant="studio" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            variant={CORE_ESSENTIAL_SLUGS.has(tool.slug) ? 'featured' : 'studio'}
          />
        ))}
      </div>
    </div>
  );
};
