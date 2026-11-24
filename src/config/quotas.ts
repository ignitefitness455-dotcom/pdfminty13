/**
 * Canonical single source of truth for PdfMinty operator metadata,
 * opt-in AI provider disclosures, usage quota tiers, and synchronized
 * localized copy across all 7 supported locales (en, bn, de, es, fr, hi, zh).
 *
 * Update values here and run `npx tsx scripts/sync-quota-locales.ts` to keep
 * every locale JSON file consistent with the enforced product tiers.
 */

import type { SupportedLocale } from '../i18n/config';

export const OPERATOR_INFO = {
  brandName: 'PdfMinty',
  operatorName: 'Mohammed Tanveer Munshi',
  city: 'Dhaka',
  country: 'Bangladesh',
  location: 'Dhaka, Bangladesh',
  supportEmail: 'support@pdfminty.com',
  secondaryEmail: 'pdfminty@gmail.com',
  websiteUrl: 'https://pdfminty.com/',
} as const;

export const QUOTA_TIERS = {
  guest: {
    dailyTasks: 5,
    maxSingleMB: 100,
    maxBatchMB: 200,
    ocrPagesPerBatch: 5,
    priceUsd: 0,
  },
  freeAccount: {
    dailyTasks: 10,
    maxSingleMB: 150,
    maxBatchMB: 300,
    ocrPagesPerBatch: 5,
    priceUsd: 0,
  },
  proMonthly: {
    dailyTasks: 'unlimited' as const,
    maxSingleMB: 500,
    maxBatchMB: 1000,
    ocrPagesPerBatch: 15,
    aiDailyQueries: 50,
    aiMaxPages: 50,
    priceUsdMonthly: 2.49,
  },
  proLifetime: {
    dailyTasks: 'unlimited' as const,
    maxSingleMB: 500,
    maxBatchMB: 1000,
    ocrPagesPerBatch: 15,
    aiDailyQueries: 50,
    aiMaxPages: 50,
    priceUsdOneTime: 50,
  },
} as const;

export const TOOL_PRIVACY_COUNTS = {
  totalTools: 24,
  localStandardTools: 22,
  optInAiTools: 2,
} as const;

export const AI_PROVIDER_DISCLOSURE = {
  shortList: 'Google Gemini, Groq, and xAI Grok',
  entities: [
    {
      name: 'Google LLC (Google Gemini API)',
      purpose:
        'Ephemeral cloud AI document analysis and optical character recognition strictly when initiated by user opt-in.',
    },
    {
      name: 'Groq, Inc. (Groq API)',
      purpose:
        'Configured cloud AI inference failover provider for opt-in AI Analyze PDF and OCR PDF requests via /api/gemini-proxy.',
    },
    {
      name: 'xAI Corp. (xAI Grok API)',
      purpose:
        'Configured cloud AI inference failover provider for opt-in AI Analyze PDF and OCR PDF requests via /api/gemini-proxy.',
    },
  ],
} as const;

export interface LocalizedCanonicalStrings {
  homeWhyChooseFreeTitle: string;
  homeWhyChooseFreeDesc: string;
  homeFaqFreeAnswer: string;
  homeFaqPrivacyAnswer: string;
  aboutUsFreeForever: string;
  adobeAltEveryToolDesc: string;
  adobeAltNoSignups: string;
  privacyUpdated: string;
  privacySummary: string;
  privacySec3Desc: string;
  privacySec4Intro: string;
  privacySec8Desc: string;
  termsUpdated: string;
  ocrConsentDesc: string;
  ocrConsentCheckbox: string;
  mergeComparisonLimit: string;
}

export const LOCALIZED_CANONICAL_COPY: Record<SupportedLocale, LocalizedCanonicalStrings> = {
  en: {
    homeWhyChooseFreeTitle: 'Free Forever Core Plan',
    homeWhyChooseFreeDesc:
      'Merge, split, compress, sign, and edit PDFs with zero watermarks: 5 free daily tasks for guests (up to 100MB/file), 10 daily tasks with a free account (up to 150MB/file), and optional Pro ($2.49/mo) or Lifetime ($50) plans for unlimited daily tasks.',
    homeFaqFreeAnswer:
      'Yes — PDFMinty offers a Free Forever tier across all 24 tools: guests receive 5 free daily tasks (up to 100MB per file) with no account or credit card required, and free registered users receive 10 daily tasks (up to 150MB per file) with zero watermarks. Optional Monthly Pro ($2.49/month) and Lifetime Pro ($50 one-time) plans are available for unlimited daily tasks, 500MB files, and priority AI/OCR quotas.',
    homeFaqPrivacyAnswer:
      'PdfMinty executes our 22 standard PDF tools (including Merge, Split, Compress, Sign, Protect, Unlock, and PDF to Markdown) 100% locally inside your web browser using WebAssembly and JavaScript, without uploading files to any server. The only exceptions are our 2 opt-in AI tools (AI Analyze PDF and OCR PDF), which send extracted text or selected page images via an encrypted HTTPS proxy to our configured cloud AI providers (Google Gemini, Groq, and/or xAI Grok) strictly after you check the explicit consent box.',
    aboutUsFreeForever:
      'Core PDF tools are available on our Free Forever plan (5 daily guest tasks up to 100MB, 10 daily free-account tasks up to 150MB, zero watermarks), with optional Pro ($2.49/mo) and Lifetime ($50) upgrades for unlimited daily usage.',
    adobeAltEveryToolDesc:
      'Core PDF tools free on our Free Forever plan (5 daily guest tasks, 10 with a free account). Optional Pro ($2.49/mo) & Lifetime ($50) for unlimited usage.',
    adobeAltNoSignups: 'No Mandatory Sign-Up to Start (5 Free Daily Guest Tasks)',
    privacyUpdated:
      'Effective Date: January 1, 2026 • Last Updated & Reviewed: November 2026 • Data Controller: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contact: support@pdfminty.com',
    privacySummary:
      "PDFMinty's 22 standard PDF tools (including Merge, Split, Compress, Sign, Protect, Unlock, and PDF to Markdown) process your files 100% locally inside your web browser using WebAssembly and HTML5 Canvas without uploading your documents to any server. If you explicitly opt in to use our 2 Cloud AI tools — AI Analyze PDF (/ai-analyze-pdf/) or OCR PDF (/ocr-pdf/) — extracted text or selected page images are transmitted securely via TLS-encrypted HTTPS proxy (/api/gemini-proxy) to our configured AI inference providers (Google Gemini, Groq, and/or xAI Grok) solely to fulfill your immediate request after you grant explicit consent. If you optionally sign in with Google OAuth or Email/Password, we store only your basic account profile (email, name, avatar URL, UID, and subscription/quota status) in Google Cloud Firestore in strict compliance with the Google API Services User Data Policy (Limited Use requirements).",
    privacySec3Desc:
      'PDFMinty provides 2 clearly labeled, optional AI-powered tools: AI Analyze PDF (/ai-analyze-pdf/) and OCR PDF (/ocr-pdf/). Unlike our 22 standard browser-local tools (including PDF to Markdown), these 2 features require cloud inference through our encrypted proxy (/api/gemini-proxy) routed to our configured AI providers (Google Gemini, Groq, and/or xAI Grok).',
    privacySec4Intro:
      'When enabled on public informational pages for non-Pro visitors, PDFMinty may display advertisements served by Google AdSense to support free access to our browser PDF toolkit. Advertising scripts and cookies remain subject to Google Consent Mode v2 (default-denied until you grant consent). To comply with Google Publisher and AdSense policies, please review the following disclosures:',
    privacySec8Desc:
      'If you have any questions, data subject access requests (DSAR), account deletion requests, or inquiries regarding this Privacy Policy or our Google OAuth compliance, please contact the operator (Mohammed Tanveer Munshi) via our',
    termsUpdated:
      'Last Updated & Effective Date: November 2026 • Operator: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contact: support@pdfminty.com',
    ocrConsentDesc:
      'Selected pages (up to 5 on Guest/Free tiers; up to 15 on Pro) are converted into images and transmitted securely via HTTPS proxy (/api/gemini-proxy) to our configured cloud AI Vision providers (Google Gemini, Groq, and/or xAI Grok) solely for optical character recognition. Standard PdfMinty tools process files 100% locally in your browser; this AI feature requires external cloud processing.',
    ocrConsentCheckbox:
      'I understand and consent to transmitting selected page images to our configured cloud AI providers (Google Gemini, Groq, and/or xAI Grok) for OCR transcription.',
    mergeComparisonLimit: '5/day Guest • 10/day Free • Unlimited Pro',
  },
  bn: {
    homeWhyChooseFreeTitle: 'দৈনিক ফ্রি টিয়ার ও অপশনাল প্রো',
    homeWhyChooseFreeDesc:
      'কোনো ওয়াটারমার্ক ছাড়াই বিনামূল্যে পিডিএফ মার্জ, স্প্লিট, কম্প্রেস ও সাইন করুন: গেস্টদের জন্য প্রতিদিন ৫টি ফ্রি টাস্ক (১০০MB/ফাইল), ফ্রি অ্যাকাউন্টে ১০টি টাস্ক (১৫০MB/ফাইল), এবং আনলিমিটেড দৈনিক কাজ ও ৫০০MB ফাইলের জন্য ঐচ্ছিক Pro ($2.49/মাস) বা Lifetime ($50 এককালীন) প্ল্যান।',
    homeFaqFreeAnswer:
      'হ্যাঁ — পিডিএফমিন্টির সকল ২৪টি টুলে ফ্রি টিয়ার রয়েছে: গেস্ট ব্যবহারকারীরা কোনো অ্যাকাউন্ট বা ক্রেডিট কার্ড ছাড়াই প্রতিদিন ৫টি ফ্রি টাস্ক (প্রতি ফাইল ১০০MB পর্যন্ত) পান এবং ফ্রি রেজিস্টার্ড ব্যবহারকারীরা কোনো ওয়াটারমার্ক ছাড়াই প্রতিদিন ১০টি টাস্ক (প্রতি ফাইল ১৫০MB পর্যন্ত) পান। আনলিমিটেড দৈনিক কাজ, ৫০০MB ফাইল এবং উচ্চ AI/OCR কোটার জন্য ঐচ্ছিক Monthly Pro ($2.49/মাস) এবং Lifetime Pro ($50 এককালীন) প্ল্যান রয়েছে।',
    homeFaqPrivacyAnswer:
      'PdfMinty-র ২২টি স্ট্যান্ডার্ড পিডিএফ টুল (Merge, Split, Compress, Sign, Protect, Unlock এবং PDF to Markdown সহ) WebAssembly ও JavaScript ব্যবহার করে ১০০% লোকালভাবে আপনার ব্রাউজারেই চলে—কোনো ফাইল সার্ভারে আপলোড হয় না। শুধুমাত্র আমাদের ২টি অপ্ট-ইন ক্লাউড AI টুল (AI Analyze PDF এবং OCR PDF) আপনার স্পষ্ট consent চেকবক্সে সম্মতি দেওয়ার পর এনক্রিপ্টেড HTTPS প্রক্সির মাধ্যমে নির্বাচিত টেক্সট বা পেজের ছবি কনফিগার করা AI প্রোভাইডার (Google Gemini, Groq এবং/অথবা xAI Grok)-এ পাঠায়।',
    aboutUsFreeForever:
      'কোর পিডিএফ টুলগুলো Free Forever প্ল্যানে ব্যবহার করা যায় (গেস্ট প্রতিদিন ৫টি টাস্ক ও ১০০MB, ফ্রি অ্যাকাউন্টে ১০টি টাস্ক ও ১৫০MB, কোনো ওয়াটারমার্ক নেই), এবং আনলিমিটেড দৈনিক কাজের জন্য ঐচ্ছিক Pro ($2.49/মাস) ও Lifetime ($50) প্ল্যান রয়েছে।',
    adobeAltEveryToolDesc:
      'কোর পিডিএফ টুলগুলো Free Forever প্ল্যানে ফ্রি (গেস্ট ৫টি/দিন, ফ্রি অ্যাকাউন্ট ১০টি/দিন)। আনলিমিটেড কাজের জন্য ঐচ্ছিক Pro ($2.49/মাস) ও Lifetime ($50)।',
    adobeAltNoSignups: 'শুরু করতে বাধ্যতামূলক সাইন-আপ নেই (গেস্টদের জন্য ৫টি দৈনিক ফ্রি টাস্ক)',
    privacyUpdated:
      'কার্যকর তারিখ: ১ জানুয়ারি ২০২৬ • সর্বশেষ হালনাগাদ: নভেম্বর ২০২৬ • ডেটা কন্ট্রোলার: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • ইমেইল: support@pdfminty.com',
    privacySummary:
      'PDFMinty-র ২২টি স্ট্যান্ডার্ড পিডিএফ টুল (PDF to Markdown সহ) আপনার ফাইলগুলো কোনো সার্ভারে আপলোড না করেই WebAssembly ও HTML5 Canvas-এর মাধ্যমে ১০০% লোকালভাবে আপনার ব্রাউজারে প্রসেস করে। শুধুমাত্র আপনি যখন স্বেচ্ছায় আমাদের ২টি অপ্ট-ইন ক্লাউড AI টুল — AI Analyze PDF (/ai-analyze-pdf/) অথবা OCR PDF (/ocr-pdf/) — ব্যবহারে সম্মতি (consent) দেন, তখনই এক্সট্র্যাক্ট করা টেক্সট বা নির্বাচিত পেজের ছবি এনক্রিপ্টেড HTTPS প্রক্সি (/api/gemini-proxy) হয়ে আমাদের কনফিগার করা AI প্রোভাইডার (Google Gemini, Groq এবং/অথবা xAI Grok)-এ পাঠানো হয়। আপনি ঐচ্ছিকভাবে Google OAuth বা ইমেইল/পাসওয়ার্ড দিয়ে সাইন ইন করলে আমরা Google API Services User Data Policy (Limited Use)-এর অধীনে শুধুমাত্র আপনার মৌলিক অ্যাকাউন্ট তথ্য Google Cloud Firestore-এ সংরক্ষণ করি।',
    privacySec3Desc:
      'PDFMinty ২টি স্পষ্টভাবে চিহ্নিত অপ্ট-ইন AI টুল সরবরাহ করে: AI Analyze PDF (/ai-analyze-pdf/) এবং OCR PDF (/ocr-pdf/)। আমাদের ২২টি লোকাল স্ট্যান্ডার্ড টুলের (PDF to Markdown সহ) বিপরীতে, এই ২টি ফিচারের জন্য এনক্রিপ্টেড প্রক্সি (/api/gemini-proxy)-এর মাধ্যমে কনফিগার করা ক্লাউড AI প্রোভাইডার (Google Gemini, Groq এবং/অথবা xAI Grok) ব্যবহৃত হয়।',
    privacySec4Intro:
      'সক্রিয় থাকা অবস্থায় (when enabled), আমাদের ফ্রি ব্রাউজার পিডিএফ টুলকিট চালু রাখতে নন-Pro ভিজিটরদের জন্য পাবলিক তথ্যমূলক পাতায় Google AdSense বিজ্ঞাপন দেখানো হতে পারে। বিজ্ঞাপনের স্ক্রিপ্ট ও কুকি সবসময় Google Consent Mode v2 (সম্মতি না দেওয়া পর্যন্ত default-denied) অনুসরণ করে। অনুগ্রহ করে নিচের বিজ্ঞাপন-সংক্রান্ত তথ্যগুলো দেখুন:',
    privacySec8Desc:
      'এই গোপনীয়তা নীতি, ডেটা মুছে ফেলার অনুরোধ (DSAR) বা Google OAuth কমপ্লায়েন্স বিষয়ে কোনো প্রশ্ন থাকলে অনুগ্রহ করে অপারেটর (Mohammed Tanveer Munshi)-এর সাথে যোগাযোগ করুন আমাদের',
    termsUpdated:
      'সর্বশেষ হালনাগাদ ও কার্যকর তারিখ: নভেম্বর ২০২৬ • অপারেটর: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • ইমেইল: support@pdfminty.com',
    ocrConsentDesc:
      'নির্বাচিত পেজগুলো (গেস্ট/ফ্রি টিয়ারে সর্বোচ্চ ৫টি; Pro-তে সর্বোচ্চ ১৫টি) ছবিতে রূপান্তর করে এনক্রিপ্টেড HTTPS প্রক্সি (/api/gemini-proxy)-এর মাধ্যমে আমাদের কনফিগার করা ক্লাউড AI প্রোভাইডার (Google Gemini, Groq এবং/অথবা xAI Grok)-এ শুধুমাত্র OCR টেক্সট শনাক্তকরণের জন্য পাঠানো হয়।',
    ocrConsentCheckbox:
      'আমি OCR ট্রান্সক্রিপশনের জন্য নির্বাচিত পেজের ছবিগুলো আমাদের কনফিগার করা ক্লাউড AI প্রোভাইডার (Google Gemini, Groq এবং/অথবা xAI Grok)-এ পাঠাতে সম্মতি দিচ্ছি।',
    mergeComparisonLimit: '৫/দিন গেস্ট • ১০/দিন ফ্রি • আনলিমিটেড Pro',
  },
  de: {
    homeWhyChooseFreeTitle: 'Kostenloses Tageskontingent',
    homeWhyChooseFreeDesc:
      'PDFs ohne Wasserzeichen zusammenfügen, teilen, komprimieren, signieren und bearbeiten: 5 kostenlose Aufgaben/Tag für Gäste (bis 100 MB), 10 Aufgaben/Tag mit kostenlosem Konto (bis 150 MB), plus optionale Pro- ($2,49/Monat) & Lifetime-Tarife ($50) für unbegrenzte Nutzung.',
    homeFaqFreeAnswer:
      'Ja — PDFMinty bietet ein dauerhaft kostenloses Kontingent für alle 24 Tools: Gäste erhalten 5 kostenlose Aufgaben pro Tag (bis 100 MB pro Datei) ohne Konto oder Kreditkarte, und registrierte kostenlose Konten erhalten 10 Aufgaben pro Tag (bis 150 MB) ohne Wasserzeichen. Optionale Monthly Pro ($2,49/Monat) und Lifetime Pro ($50 einmalig) Tarife bieten unbegrenzte Tagesaufgaben, 500-MB-Dateien und höhere AI/OCR-Kontingente.',
    homeFaqPrivacyAnswer:
      'PdfMinty führt unsere 22 Standard-PDF-Werkzeuge (einschließlich PDF zu Markdown) zu 100 % lokal in Ihrem Webbrowser mittels WebAssembly und JavaScript aus, ohne Dateien hochzuladen. Die einzigen Ausnahmen sind unsere 2 optionalen Cloud-KI-Tools (AI Analyze PDF und OCR PDF), die extrahierten Text oder ausgewählte Seitenbilder nach Ihrer ausdrücklichen Zustimmung über einen verschlüsselten HTTPS-Proxy an unsere konfigurierten KI-Anbieter (Google Gemini, Groq und/oder xAI Grok) senden.',
    aboutUsFreeForever:
      'Kern-PDF-Tools sind im Free-Forever-Tarif verfügbar (5 Gast-Aufgaben/Tag bis 100 MB, 10 kostenlose Konto-Aufgaben/Tag bis 150 MB, ohne Wasserzeichen), mit optionalen Pro- ($2,49/Monat) und Lifetime-Upgrades ($50) für unbegrenzte Nutzung.',
    adobeAltEveryToolDesc:
      'Kern-PDF-Tools kostenlos im Free-Forever-Tarif (5 Gast-Aufgaben/Tag, 10 mit kostenlosem Konto). Optional Pro ($2,49/Monat) & Lifetime ($50) für unbegrenzte Nutzung.',
    adobeAltNoSignups: 'Kein Pflichtkonto zum Start (5 kostenlose Gast-Aufgaben/Tag)',
    privacyUpdated:
      'Inkrafttreten: 1. Januar 2026 • Zuletzt aktualisiert: November 2026 • Verantwortlicher (Data Controller): Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Kontakt: support@pdfminty.com',
    privacySummary:
      'Die 22 Standard-PDF-Tools von PDFMinty (einschließlich PDF zu Markdown) verarbeiten Ihre Dateien zu 100 % lokal im Browser per WebAssembly und HTML5 Canvas ohne Server-Upload. Wenn Sie unsere 2 optionalen Cloud-KI-Tools — AI Analyze PDF (/ai-analyze-pdf/) oder OCR PDF (/ocr-pdf/) — nach ausdrücklicher Zustimmung nutzen, werden extrahierter Text oder ausgewählte Seitenbilder verschlüsselt über unseren HTTPS-Proxy (/api/gemini-proxy) an unsere konfigurierten KI-Anbieter (Google Gemini, Groq und/oder xAI Grok) übermittelt. Bei optionaler Anmeldung über Google OAuth oder E-Mail/Passwort speichern wir nur Ihr Basisprofil in Google Cloud Firestore gemäß der Google API Services User Data Policy (Limited Use).',
    privacySec3Desc:
      'PDFMinty bietet 2 klar gekennzeichnete, optionale KI-Tools: AI Analyze PDF (/ai-analyze-pdf/) und OCR PDF (/ocr-pdf/). Im Gegensatz zu unseren 22 lokalen Standard-Tools (einschließlich PDF zu Markdown) nutzen diese 2 Funktionen unseren verschlüsselten Proxy (/api/gemini-proxy) mit konfigurierten KI-Anbietern (Google Gemini, Groq und/oder xAI Grok).',
    privacySec4Intro:
      'Wenn aktiviert (when enabled), kann PDFMinty auf öffentlichen Informationsseiten für Nicht-Pro-Besucher Werbung über Google AdSense anzeigen, um den kostenlosen Zugang zum PDF-Toolkit zu finanzieren. Werbe-Cookies unterliegen Google Consent Mode v2 (standardmäßig abgelehnt bis zur Zustimmung). Bitte beachten Sie folgende Hinweise:',
    privacySec8Desc:
      'Bei Fragen zu dieser Datenschutzerklärung, Auskunfts- oder Löschungsanfragen (DSGVO/DSAR) wenden Sie sich bitte an den Betreiber (Mohammed Tanveer Munshi) über unsere',
    termsUpdated:
      'Zuletzt aktualisiert & gültig ab: November 2026 • Betreiber: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Kontakt: support@pdfminty.com',
    ocrConsentDesc:
      'Ausgewählte Seiten (bis zu 5 im Gast-/Free-Tarif; bis zu 15 mit Pro) werden verschlüsselt über unseren HTTPS-Proxy (/api/gemini-proxy) an unsere konfigurierten Cloud-KI-Anbieter (Google Gemini, Groq und/oder xAI Grok) zur Texterkennung (OCR) gesendet.',
    ocrConsentCheckbox:
      'Ich stimme der verschlüsselten Übermittlung ausgewählter Seitenbilder an unsere konfigurierten Cloud-KI-Anbieter (Google Gemini, Groq und/oder xAI Grok) für die OCR-Verarbeitung zu.',
    mergeComparisonLimit: '5/Tag Gast • 10/Tag Konto • Unbegrenzt Pro',
  },
  es: {
    homeWhyChooseFreeTitle: 'Plan diario gratuito',
    homeWhyChooseFreeDesc:
      'Une, divide, comprime, firma y edita PDFs sin marcas de agua: 5 tareas diarias gratis para invitados (hasta 100 MB/archivo), 10 tareas diarias con cuenta gratuita (hasta 150 MB/archivo) y planes opcionales Pro ($2.49/mes) o Lifetime ($50) para uso ilimitado.',
    homeFaqFreeAnswer:
      'Sí — PDFMinty ofrece un nivel gratuito permanente en las 24 herramientas: los invitados reciben 5 tareas diarias gratis (hasta 100 MB por archivo) sin cuenta ni tarjeta, y las cuentas gratuitas reciben 10 tareas diarias (hasta 150 MB) sin marcas de agua. Los planes opcionales Pro mensual ($2.49/mes) y Lifetime Pro ($50 pago único) desbloquean tareas diarias ilimitadas, archivos de 500 MB y mayores cuotas de IA/OCR.',
    homeFaqPrivacyAnswer:
      'PdfMinty ejecuta nuestras 22 herramientas PDF estándar (incluido PDF a Markdown) 100 % localmente en tu navegador mediante WebAssembly y JavaScript, sin subir archivos a ningún servidor. Las únicas excepciones son nuestras 2 herramientas opcionales de IA en la nube (AI Analyze PDF y OCR PDF), que envían texto extraído o imágenes de páginas seleccionadas a través de un proxy HTTPS cifrado a nuestros proveedores de IA configurados (Google Gemini, Groq y/o xAI Grok) solo tras tu consentimiento explícito.',
    aboutUsFreeForever:
      'Las herramientas PDF principales están disponibles en nuestro plan gratuito (5 tareas diarias para invitados hasta 100 MB, 10 diarias con cuenta gratuita hasta 150 MB, sin marcas de agua), con mejoras opcionales Pro ($2.49/mes) y Lifetime ($50) para uso ilimitado.',
    adobeAltEveryToolDesc:
      'Herramientas PDF principales gratis en el plan Free Forever (5 tareas/día invitados, 10 con cuenta gratis). Pro ($2.49/mes) y Lifetime ($50) opcionales para uso ilimitado.',
    adobeAltNoSignups: 'Sin registro obligatorio para empezar (5 tareas gratis/día)',
    privacyUpdated:
      'Fecha de entrada en vigor: 1 de enero de 2026 • Última actualización: noviembre de 2026 • Responsable del tratamiento (Data Controller): Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contacto: support@pdfminty.com',
    privacySummary:
      'Las 22 herramientas PDF estándar de PDFMinty (incluido PDF a Markdown) procesan tus archivos 100 % localmente en tu navegador con WebAssembly y HTML5 Canvas sin subir documentos a ningún servidor. Si optas explícitamente por usar nuestras 2 herramientas de IA en la nube — AI Analyze PDF (/ai-analyze-pdf/) u OCR PDF (/ocr-pdf/) — el texto extraído o las imágenes de páginas seleccionadas se transmiten cifradas mediante nuestro proxy HTTPS (/api/gemini-proxy) a nuestros proveedores de IA configurados (Google Gemini, Groq y/o xAI Grok) únicamente para responder a tu solicitud tras tu consentimiento expreso. Si inicias sesión opcionalmente con Google OAuth o correo/contraseña, almacenamos solo tu perfil básico en Google Cloud Firestore conforme a la Google API Services User Data Policy (Limited Use).',
    privacySec3Desc:
      'PDFMinty ofrece 2 herramientas opcionales de IA claramente identificadas: AI Analyze PDF (/ai-analyze-pdf/) y OCR PDF (/ocr-pdf/). A diferencia de nuestras 22 herramientas locales estándar (incluido PDF a Markdown), estas 2 funciones utilizan nuestro proxy cifrado (/api/gemini-proxy) hacia nuestros proveedores de IA configurados (Google Gemini, Groq y/o xAI Grok).',
    privacySec4Intro:
      'Cuando esté habilitado (when enabled), PDFMinty puede mostrar anuncios de Google AdSense en páginas informativas públicas para visitantes sin plan Pro con el fin de respaldar el acceso gratuito. Las cookies publicitarias permanecen sujetas a Google Consent Mode v2 (denegadas por defecto hasta tu consentimiento). Consulta las siguientes divulgaciones:',
    privacySec8Desc:
      'Si tienes preguntas sobre esta Política de privacidad, solicitudes de acceso o eliminación de datos (DSAR), comunícate con el operador (Mohammed Tanveer Munshi) a través de nuestra',
    termsUpdated:
      'Última actualización y fecha de vigencia: noviembre de 2026 • Operador: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contacto: support@pdfminty.com',
    ocrConsentDesc:
      'Las páginas seleccionadas (hasta 5 en planes Invitado/Gratis; hasta 15 en Pro) se convierten en imágenes y se transmiten cifradas mediante proxy HTTPS (/api/gemini-proxy) a nuestros proveedores de IA configurados (Google Gemini, Groq y/o xAI Grok) únicamente para OCR.',
    ocrConsentCheckbox:
      'Entiendo y acepto enviar las imágenes de páginas seleccionadas a nuestros proveedores de IA en la nube configurados (Google Gemini, Groq y/o xAI Grok) para la transcripción OCR.',
    mergeComparisonLimit: '5/día Invitado • 10/día Gratis • Ilimitado Pro',
  },
  fr: {
    homeWhyChooseFreeTitle: 'Offre quotidienne gratuite',
    homeWhyChooseFreeDesc:
      'Fusionnez, divisez, compressez, signez et modifiez vos PDF sans filigrane : 5 tâches quotidiennes gratuites pour les invités (jusqu’à 100 Mo/fichier), 10 tâches/jour avec un compte gratuit (jusqu’à 150 Mo/fichier), et des formules optionnelles Pro (2,49 $/mois) ou Lifetime (50 $) pour un usage illimité.',
    homeFaqFreeAnswer:
      'Oui — PDFMinty propose un niveau gratuit sur l’ensemble des 24 outils : les invités disposent de 5 tâches gratuites par jour (jusqu’à 100 Mo par fichier) sans compte ni carte bancaire, et les comptes gratuits de 10 tâches par jour (jusqu’à 150 Mo) sans filigrane. Les formules optionnelles Pro mensuel (2,49 $/mois) et Lifetime Pro (50 $ paiement unique) offrent des tâches quotidiennes illimitées, des fichiers jusqu’à 500 Mo et des quotas IA/OCR étendus.',
    homeFaqPrivacyAnswer:
      'PdfMinty exécute nos 22 outils PDF standard (y compris PDF en Markdown) à 100 % localement dans votre navigateur via WebAssembly et JavaScript, sans téléversement sur un serveur. Les seules exceptions sont nos 2 outils IA cloud optionnels (AI Analyze PDF et OCR PDF), qui transmettent du texte extrait ou des images de pages sélectionnées via un proxy HTTPS chiffré vers nos fournisseurs d’IA configurés (Google Gemini, Groq et/ou xAI Grok) uniquement après votre consentement explicite.',
    aboutUsFreeForever:
      'Les outils PDF essentiels sont disponibles sur notre offre gratuite (5 tâches invité/jour jusqu’à 100 Mo, 10 tâches compte gratuit/jour jusqu’à 150 Mo, sans filigrane), avec des options Pro (2,49 $/mois) et Lifetime (50 $) pour un usage illimité.',
    adobeAltEveryToolDesc:
      'Outils PDF essentiels gratuits dans le forfait Free Forever (5 tâches invité/jour, 10 avec un compte gratuit). Options Pro (2,49 $/mois) et Lifetime (50 $) pour un usage illimité.',
    adobeAltNoSignups: 'Aucune inscription obligatoire pour démarrer (5 tâches gratuites/jour)',
    privacyUpdated:
      'Date d’entrée en vigueur : 1er janvier 2026 • Dernière mise à jour : novembre 2026 • Responsable du traitement (Data Controller) : Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contact : support@pdfminty.com',
    privacySummary:
      'Les 22 outils PDF standard de PDFMinty (y compris PDF en Markdown) traitent vos fichiers à 100 % localement dans votre navigateur via WebAssembly et HTML5 Canvas sans aucun téléversement serveur. Si vous choisissez explicitement d’utiliser nos 2 outils IA cloud — AI Analyze PDF (/ai-analyze-pdf/) ou OCR PDF (/ocr-pdf/) — seul le texte extrait ou les images de pages sélectionnées sont transmis via notre proxy HTTPS chiffré (/api/gemini-proxy) à nos fournisseurs d’IA configurés (Google Gemini, Groq et/ou xAI Grok) après votre consentement explicite. Si vous vous connectez avec Google OAuth ou e-mail/mot de passe, nous stockons uniquement votre profil de base dans Google Cloud Firestore conformément à la Google API Services User Data Policy (Limited Use).',
    privacySec3Desc:
      'PDFMinty propose 2 outils IA optionnels clairement identifiés : AI Analyze PDF (/ai-analyze-pdf/) et OCR PDF (/ocr-pdf/). Contrairement à nos 22 outils locaux standard (dont PDF en Markdown), ces 2 fonctions passent par notre proxy chiffré (/api/gemini-proxy) vers nos fournisseurs d’IA configurés (Google Gemini, Groq et/ou xAI Grok).',
    privacySec4Intro:
      'Lorsqu’elle est activée (when enabled), la publicité Google AdSense peut être affichée sur les pages publiques pour les visiteurs non-Pro afin de financer l’accès gratuit. Les cookies publicitaires restent soumis à Google Consent Mode v2 (refusés par défaut jusqu’à votre consentement). Veuillez consulter les informations suivantes :',
    privacySec8Desc:
      'Pour toute question sur cette Politique de confidentialité, demande d’accès ou de suppression de données (RGPD/DSAR), contactez l’exploitant (Mohammed Tanveer Munshi) via notre',
    termsUpdated:
      'Dernière mise à jour et prise d’effet : novembre 2026 • Exploitant : Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • Contact : support@pdfminty.com',
    ocrConsentDesc:
      'Les pages sélectionnées (jusqu’à 5 en invité/gratuit ; jusqu’à 15 en Pro) sont converties en images et transmises via proxy HTTPS chiffré (/api/gemini-proxy) à nos fournisseurs d’IA configurés (Google Gemini, Groq et/ou xAI Grok) uniquement pour l’OCR.',
    ocrConsentCheckbox:
      'Je comprends et j’accepte l’envoi chiffré des images de pages sélectionnées à nos fournisseurs d’IA cloud configurés (Google Gemini, Groq et/ou xAI Grok) pour la transcription OCR.',
    mergeComparisonLimit: '5/jour Invité • 10/jour Gratuit • Illimité Pro',
  },
  hi: {
    homeWhyChooseFreeTitle: 'दैनिक मुफ़्त टियर',
    homeWhyChooseFreeDesc:
      'बिना किसी वॉटरमार्क के मुफ़्त में पीडीएफ मर्ज, स्प्लिट, कंप्रेस, साइन और एडिट करें: अतिथियों के लिए प्रतिदिन 5 मुफ़्त कार्य (100MB/फ़ाइल), मुफ़्त खाते के साथ 10 कार्य/दिन (150MB/फ़ाइल), और असीमित दैनिक उपयोग के लिए वैकल्पिक Pro ($2.49/माह) या Lifetime ($50) प्लान।',
    homeFaqFreeAnswer:
      'हाँ — PDFMinty सभी 24 उपकरणों पर मुफ़्त टियर प्रदान करता है: अतिथियों को बिना किसी खाते या क्रेडिट कार्ड के प्रतिदिन 5 मुफ़्त कार्य (प्रति फ़ाइल 100MB तक) मिलते हैं, और मुफ़्त पंजीकृत उपयोगकर्ताओं को बिना वॉटरमार्क के प्रतिदिन 10 कार्य (प्रति फ़ाइल 150MB तक) मिलते हैं। असीमित दैनिक कार्यों, 500MB फ़ाइलों और उच्च AI/OCR कोटा के लिए वैकल्पिक Monthly Pro ($2.49/माह) और Lifetime Pro ($50 एकमुश्त) प्लान उपलब्ध हैं।',
    homeFaqPrivacyAnswer:
      'PDFMinty हमारे 22 मानक पीडीएफ टूल्स (PDF to Markdown सहित) को WebAssembly और JavaScript का उपयोग करके 100% स्थानीय रूप से आपके ब्राउज़र के भीतर निष्पादित करता है—कोई फ़ाइल सर्वर पर अपलोड नहीं होती। एकमात्र अपवाद हमारे 2 वैकल्पिक क्लाउड AI टूल्स (AI Analyze PDF और OCR PDF) हैं, जो आपकी स्पष्ट सहमति के बाद एन्क्रिप्टेड HTTPS प्रॉक्सी के माध्यम से चयनित टेक्स्ट या पेज छवियाँ हमारे कॉन्फ़िगर किए गए AI प्रदाताओं (Google Gemini, Groq और/या xAI Grok) को भेजते हैं।',
    aboutUsFreeForever:
      'मुख्य पीडीएफ टूल्स हमारे Free Forever प्लान पर उपलब्ध हैं (अतिथियों के लिए 5 दैनिक कार्य / 100MB, मुफ़्त खाते के लिए 10 दैनिक कार्य / 150MB, कोई वॉटरमार्क नहीं), और असीमित उपयोग के लिए वैकल्पिक Pro ($2.49/माह) व Lifetime ($50) अपग्रेड उपलब्ध हैं।',
    adobeAltEveryToolDesc:
      'Free Forever प्लान में मुख्य पीडीएफ टूल्स मुफ़्त (अतिथि 5/दिन, मुफ़्त खाता 10/दिन)। असीमित उपयोग के लिए वैकल्पिक Pro ($2.49/माह) और Lifetime ($50)।',
    adobeAltNoSignups: 'शुरू करने के लिए अनिवार्य साइन-अप नहीं (प्रतिदिन 5 मुफ़्त अतिथि कार्य)',
    privacyUpdated:
      'प्रभावी तिथि: 1 जनवरी 2026 • अंतिम अपडेट: नवंबर 2026 • डेटा नियंत्रक (Data Controller): Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • संपर्क: support@pdfminty.com',
    privacySummary:
      'PDFMinty के 22 मानक पीडीएफ टूल्स (PDF to Markdown सहित) बिना किसी सर्वर अपलोड के WebAssembly और HTML5 Canvas के साथ 100% स्थानीय रूप से आपके ब्राउज़र में फ़ाइलें प्रोसेस करते हैं। यदि आप स्पष्ट सहमति देकर हमारे 2 क्लाउड AI टूल्स — AI Analyze PDF (/ai-analyze-pdf/) या OCR PDF (/ocr-pdf/) — का उपयोग करते हैं, तो केवल निकाला गया टेक्स्ट या चयनित पेज छवियाँ एन्क्रिप्टेड HTTPS प्रॉक्सी (/api/gemini-proxy) के माध्यम से हमारे कॉन्फ़िगर किए गए AI प्रदाताओं (Google Gemini, Groq और/या xAI Grok) को भेजी जाती हैं। यदि आप वैकल्पिक रूप से Google OAuth या ईमेल/पासवर्ड से साइन इन करते हैं, तो हम Google API Services User Data Policy (Limited Use) के अनुसार केवल आपका बुनियादी खाता प्रोफ़ाइल Google Cloud Firestore में संग्रहीत करते हैं।',
    privacySec3Desc:
      'PDFMinty 2 स्पष्ट रूप से चिह्नित वैकल्पिक AI टूल्स प्रदान करता है: AI Analyze PDF (/ai-analyze-pdf/) और OCR PDF (/ocr-pdf/)। हमारे 22 स्थानीय मानक टूल्स (PDF to Markdown सहित) के विपरीत, इन 2 सुविधाओं के लिए एन्क्रिप्टेड प्रॉक्सी (/api/gemini-proxy) के माध्यम से कॉन्फ़िगर किए गए क्लाउड AI प्रदाताओं (Google Gemini, Groq और/या xAI Grok) का उपयोग किया जाता है।',
    privacySec4Intro:
      'सक्रिय होने पर (when enabled), गैर-Pro आगंतुकों के लिए सार्वजनिक सूचना पृष्ठों पर मुफ़्त टूलकिट का समर्थन करने हेतु Google AdSense विज्ञापन दिखाए जा सकते हैं। विज्ञापन कुकीज़ Google Consent Mode v2 (सहमति मिलने तक default-denied) के अधीन हैं। कृपया नीचे दिए गए विवरण पढ़ें:',
    privacySec8Desc:
      'इस गोपनीयता नीति, डेटा एक्सेस या खाता हटाने के अनुरोध (DSAR) के लिए कृपया ऑपरेटर (Mohammed Tanveer Munshi) से हमारे माध्यम से संपर्क करें:',
    termsUpdated:
      'अंतिम अपडेट और प्रभावी तिथि: नवंबर 2026 • ऑपरेटर: Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • संपर्क: support@pdfminty.com',
    ocrConsentDesc:
      'चयनित पृष्ठ (अतिथि/मुफ़्त में अधिकतम 5; Pro में अधिकतम 15) छवियों में बदलकर केवल OCR के लिए एन्क्रिप्टेड HTTPS प्रॉक्सी (/api/gemini-proxy) के माध्यम से हमारे कॉन्फ़िगर किए गए क्लाउड AI प्रदाताओं (Google Gemini, Groq और/या xAI Grok) को भेजे जाते हैं।',
    ocrConsentCheckbox:
      'मैं OCR ट्रांसक्रिप्शन के लिए चयनित पेज छवियाँ हमारे कॉन्फ़िगर किए गए क्लाउड AI प्रदाताओं (Google Gemini, Groq और/या xAI Grok) को भेजने की सहमति देता हूँ।',
    mergeComparisonLimit: '5/दिन अतिथि • 10/दिन मुफ़्त • असीमित Pro',
  },
  zh: {
    homeWhyChooseFreeTitle: '每日免费额度',
    homeWhyChooseFreeDesc:
      '无水印免费合并、拆分、压缩、签署和编辑 PDF：访客每日 5 次免费任务（单文件最大 100MB），免费账户每日 10 次任务（单文件最大 150MB），另提供可选 Pro（$2.49/月）与 Lifetime（$50 一次性）不限量方案。',
    homeFaqFreeAnswer:
      '是的 — PDFMinty 为全部 24 款工具提供免费层级：访客无需注册或信用卡即可每日免费使用 5 次任务（单文件最高 100MB），免费注册用户每日可享 10 次任务（单文件最高 150MB）且导出无水印。如需每日无限次任务、500MB 大文件及更高 AI/OCR 额度，可选择 Monthly Pro（$2.49/月）或 Lifetime Pro（$50 一次性买断）。',
    homeFaqPrivacyAnswer:
      'PDFMinty 的 22 款标准 PDF 工具（包括 PDF 转 Markdown）100% 通过 WebAssembly 和 JavaScript 在您的浏览器本地运行，绝不向任何外部服务器上传文件。仅有的例外是 2 款可选的云端 AI 工具（AI Analyze PDF 与 OCR PDF），仅在您明确勾选同意后，才会通过加密 HTTPS 代理将提取的文本或选定页面图像发送至我们配置的云端 AI 提供商（Google Gemini、Groq 和/或 xAI Grok）。',
    aboutUsFreeForever:
      '核心 PDF 工具可通过免费方案使用（访客每日 5 次 / 100MB，免费账户每日 10 次 / 150MB，零水印），并可选升级 Pro（$2.49/月）或 Lifetime（$50）解锁每日不限量使用。',
    adobeAltEveryToolDesc:
      '核心 PDF 工具在免费方案中免费可用（访客每日 5 次，免费账户每日 10 次）。可选 Pro（$2.49/月）与 Lifetime（$50）解锁无限使用。',
    adobeAltNoSignups: '无需强制注册即可开始（访客每日 5 次免费任务）',
    privacyUpdated:
      '生效日期：2026年1月1日 • 最后更新：2026年11月 • 数据控制者 (Data Controller)：Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • 联系邮箱：support@pdfminty.com',
    privacySummary:
      'PDFMinty 的 22 款标准 PDF 工具（包括 PDF 转 Markdown）通过 WebAssembly 与 HTML5 Canvas 在您的浏览器本地 100% 处理文件，不向任何服务器上传文档。仅当您明确勾选同意并使用我们的 2 款云端 AI 工具——AI Analyze PDF（/ai-analyze-pdf/）或 OCR PDF（/ocr-pdf/）——时，提取的文本或选定页面图像才会通过 TLS 加密 HTTPS 代理（/api/gemini-proxy）传输至我们配置的云端 AI 推理提供商（Google Gemini、Groq 和/或 xAI Grok）以完成您的即时请求。若您选择通过 Google OAuth 或邮箱登录，我们仅按照 Google API Services User Data Policy（Limited Use）在 Google Cloud Firestore 中保存基本账户信息。',
    privacySec3Desc:
      'PDFMinty 提供 2 款明确标注的可选 AI 工具：AI Analyze PDF（/ai-analyze-pdf/）与 OCR PDF（/ocr-pdf/）。与我们的 22 款本地标准工具（包括 PDF 转 Markdown）不同，这 2 款功能通过加密代理（/api/gemini-proxy）调用我们配置的云端 AI 提供商（Google Gemini、Groq 和/或 xAI Grok）。',
    privacySec4Intro:
      '在启用广告的情况下（when enabled），PDFMinty 可能在面向非 Pro 访客的公开信息页面展示 Google AdSense 广告以支持免费使用。广告 Cookie 始终受 Google Consent Mode v2 控制（在您明确同意前默认拒绝）。请参阅以下说明：',
    privacySec8Desc:
      '如您对本隐私政策、数据访问或账户删除请求（DSAR）有任何疑问，请通过以下方式联系运营者（Mohammed Tanveer Munshi）：',
    termsUpdated:
      '最后更新与生效日期：2026年11月 • 运营者：Mohammed Tanveer Munshi (PdfMinty), Dhaka, Bangladesh • 联系邮箱：support@pdfminty.com',
    ocrConsentDesc:
      '所选页面（访客/免费版最多 5 页；Pro 版最多 15 页）将转换为图像，并通过加密 HTTPS 代理（/api/gemini-proxy）传输至我们配置的云端 AI 提供商（Google Gemini、Groq 和/或 xAI Grok）仅用于 OCR 文字识别。',
    ocrConsentCheckbox:
      '我理解并同意将所选页面图像加密发送至我们配置的云端 AI 提供商（Google Gemini、Groq 和/或 xAI Grok）以进行 OCR 识别。',
    mergeComparisonLimit: '访客 5次/天 • 免费账户 10次/天 • Pro 无限制',
  },
};
