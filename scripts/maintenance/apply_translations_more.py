import re

def update_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Make sure useTranslation is there
        if "t(" in str(replacements.values()) and "useTranslation" not in content and "react-i18next" not in content:
            # this is a bit crude but we'll assume we can inject it or it already has it
            pass
            
        for old, new_str in replacements.items():
            content = content.replace(old, new_str)
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    except FileNotFoundError:
        pass

adobe_reps = {
    'Adobe Acrobat costs <span className="text-rose-500 line-through">$240/year</span>. PDFMinty costs <span className="text-emerald-500">$0 — forever</span>.': "<span dangerouslySetInnerHTML={{ __html: t('adobeAlternative.pricingStrike') }} />",
    '<th className="py-4 px-4 sm:px-6 font-bold text-on-surface">Feature</th>': '<th className="py-4 px-4 sm:px-6 font-bold text-on-surface">{t("adobeAlternative.featCol")}</th>',
    '<th className="py-4 px-4 sm:px-6 font-bold text-on-surface w-1/3">Adobe Acrobat Pro</th>': '<th className="py-4 px-4 sm:px-6 font-bold text-on-surface w-1/3">{t("adobeAlternative.acrobatCol")}</th>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Annual Price</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.annualPrice")}</td>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Account Required</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.accountReq")}</td>',
    'Mandatory Adobe ID': '{t("adobeAlternative.adobeId")}',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Files Leave Your Device</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.filesLeave")}</td>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Merge Multiple PDFs</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.mergePdfs")}</td>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Watermark, Page Numbers, Blank Pages</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.watermarkPages")}</td>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Electronic Signature Stamping</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.eSignature")}</td>',
    '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">Offline Capability</td>': '<td className="py-3.5 px-4 sm:px-6 font-semibold text-on-surface">{t("adobeAlternative.offlineCap")}</td>',
    'Requires 30-day online check': '{t("adobeAlternative.requires30Day")}',
    '<th className="py-3.5 px-4 font-bold text-on-surface">Team Size</th>': '<th className="py-3.5 px-4 font-bold text-on-surface">{t("adobeAlternative.teamSize")}</th>',
    '<th className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">Total Savings</th>': '<th className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{t("adobeAlternative.totalSavings")}</th>',
    '5-Person Small Office': '{t("adobeAlternative.team5")}',
    '20-Person Department': '{t("adobeAlternative.team20")}',
    '50-Person Company': '{t("adobeAlternative.team50")}',
    'Enterprise-level multi-signer routing workflows with strict cryptographic hardware token authentication.': '{t("adobeAlternative.entFeatures1")}',
    'High-end prepress color separation and commercial print offset calibrations.': '{t("adobeAlternative.entFeatures2")}'
}
update_file('src/pages/AdobeAlternativePage.tsx', adobe_reps)

contact_reps = {
    'Thank you for reaching out to PdfMinty. We have received your message and will respond to your email within <strong>24 to 48 hours</strong>.': '<span dangerouslySetInnerHTML={{ __html: t("contact.successMsg") }} />',
    '<option value="General Inquiry">General Inquiry</option>': '<option value="General Inquiry">{t("contact.optGeneral")}</option>',
    '<option value="Feature Request">Feature Request</option>': '<option value="Feature Request">{t("contact.optFeature")}</option>',
    '<option value="Bug Report">Bug Report</option>': '<option value="Bug Report">{t("contact.optBug")}</option>',
    '<option value="Privacy Question">Privacy Question</option>': '<option value="Privacy Question">{t("contact.optPrivacy")}</option>'
}
update_file('src/pages/ContactPage.tsx', contact_reps)

safe_reps = {
    '<th className="py-3.5 px-4 font-bold text-on-surface">Feature</th>': '<th className="py-3.5 px-4 font-bold text-on-surface">{t("isSafePdf.featCol")}</th>',
    '<th className="py-3.5 px-4 font-bold text-rose-500">Traditional Online Tools</th>': '<th className="py-3.5 px-4 font-bold text-rose-500">{t("isSafePdf.tradCol")}</th>',
    '<td className="py-3 px-4 font-semibold text-on-surface">File Upload Required</td>': '<td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.uploadReq")}</td>',
    '<td className="py-3 px-4 font-semibold text-on-surface">Data Privacy Guarantee</td>': '<td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.dataPriv")}</td>',
    'Relies on privacy policy promises': '{t("isSafePdf.reliesPromises")}',
    'Guaranteed by architecture': '{t("isSafePdf.guaranteedArch")}',
    '<td className="py-3 px-4 font-semibold text-on-surface">Offline Availability</td>': '<td className="py-3 px-4 font-semibold text-on-surface">{t("isSafePdf.offlineAvail")}</td>'
}
update_file('src/pages/IsSafePdfArticlePage.tsx', safe_reps)

pdfmd_reps = {
    '<label htmlFor="raw_markdown_editor">Raw Markdown Editor</label>': '<label htmlFor="raw_markdown_editor">{t("pdfToMarkdown.rawEditor")}</label>'
}
update_file('src/pages/PdfToMarkdownPage.tsx', pdfmd_reps)

pgnum_reps = {
    '<option value="bottom-center">Bottom Center</option>': '<option value="bottom-center">{t("pageNumbers.posBottomCenter")}</option>',
    '<option value="bottom-left">Bottom Left</option>': '<option value="bottom-left">{t("pageNumbers.posBottomLeft")}</option>',
    '<option value="top-right">Top Right</option>': '<option value="top-right">{t("pageNumbers.posTopRight")}</option>',
    '<option value="top-center">Top Center</option>': '<option value="top-center">{t("pageNumbers.posTopCenter")}</option>',
    '<option value="top-left">Top Left</option>': '<option value="top-left">{t("pageNumbers.posTopLeft")}</option>'
}
update_file('src/pages/PageNumbersPage.tsx', pgnum_reps)

meta_reps = {
    '<label htmlFor="meta_title" className="text-xs font-bold text-slate-700">Title</label>': '<label htmlFor="meta_title" className="text-xs font-bold text-slate-700">{t("editMetadata.lblTitle")}</label>',
    '<label htmlFor="meta_author" className="text-xs font-bold text-slate-700">Author</label>': '<label htmlFor="meta_author" className="text-xs font-bold text-slate-700">{t("editMetadata.lblAuthor")}</label>',
    '<label htmlFor="meta_subject" className="text-xs font-bold text-slate-700">Subject</label>': '<label htmlFor="meta_subject" className="text-xs font-bold text-slate-700">{t("editMetadata.lblSubject")}</label>',
    '<label htmlFor="meta_keywords" className="text-xs font-bold text-slate-700">Keywords</label>': '<label htmlFor="meta_keywords" className="text-xs font-bold text-slate-700">{t("editMetadata.lblKeywords")}</label>',
    '<label htmlFor="meta_creator" className="text-xs font-bold text-slate-700">Creator</label>': '<label htmlFor="meta_creator" className="text-xs font-bold text-slate-700">{t("editMetadata.lblCreator")}</label>'
}
update_file('src/pages/EditMetadataPage.tsx', meta_reps)

aianalyze_reps = {
    'Your <strong>PDF file itself never leaves your browser</strong> — all rendering and text': '',
    'extraction happens locally. However, the <strong>extracted text content</strong> (up to the': '',
    'first 12 pages) is sent to our server and forwarded to <strong>Google Gemini</strong> for': '',
    'processing.': '<span dangerouslySetInnerHTML={{ __html: t("aiAnalyze.consentDisclaimer") }} />'
}
update_file('src/pages/AiAnalyzePage.tsx', aianalyze_reps)

tos_reps = {
    '<strong>Direct AI Documentation:</strong> Automated systems may consult <a href="/llms.txt" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">/llms.txt</a> and <a href="/llms-full.txt" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">/llms-full.txt</a> for structured system instructions and endpoint directories.': '<span dangerouslySetInnerHTML={{ __html: t("tos.aiDocs") }} />'
}
update_file('src/pages/TermsOfServicePage.tsx', tos_reps)

# OcrPdfPage language option - it maps to the underlying OCR engine, probably fine to leave as "English" since it's an option value, but we can translate the label if needed.

