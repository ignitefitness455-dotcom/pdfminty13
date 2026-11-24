/**
 * Single-source-of-truth locale synchronization script.
 *
 * Reads canonical operator, AI provider, AdSense ("when enabled"), and quota
 * copy from `src/config/quotas.ts` and updates all 7 locales
 * (en, bn, de, es, fr, hi, zh) consistently without altering unrelated keys.
 *
 * Usage: npx tsx scripts/sync-quota-locales.ts
 */

import fs from 'fs';
import path from 'path';

import { LOCALIZED_CANONICAL_COPY } from '../src/config/quotas';
import type { SupportedLocale } from '../src/i18n/config';

const LOCALES: SupportedLocale[] = ['en', 'bn', 'de', 'es', 'fr', 'hi', 'zh'];
const LOCALES_ROOT = path.resolve(process.cwd(), 'src', 'locales');

function setNested(obj: Record<string, unknown>, dotPath: string, value: string): void {
  const parts = dotPath.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== 'object') {
      cur[k] = {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function syncCommonJson(locale: SupportedLocale): void {
  const filePath = path.join(LOCALES_ROOT, locale, 'common.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as Record<string, unknown>;
  const copy = LOCALIZED_CANONICAL_COPY[locale];

  // 1. Homepage quota & privacy FAQ sync
  setNested(data, 'home.whyChoose.freeTitle', copy.homeWhyChooseFreeTitle);
  setNested(data, 'home.whyChoose.freeDesc', copy.homeWhyChooseFreeDesc);

  const home = data.home as { faq?: { items?: Array<{ q: string; a: string }> } } | undefined;
  if (home?.faq?.items && Array.isArray(home.faq.items)) {
    if (home.faq.items[0]) {
      home.faq.items[0].a = copy.homeFaqPrivacyAnswer;
    }
    if (home.faq.items[1]) {
      home.faq.items[1].a = copy.homeFaqFreeAnswer;
    }
  }

  // 2. About Us & Adobe Alternative quota sync
  setNested(data, 'aboutUs.freeForever', copy.aboutUsFreeForever);
  setNested(data, 'adobeAlternative.everyToolDesc', copy.adobeAltEveryToolDesc);
  setNested(data, 'adobeAlternative.noSignups', copy.adobeAltNoSignups);

  // 3. Privacy Policy & Terms of Service canonical strings
  setNested(data, 'privacyPolicy.updated', copy.privacyUpdated);
  setNested(data, 'privacyPolicy.summary', copy.privacySummary);
  setNested(data, 'privacyPolicy.sec3Desc', copy.privacySec3Desc);
  setNested(data, 'privacyPolicy.sec4Intro', copy.privacySec4Intro);
  setNested(data, 'privacyPolicy.sec8Desc', copy.privacySec8Desc);
  setNested(data, 'termsOfService.updated', copy.termsUpdated);

  // 4. OCR PDF consent strings (Google Gemini, Groq, xAI Grok)
  setNested(data, 'ocrPdf.consentDesc', copy.ocrConsentDesc);
  setNested(data, 'ocrPdf.consentCheckbox', copy.ocrConsentCheckbox);

  // 5. Clean any stale embedded merge-pdf/split-pdf longFormBody contradictions inside common.json
  const tools = data.tools as Record<string, Record<string, unknown>> | undefined;
  if (tools?.['merge-pdf'] && typeof tools['merge-pdf'].longFormBody === 'string') {
    tools['merge-pdf'].longFormBody = (tools['merge-pdf'].longFormBody as string)
      .replace(
        /Sin límites ocultos ni marcas de agua:/g,
        'Sin marcas de agua y nivel gratuito claro:'
      )
      .replace(
        /Herramienta 100% gratuita y sin logotipos añadidos a tus documentos\./g,
        '5 tareas diarias gratis para invitados (10 con cuenta gratuita) sin logotipos añadidos, más planes Pro opcionales para uso ilimitado.'
      )
      .replace(
        /Keine Beschränkungen oder Wasserzeichen:/g,
        'Ohne Wasserzeichen &amp; faires Freikontingent:'
      )
      .replace(
        /Völlig kostenlos ohne störende Markierungen, versteckte Abonnements oder Registrierungszwang\./g,
        '5 kostenlose Aufgaben/Tag für Gäste (10/Tag mit kostenlosem Konto) ohne Wasserzeichen, plus optionale Pro-Tarife für unbegrenzte Nutzung.'
      )
      .replace(
        /Sans filigrane ni frais cachés :/g,
        'Sans filigrane et offre gratuite transparente :'
      )
      .replace(
        /Service entièrement gratuit, sans inscription obligatoire et sans ajout de logo promotionnel\./g,
        '5 tâches gratuites/jour pour les invités (10/jour avec compte gratuit) sans filigrane, plus des offres Pro optionnelles pour un usage illimité.'
      )
      .replace(/真正永久免费且无水印干扰：/g, '零水印与透明免费额度：')
      .replace(
        /无需注册登录账号，无隐藏订阅收费，绝不在您的文档中强行嵌入任何宣传水印或页脚徽标。/g,
        '访客每日可享 5 次免费任务（免费账户每日 10 次）且绝无宣传水印，如需每日不限量可选择 Pro 方案。'
      )
      .replace(/কোনো সীমা বা ওয়াটারমার্ক নেই:/g, 'কোনো ওয়াটারমার্ক নেই ও ফ্রি টিয়ার:')
      .replace(
        /সম্পূর্ণ ফ্রি এবং কোনো জলছাপ বা লুকানো সাবস্ক্রিপশন চার্জ যুক্ত করা হয় না।/g,
        'গেস্টদের জন্য প্রতিদিন ৫টি ফ্রি টাস্ক (ফ্রি অ্যাকাউন্টে ১০টি) কোনো জলছাপ ছাড়াই, এবং আনলিমিটেড কাজের জন্য ঐচ্ছিক Pro প্ল্যান।'
      )
      .replace(/कोई सीमा या वॉटरमार्क नहीं:/g, 'कोई वॉटरमार्क नहीं व स्पष्ट मुफ़्त टियर:')
      .replace(
        /पूरी तरह से मुफ्त और बिना किसी प्रचार वॉटरमार्क या छिपे हुए सदस्यता शुल्क के।/g,
        'अतिथियों के लिए प्रतिदिन 5 मुफ़्त कार्य (मुफ़्त खाते में 10/दिन) बिना किसी वॉटरमार्क के, और असीमित उपयोग के लिए वैकल्पिक Pro प्लान।'
      );
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Synced ${locale}/common.json`);
}

function syncArticlesBodyJson(locale: SupportedLocale): void {
  const filePath = path.join(LOCALES_ROOT, locale, 'articles-body.json');
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  const updated = raw
    .replace(
      /Merge up to 50 documents per session \(150MB combined\) without paying \$15\/month subscriptions — and with no daily limits\./g,
      'Merge up to 50 documents per session (150MB combined on Free Account; 5 daily tasks for guests, 10 for free accounts, or unlimited daily tasks on optional Pro $2.49/mo and Lifetime $50 plans).'
    )
    .replace(
      /Yes! PdfMinty is 100% free forever with no hidden paywalls, subscription traps, or limits on the number of files you can merge\./g,
      'Yes! PdfMinty offers a Free Forever tier (5 free daily guest tasks up to 100MB/file, 10 daily free-account tasks up to 150MB/file) with zero watermarks, plus optional Pro ($2.49/mo) and Lifetime ($50) upgrades for unlimited daily usage.'
    )
    .replace(/with no artificial daily caps/gi, 'with generous Free Forever daily quotas (5/day guest, 10/day free account) and optional Pro unlimited plans')
    .replace(/no artificial daily caps/gi, 'transparent Free Forever daily quotas (5/day guest, 10/day free account) and optional Pro unlimited plans')
    .replace(/no daily limits/gi, 'transparent Free Forever daily quotas (5/day guest, 10/day free account, unlimited on Pro)');

  if (updated !== raw) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Cleaned quota copy in ${locale}/articles-body.json`);
  }
}

for (const locale of LOCALES) {
  syncCommonJson(locale);
  syncArticlesBodyJson(locale);
}

console.log('Locale quota and legal sync complete across all 7 locales.');
