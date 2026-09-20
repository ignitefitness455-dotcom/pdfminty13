#!/usr/bin/env python3
import json
import os

locales = {
    "de": {
        "common.json": {
            "header": {
                "siteName": "PdfMinty",
                "tagline": "Datenschutzfreundliche PDF-Tools",
                "badgeOffline": "100% PRIVAT & OFFLINE",
                "nav": {
                    "home": "Startseite",
                    "tools": "Werkzeuge",
                    "blog": "Blog",
                    "about": "Über uns",
                    "contact": "Kontakt"
                },
                "themeToggle": {
                    "ariaLabel": "Dunkelmodus umschalten",
                    "switchToLight": "Zu hellem Modus wechseln",
                    "switchToDark": "Zu dunklem Modus wechseln"
                },
                "mobileMenu": {
                    "ariaLabel": "Mobiles Menü öffnen",
                    "open": "Menü öffnen",
                    "close": "Menü schließen"
                }
            },
            "footer": {
                "brandDescription": "Kostenlose, datenschutzorientierte PDF-Werkzeuge. Alle Kernwerkzeuge laufen zu 100% lokal in Ihrem Browser ohne Server-Uploads. Ihre Dateien bleiben privat.",
                "sections": {
                    "coreTools": "Hauptwerkzeuge",
                    "popularTools": "Beliebte Werkzeuge",
                    "resources": "Ressourcen",
                    "companyLegal": "Unternehmen & Rechtliches",
                    "converters": "Konverter",
                    "legalTrust": "Recht & Vertrauen"
                },
                "links": {
                    "mergePdf": "PDF zusammenfügen",
                    "splitPdf": "PDF teilen",
                    "grayscalePdf": "PDF in Graustufen",
                    "protectPdf": "PDF schützen & verschlüsseln",
                    "pdfToImg": "PDF in Bild umwandeln",
                    "compressPdf": "PDF komprimieren",
                    "unlockPdf": "PDF entsperren",
                    "organizePdf": "PDF organisieren",
                    "rotatePdf": "PDF drehen",
                    "pdfToWord": "PDF zu Word (DOCX)",
                    "pdfToText": "PDF zu Text",
                    "pdfToZip": "PDF zu ZIP",
                    "pdfToJpg": "PDF zu JPG",
                    "jpgToPdf": "JPG zu PDF",
                    "pngToPdf": "PNG zu PDF",
                    "webpToPdf": "WEBP zu PDF",
                    "knowledgeHub": "Wissenszentrum",
                    "compareSmallpdf": "PdfMinty vs SmallPDF",
                    "compareIlovepdf": "PdfMinty vs iLovePDF",
                    "adobeSecurity": "Adobe vs Browser-Sicherheit",
                    "trustArticle": "Ist Online-PDF sicher?",
                    "aboutUs": "Über uns",
                    "contactUs": "Kontaktieren Sie uns",
                    "privacyPolicy": "Datenschutzerklärung",
                    "termsOfService": "Nutzungsbedingungen",
                    "howItWorks": "So funktioniert es"
                },
                "copyright": "© {{year}} PdfMinty. Alle Rechte vorbehalten. Entwickelt für 100% Dateidatenschutz.",
                "badges": {
                    "privacyFirst": "Datenschutz zuerst",
                    "clientSide": "Client-seitige PDF-Suite",
                    "zeroLogs": "Keine Datenprotokolle",
                    "openFree": "Kostenlos & Offen",
                    "webAssembly": "WebAssembly-basiert"
                }
            },
            "mobileDrawer": {
                "siteName": "PdfMinty",
                "brandTagline": "Datenschutzfreundlicher PDF-Baukasten",
                "closeAriaLabel": "Navigationsmenü schließen",
                "sectionTools": "PDF-Werkzeuge",
                "sectionSettings": "Anzeige & Spracheinstellungen",
                "languageLabel": "Sprache",
                "displayThemeLabel": "Design-Modus",
                "switchToLight": "Helles Design",
                "switchToDark": "Dunkles Design",
                "toggleLabel": "Umschalten"
            },
            "languageSwitcher": {
                "selectLanguage": "Sprache auswählen",
                "changeLanguageAria": "Sprache ändern"
            }
        },
        "faq.json": {
            "sectionTitle": "Häufig gestellte Fragen",
            "merge": [
                {
                    "question": "In welcher Reihenfolge werden meine PDF-Dateien zusammengefügt?",
                    "answer": "Ihre PDFs werden genau in der Reihenfolge kombiniert, in der Sie sie in der Dateiliste anordnen. Nutzen Sie die Pfeiltasten oder Drag & Drop, um die Reihenfolge vor dem Zusammenfügen festzulegen."
                },
                {
                    "question": "Gibt es ein Limit für die Anzahl der zusammenzufügenden PDFs?",
                    "answer": "Sie können so viele Dateien zusammenfügen, wie Ihr Gerätespeicher verarbeiten kann. Einzeldateien können bis zu 100 MB groß sein, mit einem Gesamtstapel von 150 MB."
                },
                {
                    "question": "Verlieren Bilder oder Texte durch das Zusammenfügen an Qualität?",
                    "answer": "Nein. PdfMinty führt eine verlustfreie Zusammenführung durch. Hohe Auflösung, Originalschriftarten und Vektoren bleiben vollständig erhalten."
                },
                {
                    "question": "Werden meine Dokumente auf externe Server hochgeladen?",
                    "answer": "Nein. Die gesamte Verarbeitung erfolgt zu 100% lokal in Ihrem Browser via WebAssembly. Ihre Dokumente verlassen niemals Ihr Gerät."
                }
            ]
        },
        "merge-pdf.json": {
            "returnDashboard": "Zurück zur Übersicht",
            "pageTitle": "PDF zusammenfügen — Kostenlos online PDF-Dateien kombinieren",
            "pageSubtitle": "Kombinieren Sie mehrere PDF-Dateien zu einem strukturierten Dokument. Schnell, privat und ohne Uploads.",
            "limitBadge": "Limit: {{limit}}MB pro Datei",
            "privacyBadge": "100% Privat — Lokale Browser-Verarbeitung",
            "alerts": {
                "genericError": "Beim Zusammenfügen der PDF-Dateien ist ein Fehler aufgetreten.",
                "processing": "PDF-Dateien werden sicher im Browser zusammengefügt...",
                "success": "PDFs erfolgreich zusammengefügt! Ihr Download startet automatisch.",
                "successTitle": "Zusammenführung erfolgreich abgeschlossen!",
                "successDescription": "Ihr zusammengeführtes Dokument wurde vollständig im Browser erstellt.",
                "downloadButton": "Zusammengeführte PDF herunterladen"
            },
            "dropzone": {
                "title": "Dateien zum Zusammenfügen hinzufügen",
                "subtitle": "oder Dateien von Ihrem Computer auswählen",
                "subtitleWithLimit": "PDF-Dateien hier ablegen oder zum Auswählen klicken",
                "browseButton": "Dateien durchsuchen",
                "ariaLabel": "PDF-Dateien zum Zusammenfügen hochladen",
                "supportedFormat": "Unterstützt PDF-Dateien bis zu 50 MB"
            },
            "emptyState": {
                "title": "PDFs zum Zusammenfügen hochladen",
                "description": "Fügen Sie oben zwei oder mehr PDF-Dateien hinzu, um sie anzuordnen und zu verbinden."
            },
            "fileList": {
                "title": "Ausgewählte Dateien",
                "titleWithCount": "Dateireihenfolge anpassen ({{count}} ausgewählt)",
                "count_one": "{{count}} Datei ausgewählt",
                "count_other": "{{count}} Dateien ausgewählt",
                "hint": "Ziehen Sie Elemente oder nutzen Sie die Pfeiltasten zur Anordnung",
                "addMore": "Weitere Dateien hinzufügen",
                "clearAll": "Alle löschen",
                "actions": {
                    "moveUp": "Nach oben verschieben",
                    "moveDown": "Nach unten verschieben",
                    "remove": "Löschen"
                },
                "fileInfo": {
                    "pages_one": "{{count}} Seite",
                    "pages_other": "{{count}} Seiten",
                    "loadingPages": "Seiten werden ermittelt..."
                }
            },
            "sidebar": {
                "title": "Zusammenfügen-Einstellungen",
                "description": "Legen Sie die Reihenfolge fest. Die Dateien werden von oben nach unten zusammengefügt.",
                "securityNote": "Dateien werden zu 100% lokal auf Ihrem Computer verarbeitet. Nichts wird hochgeladen."
            },
            "errors": {
                "minFilesRequired": "Bitte fügen Sie mindestens 2 PDF-Dateien hinzu.",
                "totalSizeExceeded": "Gesamtgröße überschritten! Bitte entfernen Sie einige Dateien.",
                "unexpectedFailure": "Ein unerwarteter Fehler ist aufgetreten. Stellen Sie sicher, dass die PDFs nicht geschützt sind."
            },
            "mergeControls": {
                "mergeButton": "PDFs zusammenfügen",
                "mergeButtonWithCount": "PDFs zusammenfügen ({{count}})",
                "mergingButton": "Wird erstellt...",
                "filenamePlaceholder": "zusammengefuegtes-dokument.pdf"
            }
        }
    },
    "fr": {
        "common.json": {
            "header": {
                "siteName": "PdfMinty",
                "tagline": "Outils PDF Respectueux de la Vie Privée",
                "badgeOffline": "100% PRIVÉ & HORS LIGNE",
                "nav": {
                    "home": "Accueil",
                    "tools": "Outils",
                    "blog": "Blog",
                    "about": "À propos",
                    "contact": "Contact"
                },
                "themeToggle": {
                    "ariaLabel": "Basculer le mode sombre",
                    "switchToLight": "Passer au mode clair",
                    "switchToDark": "Passer au mode sombre"
                },
                "mobileMenu": {
                    "ariaLabel": "Ouvrir le menu mobile",
                    "open": "Ouvrir le menu",
                    "close": "Fermer le menu"
                }
            },
            "footer": {
                "brandDescription": "Suite d'outils PDF gratuits et confidentiels. Les outils fonctionnent à 100% localement dans votre navigateur sans téléversement de fichiers sur des serveurs.",
                "sections": {
                    "coreTools": "Outils Principaux",
                    "popularTools": "Outils Populaires",
                    "resources": "Ressources",
                    "companyLegal": "Entreprise & Légal",
                    "converters": "Convertisseurs",
                    "legalTrust": "Légal & Confiance"
                },
                "links": {
                    "mergePdf": "Fusionner des PDF",
                    "splitPdf": "Diviser un PDF",
                    "grayscalePdf": "Convertir PDF en N&B",
                    "protectPdf": "Protéger & Chiffrer PDF",
                    "pdfToImg": "Convertir PDF en Image",
                    "compressPdf": "Compresser un PDF",
                    "unlockPdf": "Déverrouiller un PDF",
                    "organizePdf": "Organiser un PDF",
                    "rotatePdf": "Faire pivoter un PDF",
                    "pdfToWord": "PDF vers Word (DOCX)",
                    "pdfToText": "PDF vers Texte",
                    "pdfToZip": "PDF vers ZIP",
                    "pdfToJpg": "PDF vers JPG",
                    "jpgToPdf": "JPG vers PDF",
                    "pngToPdf": "PNG vers PDF",
                    "webpToPdf": "WEBP vers PDF",
                    "knowledgeHub": "Centre de Connaissances",
                    "compareSmallpdf": "PdfMinty vs SmallPDF",
                    "compareIlovepdf": "PdfMinty vs iLovePDF",
                    "adobeSecurity": "Adobe vs Sécurité Navigateur",
                    "trustArticle": "Le PDF en ligne est-il sûr ?",
                    "aboutUs": "À propos de nous",
                    "contactUs": "Contactez-nous",
                    "privacyPolicy": "Politique de confidentialité",
                    "termsOfService": "Conditions d'utilisation",
                    "howItWorks": "Comment ça marche"
                },
                "copyright": "© {{year}} PdfMinty. Tous droits réservés. Conçu pour une confidentialité totale.",
                "badges": {
                    "privacyFirst": "Confidentialité d'abord",
                    "clientSide": "Suite PDF Côté Client",
                    "zeroLogs": "Zéro journal de données",
                    "openFree": "Gratuit & Ouvert",
                    "webAssembly": "Propulsé par WebAssembly"
                }
            },
            "mobileDrawer": {
                "siteName": "PdfMinty",
                "brandTagline": "Boîte à outils PDF confidentielle",
                "closeAriaLabel": "Fermer le tiroir de navigation",
                "sectionTools": "Outils PDF",
                "sectionSettings": "Affichage & Langue",
                "languageLabel": "Langue",
                "displayThemeLabel": "Thème d'affichage",
                "switchToLight": "Thème Clair",
                "switchToDark": "Thème Sombre",
                "toggleLabel": "Basculer"
            },
            "languageSwitcher": {
                "selectLanguage": "Choisir la langue",
                "changeLanguageAria": "Changer de langue"
            }
        },
        "faq.json": {
            "sectionTitle": "Foire Aux Questions",
            "merge": [
                {
                    "question": "Dans quel ordre mes fichiers PDF seront-ils fusionnés ?",
                    "answer": "Vos PDF sont combinés strictement dans l'ordre où vous les disposez dans la liste. Vous pouvez réordonner les fichiers avant de lancer la fusion."
                },
                {
                    "question": "Y a-t-il une limite sur le nombre de fichiers PDF à fusionner ?",
                    "answer": "Vous pouvez fusionner autant de fichiers que la mémoire de votre appareil le permet. Chaque fichier peut peser jusqu'à 100 Mo."
                },
                {
                    "question": "La fusion dégrade-t-elle la qualité du document ?",
                    "answer": "Non. PdfMinty effectue une fusion sans perte. Les images haute résolution, polices et dessins vectoriels restent intacts."
                },
                {
                    "question": "Mes documents sont-ils envoyés sur des serveurs externes ?",
                    "answer": "Non. Tout le traitement est exécuté à 100% localement dans votre navigateur grâce à WebAssembly. Vos fichiers ne quittent jamais votre appareil."
                }
            ]
        },
        "merge-pdf.json": {
            "returnDashboard": "Retour au tableau de bord",
            "pageTitle": "Fusionner des fichiers PDF gratuitement — Combiner des PDF en ligne",
            "pageSubtitle": "Combinez plusieurs fichiers PDF en un seul document structuré. Rapide, privé et sans aucun téléversement.",
            "limitBadge": "Limite : {{limit}}Mo par fichier",
            "privacyBadge": "100% Privé — Traitement Côté Client",
            "alerts": {
                "genericError": "Une erreur est survenue lors de la fusion de vos fichiers PDF.",
                "processing": "Fusion des fichiers PDF dans votre navigateur...",
                "success": "PDFs fusionnés avec succès ! Le téléchargement va démarrer automatiquement.",
                "successTitle": "Fusion terminée avec succès !",
                "successDescription": "Votre fichier PDF combiné a été généré directement dans votre navigateur.",
                "downloadButton": "Télécharger le PDF fusionné"
            },
            "dropzone": {
                "title": "Ajouter des fichiers à fusionner",
                "subtitle": "ou choisissez des fichiers depuis votre ordinateur",
                "subtitleWithLimit": "Glissez des fichiers PDF ici ou cliquez pour parcourir",
                "browseButton": "Parcourir les fichiers",
                "ariaLabel": "Téléverser des fichiers PDF à fusionner",
                "supportedFormat": "Prend en charge les fichiers PDF jusqu'à 50 Mo"
            },
            "emptyState": {
                "title": "Ajoutez des PDF à fusionner",
                "description": "Ajoutez au moins deux fichiers PDF ci-dessus pour les combiner en un seul document."
            },
            "fileList": {
                "title": "Fichiers sélectionnés",
                "titleWithCount": "Organiser l'ordre des fichiers ({{count}} sélectionnés)",
                "count_one": "{{count}} fichier sélectionné",
                "count_other": "{{count}} fichiers sélectionnés",
                "hint": "Glissez les éléments ou utilisez les flèches pour définir l'ordre",
                "addMore": "Ajouter d'autres fichiers",
                "clearAll": "Tout effacer",
                "actions": {
                    "moveUp": "Monter",
                    "moveDown": "Descendre",
                    "remove": "Supprimer"
                },
                "fileInfo": {
                    "pages_one": "{{count}} page",
                    "pages_other": "{{count}} pages",
                    "loadingPages": "Calcul des pages..."
                }
            },
            "sidebar": {
                "title": "Paramètres de fusion",
                "description": "Définissez l'ordre des pages. La compilation s'effectue de haut en bas.",
                "securityNote": "Les fichiers sont fusionnés à 100% sur votre appareil. Vos données restent strictement confidentielles."
            },
            "errors": {
                "minFilesRequired": "Veuillez ajouter au moins 2 fichiers PDF.",
                "totalSizeExceeded": "Taille totale dépassée ! Veuillez retirer des fichiers.",
                "unexpectedFailure": "Une erreur inattendue est survenue. Vérifiez que les fichiers ne sont pas protégés par mot de passe."
            },
            "mergeControls": {
                "mergeButton": "Fusionner les PDF",
                "mergeButtonWithCount": "Fusionner les PDF ({{count}})",
                "mergingButton": "Génération du PDF...",
                "filenamePlaceholder": "document-fusionne.pdf"
            }
        }
    },
    "es": {
        "common.json": {
            "header": {
                "siteName": "PdfMinty",
                "tagline": "Herramientas PDF con Privacidad Primero",
                "badgeOffline": "100% PRIVADO Y SIN CONEXIÓN",
                "nav": {
                    "home": "Inicio",
                    "tools": "Herramientas",
                    "blog": "Blog",
                    "about": "Acerca de",
                    "contact": "Contacto"
                },
                "themeToggle": {
                    "ariaLabel": "Cambiar a modo oscuro",
                    "switchToLight": "Cambiar a Modo Claro",
                    "switchToDark": "Cambiar a Modo Oscuro"
                },
                "mobileMenu": {
                    "ariaLabel": "Abrir menú móvil",
                    "open": "Abrir menú",
                    "close": "Cerrar menú"
                }
            },
            "footer": {
                "brandDescription": "Herramientas PDF gratuitas y enfocadas en la privacidad. Las herramientas principales se ejecutan 100% localmente en tu navegador sin subir archivos a servidores externos.",
                "sections": {
                    "coreTools": "Herramientas Principales",
                    "popularTools": "Herramientas Populares",
                    "resources": "Recursos",
                    "companyLegal": "Empresa y Legal",
                    "converters": "Convertidores",
                    "legalTrust": "Legal y Confianza"
                },
                "links": {
                    "mergePdf": "Unir Archivos PDF",
                    "splitPdf": "Dividir Páginas PDF",
                    "grayscalePdf": "PDF en Escala de Grises",
                    "protectPdf": "Proteger y Cifrar PDF",
                    "pdfToImg": "Convertir PDF a Imagen",
                    "compressPdf": "Comprimir PDF",
                    "unlockPdf": "Desbloquear PDF",
                    "organizePdf": "Organizar PDF",
                    "rotatePdf": "Girar PDF",
                    "pdfToWord": "PDF a Word (DOCX)",
                    "pdfToText": "PDF a Texto",
                    "pdfToZip": "PDF a ZIP",
                    "pdfToJpg": "PDF a JPG",
                    "jpgToPdf": "JPG a PDF",
                    "pngToPdf": "PNG a PDF",
                    "webpToPdf": "WEBP a PDF",
                    "knowledgeHub": "Centro de Conocimiento",
                    "compareSmallpdf": "PdfMinty vs SmallPDF",
                    "compareIlovepdf": "PdfMinty vs iLovePDF",
                    "adobeSecurity": "Adobe vs Seguridad del Navegador",
                    "trustArticle": "¿Es seguro el PDF en línea?",
                    "aboutUs": "Sobre Nosotros",
                    "contactUs": "Contáctenos",
                    "privacyPolicy": "Política de Privacidad",
                    "termsOfService": "Términos de Servicio",
                    "howItWorks": "Cómo Funciona"
                },
                "copyright": "© {{year}} PdfMinty. Todos los derechos reservados. Diseñado para 100% de privacidad documental.",
                "badges": {
                    "privacyFirst": "Privacidad Primero",
                    "clientSide": "Suite PDF del Lado del Cliente",
                    "zeroLogs": "Sin Registros de Datos",
                    "openFree": "Gratis y Abierto",
                    "webAssembly": "Potenciado por WebAssembly"
                }
            },
            "mobileDrawer": {
                "siteName": "PdfMinty",
                "brandTagline": "Kit de herramientas PDF privado",
                "closeAriaLabel": "Cerrar panel de navegación",
                "sectionTools": "Herramientas PDF",
                "sectionSettings": "Configuración de Pantalla e Idioma",
                "languageLabel": "Idioma",
                "displayThemeLabel": "Tema Visual",
                "switchToLight": "Tema Claro",
                "switchToDark": "Tema Oscuro",
                "toggleLabel": "Cambiar"
            },
            "languageSwitcher": {
                "selectLanguage": "Seleccionar Idioma",
                "changeLanguageAria": "Cambiar idioma"
            }
        },
        "faq.json": {
            "sectionTitle": "Preguntas Frecuentes",
            "merge": [
                {
                    "question": "¿En qué orden se unirán mis archivos PDF?",
                    "answer": "Tus PDFs se combinan exactamente en el orden en que los organices en la lista. Puedes usar controles de arrastre o flechas para ordenar los documentos antes de unirlos."
                },
                {
                    "question": "¿Hay un límite en la cantidad de archivos PDF que puedo unir?",
                    "answer": "Puedes unir tantos archivos PDF como la memoria de tu dispositivo pueda procesar. Los archivos individuales pueden ser de hasta 100 MB."
                },
                {
                    "question": "¿Unir archivos PDF reduce la calidad de imágenes o texto?",
                    "answer": "No. PdfMinty realiza una unión sin pérdidas. Las imágenes de alta resolución, fuentes originales y dibujos vectoriales se mantienen intactos."
                },
                {
                    "question": "¿Se guardan o suben mis documentos a servidores externos?",
                    "answer": "No. Toda la unión de PDF se ejecuta 100% localmente dentro de tu navegador web usando WebAssembly. Tus documentos nunca tocan un servidor en la nube."
                }
            ]
        },
        "merge-pdf.json": {
            "returnDashboard": "Volver al Panel",
            "pageTitle": "Unir Archivos PDF Gratis — Combinar Documentos PDF Online",
            "pageSubtitle": "Combina múltiples archivos PDF en un solo documento organizado. Rápido, privado y sin subir archivos.",
            "limitBadge": "Límite: {{limit}}MB por archivo",
            "privacyBadge": "100% Privado — Procesamiento en el Navegador",
            "alerts": {
                "genericError": "Ocurrió un error al unir tus archivos PDF. Por favor intenta de nuevo.",
                "processing": "Uniendo archivos PDF de forma segura en tu navegador...",
                "success": "¡PDFs unidos con éxito! Tu descarga comenzará automáticamente.",
                "successTitle": "¡Operación completada con éxito!",
                "successDescription": "Tu documento PDF combinado fue generado íntegramente en tu navegador.",
                "downloadButton": "Descargar PDF Unido"
            },
            "dropzone": {
                "title": "Añadir más archivos para unir",
                "subtitle": "o elige archivos desde tu computadora",
                "subtitleWithLimit": "Arrastra archivos PDF aquí o haz clic para explorar",
                "browseButton": "Explorar Archivos",
                "ariaLabel": "Subir archivos PDF para unir",
                "supportedFormat": "Admite archivos PDF de hasta 50 MB cada uno"
            },
            "emptyState": {
                "title": "Sube PDFs para unir",
                "description": "Añade dos o más archivos PDF arriba para ordenarlos y combinarlos en un solo documento."
            },
            "fileList": {
                "title": "Archivos Seleccionados",
                "titleWithCount": "Organizar Orden de Archivos ({{count}} seleccionados)",
                "count_one": "{{count}} archivo seleccionado",
                "count_other": "{{count}} archivos seleccionados",
                "hint": "Arrastra elementos o usa las flechas para ordenar antes de unir",
                "addMore": "Añadir Más Archivos",
                "clearAll": "Borrar Todo",
                "actions": {
                    "moveUp": "Mover arriba",
                    "moveDown": "Mover abajo",
                    "remove": "Eliminar"
                },
                "fileInfo": {
                    "pages_one": "{{count}} página",
                    "pages_other": "{{count}} páginas",
                    "loadingPages": "Calculando páginas..."
                }
            },
            "sidebar": {
                "title": "Configuración de Unión",
                "description": "Ajusta el orden en la lista. Se compilarán consecutivamente de arriba hacia abajo.",
                "securityNote": "Los archivos se procesan 100% localmente en tu equipo. Tus secretos nunca salen de tu control."
            },
            "errors": {
                "minFilesRequired": "Por favor añade al menos 2 archivos PDF para unir.",
                "totalSizeExceeded": "¡Tamaño total excedido! Por favor elimina algunos archivos.",
                "unexpectedFailure": "Ocurrió un error inesperado al procesar los documentos."
            },
            "mergeControls": {
                "mergeButton": "Unir PDFs",
                "mergeButtonWithCount": "Unir PDFs ({{count}})",
                "mergingButton": "Compilando PDF...",
                "filenamePlaceholder": "documento-unido.pdf"
            }
        }
    }
}

for lang, files in locales.items():
    dir_path = f"src/locales/{lang}"
    os.makedirs(dir_path, exist_ok=True)
    for filename, content in files.items():
        file_path = os.path.join(dir_path, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        print(f"Created {file_path}")

print("Successfully created de, fr, and es locale files!")
