import json

def update_json(filepath, new_keys):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # insert before "blog" if possible, or just add at the end
    data.update(new_keys)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_keys = {
  "extractPages": {
    "previewWarning": "Previews could not be rendered, but you can still run extraction using standard page parameters.",
    "selectOnePage": "Please select at least one page to extract.",
    "extractError": "Failed to extract selected pages from the document.",
    "selectPagesTitle": "Select Pages for Extraction",
    "selectAll": "Select All",
    "clearAll": "Clear All",
    "loadingPages": "Loading document pages structure...",
    "couldNotExtract": "Could not extract individual page views for this document type.",
    "configTitle": "Extraction Config",
    "extractingButton": "Extracting Pages...",
    "extractButton": "Extract Pages",
    "successTitle": "Pages Extracted Successfully! Your custom PDF has been generated.",
    "downloadExtracted": "Download Extracted PDF",
    "emptyTitle": "Upload a PDF to extract pages",
    "emptyDesc": "Select a document above to view page thumbnails and cherry-pick specific pages to extract."
  },
  "reorderPdf": {
    "previewWarning": "Error generating page layouts. You can still confirm standard sequencing if required.",
    "provideValidSequence": "Please provide a valid page sequence containing all original pages. e.g. 3, 1, 2",
    "parseError": "Failed to parse order input.",
    "missingPages": "Your sequence is missing some original pages. Required total: {{total}}.",
    "reorderError": "An unexpected error occurred while reordering the PDF.",
    "arrangeElements": "Arrange PDF Page Elements",
    "resetOrder": "Reset Order",
    "manualSequence": "Manual Page Sequence",
    "applyOrder": "Apply Order",
    "renderingPages": "Rendering pages for workspace drag grids...",
    "addFilePrompt": "Add a file above to begin ordering.",
    "layoutSummary": "Layout Summary",
    "outputMatrix": "Output Ordering Matrix",
    "processingButton": "Reordering Assembling...",
    "reorderSaveButton": "Reorder and Save PDF",
    "successTitle": "Pages Reordered Successfully! Your custom PDF is ready.",
    "downloadReordered": "Download Reordered PDF",
    "emptyTitle": "Upload a PDF to reorder pages",
    "emptyDesc": "Select a document above to drag, drop, and rearrange your PDF page order."
  }
}

bn_keys = {
  "extractPages": {
    "previewWarning": "প্রিভিউ লোড করা যায়নি, তবে আপনি নিচের ইনপুট বক্সে পৃষ্ঠা নম্বর লিখে এক্সট্রাক্ট করতে পারেন।",
    "selectOnePage": "এক্সট্রাক্ট করার জন্য অন্তত একটি পৃষ্ঠা নির্বাচন করুন।",
    "extractError": "ডকুমেন্ট থেকে নির্বাচিত পৃষ্ঠাগুলো এক্সট্রাক্ট করতে ব্যর্থ হয়েছে।",
    "selectPagesTitle": "এক্সট্রাক্ট করার জন্য পৃষ্ঠা নির্বাচন করুন",
    "selectAll": "সব নির্বাচন করুন",
    "clearAll": "সবগুলো মুছে ফেলুন",
    "loadingPages": "ডকুমেন্টের পৃষ্ঠা ও প্রিভিউ লোড হচ্ছে...",
    "couldNotExtract": "এই ডকুমেন্টের জন্য আলাদাভাবে পৃষ্ঠার প্রিভিউ লোড করা সম্ভব হয়নি।",
    "configTitle": "এক্সট্রাকশন সেটিংস",
    "extractingButton": "পৃষ্ঠা এক্সট্রাক্ট করা হচ্ছে...",
    "extractButton": "পৃষ্ঠা এক্সট্রাক্ট করুন",
    "successTitle": "পৃষ্ঠা সফলভাবে এক্সট্রাক্ট করা হয়েছে! আপনার নতুন পিডিএফ প্রস্তুত।",
    "downloadExtracted": "এক্সট্রাক্ট করা পিডিএফ ডাউনলোড করুন",
    "emptyTitle": "পেজ এক্সট্রাক্ট করতে পিডিএফ আপলোড করুন",
    "emptyDesc": "উপরে আপনার ফাইল আপলোড করুন এবং প্রিভিউ থেকে নির্দিষ্ট পৃষ্ঠা নির্বাচন করে আলাদা করুন।"
  },
  "reorderPdf": {
    "previewWarning": "পৃষ্ঠার প্রিভিউ তৈরি করতে সমস্যা হয়েছে। তবে আপনি এখনও নিচে ম্যানুয়ালি পৃষ্ঠাগুলোর ক্রম ঠিক করতে পারেন।",
    "provideValidSequence": "অনুগ্রহ করে একটি সঠিক পৃষ্ঠার ক্রম (sequence) প্রদান করুন। যেমন: 3, 1, 2",
    "parseError": "ইনপুট করা ক্রমটি পড়া যাচ্ছে না।",
    "missingPages": "আপনার পৃষ্ঠার ক্রমে কিছু মূল পৃষ্ঠা বাদ পড়েছে। প্রয়োজনীয় মোট পৃষ্ঠা: {{total}}।",
    "reorderError": "পিডিএফের পৃষ্ঠাগুলোর ক্রম পরিবর্তন করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।",
    "arrangeElements": "পিডিএফের পৃষ্ঠাগুলো সাজান",
    "resetOrder": "ক্রম রিসেট করুন",
    "manualSequence": "ম্যানুয়ালি পৃষ্ঠা ক্রম নির্ধারণ",
    "applyOrder": "ক্রম প্রয়োগ করুন",
    "renderingPages": "প্রিভিউ গ্রিডের জন্য পৃষ্ঠাগুলো প্রস্তুত করা হচ্ছে...",
    "addFilePrompt": "ক্রম ঠিক করা শুরু করতে উপরে একটি ফাইল আপলোড করুন।",
    "layoutSummary": "লেআউট সামারি",
    "outputMatrix": "আউটপুট অর্ডারিং ম্যাট্রিক্স (ক্রম)",
    "processingButton": "পৃষ্ঠাগুলো সাজানো হচ্ছে...",
    "reorderSaveButton": "পুনরায় সাজান ও সেভ করুন",
    "successTitle": "সফলভাবে পৃষ্ঠাগুলোর ক্রম পরিবর্তন করা হয়েছে! আপনার পিডিএফ প্রস্তুত।",
    "downloadReordered": "সাজানো পিডিএফ ডাউনলোড করুন",
    "emptyTitle": "পিডিএফের পৃষ্ঠা সাজাতে ফাইল আপলোড করুন",
    "emptyDesc": "উপরে ফাইল আপলোড করুন এবং টেনে (drag and drop) আপনার পিডিএফের পৃষ্ঠাগুলোর ক্রম পরিবর্তন করুন।"
  }
}

de_keys = {
  "extractPages": {
    "previewWarning": "Vorschauen konnten nicht generiert werden, Sie können jedoch weiterhin Seiten manuell extrahieren.",
    "selectOnePage": "Bitte wählen Sie mindestens eine Seite zum Extrahieren aus.",
    "extractError": "Fehler beim Extrahieren der ausgewählten Seiten aus dem Dokument.",
    "selectPagesTitle": "Seiten zum Extrahieren auswählen",
    "selectAll": "Alle auswählen",
    "clearAll": "Alle löschen",
    "loadingPages": "Dokumentseitenstruktur wird geladen...",
    "couldNotExtract": "Individuelle Seitenvorschauen konnten für diesen Dokumenttyp nicht extrahiert werden.",
    "configTitle": "Extraktionskonfiguration",
    "extractingButton": "Seiten werden extrahiert...",
    "extractButton": "Seiten extrahieren",
    "successTitle": "Seiten erfolgreich extrahiert! Ihre neue PDF wurde erstellt.",
    "downloadExtracted": "Extrahierte PDF herunterladen",
    "emptyTitle": "Laden Sie eine PDF hoch, um Seiten zu extrahieren",
    "emptyDesc": "Wählen Sie oben ein Dokument aus, um die Seitenvorschauen anzuzeigen und spezifische Seiten zum Extrahieren auszuwählen."
  },
  "reorderPdf": {
    "previewWarning": "Fehler beim Erstellen der Seitenvorschauen. Sie können die Seitenreihenfolge weiterhin manuell bestätigen.",
    "provideValidSequence": "Bitte geben Sie eine gültige Seitenreihenfolge ein, die alle Originalseiten enthält. z.B. 3, 1, 2",
    "parseError": "Fehler beim Lesen der Eingabereihenfolge.",
    "missingPages": "In Ihrer Reihenfolge fehlen einige Originalseiten. Benötigte Gesamtzahl: {{total}}.",
    "reorderError": "Beim Neuordnen der PDF ist ein unerwarteter Fehler aufgetreten.",
    "arrangeElements": "PDF-Seitenelemente anordnen",
    "resetOrder": "Reihenfolge zurücksetzen",
    "manualSequence": "Manuelle Seitenreihenfolge",
    "applyOrder": "Reihenfolge anwenden",
    "renderingPages": "Seiten für Vorschauraster werden gerendert...",
    "addFilePrompt": "Laden Sie oben eine Datei hoch, um mit dem Anordnen zu beginnen.",
    "layoutSummary": "Layout-Zusammenfassung",
    "outputMatrix": "Ausgabeordnungsmatrix",
    "processingButton": "Wird neu angeordnet...",
    "reorderSaveButton": "PDF neu ordnen & speichern",
    "successTitle": "Seiten erfolgreich neu geordnet! Ihre angepasste PDF ist bereit.",
    "downloadReordered": "Neu geordnete PDF herunterladen",
    "emptyTitle": "Laden Sie eine PDF hoch, um Seiten neu zu ordnen",
    "emptyDesc": "Wählen Sie oben ein Dokument aus, um die Seitenreihenfolge per Drag & Drop anzupassen."
  }
}

update_json('src/locales/en/common.json', en_keys)
update_json('src/locales/bn/common.json', bn_keys)
update_json('src/locales/de/common.json', de_keys)

print("JSON files updated successfully.")
