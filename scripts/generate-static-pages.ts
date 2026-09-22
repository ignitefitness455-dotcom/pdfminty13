import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { HOMEPAGE_H1 } from '../src/config/homeConfig';
import { SITE_URL, SITE_NAME, TOOLS, ToolSEOInfo, RELATED_TOOL_MAPPING } from '../src/config/seo-data';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_TOOL_SLUGS, getHreflangs, getCanonicalUrl } from '../src/i18n/config';
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

      // 4. favicon.ico / favicon.png (Browser tabs)
      await sharp(iconSource)
        .resize(32, 32)
        .png()
        .toFile(path.join(target, 'favicon.ico'));

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
    metaTitle: 'PDF zusammenfügen — Kostenlos online PDF-Dateien kombinieren | PDFMinty',
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
    metaTitle: 'Fusionner PDF Gratuit — Combiner des fichiers PDF en ligne | PDFMinty',
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
    metaTitle: 'मुफ़्त में पीडीएफ फ़ाइलें मर्ज करें — ऑनलाइन पीडीएफ मिलाएं | PDFMinty',
    metaDescription: 'मुफ़्त में ऑनलाइन पीडीएफ फ़ाइलें मर्ज करें। अपने ब्राउज़र में स्थानीय रूप से कई पीडीएफ को एक सुरक्षित दस्तावेज़ में संयोजित करें। कोई सर्वर अपलोड नहीं — आपकी फ़ाइलें निजी रहती हैं।',
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
    metaTitle: '免费合并 PDF 文件 — 在线合并 PDF | PDFMinty',
    metaDescription: '免费在线合并 PDF 文件。在浏览器中本地将多个 PDF 合并为一个安全文档。无需服务器上传 — 您的文件保持私密。',
    h1: '免费合并 PDF 文件 — 在线将多个 PDF 组合为一个文档（100% 浏览器本地处理）',
    lead: '快速、安全且完全免费地在线将多个 PDF 文件合并为一个结构化文档。无需安装软件，您的私密文件永远不会上传到任何远程服务器。',
    howToTitle: '如何合并多个 PDF 文件？',
    howToSteps: [
      { title: '选择文件：', desc: '点击“选择文件”按钮或直接将 PDF 文件拖放到页面中。' },
      { title: '调整顺序：', desc: '轻松拖拽文件以按所需顺序重新排列。' },
      { title: '点击合并：', desc: '点击“合并 PDF”，在浏览器内存中极速组合文件。' },
      { title: '立即下载：', desc: '合并完成后即可一键下载全新的单一 PDF 文件。' }
    ],
    whyTitle: '为什么选择 PDFMinty 合并 PDF？',
    features: [
      { title: '100% 客户端隐私保护：', desc: '使用 WebAssembly 技术在本地处理，零服务器上传。' },
      { title: '无限制无水印：', desc: '完全免费使用，绝不在生成的文件中添加任何水印。' },
      { title: '保持原始内容品质：', desc: '文字、高分辨率图片和矢量图完全无损保留。' },
      { title: '离线可用：', desc: '网页加载后，即使在断网状态下也能正常处理文件。' }
    ],
    faqTitle: '常见问题解答 (FAQ)',
    faqs: [
      { q: '我的 PDF 会被上传或保存在服务器上吗？', a: '绝对不会。所有文件仅在您设备的本地内存中处理。' },
      { q: '我一次可以合并多少个 PDF 文件？', a: '取决于您设备的可用内存，通常可轻松处理数十个文件。单个文件上限 100MB。' },
      { q: '合并后 PDF 会丢失清晰度吗？', a: '不会，合并过程为无损组合，保持原稿品质。' }
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
    clean = clean.replace(/<div\s+id="root"[\s\S]*?(?=\s*(?:<script|<!--|<footer>|<\/body>))/i, '<div id="root"></div>');

    return clean;
  }
  
  const optimizedBase: string = cleanBaseTemplate(baseHtml);
  
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

    // Pre-inject longFormBody directly inside the React root element (#root) for bot/crawler visibility without duplicate noscript block
    const preRenderedContent: string = `
    <div id="root">
      <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
        ${finalBody}
      </article>
    </div>
    `;
    
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

            locPreRenderedContent = `
    <div id="root">
      <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
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
      </article>
    </div>
            `;
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
  const localizedHomepages = [
    {
      code: 'de',
      title: 'PdfMinty — Kostenlose datenschutzfreundliche PDF-Werkzeuge (100% im Browser)',
      desc: 'Kostenlose PDF-Tools direkt im Browser. PDF zusammenfügen, teilen, komprimieren und schützen. Keine Uploads, keine Registrierung, 100% Datenschutz.',
    },
    {
      code: 'fr',
      title: 'PdfMinty — Outils PDF gratuits et confidentiels (100% dans le navigateur)',
      desc: 'Suite d’outils PDF gratuits dans votre navigateur. Fusionnez, divisez, compressez et protégez vos fichiers PDF sans téléversement et en toute confidentialité.',
    },
    {
      code: 'es',
      title: 'PdfMinty — Herramientas PDF gratis y privadas (100% en el navegador)',
      desc: 'Herramientas PDF gratuitas en tu navegador. Une, divide, comprime y protege PDFs sin subir archivos a servidores. 100% privado y seguro.',
    },
    {
      code: 'bn',
      title: 'PdfMinty — বিনামূল্যে গোপনীয়তা-বান্ধব পিডিএফ টুলস (১০০% ব্রাউজারে)',
      desc: 'ব্রাউজারেই বিনামূল্যে পিডিএফ টুলস। কোনো সার্ভার আপলোড বা নিবন্ধন ছাড়া পিডিএফ যুক্ত করুন, ভাগ করুন, সংকুচিত করুন এবং সুরক্ষিত করুন। ১০০% গোপনীয়তা।',
    },
    {
      code: 'hi',
      title: 'PdfMinty — मुफ्त प्राइवेसी-फर्स्ट पीडीएफ टूल्स (100% ब्राउज़र में)',
      desc: 'आपके ब्राउज़र में मुफ्त पीडीएफ टूल्स। सर्वर अपलोड या रजिस्ट्रेशन के बिना पीडीएफ मर्ज, स्प्लिट, कंप्रेस और प्रोटेक्ट करें। 100% प्राइवेसी।',
    },
    {
      code: 'zh',
      title: 'PdfMinty — 免费的隐私优先PDF工具（100%在浏览器中运行）',
      desc: '直接在浏览器中使用的免费PDF工具。无需服务器上传或注册，即可合并、拆分、压缩和保护PDF。100%隐私安全。',
    },
  ];

  const cleanSiteUrl = SITE_URL.replace(/\/+$/, '');

  for (const eu of localizedHomepages) {
    const euHomepageDir = path.join(distDir, eu.code);
    if (!fs.existsSync(euHomepageDir)) {
      fs.mkdirSync(euHomepageDir, { recursive: true });
    }

    const euCanonical = `${cleanSiteUrl}/${eu.code}/`;
    const hreflangLinks = SUPPORTED_LOCALES.map(loc => 
      `  <link rel="alternate" hreflang="${loc}" href="${cleanSiteUrl}${loc === 'en' ? '/' : `/${loc}/`}">`
    ).join('\n');

    const euHeadMeta = `
  <title>${eu.title}</title>
  <meta name="description" content="${eu.desc}">
  <link rel="canonical" href="${euCanonical}">
${hreflangLinks}
  <link rel="alternate" hreflang="x-default" href="${cleanSiteUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${eu.title}">
  <meta property="og:description" content="${eu.desc}">
  <meta property="og:url" content="${euCanonical}">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${euCanonical}">
  <meta name="twitter:title" content="${eu.title}">
  <meta name="twitter:description" content="${eu.desc}">
  <meta name="twitter:image" content="${SITE_URL}/og-image.png">
  `;

    let euHomepageHtml = optimizedBase.replace(/<html(\s+[^>]*)?lang="[a-zA-Z\-]+"/i, `<html lang="${eu.code}"`);
    if (!euHomepageHtml.includes(`lang="${eu.code}"`)) {
      euHomepageHtml = euHomepageHtml.replace('<html', `<html lang="${eu.code}"`);
    }
    euHomepageHtml = euHomepageHtml.replace("</head>", `${euHeadMeta}\n</head>`);
    euHomepageHtml = euHomepageHtml.replace(/<div\s+id="root"[\s\S]*?<\/div>/i, homepageRootContent.trim());
    fs.writeFileSync(path.join(euHomepageDir, 'index.html'), euHomepageHtml, 'utf8');
    logger.info(`Successfully pre-rendered static HTML for ${eu.code.toUpperCase()} Homepage at dist/${eu.code}/index.html`);
  }

  // Generate static redirect pages for high search-volume aliases
  const aliasRoutes = [
    { alias: 'jpg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'jpeg-to-pdf', target: 'image-to-pdf', title: 'JPG to PDF — Convert JPG Images to PDF Free | PDFMinty' },
    { alias: 'png-to-pdf', target: 'image-to-pdf', title: 'PNG to PDF — Convert PNG Images to PDF Free | PDFMinty' },
    { alias: 'pdf-to-jpg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-jpeg', target: 'pdf-to-image', title: 'PDF to JPG — Convert PDF to High Quality JPG Images Free | PDFMinty' },
    { alias: 'pdf-to-png', target: 'pdf-to-image', title: 'PDF to PNG — Convert PDF to High Quality PNG Images Free | PDFMinty' },
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
