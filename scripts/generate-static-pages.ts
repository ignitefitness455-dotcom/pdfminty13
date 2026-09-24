import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

import { HOMEPAGE_H1 } from '../src/config/homeConfig';
import { SITE_URL, SITE_NAME, TOOLS, ToolSEOInfo, RELATED_TOOL_MAPPING } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_TOOL_SLUGS, isI18nToolSlug, getHreflangs, getCanonicalUrl } from '../src/i18n/config';
import { logger } from '../src/utils/logger';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Ensure favicons, touch-icons, and OG sharing images are generated on every build
async function generateAllAssets(publicDir: string, distDir: string): Promise<void> {
  const iconSource: string = path.join(publicDir, 'logo.svg');
  if (!fs.existsSync(iconSource)) {
    logger.warn('Warning: Source logo.svg not found in public directory. Unable to generate assets.');
    return;
  }

  logger.info('Generating website logos, favicons, and metadata graphics...');
  try {
    // Ensure both output targets exist
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    const targets: string[] = [publicDir, distDir];

    for (const target of targets) {
      if (!fs.existsSync(target)) continue;

      // 1. logo-192.png (PWA asset)
      await sharp(iconSource)
        .resize(192, 192)
        .png()
        .toFile(path.join(target, 'logo-192.png'));

      // 2. logo-512.png (PWA asset)
      await sharp(iconSource)
        .resize(512, 512)
        .png()
        .toFile(path.join(target, 'logo-512.png'));

      // 3. apple-touch-icon.png (Apple web device card)
      await sharp(iconSource)
        .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(target, 'apple-touch-icon.png'));

      // 4. favicon.ico (True ICO binary containing 16x16 and 32x32 frames) & favicon.png
      const png16 = await sharp(iconSource).resize(16, 16).png().toBuffer();
      const png32 = await sharp(iconSource).resize(32, 32).png().toBuffer();
      const icoBuffer = await pngToIco([png16, png32]);
      await fs.promises.writeFile(path.join(target, 'favicon.ico'), icoBuffer);
      await fs.promises.writeFile(path.join(target, 'favicon.png'), png32);

      // 5. og-image.png (Rich social share preview, custom high-fidelity banner composition!)
      const ogSvgMarkup = `
        <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0b1329;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#grad)" />
          
          <circle cx="1100" cy="100" r="300" fill="#00FFC2" fill-opacity="0.04" />
          <circle cx="100" cy="530" r="200" fill="#059669" fill-opacity="0.06" />

          <g transform="translate(480, 110) scale(4.8)">
            <rect x="6" y="11" width="26" height="33" rx="6" fill="#0E0E0E" />
            <rect x="7" y="12" width="24" height="31" rx="5" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" fill="none" />
            <rect x="15" y="4" width="27" height="33" rx="6" fill="#00FFC2" />
            <rect x="16" y="5" width="25" height="31" rx="5" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.3" fill="none" />
            <path d="M35 4L42 11H39C36.7909 11 35 9.20914 35 7V4Z" fill="#131313" />
            <rect x="21" y="15" width="15" height="2.2" rx="1.1" fill="#131313" />
            <rect x="21" y="21" width="15" height="2.2" rx="1.1" fill="#131313" />
            <rect x="21" y="27" width="9" height="2.2" rx="1.1" fill="#131313" fill-opacity="0.8" />
          </g>

          <text x="600" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2px">
            PDFMinty
          </text>
          
          <text x="600" y="490" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="4px">
            PRIVACY-FIRST FREE PDF TOOLKIT
          </text>

          <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#00FFC2" text-anchor="middle" letter-spacing="1px">
            100% Client-Side • Secure Offline Calculations • No Server Uploads
          </text>
        </svg>
      `;

      await sharp(Buffer.from(ogSvgMarkup))
        .png()
        .toFile(path.join(target, 'og-image.png'));
    }

    logger.info('Successfully completed generateAllAssets procedure.');
  } catch (err: unknown) {
    logger.error('Error during asset generation pipeline:', err);
  }
}

interface LocalizedPageData {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  howToTitle: string;
  howToSteps: { title: string; desc: string }[];
  whyTitle: string;
  features: { title: string; desc: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
  relatedTitle: string;
  relatedTools: { url: string; text: string }[];
}

const MERGE_PDF_LOCALIZED_DATA: Record<string, LocalizedPageData> = {
  bn: {
    metaTitle: 'বিনামূল্যে PDF মার্জ করুন — একাধিক ফাইল যুক্ত করুন | PDFMinty',
    metaDescription: 'সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ফাইলে যুক্ত করুন। ১০০% ব্রাউজার প্রসেসিং, কোনো ফাইল সার্ভারে আপলোড হয় না।',
    h1: 'বিনামূল্যে PDF ফাইল মার্জ করুন — একাধিক PDF এক ডকুমেন্টে যুক্ত করুন (১০০% ব্রাউজার প্রসেসিং)',
    lead: 'অনলাইনে সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ডকুমেন্টে মার্জ বা একত্রিত করুন। কোনো সফটওয়্যার ইন্সটল করার প্রয়োজন নেই এবং আপনার ফাইল কখনোই কোনো রিমোট সার্ভারে আপলোড করা হয় না।',
    howToTitle: 'কীভাবে একাধিক PDF ফাইল মার্জ করবেন?',
    howToSteps: [
      { title: 'ফাইল নির্বাচন করুন:', desc: "'ফাইল বাছুন' বোতামে ক্লিক করুন অথবা আপনার ডিভাইস থেকে PDF ফাইলগুলো ড্র্যাগ ও ড্রপ করুন।" },
      { title: 'ক্রম সাজান:', desc: 'ড্র্যাগ কন্ট্রোল বা তীর বোতাম ব্যবহার করে ফাইলগুলো আপনার পছন্দমতো ক্রমানুসারে সাজান।' },
      { title: 'মার্জ বোতামে চাপুন:', desc: "'PDF মার্জ করুন' বোতামে ক্লিক করলেই ব্রাউজারের ভেতর মেমোরিতে ফাইলগুলো একত্রিত হবে।" },
      { title: 'ডাউনলোড করুন:', desc: 'মার্জ সম্পন্ন হলে স্বয়ংক্রিয়ভাবে আপনার নতুন একক PDF ফাইলটি ডাউনলোড হয়ে যাবে।' }
    ],
    whyTitle: 'কেন PdfMinty-এর PDF মার্জার সেরা?',
    features: [
      { title: '১০০% ক্লায়েন্ট-সাইড প্রাইভেসি:', desc: 'ফাইলগুলো WebAssembly প্রযুক্তিতে সরাসরি আপনার ডিভাইসে প্রসেস হয়।' },
      { title: 'কোনো সীমা বা ওয়াটারমার্ক নেই:', desc: 'সম্পূর্ণ ফ্রি এবং কোনো জলছাপ যুক্ত করা হয় না।' },
      { title: 'লিপিবদ্ধ কোয়ালিটি অক্ষত:', desc: 'টেক্সট, হাই-রেজোলিউশন ছবি ও ভেক্টর ড্রয়িং মূল কোয়ালিটিতে বজায় থাকে।' },
      { title: 'অফলাইন সাপোর্ট:', desc: 'একবার লোড হওয়ার পর ইন্টারনেট সংযোগ ছাড়াও টুলটি কাজ করতে সক্ষম।' }
    ],
    faqTitle: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)',
    faqs: [
      { q: 'আমার PDF ফাইলগুলো কি কোনো সার্ভারে সেভ হয়?', a: 'না, একদমই না। PdfMinty একটি জিরো-আপলোড আর্কিটেকচার অনুসরণ করে। ফাইল প্রসেসিং সম্পূর্ণ আপনার ডিভাইসের র‍্যামে ঘটে।' },
      { q: 'একসাথে কতগুলো PDF ফাইল মার্জ করা যায়?', a: 'আপনার ডিভাইসের মেমোরি অনুযায়ী যতগুলো প্রয়োজন আপনি মার্জ করতে পারবেন। প্রতিটি ফাইল সর্বোচ্চ 100MB পর্যন্ত হতে পারে।' },
      { q: 'PDF মার্জ করলে কি কোয়ালিটি হ্রাস পায়?', a: 'না, মার্জিং প্রক্রিয়াটি সম্পূর্ণ লসলেস (lossless)। মূল ফন্ট, মেটাডাটা এবং ছবির রেজোলিউশন পুরোপুরি অক্ষত থাকে।' }
    ],
    relatedTitle: 'অন্যান্য প্রয়োজনীয় PDF টুলস',
    relatedTools: [
      { url: '/split-pdf/', text: 'PDF স্প্লিট করুন — বড় PDF থেকে পেজ আলাদা করুন' },
      { url: '/protect-pdf/', text: 'PDF পাসওয়ার্ড দিয়ে সুরক্ষিত করুন — অফলাইনে শক্তিশালী এনক্রিপশন' },
      { url: '/rotate-pdf/', text: 'PDF রোটেট করুন — উল্টো বা বাঁকা পেজ সোজা করুন' },
      { url: '/extract-pages-pdf/', text: 'PDF পেজ এক্সট্র্যাক্ট করুন — নির্দিষ্ট পাতাগুলো আলাদা করুন' }
    ]
  },
  de: {
    metaTitle: 'PDF zusammenfügen — Kostenlos PDFs kombinieren | PDFMinty',
    metaDescription: 'Fügen Sie mehrere PDF-Dateien kostenlos und sicher direkt im Browser zusammen. 100% clientseitige Verarbeitung — keine Server-Uploads, maximale Privatsphäre.',
    h1: 'Kostenlos PDF-Dateien zusammenfügen — Mehrere PDFs online kombinieren (100% im Browser)',
    lead: 'Fügen Sie mehrere PDF-Dateien schnell, sicher und kostenlos direkt in Ihrem Webbrowser zu einem Dokument zusammen. Keine Installation erforderlich und Ihre vertraulichen Dokumente verlassen niemals Ihr Gerät.',
    howToTitle: 'Wie füge ich mehrere PDF-Dateien zusammen?',
    howToSteps: [
      { title: 'Dateien auswählen:', desc: "Klicken Sie auf 'Dateien auswählen' oder ziehen Sie Ihre PDF-Dokumente per Drag & Drop in den Bereich." },
      { title: 'Reihenfolge anpassen:', desc: 'Ordnen Sie die Dokumente per Drag & Drop in der gewünschten Reihenfolge an.' },
      { title: 'Zusammenfügen:', desc: "Klicken Sie auf 'PDFs zusammenfügen', um die Dateien direkt im lokalen Speicher zu verbinden." },
      { title: 'Herunterladen:', desc: 'Speichern Sie Ihre neue zusammengefügte PDF-Datei sofort auf Ihrem Gerät.' }
    ],
    whyTitle: 'Warum PDFMinty für das Zusammenfügen von PDFs wählen?',
    features: [
      { title: '100% Privatsphäre & Datenschutz:', desc: 'Alle Operationen werden lokal mit WebAssembly ausgeführt. Null Server-Uploads.' },
      { title: 'Keine Beschränkungen oder Wasserzeichen:', desc: 'Völlig kostenlos ohne störende Markierungen oder Registrierungszwang.' },
      { title: 'Originalqualität bleibt erhalten:', desc: 'Scharfe Vektorgrafiken, lesbare Schriften und Bilder bleiben 1:1 intakt.' },
      { title: 'Offline nutzbar:', desc: 'Nach dem ersten Aufruf funktioniert das Werkzeug auch ohne aktive Internetverbindung.' }
    ],
    faqTitle: 'Häufig gestellte Fragen (FAQ)',
    faqs: [
      { q: 'Werden meine PDF-Dateien auf einem Server gespeichert?', a: 'Nein, niemals. Die Verarbeitung erfolgt vollständig im Arbeitsspeicher Ihres Browsers.' },
      { q: 'Wie viele Dateien kann ich gleichzeitig verbinden?', a: 'Beliebig viele, abhängig vom Speicher Ihres Endgeräts. Einzelne Dateien können bis zu 100 MB groß sein.' },
      { q: 'Verliert das Dokument durch das Zusammenfügen an Qualität?', a: 'Nein, der Vorgang ist absolut verlustfrei. Vektoren, Texte und Formatierungen bleiben unverändert.' }
    ],
    relatedTitle: 'Weitere nützliche PDF-Tools',
    relatedTools: [
      { url: '/split-pdf/', text: 'PDF teilen — Seiten aus großen PDFs trennen' },
      { url: '/protect-pdf/', text: 'PDF mit Passwort schützen — Starke Offline-Verschlüsselung' },
      { url: '/rotate-pdf/', text: 'PDF drehen — Schiefe oder verkehrt herum liegende Seiten korrigieren' },
      { url: '/extract-pages-pdf/', text: 'PDF-Seiten extrahieren — Spezifische Einzelseiten speichern' }
    ]
  },
  es: {
    metaTitle: 'Unir PDF Gratis — Combinar Documentos PDF Online | PDFMinty',
    metaDescription: 'Une varios archivos PDF gratis y de forma segura directamente en tu navegador. Procesamiento 100% local — sin subir archivos a ningún servidor.',
    h1: 'Unir archivos PDF gratis — Combinar múltiples documentos PDF online (100% en el navegador)',
    lead: 'Combina varios archivos PDF en un solo documento organizado de forma rápida, privada y gratuita. Sin necesidad de instalar software y sin que tus archivos salgan de tu dispositivo.',
    howToTitle: '¿Cómo unir varios archivos PDF?',
    howToSteps: [
      { title: 'Seleccionar archivos:', desc: "Haz clic en 'Seleccionar archivos' o arrastra y suelta tus documentos PDF en el área indicada." },
      { title: 'Organizar el orden:', desc: 'Reordena los archivos fácilmente arrastrándolos a la posición deseada.' },
      { title: 'Unir archivos:', desc: "Haz clic en 'Unir PDFs' para procesar los documentos instantáneamente en tu navegador." },
      { title: 'Descargar:', desc: 'Guarda tu nuevo documento PDF unificado de inmediato en tu dispositivo.' }
    ],
    whyTitle: '¿Por qué elegir PDFMinty para unir PDFs?',
    features: [
      { title: 'Privacidad total garantizada:', desc: 'Procesamiento local seguro con WebAssembly. Cero subidas a la nube.' },
      { title: 'Sin límites ni marcas de agua:', desc: 'Herramienta 100% gratuita y sin marcas añadidas a tus documentos.' },
      { title: 'Calidad intacta:', desc: 'Mantiene la resolución de las imágenes, fuentes tipográficas y diseño original.' },
      { title: 'Funciona sin conexión:', desc: 'Una vez cargada la página, puedes unir archivos incluso sin conexión a internet.' }
    ],
    faqTitle: 'Preguntas frecuentes (FAQ)',
    faqs: [
      { q: '¿Se suben mis archivos a algún servidor?', a: 'No, en absoluto. Todo el proceso ocurre en la memoria RAM de tu propio navegador.' },
      { q: '¿Cuántos archivos PDF puedo unir a la vez?', a: 'Tantos como admita la memoria de tu dispositivo. Cada archivo puede ser de hasta 100 MB.' },
      { q: '¿Se pierde calidad al unir los documentos?', a: 'No, la combinación se realiza de forma totalmente fiel y sin compresión destructiva.' }
    ],
    relatedTitle: 'Otras herramientas PDF útiles',
    relatedTools: [
      { url: '/split-pdf/', text: 'Dividir PDF — Separar páginas de un PDF extenso' },
      { url: '/protect-pdf/', text: 'Proteger PDF — Encriptar con contraseña sin conexión' },
      { url: '/rotate-pdf/', text: 'Rotar PDF — Enderezar páginas giradas o invertidas' },
      { url: '/extract-pages-pdf/', text: 'Extraer páginas — Guardar rangos de páginas seleccionadas' }
    ]
  },
  fr: {
    metaTitle: 'Fusionner PDF Gratuit — Combiner vos fichiers | PDFMinty',
    metaDescription: 'Fusionnez plusieurs fichiers PDF gratuitement et en toute sécurité dans votre navigateur. Traitement 100% local — aucun téléversement, confidentialité totale.',
    h1: 'Fusionner des fichiers PDF gratuitement — Combiner plusieurs PDF en ligne (100% dans le navigateur)',
    lead: 'Assemblez plusieurs documents PDF en un seul fichier structuré en quelques secondes. Simple, gratuit et strictement confidentiel : aucun fichier n\'est téléversé sur un serveur.',
    howToTitle: 'Comment fusionner plusieurs fichiers PDF ?',
    howToSteps: [
      { title: 'Sélectionner les fichiers :', desc: "Cliquez sur 'Sélectionner des fichiers' ou glissez-déposez vos documents PDF." },
      { title: 'Organiser l\'ordre :', desc: 'Réorganisez facilement les fichiers dans l\'ordre de votre choix.' },
      { title: 'Fusionner :', desc: "Cliquez sur 'Fusionner les PDF' pour combiner les pages dans la mémoire locale." },
      { title: 'Télécharger :', desc: 'Enregistrez immédiatement votre nouveau document PDF consolidé.' }
    ],
    whyTitle: 'Pourquoi choisir PDFMinty pour fusionner vos PDF ?',
    features: [
      { title: 'Confidentialité absolue :', desc: 'Traitement local via WebAssembly. Zéro transfert de données vers des serveurs distants.' },
      { title: 'Sans filigrane ni inscription :', desc: 'Service entièrement gratuit sans marquage publicitaire.' },
      { title: 'Préservation de la qualité :', desc: 'Vos textes, images et éléments vectoriels conservent leur netteté d\'origine.' },
      { title: 'Fonctionnement hors ligne :', desc: 'L\'outil reste pleinement opérationnel même sans accès à Internet une fois chargé.' }
    ],
    faqTitle: 'Foire aux questions (FAQ)',
    faqs: [
      { q: 'Mes documents sont-ils stockés en ligne ?', a: 'Non. PdfMinty fonctionne exclusivement dans la mémoire vive de votre navigateur.' },
      { q: 'Combien de fichiers puis-je combiner ?', a: 'Autant que la mémoire de votre appareil le permet. Chaque fichier peut aller jusqu\'à 100 Mo.' },
      { q: 'Y a-t-il une perte de qualité ?', a: 'Non, le processus de fusion est rigoureusement sans perte.' }
    ],
    relatedTitle: 'Autres outils PDF pratiques',
    relatedTools: [
      { url: '/split-pdf/', text: 'Diviser un PDF — Séparer les pages d\'un gros document' },
      { url: '/protect-pdf/', text: 'Protéger par mot de passe — Chiffrement fort hors ligne' },
      { url: '/rotate-pdf/', text: 'Pivoter un PDF — Redresser les pages inversées' },
      { url: '/extract-pages-pdf/', text: 'Extraire des pages — Isoler des sections précises' }
    ]
  },
  hi: {
    metaTitle: 'पीडीएफ मर्ज करें — मुफ़्त ऑनलाइन फाइलें जोड़ें | PDFMinty',
    metaDescription: 'मुफ़्त में ऑनलाइन पीडीएफ फ़ाइलें मर्ज करें। ब्राउज़र में कई पीडीएफ सुरक्षित रूप से जोड़ें। कोई सर्वर अपलोड नहीं, आपकी फाइलें निजी रहती हैं।',
    h1: 'मुफ़्त में पीडीएफ फाइलें मर्ज करें — कई पीडीएफ एक साथ जोड़ें (१००% ब्राउज़र प्रोसेसिंग)',
    lead: 'ऑनलाइन मुफ़्त और सुरक्षित तरीके से कई पीडीएफ फाइलों को एक दस्तावेज़ में मिलाएं। किसी सॉफ्टवेयर को इंस्टॉल करने की आवश्यकता नहीं है और आपकी फाइलें कभी भी किसी रिमोट सर्वर पर अपलोड नहीं होती हैं।',
    howToTitle: 'कई पीडीएफ फाइलों को कैसे मर्ज करें?',
    howToSteps: [
      { title: 'फाइलें चुनें:', desc: "'फाइलें चुनें' बटन पर क्लिक करें या अपने डिवाइस से पीडीएफ फाइलों को ड्रैग और ड्रॉप करें।" },
      { title: 'क्रम व्यवस्थित करें:', desc: 'फाइलों को अपनी इच्छानुसार क्रम में व्यवस्थित करें।' },
      { title: 'मर्ज बटन दबाएं:', desc: "'पीडीएफ मर्ज करें' पर क्लिक करें, फाइलें स्थानीय रूप से जुड़ जाएंगी।" },
      { title: 'डाउनलोड करें:', desc: 'नई संयुक्त पीडीएफ फाइल तुरंत डाउनलोड करें।' }
    ],
    whyTitle: 'पीडीएफ मर्ज करने के लिए PDFMinty क्यों चुनें?',
    features: [
      { title: '१००% स्थानीय गोपनीयता:', desc: 'वेबअसेम्बली के साथ फाइलें आपके डिवाइस पर सुरक्षित रूप से प्रोसेस होती हैं।' },
      { title: 'कोई सीमा या वॉटरमार्क नहीं:', desc: 'पूरी तरह से मुफ्त और बिना किसी वॉटरमार्क के।' },
      { title: 'मूल गुणवत्ता बरकरार:', desc: 'टेक्स्ट और इमेज की गुणवत्ता मूल रूप में बनी रहती है।' },
      { title: 'ऑफलाइन कार्यक्षमता:', desc: 'एक बार लोड होने के बाद बिना इंटरनेट के भी काम करता है।' }
    ],
    faqTitle: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
    faqs: [
      { q: 'क्या मेरी फाइलें किसी सर्वर पर सुरक्षित की जाती हैं?', a: 'नहीं, कभी नहीं। Processing केवल आपके ब्राउज़र की रैम में होती है।' },
      { q: 'मैं एक बार में कितनी फाइलें जोड़ सकता हूं?', a: 'आपके डिवाइस की मेमोरी के अनुसार जितनी चाहें उतनी। प्रत्येक फ़ाइल 100MB तक हो सकती है।' },
      { q: 'क्या मर्ज करने से गुणवत्ता कम होती है?', a: 'नहीं, प्रक्रिया पूरी तरह से दोषरहित है।' }
    ],
    relatedTitle: 'अन्य उपयोगी पीडीएफ टूल्स',
    relatedTools: [
      { url: '/split-pdf/', text: 'पीडीएफ विभाजित करें — बड़ी फाइलों से पेज अलग करें' },
      { url: '/protect-pdf/', text: 'पासवर्ड से सुरक्षित करें — मजबूत ऑफलाइन एन्क्रिप्शन' },
      { url: '/rotate-pdf/', text: 'पीडीएफ घुमाएं — उल्टे पेजों को सीधा करें' },
      { url: '/extract-pages-pdf/', text: 'पेज निकालें — विशिष्ट पेजों को नई फाइल में सहेजें' }
    ]
  },
  zh: {
    metaTitle: '免费合并 PDF 文件 — 在线合并 PDF 文档 | PDFMinty',
    metaDescription: '免费在线合并 PDF 文件，支持拖拽排序并将多个 PDF 高速拼接组合为一个完整文档。采用现代 WebAssembly 与浏览器本地沙箱技术，零服务器上传，全方位守护个人档案、财务凭证与法律合同隐私。无需注册登录、无文件数量限制、绝无任何水印，且完全支持离线 PWA 随时使用，轻巧安全。',
    h1: '免费合并 PDF 文件 — 在线将多个 PDF 组合为一个文档（100% 浏览器本地处理）',
    lead: 'PDFMinty 为您提供了一种全新且高度安全的专业 PDF 处理方式。传统在线合并工具通常需要将您的发票、合同、纳税申报表或医疗报告上传至未知云端服务器，存在严重的数据泄露风险。PDFMinty 完全颠覆了这一流程——所有文档解析与合并操作均在您设备本地的浏览器沙箱环境中执行，基于 WebAssembly 引擎毫秒级完成。无论是合并月度工作报告、学术论文章节还是法律诉讼案卷，整个过程零数据上传、完全免费且无任何水印，全方位保障您的隐私安全。',
    howToTitle: '如何合并多个 PDF 文件？',
    howToSteps: [
      { title: '添加并上传文件：', desc: '点击“选择文件”按钮，或直接将需要合并的多个 PDF 文件从电脑拖拽至虚线工作区域内。' },
      { title: '自由排列文件顺序：', desc: '通过可视化拖拽手柄或上下移动箭头，轻松调整各个 PDF 文件的先后排布次序，还可以随时移除不需要的页面或文件。' },
      { title: '一键本地极速合并：', desc: '点击绿色的“合并 PDF”按钮，浏览器将在本地内存中高速编译文档树，几毫秒内完成组合，无需漫长等待。' },
      { title: '即刻保存合并文件：', desc: '合并完成后，全新的单一 PDF 文件将自动或一键下载至您的设备，原始文档格式、文字排版与高清矢量图完美保留。' }
    ],
    whyTitle: '为什么选择 PDFMinty 合并 PDF？',
    features: [
      { title: '100% 客户端隐私安全（零文件上传）：', desc: '所有 PDF 处理均在您本地设备的 CPU 与浏览器沙箱内存中完成，数据绝不经过任何外部服务器或云端 API，处理纳税单、商业合同及敏感医疗记录安全无忧。' },
      { title: '极速本地处理与无损高品质：', desc: '依托现代 WebAssembly 底层优化技术，合并大文件无需等待网络上传和下载；原生保留原始 PDF 的字体、矢量图、超链接、混合横纵页面方向与分辨率。' },
      { title: '真正永久免费且无水印干扰：', desc: '无需注册登录账号，无隐藏订阅收费，绝不在您的文档中强行嵌入任何宣传水印或页脚徽标。' },
      { title: '纯离线运行与 PWA 渐进式应用支持：', desc: '支持安装为渐进式 Web 应用（PWA），页面缓存后即使在飞机、高铁等无网络离线环境下，依然能够顺畅合并文档。' },
      { title: '灵活易用与大容量无限制：', desc: '轻松支持数十个 PDF 文件批量组合，最大支持 150MB 批处理容量，提供便捷的拖拽手柄与键盘辅助功能。' }
    ],
    faqTitle: '常见问题解答 (FAQ)',
    faqs: [
      { q: '在 PDFMinty 上合并 PDF 文件是否绝对安全？我的数据会被泄露吗？', a: '绝对安全。PDFMinty 采用创新的“零上传”纯客户端架构，所有文件的解码、页面提取与拼接均直接在您本地浏览器的 JavaScript 与 WebAssembly 内存中运行。您的文件数据绝不会通过互联网发送至任何远程云端服务器，完全杜绝了第三方截获或泄露隐私的风险。' },
      { q: '我一次可以合并多少个 PDF 文件？有文件大小限制吗？', a: '单个 PDF 文件支持高达 50MB，单次合并总容量上限为 150MB，可轻松容纳数十个文档。由于所有计算均调用您当前设备的硬件资源，因此没有每日使用次数限制，也无需排队等待服务器端分配配额。' },
      { q: '可以直接合并受密码保护或已加密的 PDF 文件吗？', a: '受密码加密保护的 PDF 必须先进行解密方可合并。这是为了确保文档结构的合法性与权限安全。您可以先使用我们的“解锁 PDF”工具输入密码解除限制，然后再将生成的解密文档导入合并工具中进行快速组合。' },
      { q: 'PDFMinty 合并工具在断网或没有网络时能正常使用吗？', a: '完全可以。PDFMinty 构建为符合现代标准的渐进式 Web 应用（PWA）。只要您在有网络时访问过一次本站，所有核心算法和工具组件均已保存在本地浏览器缓存中。在无网络连接状态下打开网页或添加到桌面运行，依然可以流畅合并您的 PDF 文件。' }
    ],
    relatedTitle: '其他常用 PDF 工具',
    relatedTools: [
      { url: '/split-pdf/', text: '拆分 PDF — 从大文件中分离页面' },
      { url: '/protect-pdf/', text: 'PDF 密码保护 — 强力离线加密' },
      { url: '/rotate-pdf/', text: '旋转 PDF — 纠正倒置或倾斜的页面' },
      { url: '/extract-pages-pdf/', text: '提取 PDF 页面 — 导出选定页面为新文件' }
    ]
  }
};

async function run(): Promise<void> {
  const distDir: string = path.join(__dirname, "../dist");
  const publicDir: string = path.join(__dirname, "../public");
  
  // Create logos & icons first on every build dynamically
  await generateAllAssets(publicDir, distDir);

  const distIndexHtmlPath: string = path.join(distDir, "index.html");
  const rootIndexHtmlPath: string = path.join(__dirname, "../index.html");
  
  let baseHtml = "";
  if (fs.existsSync(distIndexHtmlPath)) {
    baseHtml = fs.readFileSync(distIndexHtmlPath, "utf8");
    logger.info("Reading template from compiled dist/index.html");
  } else if (fs.existsSync(rootIndexHtmlPath)) {
    baseHtml = fs.readFileSync(rootIndexHtmlPath, "utf8");
    logger.info("Reading template from root index.html");
  } else {
    throw new Error("Unable to locate any base index.html template file for static generation.");
  }
  
  // Clean base HTML to avoid double definitions (purging titles, descriptions, canonicals, OGs, Twitters, and JSON-LD markup)
  function cleanBaseTemplate(html: string): string {
    let clean: string = html;
    clean = clean.replace(/<title>[^<]*<\/title>/gi, "");
    clean = clean.replace(/<meta\s+name="description"[^>]*>/gi, "");
    clean = clean.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
    clean = clean.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, "");
    clean = clean.replace(/<meta\s+property="og:[^>]*>/gi, ""); // Purge all og: properties
    clean = clean.replace(/<meta\s+name="twitter:[^>]*>/gi, ""); // Purge all twitter: properties
    
    // Purge any homepage-only JSON-LD structured script elements to avoid duplication
    clean = clean.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
    
    // Reset #root container thoroughly
    clean = clean.replace(/<div\s+id="root"[\s\S]*?(?=\s*(?:<script|<!--|<\/body>))/i, '<div id="root"></div>');

    return clean;
  }
  
  const optimizedBase: string = cleanBaseTemplate(baseHtml);

  // Complete PDF tool links for rich crawlable static footer
  const STATIC_FOOTER_TOOL_LINKS = [
    { slug: 'merge-pdf', name: 'Merge PDF' },
    { slug: 'split-pdf', name: 'Split PDF' },
    { slug: 'compress-pdf', name: 'Compress PDF' },
    { slug: 'rotate-pdf', name: 'Rotate PDF' },
    { slug: 'delete-pages-pdf', name: 'Delete PDF Pages' },
    { slug: 'extract-pages-pdf', name: 'Extract PDF Pages' },
    { slug: 'reorder-pdf', name: 'Reorder PDF Pages' },
    { slug: 'watermark-pdf', name: 'Watermark PDF' },
    { slug: 'add-page-numbers', name: 'Add Page Numbers' },
    { slug: 'add-blank-page', name: 'Add Blank Page' },
    { slug: 'protect-pdf', name: 'Protect PDF' },
    { slug: 'unlock-pdf', name: 'Unlock PDF' },
    { slug: 'image-to-pdf', name: 'Image to PDF' },
    { slug: 'pdf-to-image', name: 'PDF to Image' },
    { slug: 'pdf-to-markdown', name: 'PDF to Markdown' },
    { slug: 'ai-analyze-pdf', name: 'AI Analyze PDF' },
    { slug: 'grayscale-pdf', name: 'Grayscale PDF' },
    { slug: 'flatten-pdf', name: 'Flatten PDF' },
    { slug: 'repair-pdf', name: 'Repair PDF' },
    { slug: 'sign-pdf', name: 'Sign PDF' },
    { slug: 'ocr-pdf', name: 'OCR PDF' },
    { slug: 'edit-pdf-metadata', name: 'Edit PDF Metadata' },
    { slug: 'sanitize-pdf', name: 'Sanitize PDF' },
  ];

  // Helper to build semantic lightweight static header for pre-rendered pages
  function buildStaticHeader(locale: string = DEFAULT_LOCALE): string {
    const homeHref = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
    return `      <header data-prerender="true" class="site-header">
        <div class="site-header-inner">
          <a href="${homeHref}" class="brand-logo" aria-label="PDFMinty Home">
            <span>PDFMinty</span>
          </a>
          <nav aria-label="Main Navigation">
            <ul>
              <li><a href="${homeHref}">Home</a></li>
              <li><a href="#all-tools">All Tools</a></li>
              <li><a href="/blog/">Blog</a></li>
              <li><a href="/compare/pdfminty-vs-smallpdf/">Compare</a></li>
              <li><a href="/about-us/">About</a></li>
              <li><a href="/contact/">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>`;
  }

  // Helper to build semantic lightweight static footer with 4 rich columns
  function buildStaticFooter(locale: string = DEFAULT_LOCALE): string {
    const homeHref = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
    const toolsListHtml = STATIC_FOOTER_TOOL_LINKS
      .map((t) => `              <li><a href="/${t.slug}/">${t.name}</a></li>`)
      .join('\n');

    return `      <footer data-prerender="true" class="site-footer">
        <div class="site-footer-inner">
          <div>
            <h3>PDF Tools</h3>
            <ul>
${toolsListHtml}
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li><a href="/about-us/">About Us</a></li>
              <li><a href="/contact/">Contact Us</a></li>
              <li><a href="/adobe-acrobat-alternative/">Adobe Acrobat Alternative</a></li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li><a href="/privacy-policy/">Privacy Policy</a></li>
              <li><a href="/terms-of-service/">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3>Blog & Resources</h3>
            <ul>
              <li><a href="/blog/">Knowledge Hub</a></li>
              <li><a href="/compare/pdfminty-vs-smallpdf/">PDFMinty vs Smallpdf</a></li>
              <li><a href="/compare/pdfminty-vs-ilovepdf/">PDFMinty vs iLovePDF</a></li>
              <li><a href="/blog/is-it-safe-to-upload-pdf-to-online-tools/">Is Online PDF Safe?</a></li>
              <li><a href="/blog/adobe-security-vulnerabilities-offline-pdf-tools/">Adobe vs Browser Security</a></li>
              <li><a href="/blog/how-to-compress-a-pdf-without-losing-quality-2026/">How to Compress PDF Without Losing Quality</a></li>
            </ul>
          </div>
        </div>
        <div>
          <p>&copy; ${new Date().getFullYear()} <a href="${homeHref}">PDFMinty</a>. Free Privacy-First Browser PDF Toolkit. 100% Local Processing.</p>
        </div>
      </footer>`;
  }

  // Wrap pre-rendered tool/page content with semantic header, main, and footer inside #root
  function wrapInPrerenderedShell(innerArticleHtml: string, locale: string = DEFAULT_LOCALE): string {
    const headerHtml = buildStaticHeader(locale);
    const footerHtml = buildStaticFooter(locale);

    return `
    <div id="root">
${headerHtml}
      <main data-prerender="true">
${innerArticleHtml}
      </main>
${footerHtml}
    </div>
    `;
  }
  
  TOOLS.forEach((item: ToolSEOInfo) => {
    const pageUrl: string = `${SITE_URL}/${item.slug}/`;
    const targetFolder: string = path.join(distDir, item.slug);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    // Construct route-specific JSON-LD blocks
    const schemas: Record<string, unknown>[] = [];
    
    if (item.type === 'tool') {
      // 1. WebApplication Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": `PdfMinty - ${item.name}`,
        "url": `https://pdfminty.com/${item.slug}/`,
        "description": item.metaDescription || item.shortDescription,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires HTML5, WebAssembly",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock"},
        "featureList": [
          "100% client-side processing for standard tools",
          "Zero file uploads for our standard PDF tools",
          "The AI Analyze tool only sends extracted text to Google Gemini after you explicitly check a consent box",
          "Free to use",
          "No registration required"
        ]
      });
      
      // 2. HowTo Schema
      if (item.howTo) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": item.howTo.name,
          "totalTime": item.howTo.totalTime,
          "step": item.howTo.steps.map((stepText: string, index: number) => ({
            "@type": "HowToStep",
            "url": `${pageUrl}#step${index + 1}`,
            "name": stepText,
            "itemListElement": [{ "@type": "HowToDirection", "text": stepText }]
          }))
        });
      }

      // 3. BreadcrumbList Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://pdfminty.com/"},
          {"@type": "ListItem", "position": 2, "name": item.name, "item": `https://pdfminty.com/${item.slug}/`}
        ]
      });

      // 4. FAQPage Schema
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((f: { q: string; a: string }) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        });
      }
    } else if (item.slug === 'about-us') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/about-us/`,
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": `${SITE_URL}/`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "About Us", "item": `${SITE_URL}/about-us/`}
          ]
        }
      );
    } else if (item.slug === 'contact') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/contact/`,
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": `${SITE_URL}/`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "Contact Us", "item": `${SITE_URL}/contact/`}
          ]
        }
      );
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        });
      }
    } else if (item.slug === 'privacy-policy' || item.slug === 'terms-of-service') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": item.metaTitle,
          "description": item.metaDescription,
          "url": `${SITE_URL}/${item.slug}/`
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": item.name, "item": `${SITE_URL}/${item.slug}/`}
          ]
        }
      );
    } else if (item.slug === 'blog') {
      schemas.push(
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "PdfMinty Knowledge Hub",
          "url": `${SITE_URL}/blog/`,
          "description": "Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.",
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": `${SITE_URL}/logo-192.png`
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
            {"@type": "ListItem", "position": 2, "name": "Knowledge Hub", "item": `${SITE_URL}/blog/`}
          ]
        }
      );
    } else if (item.type === 'article') {
      // 1. Article Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": item.h1 || item.name,
        "description": item.metaDescription,
        "url": pageUrl,
        "datePublished": item.datePublished || "2026-07-16",
        "dateModified": item.dateModified || item.datePublished || "2026-08-08",
        "author": {
          "@type": "Organization",
          "name": "PdfMinty Editorial Team",
          "url": `${SITE_URL}/`
        },
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo-192.png`
          }
        },
        "image": {
          "@type": "ImageObject",
          "url": item.ogImage ? `${SITE_URL}${item.ogImage}` : `${SITE_URL}/og-image.png`,
          "width": 1200,
          "height": 630
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": pageUrl
        }
      });

      // 2. BreadcrumbList Schema
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/`},
          {"@type": "ListItem", "position": 2, "name": "Knowledge Hub", "item": `${SITE_URL}/blog/`},
          {"@type": "ListItem", "position": 3, "name": item.name, "item": pageUrl}
        ]
      });

      // 3. FAQPage Schema
      if (item.faqs && item.faqs.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": item.faqs.map((f: { q: string; a: string }) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        });
      }
    }
    
    // Generate JSON-LD Script tag bundle
    const jsonLdMarkup: string = schemas
      .map((schema: Record<string, unknown>) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
      .join('\n  ');

    const isI18n = (I18N_TOOL_SLUGS as readonly string[]).includes(item.slug);
    const hreflangMarkup = isI18n
      ? getHreflangs(item.slug, SITE_URL)
          .map((entry) => `  <link rel="alternate" hreflang="${entry.hreflang}" href="${entry.href}">`)
          .join('\n')
      : '';

    const pageKeywords = item.keywords
      ? (Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords)
      : `${item.name.toLowerCase()}, ${item.slug.replace(/-/g, ' ')}, pdf tools`;

    // Set custom page head meta tags
    const headMeta: string = `
  <title>${item.metaTitle}</title>
  <meta name="description" content="${item.metaDescription}">
  <meta name="keywords" content="${pageKeywords}">
  <link rel="canonical" href="${pageUrl}">
${hreflangMarkup ? `${hreflangMarkup}\n` : ''}  <meta property="og:type" content="${item.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${item.metaTitle}">
  <meta property="og:description" content="${item.metaDescription}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${item.metaTitle}">
  <meta name="twitter:description" content="${item.metaDescription}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  ${jsonLdMarkup}
  `;
  
    // Inject metadata immediately inside the head element and replace sitewide default keywords
    let preRenderedHtml: string = optimizedBase.replace("</head>", `${headMeta}\n</head>`);
    if (preRenderedHtml.match(/<meta\s+name="keywords"[^>]*\/?>/i)) {
      // Remove any duplicate keywords tag from base template so only the per-page tag remains
      const firstKwRegex = /<meta\s+name="keywords"[^>]*\/?>/i;
      preRenderedHtml = preRenderedHtml.replace(firstKwRegex, '');
    }
    
    // Helper function to build related tools list using contextual subset (4-6 tools)
    const getRelatedToolsHtml = (currentSlug: string): string => {
      const relatedSlugs = RELATED_TOOL_MAPPING[currentSlug] || [];
      const relatedTools = relatedSlugs
        .map((slug: string) => TOOLS.find((t: ToolSEOInfo) => t.slug === slug && t.type === 'tool'))
        .filter((t): t is ToolSEOInfo => !!t);

      if (relatedTools.length === 0) return '';

      return `
<h2>Related PDF Tools</h2>
<p>Explore logically related, privacy-first PDF tools:</p>
<ul>
${relatedTools.map((t: ToolSEOInfo) => `  <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription}</li>`).join('\n')}
</ul>
`;
    };

    let finalBody: string = item.longFormBody;
    // Strip any existing <h1> in body completely to avoid duplicate title headings
    finalBody = finalBody.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');

    // Prepend the page's exact, canonical <h1> tag
    finalBody = `<h1>${item.h1 || item.name}</h1>\n${finalBody}`;

    if (item.type !== 'article') {
      finalBody += getRelatedToolsHtml(item.slug);
    }

    // Pre-inject longFormBody directly inside the React root element (#root) with semantic header and footer
    const articleHtml = `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          ${finalBody}
        </article>`;
    const preRenderedContent: string = wrapInPrerenderedShell(articleHtml, DEFAULT_LOCALE);
    
    // Replace empty #root mount tag with populated static HTML
    preRenderedHtml = preRenderedHtml.replace(/<div\s+id="root"\s*><\/div>/i, preRenderedContent);
    preRenderedHtml = preRenderedHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, preRenderedContent);
    
    fs.writeFileSync(path.join(targetFolder, "index.html"), preRenderedHtml, "utf8");
    logger.info(`Pre-rendered static HTML created for ${item.name} at: ${targetFolder}/index.html`);

    // If tool is localized, generate pre-rendered static HTML for configured non-default locales
    if (isI18n) {
      for (const locLang of SUPPORTED_LOCALES) {
        if (locLang !== DEFAULT_LOCALE) {
          const locTargetFolder = path.join(distDir, locLang, item.slug);
          if (!fs.existsSync(locTargetFolder)) {
            fs.mkdirSync(locTargetFolder, { recursive: true });
          }
          const locPageUrl = getCanonicalUrl(item.slug, locLang, SITE_URL);
          
          // Retrieve localized content for merge-pdf or other localized tools
          const locData = item.slug === 'merge-pdf' ? MERGE_PDF_LOCALIZED_DATA[locLang] : undefined;
          const locMetaTitle = locData ? locData.metaTitle : item.metaTitle;
          const locMetaDesc = locData ? locData.metaDescription : item.metaDescription;

          let locPreRenderedContent = preRenderedContent;
          if (locData) {
            const stepsHtml = locData.howToSteps.map(s => `          <li><strong>${s.title}</strong> ${s.desc}</li>`).join('\n');
            const featuresHtml = locData.features.map(f => `          <li><strong>${f.title}</strong> ${f.desc}</li>`).join('\n');
            const faqsHtml = locData.faqs.map(faq => `        <h3>${faq.q}</h3>\n        <p>${faq.a}</p>`).join('\n\n');
            const relatedHtml = locData.relatedTools.map(t => `            <li><a href="${t.url}">${t.text}</a></li>`).join('\n');

            const locArticleHtml = `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          <h1>${locData.h1}</h1>
          <p class="lead text-lg font-medium text-slate-700 dark:text-slate-300">
            ${locData.lead}
          </p>

          <h2>${locData.howToTitle}</h2>
          <ol>
${stepsHtml}
          </ol>

          <h2>${locData.whyTitle}</h2>
          <ul>
${featuresHtml}
          </ul>

          <h2>${locData.faqTitle}</h2>
${faqsHtml}

          <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3>${locData.relatedTitle}</h3>
            <ul>
${relatedHtml}
            </ul>
          </div>
        </article>`;
            locPreRenderedContent = wrapInPrerenderedShell(locArticleHtml, locLang);
          }

          let locJsonLdMarkup = jsonLdMarkup;
          if (locData) {
            const locSchemas: any[] = [
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": `PdfMinty - ${locMetaTitle.split('—')[0].trim()}`,
                "url": locPageUrl,
                "description": locMetaDesc,
                "applicationCategory": "UtilitiesApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires HTML5, WebAssembly",
                "inLanguage": locLang
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": `${SITE_URL}/${locLang}/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": locData.h1,
                    "item": locPageUrl
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": locData.faqs.map(f => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.a
                  }
                }))
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": locData.howToTitle,
                "step": locData.howToSteps.map((step, idx) => ({
                  "@type": "HowToStep",
                  "position": idx + 1,
                  "name": step.title.replace(':', ''),
                  "text": step.desc
                }))
              }
            ];
            locJsonLdMarkup = locSchemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
          }

          const locHeadMeta: string = `
  <title>${locMetaTitle}</title>
  <meta name="description" content="${locMetaDesc}">
  <link rel="canonical" href="${locPageUrl}">
${hreflangMarkup ? `${hreflangMarkup}\n` : ''}  <meta property="og:type" content="${item.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${locMetaTitle}">
  <meta property="og:description" content="${locMetaDesc}">
  <meta property="og:url" content="${locPageUrl}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${locPageUrl}">
  <meta name="twitter:title" content="${locMetaTitle}">
  <meta name="twitter:description" content="${locMetaDesc}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  ${locJsonLdMarkup}
  `;
          let locHtml: string = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${locLang}"`);
          if (!locHtml.includes(`lang="${locLang}"`)) {
            locHtml = locHtml.replace('<html', `<html lang="${locLang}"`);
          }
          locHtml = locHtml.replace("</head>", `${locHeadMeta}\n</head>`);
          locHtml = locHtml.replace(/<div\s+id="root"\s*><\/div>/i, locPreRenderedContent);
          locHtml = locHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, locPreRenderedContent);
          fs.writeFileSync(path.join(locTargetFolder, "index.html"), locHtml, "utf8");
          logger.info(`Pre-rendered static HTML created for ${item.name} [${locLang}] at: ${locTargetFolder}/index.html`);
        }
      }
    }
  });

  // ----------------------------------------------------
  // Pre-render the Blog Index Page (dist/blog/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Blog Index (/blog)...");
  const blogTargetFolder = path.join(distDir, "blog");
  if (!fs.existsSync(blogTargetFolder)) {
    fs.mkdirSync(blogTargetFolder, { recursive: true });
  }

  const articles = TOOLS.filter((t: ToolSEOInfo) => t.type === 'article');
  const articlesListHtml = articles
    .map(
      (a: ToolSEOInfo) => `
      <article class="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm">
        <div class="flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
          <span>${a.category || 'Guide'}</span>
          <span>•</span>
          <time datetime="${a.datePublished || '2026-01-01'}">${a.datePublished || '2026-01-01'}</time>
        </div>
        <h2 class="text-xl font-bold mb-2">
          <a href="/${a.slug}/" class="hover:text-emerald-600 transition-colors">${a.h1 || a.name}</a>
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">${a.metaDescription || a.shortDescription || ''}</p>
        <a href="/${a.slug}/" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hover:underline">Read Full Article →</a>
      </article>`
    )
    .join('\n');

  const blogHeadMeta = `
  <title>PdfMinty Knowledge Hub — Free Guides & PDF Tutorials</title>
  <meta name="description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <link rel="canonical" href="${SITE_URL}/blog/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="PdfMinty Knowledge Hub — Free Guides & PDF Tutorials">
  <meta property="og:description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <meta property="og:url" content="${SITE_URL}/blog/">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_URL}/blog/">
  <meta name="twitter:title" content="PdfMinty Knowledge Hub — Free Guides & PDF Tutorials">
  <meta name="twitter:description" content="Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "PdfMinty Knowledge Hub",
    "description": "Explore expert guides, security tips, and privacy-first PDF tutorials in the PdfMinty Knowledge Hub.",
    "url": "${SITE_URL}/blog/",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/og-image.png"
      }
    }
  }
  </script>
  `;

  let blogHtml = optimizedBase.replace("</head>", `${blogHeadMeta}\n</head>`);

  const blogPreRenderedContent = `
    <div id="root">
      <main class="max-w-5xl mx-auto py-12 px-6 font-sans">
        <header class="text-center max-w-3xl mx-auto mb-12">
          <h1 class="text-3xl font-black mb-4">PdfMinty Knowledge Hub</h1>
          <p class="text-base text-slate-600 dark:text-slate-300">
            Free, privacy-first guides, tutorials, and deep-dives on PDF security, formatting, and offline workflows.
          </p>
        </header>

        <section class="grid gap-6 md:grid-cols-2">
          ${articlesListHtml}
        </section>
      </main>
    </div>
  `;

  blogHtml = blogHtml.replace(/<div\s+id="root"\s*><\/div>/i, blogPreRenderedContent);
  blogHtml = blogHtml.replace(/<div\s+id="root"\s*>\s*<\/div>/i, blogPreRenderedContent);

  fs.writeFileSync(path.join(blogTargetFolder, "index.html"), blogHtml, "utf8");
  logger.info("Successfully pre-rendered static HTML for Blog Index at dist/blog/index.html");

  // ----------------------------------------------------
  // Pre-render the Homepage (dist/index.html)
  // ----------------------------------------------------
  logger.info("Pre-rendering static HTML for the Homepage...");

  const toolsCount = TOOLS.filter((t: ToolSEOInfo) => t.type === 'tool').length;
  const toolsListHtml = TOOLS
    .filter((t: ToolSEOInfo) => t.type === 'tool')
    .map((t: ToolSEOInfo) => `      <li><a href="/${t.slug}/">${t.name}</a> — ${t.shortDescription}</li>`)
    .join('\n');
  
  const homepageContent = `
  <main class="prose max-w-6xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
    <h1>${HOMEPAGE_H1}</h1>
    <p>PDFMinty is a free, privacy-first PDF toolkit with ${toolsCount} powerful tools that run entirely in your browser. Your files never leave your device — no server uploads, no sign-ups, no daily quotas. Merge, split, protect, convert, and edit PDFs with complete confidentiality.</p>
 
    <h2>All PDF Tools</h2>
    <ul>
${toolsListHtml}
    </ul>
 
    <h2>Why Choose PDFMinty?</h2>
    <p>Unlike other online PDF tools that upload your files to remote servers, PDFMinty processes everything locally in your browser using WebAssembly. This means:</p>
    <ul>
      <li><strong>Complete Privacy:</strong> Your documents never touch our servers</li>
      <li><strong>No File Limits:</strong> Process files up to 100MB each, 150MB total</li>
      <li><strong>Fast Processing:</strong> WebAssembly-powered operations complete in seconds</li>
      <li><strong>No Registration:</strong> All tools are 100% free with no sign-up</li>
      <li><strong>Works Offline:</strong> PWA-enabled — install and use without internet</li>
    </ul>
 
    <h2>How PDFMinty Protects Your Privacy</h2>
    <p>Every PDF operation in PDFMinty happens client-side using JavaScript and WebAssembly. When you upload a file, it's loaded into your browser's memory, processed locally, and the result is generated on your device. The file is never transmitted over the network. This is fundamentally different from traditional online PDF tools that require you to upload files to their servers.</p>
 
    <p>Our privacy-first architecture makes PDFMinty ideal for processing sensitive documents like tax returns, medical records, financial statements, legal contracts, and any file containing personal information.</p>
 
    <h2>Frequently Asked Questions</h2>
    <h3>Is PDFMinty really free?</h3>
    <p>Yes, PDFMinty is 100% free to use. All ${toolsCount} tools are available without subscription, payment, or registration.</p>
 
    <h3>Are my files uploaded to your server?</h3>
    <p>For our standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exception is the AI Analyze tool, which only sends extracted text to Google Gemini after you explicitly check a consent box.</p>
 
    <h3>What is the maximum file size?</h3>
    <p>PDFMinty can handle individual PDF files up to 100MB and combined operations up to 150MB total. Performance depends on your device's memory and processing power.</p>
 
    <h3>Do I need to install any software?</h3>
    <p>No installation required. PDFMinty runs in any modern browser (Chrome, Firefox, Safari, Edge). You can also install it as a PWA for offline access.</p>
 
    <h2>Start Processing Your PDFs Now</h2>
    <p>Browse our complete collection of PDF tools above. All tools are free, private, and work instantly in your browser.</p>

    <div style="margin-top: 2.5rem; text-align: center;">
      <p style="font-weight: 600; margin-bottom: 1rem;">Recognized &amp; Featured On</p>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.5rem;">
        <a href="https://launchbuff.com/products/pdfminty-8g15b8" target="_blank" rel="noopener noreferrer" title="Featured on LaunchBuff">
          <img src="https://launchbuff.com/badge-featured-dark.svg" alt="Featured on LaunchBuff" width="256" height="80" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
        <a href="https://launchstag.com/p/pdfminty" target="_blank" rel="noopener" title="Featured on Launchstag">
          <img src="https://launchstag.com/badge-light.svg" alt="Featured on Launchstag" width="198" height="62" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
      </div>
    </div>
  </main>
`;

  const homepageFaqSchema = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is PDFMinty really free?",
        "acceptedAnswer": {"@type": "Answer", "text": "Yes, PDFMinty is 100% free to use. All ${toolsCount} tools are available without subscription, payment, or registration."}
      },
      {
        "@type": "Question",
        "name": "Are my files uploaded to your server?",
        "acceptedAnswer": {"@type": "Answer", "text": "For our standard PDF tools, no. Files are processed entirely in your browser using client-side JavaScript and WebAssembly without leaving your device. The only exception is the AI Analyze tool, which only sends extracted text to Google Gemini after you explicitly check a consent box."}
      },
      {
        "@type": "Question",
        "name": "What is the maximum file size?",
        "acceptedAnswer": {"@type": "Answer", "text": "PDFMinty can handle individual PDF files up to 100MB and combined operations up to 150MB total. Performance depends on your device's memory and processing power."}
      },
      {
        "@type": "Question",
        "name": "Do I need to install any software?",
        "acceptedAnswer": {"@type": "Answer", "text": "No installation required. PDFMinty runs in any modern browser. You can also install it as a PWA for offline access."}
      }
    ]
  }
  </script>
`;

  let homepageHtml: string = cleanBaseTemplate(baseHtml);

  const homepageHreflangs = SUPPORTED_LOCALES.map(loc => 
    `  <link rel="alternate" hreflang="${loc}" href="${SITE_URL}${loc === 'en' ? '/' : `/${loc}/`}">`
  ).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`;

  const homepageHead = `
  <title>PDFMinty — Free Privacy-First PDF Toolkit</title>
  <meta name="description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <link rel="canonical" href="${SITE_URL}/">
${homepageHreflangs}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta property="og:description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_URL}/">
  <meta name="twitter:title" content="PDFMinty — Free Privacy-First PDF Toolkit">
  <meta name="twitter:description" content="Free privacy-first PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebApplication",
    "name": "PDFMinty", "url": "${SITE_URL}/",
    "description": "Free, privacy-first online PDF toolkit. Merge, split, compress, rotate, watermark, and analyze PDFs entirely in your browser.",
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "PDF Software",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "author": { "@type": "Organization", "name": "PDFMinty", "url": "${SITE_URL}/" },
    "publisher": { "@type": "Organization", "name": "PDFMinty", "logo": { "@type": "ImageObject", "url": "${SITE_URL}/logo-512.png", "width": 512, "height": 512 } },
    "image": { "@type": "ImageObject", "url": "${SITE_URL}/og-image.png", "width": 1200, "height": 630 },
    "featureList": [
      "Merge multiple PDF files", "Split PDF into separate pages", "Compress PDF file size",
      "Rotate PDF pages", "Delete pages from PDF", "Add watermarks to PDF", "Add page numbers",
      "Insert blank pages", "Password protect PDF", "Unlock password-protected PDF",
      "Convert images to PDF", "Convert PDF to images", "AI-powered PDF analysis"
    ]
  }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "Organization",
    "@id": "${SITE_URL}/#organization",
    "name": "PDFMinty", "url": "${SITE_URL}/",
    "logo": { "@type": "ImageObject", "url": "${SITE_URL}/logo-512.png", "width": 512, "height": 512 },
    "image": "${SITE_URL}/og-image.png",
    "description": "Privacy-first, client-side PDF toolkit with 23 free tools.",
    "foundingDate": "2025",
    "contactPoint": {
      "@type": "ContactPoint", "contactType": "customer support",
      "email": "support@pdfminty.com",
      "url": "${SITE_URL}/contact/",
      "availableLanguage": ["English"]
    }
  }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebSite",
    "@id": "${SITE_URL}/#website",
    "url": "${SITE_URL}/", "name": "PDFMinty",
    "publisher": { "@id": "${SITE_URL}/#organization" },
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": "${SITE_URL}/?q={search_term_string}" },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  ${homepageFaqSchema}
  `;

  // 1. Inject Head meta and FAQ schema before </head>
  homepageHtml = homepageHtml.replace("</head>", `${homepageHead}\n</head>`);

  // 2. Inject pre-rendered content into #root
  const homepageRootContent = `
    <div id="root">
      ${homepageContent}
    </div>
  `;
  homepageHtml = homepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, homepageRootContent.trim());

  fs.writeFileSync(distIndexHtmlPath, homepageHtml, "utf8");
  logger.info("Successfully pre-rendered static HTML for the Homepage at dist/index.html");

  // ----------------------------------------------------
  // Pre-render Localized Homepages
  // ----------------------------------------------------
  interface LocalizedHomepageContent {
    code: string;
    langName: string;
    title: string;
    desc: string;
    h1: string;
    lead: string;
    toolsTitle: string;
    whyTitle: string;
    whyIntro: string;
    whyFeatures: { title: string; desc: string }[];
    privacyTitle: string;
    privacyP1: string;
    privacyP2: string;
    faqTitle: string;
    faqs: { q: string; a: string }[];
    ctaTitle: string;
    ctaDesc: string;
    featuredOn: string;
    webAppDesc: string;
    orgDesc: string;
    websiteDesc: string;
    features: string[];
    jsonld?: string;
  }

  const localizedHomepagesData: Record<string, LocalizedHomepageContent> = {
    de: {
      code: 'de',
      langName: 'German',
      title: 'Kostenlose PDF-Tools — 100% privat im Browser | PDFMinty',
      desc: 'Kostenlose PDF-Tools direkt im Browser. PDF zusammenfügen, teilen, komprimieren und schützen. Keine Uploads, keine Registrierung, 100% Datenschutz.',
      h1: 'Kostenlose browserbasierte PDF-Werkzeuge — 100% privat, ohne Uploads',
      lead: `PDFMinty ist ein kostenloses, datenschutzorientiertes PDF-Toolkit mit ${toolsCount} leistungsstarken Werkzeugen direkt in Ihrem Browser. Ihre Dateien verlassen niemals Ihr Gerät — keine Server-Uploads, keine Registrierung, keine täglichen Limits. Fügen Sie PDFs zusammen, teilen, schützen, konvertieren und bearbeiten Sie sie mit voller Vertraulichkeit.`,
      toolsTitle: 'Alle PDF-Werkzeuge',
      whyTitle: 'Warum PDFMinty wählen?',
      whyIntro: 'Im Gegensatz zu anderen Online-PDF-Tools, die Ihre Dateien auf entfernte Server hochladen, verarbeitet PDFMinty alles lokal in Ihrem Browser mittels WebAssembly. Das bedeutet:',
      whyFeatures: [
        { title: 'Vollständige Privatsphäre', desc: 'Ihre Dokumente berühren niemals unsere Server.' },
        { title: 'Keine Dateilimits', desc: 'Verarbeiten Sie Dateien bis zu 100 MB einzeln und 150 MB insgesamt.' },
        { title: 'Schnelle Verarbeitung', desc: 'WebAssembly-gestützte Operationen werden in Sekundenschnelle abgeschlossen.' },
        { title: 'Keine Registrierung', desc: 'Alle Tools sind zu 100% kostenlos ohne Anmeldung nutzbar.' },
        { title: 'Funktioniert offline', desc: 'PWA-fähig — installieren und auch ohne Internetverbindung nutzen.' }
      ],
      privacyTitle: 'Wie PDFMinty Ihre Privatsphäre schützt',
      privacyP1: 'Jede PDF-Operation in PDFMinty erfolgt clientseitig mithilfe von JavaScript und WebAssembly. Wenn Sie eine Datei auswählen, wird sie in den Arbeitsspeicher Ihres Browsers geladen, lokal verarbeitet und das Ergebnis direkt auf Ihrem Gerät generiert. Die Datei wird niemals über das Netzwerk übertragen. Dies unterscheidet sich grundlegend von herkömmlichen Online-PDF-Tools, die einen Upload auf Server verlangen.',
      privacyP2: 'Unsere datenschutzorientierte Architektur macht PDFMinty ideal für die vertrauliche Bearbeitung sensibler Dokumente wie Steuererklärungen, medizinische Unterlagen, Finanzberichte, Verträge und persönliche Dokumente.',
      faqTitle: 'Häufig gestellte Fragen (FAQ)',
      faqs: [
        { q: 'Wie verarbeitet PDFMinty meine PDFs vertraulich?', a: 'PDFMinty führt alle Verarbeitungen vollständig clientseitig in Ihrem Webbrowser mithilfe moderner WebAssembly- und JavaScript-Technologien aus. Ihre Dokumente werden direkt im lokalen Arbeitsspeicher Ihres Geräts geöffnet und verarbeitet. Es findet zu keinem Zeitpunkt ein Upload auf externe Server statt.' },
        { q: 'Ist PDFMinty wirklich kostenlos?', a: `Ja, PDFMinty ist zu 100% kostenlos nutzbar. Alle ${toolsCount} Werkzeuge stehen ohne versteckte Kosten, ohne Abonnement und ohne Registrierung unbegrenzt zur Verfügung.` },
        { q: 'Verlassen meine Dateien jemals mein Gerät?', a: 'Nein, bei allen unseren Standard-PDF-Werkzeugen verlassen Ihre Dateien niemals Ihren Computer oder Ihr Mobilgerät. Die einzige optionale Ausnahme ist das KI-Analysetool, das erst nach Ihrer ausdrücklichen Bestätigung ausgewählte Textauszüge an Google Gemini übermittelt.' },
        { q: 'Wie hoch ist die maximale Dateigröße?', a: 'PDFMinty unterstützt einzelne PDF-Dateien bis zu 100 MB und kombinierte Stapeloperationen bis zu 150 MB. Die tatsächliche Leistung richtet sich nach dem verfügbaren Arbeitsspeicher Ihres Endgeräts.' }
      ],
      ctaTitle: 'Starten Sie jetzt mit der Bearbeitung Ihrer PDFs',
      ctaDesc: 'Entdecken Sie oben unsere vollständige Sammlung an PDF-Tools. Alle Werkzeuge sind kostenlos, privat und funktionieren sofort im Browser.',
      featuredOn: 'Vorgestellt & anerkannt auf',
      webAppDesc: 'Kostenloses, datenschutzorientiertes Online-PDF-Toolkit. PDFs zusammenfügen, teilen, komprimieren, drehen, schützen und bearbeiten — 100% lokal in Ihrem Browser ohne Server-Uploads.',
      orgDesc: 'Datenschutzorientiertes, clientseitiges PDF-Toolkit mit 23 kostenlosen Werkzeugen ohne Server-Uploads.',
      websiteDesc: 'Kostenlose browserbasierte PDF-Tools — 100% privat, ohne Uploads und ohne Registrierung.',
      features: [
        'Mehrere PDF-Dateien zusammenfügen',
        'PDF in einzelne Seiten teilen',
        'PDF-Dateigröße komprimieren',
        'PDF-Seiten drehen',
        'Seiten aus PDF löschen',
        'Wasserzeichen hinzufügen',
        'Seitenzahlen einfügen',
        'Leere Seiten einfügen',
        'PDF mit Passwort schützen',
        'Passwortgeschützte PDFs entsperren',
        'Bilder in PDF umwandeln',
        'PDF in Bilder umwandeln',
        'KI-gestützte PDF-Analyse'
      ]
    },
    fr: {
      code: 'fr',
      langName: 'French',
      title: 'Outils PDF gratuits et confidentiels en ligne | PDFMinty',
      desc: 'Suite d’outils PDF gratuits dans votre navigateur. Fusionnez, divisez, compressez et protégez vos fichiers PDF sans téléversement et en toute confidentialité.',
      h1: 'Outils PDF gratuits dans le navigateur — 100% confidentiels, zéro téléversement',
      lead: `PDFMinty est une boîte à outils PDF gratuite et confidentielle comprenant ${toolsCount} outils puissants qui s'exécutent directement dans votre navigateur. Vos fichiers ne quittent jamais votre appareil — aucun téléversement, aucune inscription, aucun quota quotidien. Fusionnez, divisez, protégez, convertissez et modifiez des PDF en toute confidentialité.`,
      toolsTitle: 'Tous les outils PDF',
      whyTitle: 'Pourquoi choisir PDFMinty ?',
      whyIntro: 'Contrairement à d’autres outils PDF en ligne qui téléversent vos fichiers sur des serveurs distants, PDFMinty traite tout localement dans votre navigateur grâce à WebAssembly. Cela signifie :',
      whyFeatures: [
        { title: 'Confidentialité totale', desc: 'Vos documents ne touchent jamais nos serveurs.' },
        { title: 'Sans limites restrictives', desc: 'Traitez des fichiers jusqu’à 100 Mo chacun et 150 Mo au total.' },
        { title: 'Traitement ultra-rapide', desc: 'Les opérations optimisées par WebAssembly s’exécutent en quelques secondes.' },
        { title: 'Aucune inscription', desc: 'Tous les outils sont 100% gratuits sans création de compte.' },
        { title: 'Fonctionne hors ligne', desc: 'Compatible PWA — installez et utilisez même sans connexion Internet.' }
      ],
      privacyTitle: 'Comment PDFMinty protège votre vie privée',
      privacyP1: 'Chaque opération PDF sur PDFMinty s’exécute côté client grâce à JavaScript et WebAssembly. Lorsque vous sélectionnez un fichier, il est chargé dans la mémoire de votre navigateur, traité localement et le résultat est généré sur votre appareil. Le fichier n’est jamais transmis sur le réseau. Cela diffère fondamentalement des outils PDF en ligne traditionnels qui exigent le téléversement de vos fichiers sur leurs serveurs.',
      privacyP2: 'Notre architecture axée sur la confidentialité fait de PDFMinty le choix idéal pour traiter des documents sensibles tels que déclarations fiscales, dossiers médicaux, relevés financiers et contrats juridiques.',
      faqTitle: 'Foire aux questions (FAQ)',
      faqs: [
        { q: 'Comment PDFMinty traite-t-il mes fichiers PDF en toute confidentialité ?', a: 'PDFMinty effectue tous les traitements directement dans votre navigateur web grâce aux technologies WebAssembly et JavaScript. Vos documents sont traités localement dans la mémoire vive de votre appareil, sans jamais être envoyés vers un serveur distant.' },
        { q: 'PDFMinty est-il vraiment gratuit ?', a: `Oui, PDFMinty est 100% gratuit. L'ensemble des ${toolsCount} outils est accessible sans aucun frais, sans abonnement et sans obligation de créer un compte.` },
        { q: 'Mes fichiers quittent-ils un jour mon appareil ?', a: 'Non, pour tous nos outils PDF standard, vos fichiers ne quittent jamais votre ordinateur ni votre appareil mobile. La seule exception est l’outil d’analyse IA optionnel, qui ne transmet d’extraits textuels qu’après votre accord explicite.' },
        { q: 'Quelle est la taille maximale de fichier autorisée ?', a: 'PDFMinty prend en charge des fichiers individuels jusqu’à 100 Mo et des opérations combinées par lot jusqu’à 150 Mo. Les performances dépendent de la mémoire disponible sur votre appareil.' }
      ],
      ctaTitle: 'Commencez à traiter vos fichiers PDF dès maintenant',
      ctaDesc: 'Parcourez notre collection complète d’outils PDF ci-dessus. Tous les outils sont gratuits, confidentiels et fonctionnent instantanément dans votre navigateur.',
      featuredOn: 'Reconnu et présenté sur',
      webAppDesc: 'Boîte à outils PDF en ligne gratuite et confidentielle. Fusionnez, divisez, compressez, faites pivoter, protégez et éditez vos PDF à 100% dans votre navigateur sans téléversement.',
      orgDesc: 'Boîte à outils PDF côté client, axée sur la confidentialité, comprenant 23 outils gratuits sans serveur distant.',
      websiteDesc: 'Outils PDF gratuits dans le navigateur — 100% confidentiels, zéro téléversement et sans inscription.',
      features: [
        'Fusionner plusieurs fichiers PDF',
        'Diviser un PDF en pages individuelles',
        'Compresser la taille d’un PDF',
        'Faire pivoter des pages PDF',
        'Supprimer des pages d’un PDF',
        'Ajouter un filigrane',
        'Numéroter les pages',
        'Insérer des pages vierges',
        'Protéger un PDF par mot de passe',
        'Déverrouiller un PDF protégé',
        'Convertir des images en PDF',
        'Convertir un PDF en images',
        'Analyse PDF par IA'
      ]
    },
    es: {
      code: 'es',
      langName: 'Spanish',
      title: 'PdfMinty — Herramientas PDF gratis y privadas (100% en el navegador)',
      desc: 'Herramientas PDF gratuitas en tu navegador. Une, divide, comprime y protege PDFs sin subir archivos a servidores. 100% privado y seguro.',
      h1: 'Herramientas PDF gratuitas en el navegador — 100% privadas, sin subidas',
      lead: `PDFMinty es un conjunto de herramientas PDF gratuito y centrado en la privacidad con ${toolsCount} potentes herramientas que se ejecutan directamente en tu navegador. Tus archivos nunca salen de tu dispositivo: sin subidas a servidores, sin registros ni cuotas diarias. Une, divide, protege, convierte y edita PDFs con total confidencialidad.`,
      toolsTitle: 'Todas las herramientas PDF',
      whyTitle: '¿Por qué elegir PDFMinty?',
      whyIntro: 'A diferencia de otras herramientas PDF en línea que suben tus archivos a servidores remotos, PDFMinty procesa todo localmente en tu navegador usando WebAssembly. Esto significa:',
      whyFeatures: [
        { title: 'Privacidad completa', desc: 'Tus documentos nunca tocan nuestros servidores.' },
        { title: 'Sin límites de archivos', desc: 'Procesa archivos de hasta 100 MB cada uno, 150 MB en total.' },
        { title: 'Procesamiento rápido', desc: 'Las operaciones con tecnología WebAssembly se completan en segundos.' },
        { title: 'Sin registro', desc: 'Todas las herramientas son 100% gratuitas sin necesidad de registrarse.' },
        { title: 'Funciona sin conexión', desc: 'Compatible con PWA: instala y usa incluso sin conexión a internet.' }
      ],
      privacyTitle: 'Cómo protege PDFMinty tu privacidad',
      privacyP1: 'Cada operación de PDF en PDFMinty ocurre del lado del cliente utilizando JavaScript y WebAssembly. Cuando cargas un archivo, se almacena en la memoria de tu navegador, se procesa localmente y el resultado se genera en tu dispositivo. El archivo nunca se transmite por internet. Esto es fundamentalmente diferente a las herramientas PDF convencionales que suben tus archivos a servidores.',
      privacyP2: 'Nuestra arquitectura orientada a la privacidad convierte a PDFMinty en la solución ideal para procesar documentos confidenciales como declaraciones de impuestos, registros médicos, estados financieros y contratos legales.',
      faqTitle: 'Preguntas frecuentes (FAQ)',
      faqs: [
        { q: '¿Cómo procesa PDFMinty mis archivos PDF de forma privada?', a: 'PDFMinty procesa todos los documentos de forma 100% local en su navegador web mediante WebAssembly y JavaScript. Los archivos se abren en la memoria de su dispositivo y nunca se cargan en servidores externos.' },
        { q: '¿PDFMinty es realmente gratuito?', a: `Sí, PDFMinty es 100% gratuito. Las ${toolsCount} herramientas están disponibles sin suscripciones, sin tarifas ocultas y sin necesidad de crear una cuenta.` },
        { q: '¿Salen alguna vez mis archivos de mi dispositivo?', a: 'No, en todas nuestras herramientas estándar de PDF, sus archivos nunca salen de su ordenador o teléfono móvil. La única excepción opcional es la herramienta de análisis con IA, que solo envía texto tras su consentimiento expreso.' },
        { q: '¿Cuál es el tamaño máximo de archivo permitido?', a: 'PDFMinty admite archivos PDF individuales de hasta 100 MB y operaciones combinadas de hasta 150 MB en total. El rendimiento depende de la memoria RAM disponible en su equipo.' }
      ],
      ctaTitle: 'Comienza a procesar tus archivos PDF ahora',
      ctaDesc: 'Explora nuestra colección completa de herramientas PDF arriba. Todas las herramientas son gratuitas, privadas y funcionan al instante en tu navegador.',
      featuredOn: 'Reconocido y destacado en',
      webAppDesc: 'Herramientas PDF en línea gratuitas y privadas. Une, divide, comprime, rota, protege y edita documentos PDF directamente en tu navegador sin subir archivos a servidores.',
      orgDesc: 'Kit de herramientas PDF del lado del cliente, con privacidad garantizada y 23 utilidades gratuitas.',
      websiteDesc: 'Herramientas PDF gratuitas en el navegador — 100% privadas, sin subidas de archivos ni registros.',
      features: [
        'Unir varios archivos PDF',
        'Dividir PDF en páginas individuales',
        'Comprimir tamaño de archivo PDF',
        'Rotar páginas PDF',
        'Eliminar páginas de un PDF',
        'Añadir marcas de agua',
        'Insertar números de página',
        'Insertar páginas en blanco',
        'Proteger PDF con contraseña',
        'Desbloquear PDF protegido',
        'Convertir imágenes a PDF',
        'Convertir PDF a imágenes',
        'Análisis de PDF con IA'
      ]
    },
    bn: {
      code: 'bn',
      langName: 'Bengali',
      title: 'PdfMinty — বিনামূল্যে গোপনীয়তা-বান্ধব পিডিএফ টুলস (১০০% ব্রাউজারে)',
      desc: 'ব্রাউজারেই বিনামূল্যে পিডিএফ টুলস। কোনো সার্ভার আপলোড বা নিবন্ধন ছাড়া পিডিএফ যুক্ত করুন, ভাগ করুন, সংকুচিত করুন এবং সুরক্ষিত করুন। ১০০% গোপনীয়তা।',
      h1: 'ফ্রি ব্রাউজার-ভিত্তিক পিডিএফ টুলস — ১০০% প্রাইভেট, কোনো আপলোড নেই',
      lead: `PDFMinty হলো একটি সম্পূর্ণ বিনামূল্যে ও প্রাইভেসিবান্ধব পিডিএফ টুলকিট যাতে রয়েছে ${toolsCount}টি শক্তিশালী টুল যা পুরোপুরি আপনার ব্রাউজারে চলে। আপনার ফাইল কখনো ডিভাইস থেকে বাইরে যায় না — কোনো সার্ভার আপলোড নেই, কোনো সাইন-আপ নেই, কোনো দৈনিক লিমিট নেই। সম্পূর্ণ গোপনীয়তার সাথে পিডিএফ মার্জ, স্প্লিট, প্রটেক্ট, কনভার্ট এবং এডিট করুন।`,
      toolsTitle: 'সকল পিডিএফ টুলস',
      whyTitle: 'কেন PDFMinty বেছে নেবেন?',
      whyIntro: 'অন্যান্য অনলাইন পিডিএফ টুলের মতো নয় যা আপনার ফাইলগুলো রিমোট সার্ভারে আপলোড করে, PDFMinty ওয়েবঅ্যাসেম্বলি (WebAssembly) প্রযুক্তি ব্যবহার করে আপনার ব্রাউজারে সম্পূর্ণ লোকালভাবে ফাইল প্রসেস করে। এর সুবিধা:',
      whyFeatures: [
        { title: 'সম্পূর্ণ গোপনীয়তা', desc: 'আপনার ডকুমেন্ট কখনোই আমাদের সার্ভারে যায় না।' },
        { title: 'কোনো ফাইলের বাধা নেই', desc: 'প্রতিটি ফাইল ১০০ মেগাবাইট এবং মোট ১৫০ মেগাবাইট পর্যন্ত প্রসেস করুন।' },
        { title: 'দ্রুত প্রসেসিং', desc: 'ওয়েবঅ্যাসেম্বলি প্রযুক্তির কারণে কয়েক সেকেন্ডে কাজ সম্পন্ন হয়।' },
        { title: 'কোনো রেজিস্ট্রেশন নেই', desc: 'কোনো সাইন-আপ ছাড়াই সমস্ত টুল ১০০% ফ্রি।' },
        { title: 'অফলাইনে কাজ করে', desc: 'PWA সমৃদ্ধ — ইন্টারনেট সংযোগ ছাড়াই ইন্সটল করে ব্যবহার করুন।' }
      ],
      privacyTitle: 'PDFMinty কীভাবে আপনার গোপনীয়তা রক্ষা করে',
      privacyP1: 'PDFMinty-এর প্রতিটি পিডিএফ অপারেশন জাভাস্ক্রিপ্ট এবং ওয়েবঅ্যাসেম্বলি ব্যবহার করে ক্লায়েন্ট-সাইডে সম্পন্ন হয়। আপনি যখন একটি ফাইল নির্বাচন করেন, এটি সরাসরি ব্রাউজারের মেমরিতে লোড হয়, লোকালভাবে প্রসেস হয় এবং আপনার ডিভাইসেই আউটপুট তৈরি হয়। ফাইলটি কখনোই ইন্টারনেটে বা কোনো দূরবর্তী সার্ভারে পাঠানো হয় না।',
      privacyP2: 'আমাদের প্রাইভেসি-ফার্স্ট আর্কিটেকচার ট্যাক্স রিটার্ন, মেডিকেল রেকর্ড, ফিনান্সিয়াল স্টেটমেন্ট, আইনি চুক্তি এবং ব্যক্তিগত যেকোনো সংবেদনশীল ডকুমেন্ট প্রসেস করার জন্য PDFMinty-কে অত্যন্ত নিরাপদ ও বিশ্বস্ত করে তোলে।',
      faqTitle: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)',
      faqs: [
        { q: 'PDFMinty কীভাবে আমার PDF গোপনীয়ভাবে প্রসেস করে?', a: 'PDFMinty ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট এবং আধুনিক ওয়েবঅ্যাসেম্বলি (WebAssembly) প্রযুক্তি ব্যবহার করে আপনার ব্রাউজারের ভেতর সম্পূর্ণ লোকালভাবে ফাইল প্রসেস করে। ফাইলগুলো সরাসরি আপনার ডিভাইসের মেমরিতে প্রক্রিয়াজাত হয় এবং কখনোই কোনো রিমোট সার্ভারে আপলোড হয় না।' },
        { q: 'PDFMinty কি সম্পূর্ণ ফ্রি?', a: `হ্যাঁ, PDFMinty ব্যবহার করা ১০০% সম্পূর্ণ ফ্রি। আমাদের সকল ${toolsCount}টি টুল কোনো প্রকার সাবস্ক্রিপশন, পেমেন্ট বা রেজিস্ট্রেশন ছাড়াই আজীবন ব্যবহারের জন্য উন্মুক্ত।` },
        { q: 'আমার ফাইল কি কখনো আমার ডিভাইস ছাড়ায়?', a: 'না, আমাদের সাধারণ পিডিএফ টুলগুলোর ক্ষেত্রে আপনার ফাইল কখনোই কম্পিউটার বা মোবাইল ডিভাইস ছেড়ে ইন্টারনেটে যায় না। একমাত্র ব্যতিক্রম ঐচ্ছিক এআই অ্যানালাইজ টুল, যা ব্যবহারকারীর সুস্পষ্ট সম্মতির পরেই টেক্সট পাঠায়।' },
        { q: 'সর্বোচ্চ কত সাইজের ফাইল প্রসেস করা যায়?', a: 'PDFMinty একক ফাইলে সর্বোচ্চ ১০০ মেগাবাইট এবং সম্মিলিত অপারেশনে সর্বোচ্চ ১৫০ মেগাবাইট পর্যন্ত ফাইল সাপোর্ট করে। এটি মূলত আপনার ডিভাইসের র‍্যাম ও মেমরির উপর নির্ভর করে।' }
      ],
      ctaTitle: 'এখনই আপনার PDF প্রসেসিং শুরু করুন',
      ctaDesc: 'উপরে আমাদের সম্পূর্ণ পিডিএফ টুলসের তালিকা দেখুন। সব টুল বিনামূল্যে, ব্যক্তিগত এবং ব্রাউজারে তাৎক্ষণিকভাবে কাজ করে।',
      featuredOn: 'স্বীকৃত ও ফিচার্ড হয়েছে',
      webAppDesc: 'সম্পূর্ণ বিনামূল্যে ও গোপনীয়তাবান্ধব অনলাইন পিডিএফ টুলকিট। ব্রাউজারের ভেতর সরাসরি পিডিএফ মার্জ, স্প্লিট, কম্প্রেস, রোটেট, প্রটেক্ট এবং এডিট করুন কোনো সার্ভার আপলোড ছাড়াই।',
      orgDesc: 'প্রাইভেসি-ফার্স্ট ক্লায়েন্ট-সাইড পিডিএফ টুলকিট যাতে রয়েছে ২৩টি সম্পূর্ণ ফ্রি টুল।',
      websiteDesc: 'ব্রাউজার-ভিত্তিক ফ্রি পিডিএফ টুলস — ১০০% ব্যক্তিগত, জিরো ফাইল আপলোড এবং কোনো সাইন-আপ ছাড়াই।',
      features: [
        'একাধিক পিডিএফ ফাইল মার্জ বা একত্রিত করা',
        'পিডিএফ পৃথক পেজে স্প্লিট করা',
        'পিডিএফ ফাইলের আকার কম্প্রেস করা',
        'পিডিএফ পেজ রোটেট করা',
        'পিডিএফ থেকে পেজ ডিলিট করা',
        'ওয়াটারমার্ক যোগ করা',
        'পৃষ্ঠা নম্বর যুক্ত করা',
        'ফাঁকা পৃষ্ঠা যুক্ত করা',
        'পাসওয়ার্ড দিয়ে পিডিএফ সুরক্ষিত করা',
        'পাসওয়ার্ডযুক্ত পিডিএফ আনলক করা',
        'ছবি থেকে পিডিএফ তৈরি',
        'পিডিএফ থেকে ছবি তৈরি',
        'এআই-চালিত পিডিএফ বিশ্লেষণ'
      ]
    },
    hi: {
      code: 'hi',
      langName: 'Hindi',
      title: 'PdfMinty — मुफ्त प्राइवेसी-फर्स्ट पीडीएफ टूल्स (100% ब्राउज़र में)',
      desc: 'आपके ब्राउज़र में मुफ्त पीडीएफ टूल्स। सर्वर अपलोड या रजिस्ट्रेशन के बिना पीडीएफ मर्ज, स्प्लिट, कंप्रेस और प्रोटेक्ट करें। 100% प्राइवेसी।',
      h1: 'मुफ़्त ब्राउज़र-आधारित पीडीएफ उपकरण — 100% निजी, कोई अपलोड नहीं',
      lead: `PDFMinty एक मुफ़्त, प्राइवेसी-फर्स्ट पीडीएफ टूलकिट है जिसमें ${toolsCount} शक्तिशाली उपकरण हैं जो पूरी तरह से आपके ब्राउज़र में चलते हैं। आपकी फ़ाइलें कभी भी आपके डिवाइस से बाहर नहीं जाती हैं — कोई सर्वर अपलोड नहीं, कोई साइन-अप नहीं, कोई दैनिक सीमा नहीं। पूर्ण गोपनीयता के साथ पीडीएफ मर्ज, स्प्लिट, प्रोटेक्ट, कन्वर्ट और एडिट करें।`,
      toolsTitle: 'सभी पीडीएफ उपकरण',
      whyTitle: 'PDFMinty क्यों चुनें?',
      whyIntro: 'अन्य ऑनलाइन पीडीएफ उपकरणों के विपरीत जो आपकी फ़ाइलों को रिमोट सर्वर पर अपलोड करते हैं, PDFMinty WebAssembly का उपयोग करके आपके ब्राउज़र में सब कुछ स्थानीय रूप से प्रोसेस करता है। इसका मतलब है:',
      whyFeatures: [
        { title: 'पूर्ण गोपनीयता', desc: 'आपके दस्तावेज़ कभी भी हमारे सर्वर पर नहीं जाते हैं।' },
        { title: 'फ़ाइल सीमा से मुक्त', desc: 'प्रत्येक फ़ाइल 100MB तक और कुल 150MB तक प्रोसेस करें।' },
        { title: 'तेज़ प्रोसेसिंग', desc: 'WebAssembly-संचालित कार्य कुछ ही सेकंड में पूरे होते हैं।' },
        { title: 'कोई पंजीकरण नहीं', desc: 'बिना साइन-अप के सभी उपकरण 100% मुफ़्त हैं।' },
        { title: 'ऑफ़लाइन काम करता है', desc: 'PWA-सक्षम — बिना इंटरनेट के इंस्टॉल और उपयोग करें।' }
      ],
      privacyTitle: 'PDFMinty आपकी गोपनीयता की रक्षा कैसे करता है',
      privacyP1: 'PDFMinty में प्रत्येक पीडीएफ ऑपरेशन जावास्क्रिप्ट और WebAssembly का उपयोग करके क्लाइंट-साइड पर होता है। जब आप कोई फ़ाइल चुनते हैं, तो वह आपके ब्राउज़र की मेमोरी में लोड होती है, स्थानीय रूप से प्रोसेस होती है और परिणाम आपके डिवाइस पर ही तैयार होता है। फ़ाइल कभी भी नेटवर्क पर प्रेषित नहीं होती है।',
      privacyP2: 'हमारा प्राइवेसी-फर्स्ट आर्किटेक्चर PDFMinty को टैक्स रिटर्न, मेडिकल रिकॉर्ड, वित्तीय विवरण, कानूनी अनुबंध और व्यक्तिगत जानकारी वाले किसी भी संवेदनशील दस्तावेज़ को प्रोसेस करने के लिए आदर्श बनाता है।',
      faqTitle: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
      faqs: [
        { q: 'PDFMinty मेरी पीडीएफ फाइलों को निजी तौर पर कैसे प्रोसेस करता है?', a: 'PDFMinty वेबअसेम्बली (WebAssembly) और जावास्क्रिप्ट का उपयोग करके पूरी तरह से आपके ब्राउज़र के भीतर फाइलों को प्रोसेस करता है। दस्तावेज़ सीधे आपके डिवाइस की मेमोरी में प्रोसेस होते हैं और कभी किसी सर्वर पर अपलोड नहीं होते।' },
        { q: 'क्या PDFMinty वास्तव में पूरी तरह मुफ़्त है?', a: `हाँ, PDFMinty उपयोग करने के लिए 100% पूरी तरह से मुफ़्त है। सभी ${toolsCount} उपकरण बिना किसी सदस्यता, शुल्क या साइन-अप के उपलब्ध हैं।` },
        { q: 'क्या मेरी फाइलें कभी मेरे डिवाइस से बाहर जाती हैं?', a: 'नहीं, हमारे सभी मानक पीडीएफ उपकरणों के लिए फाइलें कभी भी आपके कंप्यूटर या मोबाइल को छोड़कर बाहर नहीं जाती हैं। केवल वैकल्पिक AI एनालाइज टूल आपकी स्पष्ट सहमति के बाद ही टेक्स्ट भेजता है।' },
        { q: 'अधिकतम फाइल आकार कितना है?', a: 'PDFMinty 100MB तक की एकल फाइलों और बैच ऑपरेशन में कुल 150MB तक की फाइलों को प्रोसेस कर सकता है। वास्तविक क्षमता आपके डिवाइस की मेमोरी पर निर्भर करती है।' }
      ],
      ctaTitle: 'अभी अपनी पीडीएफ प्रोसेस करना शुरू करें',
      ctaDesc: 'ऊपर हमारे पीडीएफ उपकरणों का पूरा संग्रह देखें। सभी उपकरण मुफ़्त, सुरक्षित और आपके ब्राउज़र में तुरंत काम करते हैं।',
      featuredOn: 'इन मंचों पर प्रदर्शित',
      webAppDesc: 'मुफ़्त और प्राइवेसी-फर्स्ट ऑनलाइन पीडीएफ टूलकिट। अपने ब्राउज़र में सीधे पीडीएफ मर्ज, स्प्लिट, कंप्रेस, रोटेट, प्रोटेक्ट और एडिट करें — बिना किसी सर्वर अपलोड के।',
      orgDesc: 'प्राइवेसी-फर्स्ट, क्लाइंट-साइड पीडीएफ टूलकिट जिसमें 23 मुफ़्त और सुरक्षित टूल्स उपलब्ध हैं।',
      websiteDesc: 'मुफ़्त ब्राउज़र-आधारित पीडीएफ उपकरण — 100% निजी, कोई सर्वर अपलोड नहीं, कोई पंजीकरण नहीं।',
      features: [
        'कई पीडीएफ फाइलों को एक साथ जोड़ें',
        'पीडीएफ को अलग-अलग पेजों में विभाजित करें',
        'पीडीएफ फाइल का आकार कंप्रेस करें',
        'पीडीएफ पेजों को घुमाएं',
        'पीडीएफ से पेज हटाएं',
        'वॉटरमार्क जोड़ें',
        'पेज नंबर डालें',
        'खाली पेज डालें',
        'पासवर्ड से सुरक्षित करें',
        'पासवर्ड वाली पीडीएफ अनलॉक करें',
        'इमेज को पीडीएफ में बदलें',
        'पीडीएफ को इमेज में बदलें',
        'एआई-आधारित पीडीएफ विश्लेषण'
      ]
    },
    zh: {
      code: 'zh',
      langName: 'Chinese',
      title: 'PdfMinty — 免费的隐私优先PDF工具（100%在浏览器中运行）',
      desc: '直接在浏览器中使用的免费PDF工具。无需服务器上传或注册，即可合并、拆分、压缩和保护PDF。100%隐私安全。',
      h1: '免费的基于浏览器的 PDF 工具 — 100% 私密，零上传',
      lead: `PDFMinty 是一套免费、注重隐私的 PDF 工具箱，拥有 ${toolsCount} 款完全在浏览器中运行的强大工具。您的文件绝不会离开您的设备——无服务器上传、无需注册、无每日限额。完全私密地合并、拆分、保护、转换和编辑 PDF。`,
      toolsTitle: '所有 PDF 工具',
      whyTitle: '为什么选择 PDFMinty？',
      whyIntro: '与其他将文件上传到远程服务器的在线 PDF 工具不同，PDFMinty 使用 WebAssembly 在您的浏览器中进行 100% 本地处理。这意味着：',
      whyFeatures: [
        { title: '完全隐私', desc: '您的文档绝不会接触我们的服务器。' },
        { title: '大文件支持', desc: '支持处理单文件最高 100MB，总计 150MB 的文档。' },
        { title: '疾速处理', desc: '基于 WebAssembly 技术，数秒内完成处理。' },
        { title: '无需注册', desc: '所有工具 100% 免费，无需注册账户。' },
        { title: '离线可用', desc: '支持 PWA — 无需互联网即可安装和随时使用。' }
      ],
      privacyTitle: 'PDFMinty 如何保护您的隐私',
      privacyP1: 'PDFMinty 中的每项 PDF 操作均使用 JavaScript 和 WebAssembly 在客户端本地运行。当您载入文件时，它直接加载到您的浏览器内存中进行本地运算，生成的结果也直接保存在您的设备上。文件绝不会在网络上传输，这与需要上传到远程服务器的传统在线 PDF 工具存在本质区别。',
      privacyP2: '我们的隐私优先架构使 PDFMinty 成为处理敏感机密文件（如纳税申报单、医疗记录、财务报表、法律合同以及包含个人身份信息的任何文件）的理想之选。',
      faqTitle: '常见问题解答 (FAQ)',
      faqs: [
        { q: 'PDFMinty 如何私密安全地处理我的 PDF 文件？', a: 'PDFMinty 利用 WebAssembly 和 JavaScript 技术在您的网页浏览器本地完成所有计算与处理。文件仅加载至您设备的内存中并在本地运行，绝不会上传至任何远程服务器。' },
        { q: 'PDFMinty 是完全免费的吗？', a: `是的，PDFMinty 100% 完全免费使用。全部 ${toolsCount} 款工具均无任何订阅费、无隐藏付费，也无需注册任何账号。` },
        { q: '我的文件会离开我的电脑或移动设备吗？', a: '不会。对于所有常规 PDF 工具，您的文件绝不会离开您的设备或浏览器。唯一的例外是可选的 AI 分析工具，且仅在您主动勾选授权后才会传输提取的文本。' },
        { q: '支持的最大文件大小是多少？', a: 'PDFMinty 支持单个最大 100MB 的 PDF 文件，批量合并等操作总计支持最高 150MB。具体处理能力取决于您设备的可用内存。' }
      ],
      ctaTitle: '立即开始处理您的 PDF',
      ctaDesc: '浏览上方我们完整的 PDF 工具合集。所有工具均免费、私密，并在您的浏览器中即刻运行。',
      featuredOn: '精选收录平台',
      webAppDesc: '免费、注重隐私的在线 PDF 工具箱。完全在浏览器中合并、拆分、压缩、旋转、加密和编辑 PDF，零服务器上传，保护您的数据安全。',
      orgDesc: '隐私优先的纯客户端 PDF 工具箱，提供 23 款无需服务器上传的免费工具。',
      websiteDesc: '免费基于浏览器的 PDF 工具 — 100% 私密，零文件上传，无需注册账户。',
      features: [
        '合并多个 PDF 文件',
        '将 PDF 拆分为单个页面',
        '压缩 PDF 文件大小',
        '旋转 PDF 页面',
        '删除 PDF 中的指定页面',
        '添加水印',
        '插入页码',
        '插入空白页',
        '使用密码加密 PDF',
        '解锁受保护的 PDF',
        '将图片转换为 PDF',
        '将 PDF 转换为图片',
        'AI 智能 PDF 分析'
      ]
    }
  };

  const cleanSiteUrl = SITE_URL.replace(/\/+$/, '');

  for (const [code, locData] of Object.entries(localizedHomepagesData)) {
    const euHomepageDir = path.join(distDir, code);
    if (!fs.existsSync(euHomepageDir)) {
      fs.mkdirSync(euHomepageDir, { recursive: true });
    }

    const euCanonical = `${cleanSiteUrl}/${code}/`;
    const hreflangLinks = SUPPORTED_LOCALES.map(loc => 
      `  <link rel="alternate" hreflang="${loc}" href="${cleanSiteUrl}${loc === 'en' ? '/' : `/${loc}/`}">`
    ).join('\n');

    const locCommonPath = path.join(__dirname, `../src/locales/${code}/common.json`);
    interface LocaleToolEntry {
      name?: string;
      desc?: string;
    }
    let locCommon: { tools?: Record<string, LocaleToolEntry> } | null = null;
    if (fs.existsSync(locCommonPath)) {
      try {
        locCommon = JSON.parse(fs.readFileSync(locCommonPath, 'utf8'));
      } catch (err: unknown) {
        logger.warn(`Could not parse common.json for locale ${code}:`, err);
      }
    }

    const euToolsListHtml = TOOLS
      .filter((t: ToolSEOInfo) => t.type === 'tool')
      .map((t: ToolSEOInfo) => {
        const toolUrl = isI18nToolSlug(t.slug) ? `/${code}/${t.slug}/` : `/${t.slug}/`;
        const toolName = locCommon?.tools?.[t.slug]?.name || t.name;
        const toolDesc = locCommon?.tools?.[t.slug]?.desc || t.shortDescription;
        return `      <li><a href="${toolUrl}">${toolName}</a> — ${toolDesc}</li>`;
      })
      .join('\n');

    const euHomepageContent = `
  <main class="prose max-w-6xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
    <h1>${locData.h1}</h1>
    <p>${locData.lead}</p>
 
    <h2>${locData.toolsTitle}</h2>
    <ul>
${euToolsListHtml}
    </ul>
 
    <h2>${locData.whyTitle}</h2>
    <p>${locData.whyIntro}</p>
    <ul>
${locData.whyFeatures.map(f => `      <li><strong>${f.title}:</strong> ${f.desc}</li>`).join('\n')}
    </ul>
 
    <h2>${locData.privacyTitle}</h2>
    <p>${locData.privacyP1}</p>
 
    <p>${locData.privacyP2}</p>
 
    <h2>${locData.faqTitle}</h2>
${locData.faqs.map(faq => `    <h3>${faq.q}</h3>\n    <p>${faq.a}</p>`).join('\n\n')}
 
    <h2>${locData.ctaTitle}</h2>
    <p>${locData.ctaDesc}</p>

    <div style="margin-top: 2.5rem; text-align: center;">
      <p style="font-weight: 600; margin-bottom: 1rem;">${locData.featuredOn}</p>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.5rem;">
        <a href="https://launchbuff.com/products/pdfminty-8g15b8" target="_blank" rel="noopener noreferrer" title="Featured on LaunchBuff">
          <img src="https://launchbuff.com/badge-featured-dark.svg" alt="Featured on LaunchBuff" width="256" height="80" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
        <a href="https://launchstag.com/p/pdfminty" target="_blank" rel="noopener" title="Featured on Launchstag">
          <img src="https://launchstag.com/badge-light.svg" alt="Featured on Launchstag" width="198" height="62" loading="lazy" style="display: inline-block; max-width: 100%; height: 56px; width: auto;" />
        </a>
      </div>
    </div>
  </main>
`;

    locData.jsonld = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "${euCanonical}#webapp",
    "name": "PDFMinty",
    "url": "${euCanonical}",
    "inLanguage": "${code}",
    "description": ${JSON.stringify(locData.webAppDesc)},
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "PDF Software",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "author": {
      "@type": "Organization",
      "name": "PDFMinty",
      "url": "${cleanSiteUrl}/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PDFMinty",
      "logo": {
        "@type": "ImageObject",
        "url": "${cleanSiteUrl}/logo-512.png",
        "width": 512,
        "height": 512
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": "${cleanSiteUrl}/og-image.png",
      "width": 1200,
      "height": 630
    },
    "featureList": ${JSON.stringify(locData.features)}
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "${cleanSiteUrl}/#organization",
    "name": "PDFMinty",
    "url": "${cleanSiteUrl}/",
    "inLanguage": "${code}",
    "logo": {
      "@type": "ImageObject",
      "url": "${cleanSiteUrl}/logo-512.png",
      "width": 512,
      "height": 512
    },
    "image": "${cleanSiteUrl}/og-image.png",
    "description": ${JSON.stringify(locData.orgDesc)},
    "foundingDate": "2025",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@pdfminty.com",
      "url": "${cleanSiteUrl}/contact/",
      "availableLanguage": ["English", "${locData.langName}"]
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "${cleanSiteUrl}/#website",
    "url": "${cleanSiteUrl}/",
    "name": "PDFMinty",
    "inLanguage": "${code}",
    "description": ${JSON.stringify(locData.websiteDesc)},
    "publisher": {
      "@id": "${cleanSiteUrl}/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "${cleanSiteUrl}/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "${euCanonical}#faq",
    "inLanguage": "${code}",
    "mainEntity": [
${locData.faqs.map(faq => `      {
        "@type": "Question",
        "name": ${JSON.stringify(faq.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(faq.a)}
        }
      }`).join(',\n')}
    ]
  }
  </script>
`;

    const euHeadMeta = `
  <title>${locData.title}</title>
  <meta name="description" content="${locData.desc}">
  <link rel="canonical" href="${euCanonical}">
${hreflangLinks}
  <link rel="alternate" hreflang="x-default" href="${cleanSiteUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${locData.title}">
  <meta property="og:description" content="${locData.desc}">
  <meta property="og:url" content="${euCanonical}">
  <meta property="og:image" content="${cleanSiteUrl}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${euCanonical}">
  <meta name="twitter:title" content="${locData.title}">
  <meta name="twitter:description" content="${locData.desc}">
  <meta name="twitter:image" content="${cleanSiteUrl}/og-image.png">
  ${locData.jsonld}
  `;

    let euHomepageHtml = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${code}"`);
    if (!euHomepageHtml.includes(`lang="${code}"`)) {
      euHomepageHtml = euHomepageHtml.replace('<html', `<html lang="${code}"`);
    }
    euHomepageHtml = euHomepageHtml.replace("</head>", `${euHeadMeta}\n</head>`);

    const euHomepageRootContent = `
    <div id="root">
      ${euHomepageContent}
    </div>
    `;
    euHomepageHtml = euHomepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, euHomepageRootContent.trim());
    fs.writeFileSync(path.join(euHomepageDir, 'index.html'), euHomepageHtml, 'utf8');
    logger.info(`Successfully pre-rendered static HTML for ${code.toUpperCase()} Homepage at dist/${code}/index.html`);
  }

  // Generate static redirect pages for high search-volume aliases
  const aliasRoutes = [
    { alias: 'jpg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'jpeg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'png-to-pdf', target: 'image-to-pdf', title: 'PNG to PDF — Convert PNG Images to PDF Free | PDFMinty' },
    { alias: 'pdf-to-jpg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-jpeg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-png', target: 'pdf-to-image', title: 'PDF to PNG — Convert PDF to High Quality PNG Images Free | PDFMinty' },
    { alias: 'compress-pdf', target: 'blog/how-to-compress-a-pdf-without-losing-quality-2026', title: 'Compress PDF Without Losing Quality — Free Guide | PDFMinty' },
  ];

  for (const { alias, target, title } of aliasRoutes) {
    const aliasDir = path.join(distDir, alias);
    if (!fs.existsSync(aliasDir)) {
      fs.mkdirSync(aliasDir, { recursive: true });
    }
    const targetUrl = `${cleanSiteUrl}/${target}/`;
    const aliasHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/${target}/">
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="Redirecting to ${title}">
  <link rel="canonical" href="${targetUrl}">
  <title>${title}</title>
</head>
<body>
  <p>Redirecting to <a href="/${target}/">${title}</a>...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(aliasDir, 'index.html'), aliasHtml, 'utf8');
    logger.info(`Generated search-intent alias redirect at: dist/${alias}/index.html -> /${target}/`);
  }
}

run().catch((err: unknown) => {
  logger.error("FATAL: Failed to pre-render static HTML pages:", err);
  process.exit(1);
});
