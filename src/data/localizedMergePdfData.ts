export interface LocalizedScenario {
  label: string;
  title: string;
  desc: string;
}

export interface LocalizedStep {
  title: string;
  desc: string;
}

export interface LocalizedFeature {
  title: string;
  desc: string;
}

export interface LocalizedFaq {
  q: string;
  a: string;
}

export interface LocalizedComparisonRow {
  solution: string;
  privacy: string;
  limit: string;
  speed: string;
  install: string;
}

export interface LocalizedMergePdfData {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  guideTitle: string;
  guideLead: string;
  guideText: string;
  scenariosTitle: string;
  scenarios: LocalizedScenario[];
  underTheHoodTitle: string;
  underTheHoodIntro: string;
  underTheHoodSteps: LocalizedStep[];
  howToTitle: string;
  howToSteps: LocalizedStep[];
  comparisonTitle: string;
  comparisonHeaders: {
    solution: string;
    privacy: string;
    limit: string;
    speed: string;
    install: string;
  };
  comparisonRows: LocalizedComparisonRow[];
  whyTitle: string;
  features: LocalizedFeature[];
  faqTitle: string;
  faqs: LocalizedFaq[];
  editorialNotice: string;
  relatedTitle: string;
  relatedTools: { url: string; text: string }[];
}

export const MERGE_PDF_LOCALIZED_DATA: Record<string, LocalizedMergePdfData> = {
  bn: {
    metaTitle: 'বিনামূল্যে PDF মার্জ করুন — একাধিক ফাইল যুক্ত করুন | PDFMinty',
    metaDescription:
      'সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ফাইলে যুক্ত করুন। ১০০% ব্রাউজার প্রসেসিং, কোনো ফাইল সার্ভারে আপলোড হয় না।',
    h1: 'বিনামূল্যে PDF ফাইল মার্জ করুন — একাধিক PDF এক ডকুমেন্টে যুক্ত করুন (১০০% ব্রাউজার প্রসেসিং)',
    lead: 'অনলাইনে সম্পূর্ণ বিনামূল্যে এবং নিরাপদে একাধিক PDF ফাইল একটি ডকুমেন্টে মার্জ বা একত্রিত করুন। কোনো সফটওয়্যার ইন্সটল করার প্রয়োজন নেই এবং আপনার ফাইল কখনোই কোনো রিমোট সার্ভারে আপলোড করা হয় না।',
    guideTitle:
      'ব্রাউজারে অফলাইনে PDF মার্জ করার চূড়ান্ত নির্দেশিকা (মেমোরি সীমা, ক্রমবিন্যাস ও মানদণ্ড)',
    guideLead:
      'আইনি, বাণিজ্যিক এবং একাডেমিক কার্যক্রমে একাধিক স্বাধীন PDF ফাইলকে একটি সুসংগঠিত মাস্টার ফাইলে একত্রিত করা সবচেয়ে নিয়মিত ও গুরুত্বপূর্ণ কাজ। কিন্তু গতানুগতিক ক্লাউড কনভার্টারে ফাইল আপলোড করলে ধীরগতির পাশাপাশি গোপনীয় করপোরেট চুক্তি বা আর্থিক নথি ফাঁসের মারাত্মক ঝুঁকি তৈরি হয়।',
    guideText:
      'PDFMinty-এর PDF মার্জিং ইঞ্জিন সরাসরি আপনার ব্রাউজার ট্যাবে WebAssembly প্রযুক্তির মাধ্যমে ১০০% লোকালি রান করে। নিচে বিস্তারিত কারিগরি বিবরণ দেওয়া হলো কীভাবে ক্লায়েন্ট-সাইড কম্পাইলেশন ৫০টি পর্যন্ত ফাইল এবং ১৫০ মেগাবাইট ডেটা নিরাপদে হ্যান্ডেল করে এবং ফাইল কোয়ালিটি অপরিবর্তিত রাখে।',
    scenariosTitle: 'কখন লোকাল ব্রাউজারে PDF মার্জ করবেন: ৩টি বাস্তব উদাহরণ',
    scenarios: [
      {
        label: '🏛️ দৃশ্যপট ১: আইনি নথি ও মামলা পরিচালনা',
        title: 'আদালতের পিটিশন ও প্রমাণাদি সংকলন',
        desc: 'আইনজীবী ও আইনি সহকারীরা ক্লায়েন্ট-অ্যাটর্নি গোপনীয়তা বজায় রেখে আদালতের মোশন, হলফনামা ও প্রমাণপত্রের নথি একটিমাত্র ফাইলিং নথিতে একত্রিত করতে পারেন।',
      },
      {
        label: '💼 দৃশ্যপট ২: এমঅ্যান্ডএ (M&A) ও করপোরেট নিরীক্ষা',
        title: 'কোম্পানি অধিগ্রহণ ও আর্থিক নিরীক্ষা',
        desc: 'বিনিয়োগ ব্যাংকার এবং চার্টার্ড অ্যাকাউন্ট্যান্টগণ ব্যালেন্স শিট, ত্রৈমাসিক লাভ-ক্ষতির হিসাব এবং কর নথি সংবেদনশীল পর্যালোচনার জন্য নিরাপদভাবে যুক্ত করতে পারেন।',
      },
      {
        label: '🎓 দৃশ্যপট ৩: একাডেমিক পোর্টফোলিও ও প্রকাশনা',
        title: 'রিসার্চ পেপার, থিসিস ও ডিগ্রি আবেদন',
        desc: 'গবেষক এবং শিক্ষার্থীরা সিভি, পিয়ার-রিভিউড প্রকাশনা, প্রাতিষ্ঠানিক অনুমোদনপত্র ও সুপারিশসমূহ একটি সুসংগঠিত ডসিয়ারে সংকলন করতে পারেন।',
      },
    ],
    underTheHoodTitle: 'ব্রাউজারের ভেতরে কীভাবে PDF মার্জ কাজ করে (কারিগরি ব্যাখ্যা)',
    underTheHoodIntro:
      'আন্তর্জাতিক ISO 32000-1 PDF মানদণ্ড অনুযায়ী, দুটি PDF যুক্ত করা মানে কেবল ফাইল দুটিকে একসাথে জোড়া লাগানো নয়। প্রতিটি ফাইলে নিজস্ব রুট ক্যাটালগ, অবজেক্ট নম্বর এবং ক্রস-রেফারেন্স (xref) টেবিল সংরক্ষিত থাকে। PDFMinty-তে ফাইল যোগ করার পর যা ঘটে:',
    underTheHoodSteps: [
      {
        title: 'অবজেক্ট রি-ইনডেক্সিং:',
        desc: 'ফাইলগুলোর অবজেক্ট আইডি যেন পরস্পরের সাথে সংঘর্ষে না পড়ে, সেজন্য WebAssembly ইঞ্জিন প্রতিটি অবজেক্টের জন্য অনন্য ইউনিক আইডি নির্ধারণ করে।',
      },
      {
        title: 'পেজ ট্রি একীকরণ:',
        desc: 'ইঞ্জিনটি একটি নতুন মাস্টার /Pages ট্রি তৈরি করে এবং প্রতিটি ফাইল থেকে পাতার রেফারেন্সগুলো একটি একক /Kids অ্যারেতে বিন্যস্ত করে।',
      },
      {
        title: 'রিসোর্স ডিকশনারি ম্যাপিং:',
        desc: 'ফন্টের সাবসেট, ভেক্টর অবজেক্ট এবং কালার স্পেস কোনো প্রকার কোয়ালিটি হ্রাস বা রাস্টারাইজেশন ছাড়াই মূলমানে সংরক্ষিত থাকে।',
      },
      {
        title: 'ট্রেলার সিরিয়ালাইজেশন:',
        desc: 'একটি পরিচ্ছন্ন নতুন ক্রস-রেফারেন্স টেবিল তৈরি হয় এবং সম্পূর্ণ ফাইলটি মেমোরির ভেতরে একটি একক ব্লব হিসেবে তৈরি হয়ে তাৎক্ষণিক ডাউনলোডের জন্য প্রস্তুত হয়।',
      },
    ],
    howToTitle: 'ধাপে ধাপে নির্দেশিকা: নিরাপদে বড় PDF ফাইল মার্জ করার নিয়ম',
    howToSteps: [
      {
        title: 'ফাইল নির্বাচন করুন:',
        desc: "'ফাইল বাছুন' বোতামে ক্লিক করুন অথবা আপনার ডিভাইস থেকে ৫০টি পর্যন্ত PDF (সর্বোচ্চ ১৫০MB) ড্র্যাগ ও ড্রপ করুন। ফাইলগুলো সরাসরি ব্রাউজার র‍্যামে লোড হয়।",
      },
      {
        title: 'ক্রম সাজান:',
        desc: 'ড্র্যাগ কন্ট্রোল বা তীর বোতাম ব্যবহার করে ফাইলগুলো আপনার পছন্দমতো ক্রমানুসারে সাজান।',
      },
      {
        title: 'ফাইল মেটাডাটা পরীক্ষা করুন:',
        desc: 'প্রতিটি ফাইলের পাতার সংখ্যা এবং মোট ফাইলের সাইজ কার্ডের ওপর দেখে নিশ্চিত হয়ে নিন।',
      },
      {
        title: 'মার্জ বোতামে চাপুন:',
        desc: "'PDF মার্জ করুন' বোতামে ক্লিক করলেই কোনো ডেটা ইন্টারনেটে না পাঠিয়ে চোখের পলকে মেমোরিতে ফাইলগুলো একত্রিত হবে।",
      },
      {
        title: 'ডাউনলোড করুন:',
        desc: 'মার্জ সম্পন্ন হলে স্বয়ংক্রিয়ভাবে নতুন একক PDF ফাইলটি আপনার ডিভাইসের লোকাল স্টোরেজে সেভ করে নিন।',
      },
    ],
    comparisonTitle: 'আর্কিটেকচার তুলনা: PDF মার্জিং পদ্ধতির কারিগরি পার্থক্য',
    comparisonHeaders: {
      solution: 'মার্জিং পদ্ধতি',
      privacy: 'ডেটা ট্রানজিট ও প্রাইভেসি',
      limit: 'ফ্রি ব্যাচ লিমিট',
      speed: 'প্রসেসিং গতি',
      install: 'সফটওয়্যার ইনস্টলেশন',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty (ইন-ব্রাউজার WASM)',
        privacy: '১০০% ক্লায়েন্ট-সাইড (০ বাইট আপলোড)',
        limit: '৫০টি ফাইল / ১৫০ MB',
        speed: 'মুহূর্তের মধ্যে (লোকাল সিপিইউ)',
        install: 'প্রয়োজন নেই (ওয়েব ব্রাউজার)',
      },
      {
        solution: 'ক্লাউড কনভার্টার (iLovePDF / Smallpdf)',
        privacy: 'সার্ভারে ফাইল আপলোড হয়',
        limit: '২–৫টি ফাইল (পেওয়াল সীমা)',
        speed: 'ধীরগতি (আপলোড ও ডাউনলোড অপেক্ষা)',
        install: 'প্রয়োজন নেই',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: 'লোকাল ডেস্কটপ',
        limit: 'সীমাহীন',
        speed: 'দ্রুত',
        install: 'পেইড সফটওয়্যার ($২০+/মাস)',
      },
      {
        solution: 'macOS Preview',
        privacy: 'লোকাল ডেস্কটপ',
        limit: 'ম্যানুয়াল ড্র্যাগ-অ্যান্ড-ড্রপ',
        speed: 'মাঝারি',
        install: 'কেবলমাত্র ম্যাকওএস',
      },
    ],
    whyTitle: 'কেন PDFMinty-এর PDF মার্জার সেরা?',
    features: [
      {
        title: '১০০% ক্লায়েন্ট-সাইড প্রাইভেসি:',
        desc: 'ফাইলগুলো WebAssembly প্রযুক্তিতে সরাসরি আপনার ডিভাইসে প্রসেস হয়, কোনো সার্ভারে আপলোড ছাড়া।',
      },
      {
        title: 'কোনো সীমা বা ওয়াটারমার্ক নেই:',
        desc: 'সম্পূর্ণ ফ্রি এবং কোনো জলছাপ বা লুকানো সাবস্ক্রিপশন চার্জ যুক্ত করা হয় না।',
      },
      {
        title: 'লিপিবদ্ধ কোয়ালিটি অক্ষত:',
        desc: 'টেক্সট, হাই-রেজোলিউশন ছবি ও ভেক্টর ড্রয়িং মূল কোয়ালিটিতে বজায় থাকে।',
      },
      {
        title: 'অফলাইন সাপোর্ট ও PWA:',
        desc: 'একবার লোড হওয়ার পর ইন্টারনেট সংযোগ ছাড়াও টুলটি সম্পূর্ণ অফলাইনে কাজ করতে পারে।',
      },
    ],
    faqTitle: 'সচরাচর জিজ্ঞাসিত প্রযুক্তিগত প্রশ্নাবলী (FAQ)',
    faqs: [
      {
        q: 'সবকিছু লোকাল হওয়া সত্ত্বেও ৫০টি ফাইল বা ১৫০MB সীমা কেন রাখা হয়েছে?',
        a: '১৫০MB একটি সুচিন্তিত ব্রাউজার নিরাপত্তা সীমা, যাতে মোবাইল ডিভাইসে (যেমন iOS Safari বা Android Chrome) মেমোরি সংকটজনিত ট্যাব ক্র্যাশ বা রিলোড না ঘটে।',
      },
      {
        q: 'ভিন্ন সাইজের পাতা (যেমন A4 এবং US Letter) মার্জ করলে কী হবে?',
        a: 'PDFMinty প্রতিটি পাতার নিজস্ব /MediaBox ও /CropBox সাইজ বজায় রাখে। A4 পাতা ২১০x২৯৭ মিমি এবং US Letter পাতা ৮.৫x১১ ইঞ্চি আকারেই থাকবে, কোনো বিকৃতি হবে না।',
      },
      {
        q: 'মার্জ করলে কি আগের ডিজিটাল সিগনেচার বা স্বাক্ষর নষ্ট হয়?',
        a: 'হ্যাঁ। ক্রিপ্টোগ্রাফিক মানদণ্ড (PAdES) অনুযায়ী PDF-এর গঠন পরিবর্তিত হলে সিগনেচার চেকসাম বাতিল হয়। তবে ভিজ্যুয়াল সিগনেচার ঠিক রাখতে মার্জের আগে আমাদের ফ্ল্যাটেন PDF টুল ব্যবহার করুন।',
      },
      {
        q: 'পাসওয়ার্ড দিয়ে সুরক্ষিত PDF কি মার্জ করা যাবে?',
        a: 'যদি কোনো ডকুমেন্টে ওপেন পাসওয়ার্ড থাকে, তবে প্রথমে আনলক PDF টুল দিয়ে পাসওয়ার্ড তুলে নিতে হবে। আনলক করা থাকলে অনায়াসে মার্জ করতে পারবেন।',
      },
      {
        q: 'আমার ফাইলগুলো কি কোনো সার্ভারে ক্যাশ বা জমা থাকে?',
        a: 'না, কখনোই না। PDFMinty একটি সার্ভারলেস স্ট্যাটিক অ্যাপ্লিকেশন। আপনি ইন্টারনেট বন্ধ করে অফলাইনেও ফাইল মার্জ করে এই সত্যতা যাচাই করতে পারেন।',
      },
    ],
    editorialNotice:
      'মানবিক পর্যালোচনা ও যাচাইকৃত • সাইটের প্রতিষ্ঠাতা মোহাম্মদ তানভীর মুন্সী (নেটিভ বাংলা স্পিকার) দ্বারা পর্যালোচিত • ISO 32000-1 অডিটকৃত।',
    relatedTitle: 'অন্যান্য প্রয়োজনীয় PDF টুলস',
    relatedTools: [
      { url: '/split-pdf/', text: 'PDF স্প্লিট করুন — বড় PDF থেকে পাতা আলাদা করুন' },
      {
        url: '/protect-pdf/',
        text: 'PDF পাসওয়ার্ড দিয়ে সুরক্ষিত করুন — অফলাইনে শক্তিশালী এনক্রিপশন',
      },
      { url: '/rotate-pdf/', text: 'PDF রোটেট করুন — উল্টো বা বাঁকা পাতা সোজা করুন' },
      {
        url: '/extract-pages-pdf/',
        text: 'PDF পাতা এক্সট্র্যাক্ট করুন — নির্দিষ্ট পাতাগুলো আলাদা করুন',
      },
    ],
  },
  de: {
    metaTitle: 'PDF zusammenfügen — Kostenlos PDFs kombinieren | PDFMinty',
    metaDescription:
      'Fügen Sie mehrere PDF-Dateien kostenlos und sicher direkt im Browser zusammen. 100% clientseitige Verarbeitung — keine Server-Uploads, maximale Privatsphäre.',
    h1: 'Kostenlos PDF-Dateien zusammenfügen — Mehrere PDFs online kombinieren (100% im Browser)',
    lead: 'Fügen Sie mehrere PDF-Dateien schnell, sicher und kostenlos direkt in Ihrem Webbrowser zu einem Dokument zusammen. Keine Installation erforderlich und Ihre vertraulichen Dokumente verlassen niemals Ihr Gerät.',
    guideTitle:
      'Der umfassende Leitfaden zum lokalen Zusammenfügen von PDFs (Speicherlimits, Reihenfolge & Standards)',
    guideLead:
      'Das Zusammenführen mehrerer unabhängiger PDF-Dateien zu einem einheitlichen Dokument gehört zu den häufigsten Aufgaben im geschäftlichen, juristischen und universitären Alltag. Herkömmliche Online-Dienste erfordern jedoch das Hochladen auf fremde Server, was erhebliche Sicherheitsrisiken für vertrauliche Verträge oder Finanzdaten birgt.',
    guideText:
      'Die PDF-Engine von PDFMinty arbeitet zu 100 % lokal in Ihrem Browser über kompiliertes WebAssembly. Nachfolgend finden Sie eine technische Übersicht darüber, wie die clientseitige Verarbeitung bis zu 50 Dateien und 150 MB meistert, Querverweistabellen und Seitenkataloge vereinheitlicht und maximale Datensicherheit gewährleistet.',
    scenariosTitle:
      'Wann sich das lokale Zusammenfügen von PDFs besonders lohnt: 3 Praxisszenarien',
    scenarios: [
      {
        label: '🏛️ Szenario A: Juristische Beweisführung',
        title: 'Gerichtsakten, Schriftsätze & Anlagen',
        desc: 'Rechtsanwälte und Notare fügen Schriftsätze, eidesstattliche Erklärungen und nummerierte Beweisdokumente zusammen, ohne das Anwaltsgeheimnis oder DSGVO-Vorgaben zu verletzen.',
      },
      {
        label: '💼 Szenario B: M&A Due Diligence',
        title: 'Unternehmensprüfungen & Finanzberichte',
        desc: 'Wirtschaftsprüfer und Investmentbanker bündeln Bilanzen, Steuererklärungen und vertrauliche Beteiligungsübersichten für vertrauliche Übernahmeprüfungen.',
      },
      {
        label: '🎓 Szenario C: Akademische Dossiers',
        title: 'Bewerbungen, Publikationen & Gutachten',
        desc: 'Wissenschaftler kombinieren Lebensläufe, Fachpublikationen, Ethikvoten und Empfehlungsschreiben zu einem konsistenten Gesamtdokument.',
      },
    ],
    underTheHoodTitle: 'So funktioniert das Zusammenfügen im Browser (Technische Funktionsweise)',
    underTheHoodIntro:
      'Gemäß der Spezifikation ISO 32000-1 ist das Zusammenführen von PDFs keineswegs ein einfaches Aneinanderhängen von Byte-Folgen. Jedes PDF besitzt einen eigenen Dokumentenkatalog, einen Seitenbaum (/Pages), indirekte Objektnummern und eine Querverweistabelle (xref).',
    underTheHoodSteps: [
      {
        title: 'Objekt-Reindizierung:',
        desc: 'Die WebAssembly-Engine vergibt für alle indirekten Objekte neue, eindeutige IDs, um Namenskonflikte der Quelldokumente zuverlässig auszuschließen.',
      },
      {
        title: 'Seitenbaum-Vereinheitlichung:',
        desc: 'Es wird ein neuer /Pages-Hauptbaum erzeugt, der die /Page-Referenzen aller Quelldokumente in das gemeinsame /Kids-Array überträgt.',
      },
      {
        title: 'Ressourcen-Zuordnung:',
        desc: 'Eingebettete Schriften, Vektoren und Farbprofile bleiben ohne Neukompilierung oder Qualitätsverlust 1:1 erhalten.',
      },
      {
        title: 'Trailer-Serialisierung:',
        desc: 'Eine saubere Querverweistabelle wird geschrieben und die finale Datei als clientseitiger Speicher-Blob für den Sofort-Download bereitgestellt.',
      },
    ],
    howToTitle: 'Schritt-für-Schritt-Anleitung: Große PDF-Dateien sicher zusammenfügen',
    howToSteps: [
      {
        title: 'Dateien lokal laden:',
        desc: "Klicken Sie auf 'Dateien auswählen' oder ziehen Sie bis zu 50 PDFs (max. 150 MB) in das Arbeitsfeld. Alle Daten landen direkt im RAM Ihres Geräts.",
      },
      {
        title: 'Reihenfolge anpassen:',
        desc: 'Nutzen Sie die Pfeilschaltflächen oder ziehen Sie die Karten, um die gewünschte Seitenabfolge exakt festzulegen.',
      },
      {
        title: 'Dateidetails prüfen:',
        desc: 'Überprüfen Sie Seitenzahlen und Dateigrößen in der Übersicht der ausgewählten Dokumente.',
      },
      {
        title: 'PDFs zusammenfügen:',
        desc: "Klicken Sie auf 'PDFs zusammenfügen'. Die Erstellung erfolgt lokal im Speicher in wenigen Millisekunden.",
      },
      {
        title: 'Sofort herunterladen:',
        desc: 'Speichern Sie das kombinierte Dokument direkt und ohne Umwege auf Ihrer lokalen Festplatte.',
      },
    ],
    comparisonTitle: 'Architekturvergleich: Methoden zum Zusammenfügen von PDFs',
    comparisonHeaders: {
      solution: 'Lösung',
      privacy: 'Datentransfer (Datenschutz)',
      limit: 'Kostenloses Limit',
      speed: 'Geschwindigkeit',
      install: 'Installation erforderlich',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty (In-Browser WASM)',
        privacy: '100% Client-Side (0 Bytes Upload)',
        limit: '50 Dateien / 150 MB',
        speed: 'Blitzschnell (Lokale CPU)',
        install: 'Keine (Webbrowser)',
      },
      {
        solution: 'Cloud-Dienste (iLovePDF / Smallpdf)',
        privacy: 'Dateien werden auf Server hochgeladen',
        limit: '2–5 Dateien (Bezahlschranke)',
        speed: 'Langsam (Upload- & Downloadzeit)',
        install: 'Keine',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: 'Lokaler Desktop',
        limit: 'Unbegrenzt',
        speed: 'Schnell',
        install: 'Kostenpflichtige Software (20€+/Monat)',
      },
      {
        solution: 'macOS Vorschau',
        privacy: 'Lokaler Desktop',
        limit: 'Manuelles Verschieben',
        speed: 'Moderat',
        install: 'Nur für Mac verfügbar',
      },
    ],
    whyTitle: 'Warum PDFMinty für das Zusammenfügen von PDFs wählen?',
    features: [
      {
        title: '100% Privatsphäre & DSGVO-konform:',
        desc: 'Alle Operationen werden lokal mit WebAssembly ausgeführt. Null Server-Uploads, maximale Datensicherheit.',
      },
      {
        title: 'Keine Beschränkungen oder Wasserzeichen:',
        desc: 'Völlig kostenlos ohne störende Markierungen, versteckte Abonnements oder Registrierungszwang.',
      },
      {
        title: 'Originalqualität bleibt erhalten:',
        desc: 'Scharfe Vektorgrafiken, lesbare Schriften und Farbprofile bleiben 1:1 intakt.',
      },
      {
        title: 'Offline nutzbar (PWA):',
        desc: 'Nach dem ersten Aufruf funktioniert das Werkzeug auch ohne aktive Internetverbindung im Flugmodus.',
      },
    ],
    faqTitle: 'Häufig gestellte technische Fragen (FAQ)',
    faqs: [
      {
        q: 'Warum gibt es ein Limit von 50 Dateien bzw. 150 MB, wenn alles lokal verarbeitet wird?',
        a: 'Die 150-MB-Grenze schützt mobile Browser wie Safari unter iOS oder Chrome unter Android vor Speicherüberlastung (Out-of-Memory-Abstürzen).',
      },
      {
        q: 'Was passiert bei unterschiedlichen Seitenformaten wie A4 und US Letter?',
        a: 'PDFMinty behält die nativen /MediaBox- und /CropBox-Dimensionen jeder Einzelseite bei. Seiten im Format Letter und A4 werden ohne Verzerrung kombiniert.',
      },
      {
        q: 'Verlieren vorhandene digitale Signaturen beim Zusammenfügen ihre Gültigkeit?',
        a: 'Ja. Kryptografische Signaturen (PAdES) werden bei jeder PDF-Strukturänderung ungültig. Sichtbare Stempel können zuvor mit unserem Flatten-Tool fixiert werden.',
      },
      {
        q: 'Können passwortgeschützte PDF-Dateien zusammengefügt werden?',
        a: 'Verschlüsselte Dateien mit Öffnungskennwort müssen zunächst mit unserem Entsperren-Tool entschlüsselt werden, bevor sie kombiniert werden können.',
      },
      {
        q: 'Werden meine Dateien auf Servern von PDFMinty zwischengespeichert?',
        a: 'Nein, zu keinem Zeitpunkt. PDFMinty ist eine rein statische Webanwendung. Sie können dies überprüfen, indem Sie Ihr WLAN nach dem Laden trennen.',
      },
    ],
    editorialNotice:
      'Redaktionell geprüft • Verifiziert vom PDFMinty-Architekturteam • ISO 32000-1 Konformitätsaudit.',
    relatedTitle: 'Weitere nützliche PDF-Tools',
    relatedTools: [
      { url: '/split-pdf/', text: 'PDF teilen — Seiten aus großen PDFs trennen' },
      { url: '/protect-pdf/', text: 'PDF mit Passwort schützen — Starke Offline-Verschlüsselung' },
      {
        url: '/rotate-pdf/',
        text: 'PDF drehen — Schiefe oder verkehrt herum liegende Seiten korrigieren',
      },
      {
        url: '/extract-pages-pdf/',
        text: 'PDF-Seiten extrahieren — Spezifische Einzelseiten speichern',
      },
    ],
  },
  es: {
    metaTitle: 'Unir PDF Gratis — Combinar Documentos PDF Online | PDFMinty',
    metaDescription:
      'Une varios archivos PDF gratis y de forma segura directamente en tu navegador. Procesamiento 100% local — sin subir archivos a ningún servidor.',
    h1: 'Unir archivos PDF gratis — Combinar múltiples documentos PDF online (100% en el navegador)',
    lead: 'Combina varios archivos PDF en un solo documento organizado de forma rápida, privada y gratuita. Sin necesidad de instalar software y sin que tus archivos salgan de tu dispositivo.',
    guideTitle:
      'Guía definitiva para unir archivos PDF localmente (Límites de memoria, orden y estándares)',
    guideLead:
      'Unir varios documentos PDF independientes en un único archivo es la tarea más recurrente en entornos legales, contables y académicos. Sin embargo, recurrir a convertidores en la nube implica subir datos a servidores desconocidos, exponiendo información confidencial y sufriendo lentitud en la carga.',
    guideText:
      'El motor de combinación de PDFMinty se ejecuta al 100% en tu navegador mediante WebAssembly. A continuación detallamos cómo la compilación local gestiona hasta 50 documentos y 150 MB sin sacrificar rendimiento, unificando catálogos de páginas y tablas de referencias cruzadas con total seguridad.',
    scenariosTitle: 'Cuándo utilizar la combinación local de PDF: 3 situaciones reales',
    scenarios: [
      {
        label: '🏛️ Escenario A: Ámbito jurídico y procesal',
        title: 'Escritos judiciales, alegatos y anexos',
        desc: 'Abogados y secretarios combinan demandas, declaraciones juradas y pruebas documentales numeradas sin vulnerar el secreto profesional ni normativas como el RGPD.',
      },
      {
        label: '💼 Escenario B: Due Diligence y finanzas',
        title: 'Auditorías contables y fusiones corporativas',
        desc: 'Banqueros y consultores consolidan balances de situación, declaraciones tributarias y cuadros de amortización para revisiones reservadas.',
      },
      {
        label: '🎓 Escenario C: Expedientes académicos',
        title: 'Tesis, artículos científicos y solicitudes',
        desc: 'Investigadores y graduados unifican currículums, publicaciones científicas, comités éticos y cartas de recomendación en un solo porfolio.',
      },
    ],
    underTheHoodTitle: 'Cómo funciona la unión de PDF en el navegador (Detalles técnicos)',
    underTheHoodIntro:
      'Bajo la especificación internacional ISO 32000-1, combinar PDF no es simplemente pegar flujos de bytes. Cada archivo cuenta con su propio catálogo raíz, árbol de páginas (/Pages), objetos indirectos y tabla de referencias cruzadas (xref):',
    underTheHoodSteps: [
      {
        title: 'Reindexación de objetos:',
        desc: 'El motor WebAssembly asigna identificadores numéricos únicos a cada objeto para evitar colisiones de nombres entre los distintos documentos.',
      },
      {
        title: 'Unificación del árbol de páginas:',
        desc: 'Se genera una nueva estructura raíz /Pages, transfiriendo los nodos hijos /Page de cada PDF al array maestro /Kids.',
      },
      {
        title: 'Asignación de diccionarios de recursos:',
        desc: 'Los subconjuntos de fuentes, gráficos vectoriales y espacios cromáticos se conservan íntegros sin rasterización.',
      },
      {
        title: 'Serialización del remolque (Trailer):',
        desc: 'Se escribe una nueva tabla xref uniforme y se genera un objeto Blob en memoria listo para su descarga inmediata.',
      },
    ],
    howToTitle: 'Guía paso a paso: Cómo unir archivos PDF grandes con total privacidad',
    howToSteps: [
      {
        title: 'Seleccionar archivos:',
        desc: "Haz clic en 'Seleccionar archivos' o arrastra hasta 50 documentos PDF (máximo 150 MB) a la zona de trabajo. Se leen directamente en la RAM.",
      },
      {
        title: 'Organizar el orden:',
        desc: 'Utiliza las flechas arriba/abajo o arrastra las tarjetas para definir el orden secuencial exacto de las páginas.',
      },
      {
        title: 'Revisar datos del lote:',
        desc: 'Comprueba el recuento de páginas y el peso de cada archivo mostrado en la pantalla.',
      },
      {
        title: 'Unir archivos:',
        desc: "Pulsa 'Unir PDFs'. El procesamiento se ejecuta en milisegundos sin transmitir ningún dato por la red.",
      },
      {
        title: 'Descargar al instante:',
        desc: 'Guarda tu nuevo documento PDF unificado de inmediato en el almacenamiento de tu equipo.',
      },
    ],
    comparisonTitle: 'Comparativa de arquitectura: Métodos para unir documentos PDF',
    comparisonHeaders: {
      solution: 'Método',
      privacy: 'Tránsito de datos (Privacidad)',
      limit: 'Límite gratuito',
      speed: 'Velocidad',
      install: 'Instalación requerida',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty (WASM en el navegador)',
        privacy: '100% Local (0 bytes subidos)',
        limit: '50 Archivos / 150 MB',
        speed: 'Instantáneo (CPU local)',
        install: 'Ninguna (Navegador)',
      },
      {
        solution: 'Convertidores en la nube (iLovePDF / Smallpdf)',
        privacy: 'Archivos enviados a servidores externos',
        limit: '2–5 Archivos (Límites de pago)',
        speed: 'Lento (Espera de subida/bajada)',
        install: 'Ninguna',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: 'Escritorio local',
        limit: 'Ilimitado',
        speed: 'Rápido',
        install: 'Software de pago (+20€/mes)',
      },
      {
        solution: 'macOS Vista Previa',
        privacy: 'Escritorio local',
        limit: 'Manual página a página',
        speed: 'Moderado',
        install: 'Exclusivo para Mac',
      },
    ],
    whyTitle: '¿Por qué elegir PDFMinty para unir PDFs?',
    features: [
      {
        title: 'Privacidad total garantizada:',
        desc: 'Procesamiento local seguro con WebAssembly. Cero subidas a la nube o servidores de terceros.',
      },
      {
        title: 'Sin límites ocultos ni marcas de agua:',
        desc: 'Herramienta 100% gratuita y sin logotipos añadidos a tus documentos.',
      },
      {
        title: 'Calidad intacta sin pérdidas:',
        desc: 'Mantiene la resolución de las imágenes, fuentes tipográficas y diseño original.',
      },
      {
        title: 'Funciona sin conexión (PWA):',
        desc: 'Una vez cargada la página, puedes unir archivos incluso en modo avión sin conexión a internet.',
      },
    ],
    faqTitle: 'Preguntas técnicas frecuentes (FAQ)',
    faqs: [
      {
        q: '¿Por qué existe un límite de 50 archivos o 150 MB si el proceso es local?',
        a: 'El umbral de 150 MB es una medida de seguridad orientada a evitar que los navegadores móviles (iOS Safari, Android Chrome) sufran cierres por falta de memoria RAM.',
      },
      {
        q: '¿Qué ocurre al unir páginas con diferentes dimensiones (ej. A4 y Carta estadounidense)?',
        a: 'PDFMinty respeta de forma individual las cajas /MediaBox y /CropBox de cada página, conservando sus medidas originales sin deformaciones.',
      },
      {
        q: '¿Pierden su validez las firmas digitales existentes al combinar los documentos?',
        a: 'Sí. Los estándares criptográficos (PAdES) invalidan las firmas electrónicas tras modificar la estructura del archivo. Si son visuales, recomendamos usar antes nuestra herramienta de Aplanar PDF.',
      },
      {
        q: '¿Se pueden unir documentos PDF protegidos con contraseña?',
        a: 'Los archivos con contraseña de apertura deben desbloquearse previamente mediante nuestra herramienta Desbloquear PDF antes de proceder a la unión.',
      },
      {
        q: '¿Se almacena alguna copia de mis archivos en los servidores de PDFMinty?',
        a: 'No, bajo ningún concepto. PDFMinty es una aplicación estática y sin servidor. Puedes comprobarlo desconectando el Wi-Fi tras cargar la web.',
      },
    ],
    editorialNotice:
      'Revisión editorial humana • Verificado por el equipo técnico de PDFMinty • Conforme a ISO 32000-1.',
    relatedTitle: 'Otras herramientas PDF útiles',
    relatedTools: [
      { url: '/split-pdf/', text: 'Dividir PDF — Separar páginas de un PDF extenso' },
      { url: '/protect-pdf/', text: 'Proteger PDF — Encriptar con contraseña sin conexión' },
      { url: '/rotate-pdf/', text: 'Rotar PDF — Enderezar páginas giradas o invertidas' },
      {
        url: '/extract-pages-pdf/',
        text: 'Extraer páginas — Guardar rangos de páginas seleccionadas',
      },
    ],
  },
  fr: {
    metaTitle: 'Fusionner PDF Gratuit — Combiner vos fichiers | PDFMinty',
    metaDescription:
      'Fusionnez plusieurs fichiers PDF gratuitement et en toute sécurité dans votre navigateur. Traitement 100% local — aucun téléversement, confidentialité totale.',
    h1: 'Fusionner des fichiers PDF gratuitement — Combiner plusieurs PDF en ligne (100% dans le navigateur)',
    lead: "Assemblez plusieurs documents PDF en un seul fichier structuré en quelques secondes. Simple, gratuit et strictement confidentiel : aucun fichier n'est téléversé sur un serveur.",
    guideTitle:
      'Guide complet pour fusionner des PDF localement (Limites de mémoire, ordre et normes)',
    guideLead:
      "Le regroupement de plusieurs documents PDF indépendants en un dossier unique représente l'opération bureautique la plus fréquente dans les secteurs juridique, financier et universitaire. Néanmoins, l'emploi de convertisseurs cloud traditionnels expose vos données sensibles et engendre des ralentissements lors des téléversements.",
    guideText:
      "Le moteur de fusion de PDFMinty fonctionne à 100 % localement dans votre navigateur grâce à la technologie WebAssembly. Découvrez ci-dessous comment cette architecture gère jusqu'à 50 documents et 150 Mo sans fuite de données, en consolidant arbres de pages et tables de références croisées.",
    scenariosTitle: "Quand privilégier la fusion PDF locale : 3 cas d'usage concrets",
    scenarios: [
      {
        label: "🏛️ Cas d'usage A : Procédures judiciaires",
        title: 'Dossiers de plaidoirie, conclusions et pièces',
        desc: 'Les avocats et auxiliaires de justice assemblent requêtes, attestations et pièces justificatives sans risque de violation du secret professionnel ni du RGPD.',
      },
      {
        label: "💼 Cas d'usage B : Audits d'entreprises et M&A",
        title: 'Due diligence et rapports financiers',
        desc: "Banquiers d'affaires et commissaires aux comptes compilent bilans, états fiscaux et tableaux de capitalisation pour des revues d'acquisition strictement confidentielles.",
      },
      {
        label: "🎓 Cas d'usage C : Portefeuilles académiques",
        title: 'Candidatures, publications et mémoires',
        desc: 'Chercheurs et doctorants unifient CV, articles scientifiques relus par des pairs, autorisations éthiques et lettres de recommandation en un seul recueil.',
      },
    ],
    underTheHoodTitle: 'Comment fonctionne la fusion PDF dans le navigateur (Aspects techniques)',
    underTheHoodIntro:
      "Conformément à la norme internationale ISO 32000-1, fusionner des documents ne se résume pas à juxtaposer des flux d'octets. Chaque PDF comporte son propre catalogue racine, son arbre de pages (/Pages), ses identifiants d'objets et sa table de références croisées (xref).",
    underTheHoodSteps: [
      {
        title: 'Réindexation des objets indirects :',
        desc: 'Le moteur WebAssembly attribue un nouvel identifiant numérique unique à chaque objet afin de prévenir tout conflit de noms.',
      },
      {
        title: "Consolidation de l'arbre des pages :",
        desc: "Une nouvelle racine /Pages est générée et intègre l'ensemble des sous-pages dans un tableau /Kids consolidé.",
      },
      {
        title: 'Conservation des dictionnaires de ressources :',
        desc: 'Les jeux de polices incorporées, tracés vectoriels et espaces colorimétriques sont maintenus sans aucune altération.',
      },
      {
        title: 'Sérialisation du bloc final (Trailer) :',
        desc: 'Une table xref unifiée est compilée et le document résultant est produit sous forme de Blob mémoire disponible immédiatement.',
      },
    ],
    howToTitle:
      'Guide étape par étape : Comment fusionner des fichiers PDF volumineux en toute confidentialité',
    howToSteps: [
      {
        title: 'Sélectionner les fichiers :',
        desc: "Cliquez sur 'Sélectionner des fichiers' ou glissez-déposez jusqu'à 50 documents PDF (150 Mo maximum au total). Les données sont lues dans la RAM.",
      },
      {
        title: "Organiser l'ordre :",
        desc: "Déplacez facilement les cartes à l'aide des poignées ou des flèches pour définir l'ordre chronologique exact.",
      },
      {
        title: 'Contrôler les métadonnées :',
        desc: 'Vérifiez le nombre de pages et le volume de chaque fichier directement sur les encarts.',
      },
      {
        title: 'Lancer la fusion :',
        desc: "Cliquez sur 'Fusionner les PDF'. L'assemblage s'exécute en quelques millisecondes sans aucune connexion externe.",
      },
      {
        title: 'Télécharger immédiatement :',
        desc: 'Enregistrez votre nouveau document unifié directement sur votre terminal de travail.',
      },
    ],
    comparisonTitle: "Comparatif d'architectures : Méthodes de fusion de documents PDF",
    comparisonHeaders: {
      solution: 'Solution',
      privacy: 'Transfert de données (Confidentialité)',
      limit: 'Limite gratuite',
      speed: "Vitesse d'exécution",
      install: 'Installation nécessaire',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty (WASM dans le navigateur)',
        privacy: '100% Local (0 octet téléversé)',
        limit: '50 Fichiers / 150 Mo',
        speed: 'Instantané (Processeur local)',
        install: 'Aucune (Navigateur Web)',
      },
      {
        solution: 'Convertisseurs Cloud (iLovePDF / Smallpdf)',
        privacy: 'Fichiers téléversés sur des serveurs tiers',
        limit: '2 à 5 fichiers (Plafonds payants)',
        speed: 'Lent (Attente transfert et calcul)',
        install: 'Aucune',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: 'Bureau local',
        limit: 'Illimité',
        speed: 'Rapide',
        install: 'Logiciel payant (dès 20€/mois)',
      },
      {
        solution: 'Aperçu macOS',
        privacy: 'Bureau local',
        limit: 'Glisser-déposer manuel',
        speed: 'Modéré',
        install: 'Réservé aux Mac',
      },
    ],
    whyTitle: 'Pourquoi choisir PDFMinty pour fusionner vos PDF ?',
    features: [
      {
        title: 'Confidentialité absolue et respect du RGPD :',
        desc: 'Traitement local via WebAssembly. Zéro transfert de données vers des serveurs distants ou des clouds tiers.',
      },
      {
        title: 'Sans filigrane ni frais cachés :',
        desc: 'Service entièrement gratuit, sans inscription obligatoire et sans ajout de logo promotionnel.',
      },
      {
        title: 'Préservation de la netteté originale :',
        desc: "Vos polices, graphismes et résolutions d'images d'origine restent préservés sans compression agressive.",
      },
      {
        title: 'Fonctionnement hors ligne autonome (PWA) :',
        desc: "Une fois ouvert, l'outil reste opérationnel même déconnecté d'Internet ou en mode avion.",
      },
    ],
    faqTitle: 'Foire aux questions techniques (FAQ)',
    faqs: [
      {
        q: 'Pourquoi limiter le traitement à 50 fichiers et 150 Mo si tout est local ?',
        a: 'Cette limite est un garde-fou destiné à prémunir les navigateurs pour smartphones (Safari iOS, Chrome Android) contre les plantages par dépassement de mémoire vive.',
      },
      {
        q: 'Que se passe-t-il si les pages possèdent des formats variés (ex. A4 et US Letter) ?',
        a: "PDFMinty respecte scrupuleusement les boîtes /MediaBox et /CropBox de chaque page sans mise à l'échelle forcée ni déformation.",
      },
      {
        q: 'Les signatures numériques préexistantes restent-elles valides après assemblage ?',
        a: 'Non. Selon les standards cryptographiques (PAdES), modifier la structure invalide les sommes de contrôle. Pour des signatures visuelles, nous vous conseillons de les figer avec notre outil Aplatir PDF.',
      },
      {
        q: 'Est-il possible de fusionner des PDF verrouillés par mot de passe ?',
        a: "Les documents protégés par mot de passe d'ouverture doivent préalablement être déverrouillés via notre outil Déverrouiller PDF.",
      },
      {
        q: 'Mes fichiers sont-ils mis en cache sur un serveur PDFMinty ?',
        a: "Absolument pas. PDFMinty est une application statique sans serveur. Vous pouvez l'éprouver en coupant votre connexion Wi-Fi pendant l'opération.",
      },
    ],
    editorialNotice:
      "Vérification éditoriale humaine • Validé par l'équipe d'ingénierie PDFMinty • Conforme ISO 32000-1.",
    relatedTitle: 'Autres outils PDF pratiques',
    relatedTools: [
      { url: '/split-pdf/', text: "Diviser un PDF — Séparer les pages d'un gros document" },
      { url: '/protect-pdf/', text: 'Protéger par mot de passe — Chiffrement fort hors ligne' },
      { url: '/rotate-pdf/', text: 'Pivoter un PDF — Redresser les pages inversées' },
      { url: '/extract-pages-pdf/', text: 'Extraire des pages — Isoler des sections précises' },
    ],
  },
  hi: {
    metaTitle: 'पीडीएफ मर्ज करें — मुफ़्त ऑनलाइन फाइलें जोड़ें | PDFMinty',
    metaDescription:
      'मुफ़्त में ऑनलाइन पीडीएफ फ़ाइलें मर्ज करें। ब्राउज़र में कई पीडीएफ सुरक्षित रूप से जोड़ें। कोई सर्वर अपलोड नहीं, आपकी फाइलें निजी रहती हैं।',
    h1: 'मुफ़्त में पीडीएफ फाइलें मर्ज करें — कई पीडीएफ एक साथ जोड़ें (१००% ब्राउज़र प्रोसेसिंग)',
    lead: 'ऑनलाइन मुफ़्त और सुरक्षित तरीके से कई पीडीएफ फाइलों को एक दस्तावेज़ में मिलाएं। किसी सॉफ्टवेयर को इंस्टॉल करने की आवश्यकता नहीं है और आपकी फाइलें कभी भी किसी रिमोट सर्वर पर अपलोड नहीं होती हैं।',
    guideTitle:
      'ब्राउज़र में स्थानीय रूप से पीडीएफ मर्ज करने की संपूर्ण गाइड (मेमोरी सीमाएं, अनुक्रम और मानक)',
    guideLead:
      'कानूनी, वित्तीय और शैक्षणिक कार्यों में अलग-अलग पीडीएफ दस्तावेजों को एक सुसंगत फाइल में जोड़ना सबसे आम आवश्यकता है। लेकिन पारंपरिक क्लाउड कन्वर्टर्स पर फाइलें अपलोड करने से गति धीमी होती है और गोपनीय अनुबंधों या वित्तीय दस्तावेजों के लीक होने का जोखिम रहता है।',
    guideText:
      'PDFMinty का पीडीएफ मर्जिंग इंजन WebAssembly के जरिए सीधे आपके ब्राउज़र में १००% स्थानीय रूप से काम करता है। नीचे इसका तकनीकी विवरण दिया गया है कि कैसे यह बिना इंटरनेट पर डेटा भेजे ५० फाइलों और १५० एमबी तक के दस्तावेजों को सुरक्षित रूप से जोड़ता है।',
    scenariosTitle: 'स्थानीय ब्राउज़र में पीडीएफ कब मर्ज करें: ३ व्यावहारिक उदाहरण',
    scenarios: [
      {
        label: '🏛️ परिदृश्य १: कानूनी दस्तावेज और साक्ष्य संकलन',
        title: 'अदालती याचिकाएं, हलफनामे और साक्ष्य',
        desc: 'अधिवक्ता और कानूनी सहायक मुवक्किल की गोपनीयता को बनाए रखते हुए मुकदमों, शपथपत्रों और साक्ष्यों को एक मास्टर फाइल में एकत्र कर सकते हैं।',
      },
      {
        label: '💼 परिदृश्य २: कॉर्पोरेट वित्तीय ऑडिट और विलय',
        title: 'वित्तीय समीक्षा और बैलेंस शीट',
        desc: 'चार्टर्ड एकाउंटेंट्स और निवेश विश्लेषक बैलेंस शीट, लाभ-हानि विवरण और कर रिपोर्टों को गोपनीय समीक्षा के लिए सुरक्षित रूप से संयोजित कर सकते हैं।',
      },
      {
        label: '🎓 परिदृश्य ३: शैक्षणिक और अनुसंधान पोर्टफोलियो',
        title: 'अनुसंधान पत्र, थीसिस और आवेदन पत्र',
        desc: 'शोधकर्ता और छात्र अपने बायोडाटा, शोध प्रकाशन, अनुमोदन पत्र और सिफारिश पत्रों को एक व्यवस्थित डोजियर में जोड़ सकते हैं।',
      },
    ],
    underTheHoodTitle: 'ब्राउज़र में पीडीएफ मर्ज कैसे काम करता है (तकनीकी कार्यप्रणाली)',
    underTheHoodIntro:
      'अंतर्राष्ट्रीय ISO 32000-1 पीडीएफ विनिर्देश के अनुसार, पीडीएफ फाइलों को जोड़ना केवल बाइट्स को आपस में चिपकाना नहीं है। प्रत्येक पीडीएफ में अपना रूट कैटलॉग, पेज ट्री (/Pages), अप्रत्यक्ष ऑब्जेक्ट्स और क्रॉस-रेफरेंस (xref) टेबल होती है।',
    underTheHoodSteps: [
      {
        title: 'ऑब्जेक्ट री-इंडेक्सिंग:',
        desc: 'फाइलों के ऑब्जेक्ट्स में कोई टकराव न हो, इसलिए WebAssembly इंजन प्रत्येक ऑब्जेक्ट को नए विशिष्ट नंबर प्रदान करता है।',
      },
      {
        title: 'पेज ट्री एकीकरण:',
        desc: 'इंजन एक नया मास्टर /Pages ट्री बनाता है और सभी फाइलों के पेजों को एक ही संयुक्त /Kids ऐरे में व्यवस्थित करता है।',
      },
      {
        title: 'संसाधन शब्दकोश मैपिंग:',
        desc: 'एम्बेडेड फोंट, वेक्टर ग्राफिक्स और रंग प्रोफाइल बिना किसी गिरावट के मूल रूप में सुरक्षित रखे जाते हैं।',
      },
      {
        title: 'ट्रेलर सीरियलाइजेशन:',
        desc: 'एक साफ नई क्रॉस-रेफरेंस टेबल लिखी जाती है और फाइल सीधे मेमोरी ब्लॉब के रूप में तत्काल डाउनलोड के लिए तैयार हो जाती है।',
      },
    ],
    howToTitle: 'कदम-दर-कदम गाइड: बड़ी पीडीएफ फाइलों को सुरक्षित रूप से कैसे मर्ज करें',
    howToSteps: [
      {
        title: 'फाइलें चुनें:',
        desc: "'फाइलें चुनें' बटन पर क्लिक करें या अधिकतम ५० पीडीएफ फाइलें (कुल १५० एमबी) ड्रैग और ड्रॉप करें। फाइलें सीधे आपके डिवाइस की रैम में लोड होती हैं।",
      },
      {
        title: 'क्रम व्यवस्थित करें:',
        desc: 'तख्तियों को ड्रैग करके या ऊपर/नीचे तीरों का उपयोग करके पेजों का सही क्रम निर्धारित करें।',
      },
      {
        title: 'दस्तावेज़ विवरण जांचें:',
        desc: 'कार्ड पर प्रदर्शित पेज संख्या और फाइल आकार की समीक्षा करें।',
      },
      {
        title: 'मर्ज बटन दबाएं:',
        desc: "'पीडीएफ मर्ज करें' पर क्लिक करें। प्रोसेसिंग बिना इंटरनेट पर डेटा भेजे मिलीसेकंड में पूरी हो जाती है।",
      },
      {
        title: 'तुरंत सहेजें:',
        desc: 'नई संयुक्त पीडीएफ फाइल सीधे अपने स्थानीय डिवाइस स्टोरेज में डाउनलोड करें।',
      },
    ],
    comparisonTitle: 'आर्किटेक्चर तुलना: पीडीएफ संयोजन की विभिन्न विधियां',
    comparisonHeaders: {
      solution: 'समाधान',
      privacy: 'डेटा गोपनीयता (ट्रांजिट)',
      limit: 'निःशुल्क सीमा',
      speed: 'प्रोसेसिंग गति',
      install: 'इंस्टॉलेशन आवश्यकता',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty (इन-ब्राउज़र WASM)',
        privacy: '१००% स्थानीय (० बाइट अपलोड)',
        limit: '५० फाइलें / १५० MB',
        speed: 'अति तीव्र (स्थानीय सीपीयू)',
        install: 'कोई नहीं (वेब ब्राउज़र)',
      },
      {
        solution: 'क्लाउड कन्वर्टर्स (iLovePDF / Smallpdf)',
        privacy: 'फाइलें सर्वर पर अपलोड होती हैं',
        limit: '२-५ फाइलें (सशुल्क सीमा)',
        speed: 'धीमी (अपलोड/डाउनलोड प्रतीक्षा)',
        install: 'कोई नहीं',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: 'स्थानीय डेस्कटॉप',
        limit: 'असीमित',
        speed: 'तेज',
        install: 'सशुल्क सॉफ्टवेयर (₹१५००+/माह)',
      },
      {
        solution: 'macOS Preview',
        privacy: 'स्थानीय डेस्कटॉप',
        limit: 'मैनुअल ड्रैग-एंड-ड्रॉप',
        speed: 'मध्यम',
        install: 'केवल मैक हेतु उपलब्ध',
      },
    ],
    whyTitle: 'पीडीएफ मर्ज करने के लिए PDFMinty क्यों चुनें?',
    features: [
      {
        title: '१००% स्थानीय गोपनीयता:',
        desc: 'वेबअसेम्बली के साथ फाइलें बिना सर्वर पर भेजे सीधे आपके डिवाइस पर सुरक्षित रूप से प्रोसेस होती हैं।',
      },
      {
        title: 'कोई सीमा या वॉटरमार्क नहीं:',
        desc: 'पूरी तरह से मुफ्त और बिना किसी प्रचार वॉटरमार्क या छिपे हुए सदस्यता शुल्क के।',
      },
      {
        title: 'मूल गुणवत्ता बरकरार:',
        desc: 'टेक्स्ट, एम्बेडेड फोंट और इमेज की गुणवत्ता मूल स्पष्टता में बनी रहती है।',
      },
      {
        title: 'ऑफलाइन कार्यक्षमता (PWA):',
        desc: 'एक बार लोड होने के बाद बिना सक्रिय इंटरनेट कनेक्शन के भी पूरी तरह काम करता है।',
      },
    ],
    faqTitle: 'अक्सर पूछे जाने वाले तकनीकी प्रश्न (FAQ)',
    faqs: [
      {
        q: 'यदि सब कुछ स्थानीय है, तो ५० फाइलों या १५० एमबी की सीमा क्यों है?',
        a: '१५० एमबी की सीमा मोबाइल ब्राउज़रों (जैसे सफारी और क्रोम) को मेमोरी की कमी (OOM) से क्रैश होने से बचाने के लिए रखी गई है।',
      },
      {
        q: 'अलग-अलग आकार के पेज (जैसे A4 और US Letter) जोड़ने पर क्या होता है?',
        a: 'PDFMinty प्रत्येक पेज के मूल /MediaBox आयामों को सुरक्षित रखता है। A4 और लेटर पेज बिना किसी विकृति के अपने सही आकार में रहते हैं।',
      },
      {
        q: 'क्या मर्ज करने से मौजूदा डिजिटल हस्ताक्षर अमान्य हो जाते हैं?',
        a: 'हाँ। क्रिप्टोग्राफिक मानकों (PAdES) के तहत संरचना बदलने पर डिजिटल हस्ताक्षर अमान्य हो जाते हैं। यदि हस्ताक्षर दृश्यमान हैं, तो पहले फ़्लैटन पीडीएफ टूल का उपयोग करें।',
      },
      {
        q: 'क्या पासवर्ड से सुरक्षित पीडीएफ फाइलों को मर्ज किया जा सकता है?',
        a: 'ओपन पासवर्ड वाली फाइलों को मर्ज करने से पहले हमारे अनलॉक पीडीएफ टूल से डिक्रिप्ट करना आवश्यक है।',
      },
      {
        q: 'क्या मेरी फाइलें PDFMinty के सर्वर पर सुरक्षित रखी जाती हैं?',
        a: 'नहीं, कभी भी नहीं। PDFMinty एक सर्वरलेस एप्लिकेशन है। आप इंटरनेट बंद करके भी फाइलें जोड़ सकते हैं।',
      },
    ],
    editorialNotice:
      'मानवीय समीक्षा द्वारा सत्यापित • PDFMinty आर्किटेक्चर टीम द्वारा प्रमाणित • ISO 32000-1 अनुपालन।',
    relatedTitle: 'अन्य उपयोगी पीडीएफ टूल्स',
    relatedTools: [
      { url: '/split-pdf/', text: 'पीडीएफ विभाजित करें — बड़ी फाइलों से पेज अलग करें' },
      { url: '/protect-pdf/', text: 'पासवर्ड से सुरक्षित करें — मजबूत ऑफलाइन एन्क्रिप्शन' },
      { url: '/rotate-pdf/', text: 'पीडीएफ घुमाएं — उल्टे पेजों को सीधा करें' },
      { url: '/extract-pages-pdf/', text: 'पेज निकालें — विशिष्ट पेजों को नई फाइल में सहेजें' },
    ],
  },
  zh: {
    metaTitle: '免费合并 PDF 文件 — 在线合并 PDF 文档 | PDFMinty',
    metaDescription:
      '免费在线合并 PDF 文件，支持拖拽排序并将多个 PDF 高速组合为一个完整文档。采用现代 WebAssembly 纯本地沙箱技术，零服务器上传，全方位守护隐私。无需注册、无水印、完全支持离线 PWA 使用。',
    h1: '免费合并 PDF 文件 — 在线将多个 PDF 组合为一个文档（100% 浏览器本地处理）',
    lead: 'PDFMinty 为您提供了一种全新且高度安全的专业 PDF 处理方式。传统在线合并工具通常需要将您的发票、合同、纳税申报表或医疗报告上传至未知云端服务器，存在严重的数据泄露风险。PDFMinty 完全颠覆了这一流程——所有文档解析与合并操作均在您设备本地的浏览器沙箱环境中执行，基于 WebAssembly 引擎毫秒级完成。',
    guideTitle: '本地安全合并 PDF 终极权威指南（内存配额、顺序控制与国际技术标准）',
    guideLead:
      '在企业法务、财务审计与学术研究领域，将多份各自独立的 PDF 文档整合为一份结构清晰的主案卷是最核心的高频需求。然而，依赖传统云端转换平台不仅会产生上传延迟，更在处理保密商务合同、税务申报表或企业财务报表时构成重大泄密风险。',
    guideText:
      'PDFMinty 采用先进的编译型 WebAssembly 引擎，全部合并逻辑 100% 在您本地浏览器标签页内执行。以下深入剖析客户端编译技术如何稳健承载多达 50 份文档与 150MB 总容量、如何无损重构交叉引用表与页面树目录，并保障多端设备运行流畅。',
    scenariosTitle: '何时应选择本地浏览器合并 PDF：3 大真实工作场景',
    scenarios: [
      {
        label: '🏛️ 场景一：司法诉讼与合规审计',
        title: '起诉状、宣誓书与带有贝茨编码的证据目录',
        desc: '律师与法务合规人员需要将答辩状、证据清单及公证文书汇总为单一递交案卷，全程杜绝向云端传输任何客户委托敏感材料。',
      },
      {
        label: '💼 场景二：企业并购与尽职调查',
        title: '资产负债表、税务申报表与资本结构表',
        desc: '投资银行家与注册会计师整合多季度财务报表、审计底稿与股权架构图，确保企业并购核心机密数据完全留在本地设备内。',
      },
      {
        label: '🎓 场景三：科研成果与学术答辩',
        title: '学术简历、同行评审论文与专家推荐信',
        desc: '高校学者与研究生将个人履历、高水平期刊录用函、学术伦理审批及专家评阅意见汇总为结构标准的申报评审材料。',
      },
    ],
    underTheHoodTitle: '浏览器本地合并底层运行机制（ISO 32000-1 技术解析）',
    underTheHoodIntro:
      '根据国际 ISO 32000-1 PDF 技术规范，合并文档绝非简单的底层原始字节拼接。每份独立的 PDF 都拥有自闭环的文档根目录（Catalog）、页面树结构（/Pages Tree）、间接对象索引编号以及交叉引用表（xref Table）：',
    underTheHoodSteps: [
      {
        title: '间接对象重新编号索引（Object Re-indexing）：',
        desc: 'WebAssembly 引擎为各文件中的所有间接对象分配全新的全局唯一 ID，彻底杜绝多份输入文档间的命名空间冲突。',
      },
      {
        title: '页面树统一整合（Page Tree Unification）：',
        desc: '引擎构建全新的顶级主 /Pages 树状节点，将各子文件的页面对象引用规范化汇入合并后的 /Kids 数组。',
      },
      {
        title: '资源字典保真映射（Resource Dictionary Mapping）：',
        desc: '内嵌字体子集、矢量图元和专业色彩空间在无栅格化重压缩的情况下无损映射到目标页。',
      },
      {
        title: '尾部信息序列化（Trailer Serialization）：',
        desc: '重新生成精准统一的 xref 索引表，并在设备内存中直接组装生成 Blob 二进制数据块供用户即时保存。',
      },
    ],
    howToTitle: '分步图文指南：如何在本地安全批量合并大型 PDF 文件',
    howToSteps: [
      {
        title: '本地选择文档：',
        desc: '点击“选择文件”按钮或直接将最多 50 份 PDF（总计上限 150MB）拖入虚线操作区，数据直接读入本机内存。',
      },
      {
        title: '自由排列次序：',
        desc: '通过上下箭头微调或卡片直观拖拽，自由规划目标文档中各页面的前后次序。',
      },
      {
        title: '核对批处理属性：',
        desc: '查看卡片上展示的各文件页码总数与文档体量，确认无误。',
      },
      {
        title: '一键本地极速合并：',
        desc: '点击“合并 PDF”按钮，无需漫长的网络上传等待，毫秒内完成文档编译。',
      },
      {
        title: '即刻保存至设备：',
        desc: '合并完成后直接下载新生成的文件，矢量图与原始文本排版均完美保留。',
      },
    ],
    comparisonTitle: '技术架构全景对比：不同 PDF 合并处理方案',
    comparisonHeaders: {
      solution: '合并解决方案',
      privacy: '数据流向（隐私保障）',
      limit: '免费批处理上限',
      speed: '处理耗时与性能',
      install: '是否需要安装软件',
    },
    comparisonRows: [
      {
        solution: 'PDFMinty（浏览器内 WASM）',
        privacy: '100% 本地处理（0 字节上传）',
        limit: '50 份文件 / 150 MB',
        speed: '毫秒级瞬时完成（调用本地 CPU）',
        install: '无需安装（任意现代浏览器）',
      },
      {
        solution: '云端平台（iLovePDF / Smallpdf）',
        privacy: '文件需上传至第三方远程服务器',
        limit: '2–5 份文件（强制付费拦截）',
        speed: '缓慢（受制于网络上下行）',
        install: '无需安装',
      },
      {
        solution: 'Adobe Acrobat Pro',
        privacy: '本地桌面运行',
        limit: '无限制',
        speed: '快速',
        install: '需付费订阅（月费超 150 元）',
      },
      {
        solution: 'macOS 预览（Preview）',
        privacy: '本地桌面运行',
        limit: '需逐页手动拖放拼接',
        speed: '中等',
        install: '仅支持苹果 Mac 操作系统',
      },
    ],
    whyTitle: '为什么选择 PDFMinty 合并 PDF？',
    features: [
      {
        title: '100% 客户端隐私安全（零服务器上传）：',
        desc: '所有 PDF 处理均在您本地设备的 CPU 与浏览器沙箱内存中完成，数据绝不经过任何外部服务器。',
      },
      {
        title: '真正永久免费且无水印干扰：',
        desc: '无需注册登录账号，无隐藏订阅收费，绝不在您的文档中强行嵌入任何宣传水印或页脚徽标。',
      },
      {
        title: '极速本地处理与无损高品质：',
        desc: '依托现代 WebAssembly 底层优化技术，合并大文件无需等待网络，原生保留原始 PDF 的字体、矢量图与分辨率。',
      },
      {
        title: '纯离线运行与 PWA 渐进式应用支持：',
        desc: '支持安装为渐进式 Web 应用（PWA），页面缓存后即使在无网络离线环境下，依然能够顺畅合并文档。',
      },
    ],
    faqTitle: '深度技术解答与常见疑难排查 (FAQ)',
    faqs: [
      {
        q: '既然是纯本地处理，为什么设置 50 份文件或 150MB 的容量上限？',
        a: '150MB 的安全上限是专为移动端浏览器（如 iOS Safari 和 Android Chrome）设计的保护机制，可有效避免因内存消耗过大（OOM）导致浏览器标签页崩溃自动刷新。',
      },
      {
        q: '当合并不同纸张尺寸（如 A4 与美标 Letter）的文档时会发生什么？',
        a: 'PDFMinty 独立保留每个页面的原始 /MediaBox 与 /CropBox 尺寸定义，Letter 页面保持 8.5x11 英寸，A4 保持 210x297 毫米，绝不产生非对称拉伸或失真。',
      },
      {
        q: '合并操作是否会使文档上原本存在的电子签名失效？',
        a: '是的。根据 PKCS#7 / PAdES 等密码学数字签名标准，重构 PDF 字节结构会破坏防篡改校验和。若只需保留视觉外观签名，请在合并前先使用我们的“拼合 PDF”工具将图章永久写入页面内容流。',
      },
      {
        q: '能否直接合并受到密码保护或已加密的 PDF 文件？',
        a: '带有开启密码的加密文档必须先解密方可合并。请先使用我们的“解锁 PDF”工具解除密码限制，未加密及仅受打印权限限制的文件可直接合并。',
      },
      {
        q: '我的文件是否会在 PDFMinty 的服务器上存在任何形式的缓存？',
        a: '绝无可能。PDFMinty 是纯静态无服务器架构应用，所有运算均隔离在您当前设备的内容堆栈中。您可以在页面加载后完全断开网络或开启飞行模式进行验证。',
      },
    ],
    editorialNotice:
      '人工同行评审与技术审校 • 由 PDFMinty 核心架构团队验证 • 严格遵循 ISO 32000-1 规范。',
    relatedTitle: '其他常用 PDF 工具',
    relatedTools: [
      { url: '/split-pdf/', text: '拆分 PDF — 从大文件中分离页面' },
      { url: '/protect-pdf/', text: 'PDF 密码保护 — 强力离线加密' },
      { url: '/rotate-pdf/', text: '旋转 PDF — 纠正倒置或倾斜的页面' },
      { url: '/extract-pages-pdf/', text: '提取 PDF 页面 — 导出选定页面为新文件' },
    ],
  },
};

/**
 * Builds the complete semantic HTML article for a localized merge-pdf page,
 * ensuring 100% parity with the English version (7 H2s, 3 scenarios, 4 under-the-hood steps,
 * 5 how-to steps, architecture comparison table, 5 comprehensive technical FAQs, and editorial box).
 */
export function buildLocalizedMergePdfHtml(data: LocalizedMergePdfData, _locale: string): string {
  const stepsHtml = data.howToSteps
    .map((s, idx) => `            <li><strong>${idx + 1}. ${s.title}</strong> ${s.desc}</li>`)
    .join('\n');

  const scenariosHtml = data.scenarios
    .map(
      (
        sc
      ) => `          <div class="p-5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">${sc.label}</span>
            <h4 class="text-base font-bold text-slate-900 dark:text-white m-0">${sc.title}</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">${sc.desc}</p>
          </div>`
    )
    .join('\n');

  const underTheHoodHtml = data.underTheHoodSteps
    .map((st) => `            <li><strong>${st.title}</strong> ${st.desc}</li>`)
    .join('\n');

  const comparisonRowsHtml = data.comparisonRows
    .map(
      (row) => `            <tr>
              <td class="p-3 font-semibold">${row.solution}</td>
              <td class="p-3 ${row.privacy.includes('100%') ? 'text-emerald-600 font-bold' : ''}">${row.privacy}</td>
              <td class="p-3">${row.limit}</td>
              <td class="p-3">${row.speed}</td>
              <td class="p-3">${row.install}</td>
            </tr>`
    )
    .join('\n');

  const featuresHtml = data.features
    .map((f) => `            <li><strong>${f.title}</strong> ${f.desc}</li>`)
    .join('\n');

  const faqsHtml = data.faqs
    .map(
      (faq) => `          <div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-1">${faq.q}</h4>
            <p class="text-sm text-slate-600 dark:text-slate-300">${faq.a}</p>
          </div>`
    )
    .join('\n');

  const relatedHtml = data.relatedTools
    .map((t) => `            <li><a href="${t.url}">${t.text}</a></li>`)
    .join('\n');

  return `        <article class="prose max-w-4xl mx-auto py-12 px-6 dark:prose-invert font-sans" id="static-pre-render-container">
          <h1>${data.h1}</h1>
          <p class="lead text-lg font-medium text-slate-700 dark:text-slate-300">
            ${data.lead}
          </p>

          <h2>${data.guideTitle}</h2>
          <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            ${data.guideLead}
          </p>
          <p>
            ${data.guideText}
          </p>

          <h2>${data.scenariosTitle}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
${scenariosHtml}
          </div>

          <h2>${data.underTheHoodTitle}</h2>
          <p>
            ${data.underTheHoodIntro}
          </p>
          <ol class="space-y-2 my-4">
${underTheHoodHtml}
          </ol>

          <h2>${data.howToTitle}</h2>
          <ol class="space-y-3 my-4">
${stepsHtml}
          </ol>

          <h2>${data.comparisonTitle}</h2>
          <div class="overflow-x-auto my-6">
            <table class="min-w-full text-xs text-left border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <thead class="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold">
                <tr>
                  <th class="p-3 border-b border-slate-200 dark:border-zinc-700">${data.comparisonHeaders.solution}</th>
                  <th class="p-3 border-b border-slate-200 dark:border-zinc-700">${data.comparisonHeaders.privacy}</th>
                  <th class="p-3 border-b border-slate-200 dark:border-zinc-700">${data.comparisonHeaders.limit}</th>
                  <th class="p-3 border-b border-slate-200 dark:border-zinc-700">${data.comparisonHeaders.speed}</th>
                  <th class="p-3 border-b border-slate-200 dark:border-zinc-700">${data.comparisonHeaders.install}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-zinc-800 text-slate-700 dark:text-slate-300">
${comparisonRowsHtml}
              </tbody>
            </table>
          </div>

          <h2>${data.whyTitle}</h2>
          <ul class="space-y-2 my-4">
${featuresHtml}
          </ul>

          <h2>${data.faqTitle}</h2>
          <div class="space-y-4 my-6">
${faqsHtml}
          </div>

          <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl my-6 text-xs text-emerald-800 dark:text-emerald-300">
            <strong>${data.editorialNotice}</strong>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3>${data.relatedTitle}</h3>
            <ul>
${relatedHtml}
            </ul>
          </div>
        </article>`;
}
