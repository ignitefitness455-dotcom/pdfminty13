import json

en_tools = {
  "edit-pdf-metadata": { "name": "Edit Metadata", "desc": "Edit author, title, and invisible tracking properties" },
  "sanitize-pdf": { "name": "Sanitize PDF", "desc": "Strip hidden metadata and potential trackers permanently" },
  "merge-pdf": { "name": "Merge PDF", "desc": "Combine multiple PDF documents into a single file" },
  "split-pdf": { "name": "Split PDF", "desc": "Extract individual pages or split into multiple documents" },
  "rotate-pdf": { "name": "Rotate PDF", "desc": "Rotate specific pages or entire documents instantly" },
  "delete-pages-pdf": { "name": "Delete Pages", "desc": "Remove unwanted pages from your document" },
  "extract-pages-pdf": { "name": "Extract PDF Pages", "desc": "Extract selected pages into a new PDF document" },
  "reorder-pdf": { "name": "Reorder PDF Pages", "desc": "Rearrange page sequence with visual drag-and-drop" },
  "watermark-pdf": { "name": "Watermark PDF", "desc": "Add text overlays and stamps to protect your documents" },
  "add-page-numbers": { "name": "Page Numbers", "desc": "Add sequential page numbers to document margins" },
  "add-blank-page": { "name": "Add Blank Page", "desc": "Insert blank pages anywhere in your document structure" },
  "protect-pdf": { "name": "Protect PDF", "desc": "Add a password to restrict opening or editing" },
  "unlock-pdf": { "name": "Unlock PDF", "desc": "Remove password protection from encrypted documents" },
  "image-to-pdf": { "name": "Image to PDF", "desc": "Convert JPG, PNG, and WebP images into a PDF file" },
  "pdf-to-image": { "name": "PDF to Image", "desc": "Extract PDF pages into high-quality JPG or PNG images" },
  "pdf-to-markdown": { "name": "PDF to Markdown", "desc": "Convert PDF text into clean Markdown format locally" },
  "ai-analyze-pdf": { "name": "AI Analyze", "desc": "Use AI to summarize, extract data, and query documents" },
  "grayscale-pdf": { "name": "Grayscale PDF", "desc": "Convert color PDFs to black and white for easy printing" },
  "flatten-pdf": { "name": "Flatten PDF", "desc": "Merge form fields and annotations into static document content" },
  "repair-pdf": { "name": "Repair PDF", "desc": "Attempt to recover and rebuild corrupted or broken PDF files" },
  "sign-pdf": { "name": "Sign PDF", "desc": "Add electronic signatures to your PDF securely" },
  "ocr-pdf": { "name": "OCR PDF", "desc": "Extract text from scanned PDFs using Optical Character Recognition" }
}

bn_tools = {
  "edit-pdf-metadata": { "name": "মেটাডেটা এডিট", "desc": "অথর, টাইটেল এবং লুকানো ট্র্যাকিং প্রপার্টি পরিবর্তন করুন" },
  "sanitize-pdf": { "name": "পিডিএফ স্যানিটাইজ", "desc": "স্থায়ীভাবে লুকানো মেটাডেটা এবং সম্ভাব্য ট্র্যাকার মুছে ফেলুন" },
  "merge-pdf": { "name": "পিডিএফ মার্জ", "desc": "একাধিক পিডিএফ ডকুমেন্ট একটি ফাইলে একত্রিত করুন" },
  "split-pdf": { "name": "পিডিএফ স্লিট", "desc": "আলাদা পেজ বের করুন বা একাধিক ডকুমেন্টে ভাগ করুন" },
  "rotate-pdf": { "name": "পিডিএফ রোটেট", "desc": "নির্দিষ্ট পেজ বা পুরো ডকুমেন্ট তাৎক্ষণিকভাবে ঘুরান" },
  "delete-pages-pdf": { "name": "পেজ ডিলিট", "desc": "ডকুমেন্ট থেকে অপ্রয়োজনীয় পেজ মুছে ফেলুন" },
  "extract-pages-pdf": { "name": "পিডিএফ পেজ এক্সট্রাক্ট", "desc": "নির্বাচিত পেজগুলো বের করে নতুন পিডিএফ তৈরি করুন" },
  "reorder-pdf": { "name": "পেজ রি-অর্ডার", "desc": "ড্র্যাগ অ্যান্ড ড্রপের মাধ্যমে পেজ সিকোয়েন্স পরিবর্তন করুন" },
  "watermark-pdf": { "name": "পিডিএফ ওয়াটারমার্ক", "desc": "ডকুমেন্ট সুরক্ষিত করতে টেক্সট বা স্ট্যাম্প যুক্ত করুন" },
  "add-page-numbers": { "name": "পেজ নাম্বার", "desc": "ডকুমেন্টের মার্জিনে ক্রমানুসারে পেজ নম্বর যুক্ত করুন" },
  "add-blank-page": { "name": "ব্ল্যাংক পেজ যুক্ত করুন", "desc": "আপনার ডকুমেন্টের যে কোনো স্থানে ফাঁকা পেজ ইনসার্ট করুন" },
  "protect-pdf": { "name": "পিডিএফ প্রোটেক্ট", "desc": "খোলার বা সম্পাদনার জন্য পাসওয়ার্ড দিয়ে সুরক্ষিত করুন" },
  "unlock-pdf": { "name": "পিডিএফ আনলক", "desc": "এনক্রিপ্ট করা ডকুমেন্ট থেকে পাসওয়ার্ড সুরক্ষা সরান" },
  "image-to-pdf": { "name": "ইমেজ থেকে পিডিএফ", "desc": "JPG, PNG এবং WebP ছবিকে পিডিএফ ফাইলে রূপান্তর করুন" },
  "pdf-to-image": { "name": "পিডিএফ থেকে ইমেজ", "desc": "উচ্চমানের JPG বা PNG ছবিতে পিডিএফ পেজগুলো রূপান্তর করুন" },
  "pdf-to-markdown": { "name": "পিডিএফ থেকে মার্কডাউন", "desc": "লোকালি পিডিএফ টেক্সটকে মার্কডাউন ফরম্যাটে রূপান্তর করুন" },
  "ai-analyze-pdf": { "name": "এআই অ্যানালাইজ", "desc": "সারসংক্ষেপ, ডেটা এক্সট্রাক্ট এবং প্রশ্নোত্তরের জন্য এআই ব্যবহার করুন" },
  "grayscale-pdf": { "name": "গ্রেস্কেল পিডিএফ", "desc": "প্রিন্টিংয়ের সুবিধার্থে রঙিন পিডিএফকে সাদাকালোতে রূপান্তর করুন" },
  "flatten-pdf": { "name": "পিডিএফ ফ্ল্যাটেন", "desc": "ফর্ম ফিল্ড ও টীকাকে ডকুমেন্টের স্ট্যাটিক কন্টেন্টে রূপান্তর করুন" },
  "repair-pdf": { "name": "পিডিএফ মেরামত", "desc": "নষ্ট বা ত্রুটিপূর্ণ পিডিএফ ফাইল পুনরুদ্ধার করার চেষ্টা করুন" },
  "sign-pdf": { "name": "পিডিএফ সিগনেচার", "desc": "পিডিএফে নিরাপদে আপনার ইলেকট্রনিক স্বাক্ষর যুক্ত করুন" },
  "ocr-pdf": { "name": "ও.সি.আর পিডিএফ", "desc": "অপটিক্যাল ক্যারেক্টার রিকগনিশন ব্যবহার করে স্ক্যান করা পিডিএফ থেকে টেক্সট বের করুন" }
}

de_tools = {
  "edit-pdf-metadata": { "name": "Metadaten bearbeiten", "desc": "Autor, Titel und unsichtbare Tracking-Eigenschaften ändern" },
  "sanitize-pdf": { "name": "PDF bereinigen", "desc": "Versteckte Metadaten und mögliche Tracker dauerhaft entfernen" },
  "merge-pdf": { "name": "PDF zusammenführen", "desc": "Mehrere PDF-Dokumente zu einer Datei kombinieren" },
  "split-pdf": { "name": "PDF teilen", "desc": "Einzelne Seiten extrahieren oder in mehrere Dokumente aufteilen" },
  "rotate-pdf": { "name": "PDF drehen", "desc": "Bestimmte Seiten oder ganze Dokumente sofort drehen" },
  "delete-pages-pdf": { "name": "Seiten löschen", "desc": "Unerwünschte Seiten aus Ihrem Dokument entfernen" },
  "extract-pages-pdf": { "name": "PDF-Seiten extrahieren", "desc": "Ausgewählte Seiten in ein neues PDF-Dokument extrahieren" },
  "reorder-pdf": { "name": "PDF-Seiten neu anordnen", "desc": "Seitenreihenfolge per Drag-and-Drop visuell anpassen" },
  "watermark-pdf": { "name": "PDF-Wasserzeichen", "desc": "Textüberlagerungen und Stempel hinzufügen, um Dokumente zu schützen" },
  "add-page-numbers": { "name": "Seitenzahlen", "desc": "Fortlaufende Seitenzahlen an den Dokumenträndern hinzufügen" },
  "add-blank-page": { "name": "Leere Seite hinzufügen", "desc": "Fügen Sie leere Seiten an einer beliebigen Stelle ein" },
  "protect-pdf": { "name": "PDF schützen", "desc": "Fügen Sie ein Passwort hinzu, um das Öffnen oder Bearbeiten einzuschränken" },
  "unlock-pdf": { "name": "PDF entsperren", "desc": "Passwortschutz von verschlüsselten Dokumenten entfernen" },
  "image-to-pdf": { "name": "Bild zu PDF", "desc": "Konvertieren Sie JPG, PNG und WebP-Bilder in eine PDF-Datei" },
  "pdf-to-image": { "name": "PDF zu Bild", "desc": "Extrahieren Sie PDF-Seiten in hochwertige JPG- oder PNG-Bilder" },
  "pdf-to-markdown": { "name": "PDF zu Markdown", "desc": "Konvertieren Sie PDF-Text lokal in ein sauberes Markdown-Format" },
  "ai-analyze-pdf": { "name": "KI-Analyse", "desc": "Nutzen Sie KI, um Dokumente zusammenzufassen und Daten zu extrahieren" },
  "grayscale-pdf": { "name": "Graustufen-PDF", "desc": "Konvertieren Sie farbige PDFs für einfaches Drucken in Schwarzweiß" },
  "flatten-pdf": { "name": "PDF glätten", "desc": "Führen Sie Formularfelder und Anmerkungen zu statischen Inhalten zusammen" },
  "repair-pdf": { "name": "PDF reparieren", "desc": "Versuchen Sie, beschädigte oder fehlerhafte PDF-Dateien wiederherzustellen" },
  "sign-pdf": { "name": "PDF unterschreiben", "desc": "Fügen Sie Ihrem PDF sicher elektronische Signaturen hinzu" },
  "ocr-pdf": { "name": "OCR-PDF", "desc": "Extrahieren Sie Text aus gescannten PDFs mithilfe von OCR" }
}

def update_json(filepath, lang_tools):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "tools" not in data:
        data["tools"] = {}
    
    data["tools"].update(lang_tools)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json('src/locales/en/common.json', en_tools)
update_json('src/locales/bn/common.json', bn_tools)
update_json('src/locales/de/common.json', de_tools)

print("Tool names and descriptions updated in JSON.")
