export interface FAQItem {
  question: string;
  answer: string;
}

export type ToolFaqMap = Record<string, FAQItem[]>;

export const TOOL_FAQS: ToolFaqMap = {
  // 1. Merge PDF
  merge: [
    {
      question: 'In what order will my PDF files be merged?',
      answer: 'Your PDFs are combined strictly in the order you arrange them in the upload list deck. You can use the drag controls or arrow buttons to move files up or down before initiating the merge.',
    },
    {
      question: 'Is there a limit on how many PDF files I can merge at once?',
      answer: 'You can merge up to 50 PDF files per session. Single files can be up to 50MB each, with a maximum combined batch of 150MB per session. There are no daily limits or sign-ups.',
    },
    {
      question: 'Will merging PDFs degrade the quality of my images or text?',
      answer: 'No. PdfMinty performs a lossless merge operation. High-resolution graphics, original fonts, vector drawings, and embedded metadata remain completely intact.',
    },
    {
      question: 'Can I combine password-protected PDF files?',
      answer: 'If a PDF requires an open password, you must first unlock it using our Unlock PDF tool before merging it with other documents.',
    },
    {
      question: 'Are my merged documents saved or uploaded to external servers?',
      answer: 'No. All PDF merging is executed 100% locally inside your web browser using WebAssembly. Your documents never touch a third-party cloud or external server.',
    },
  ],

  // 2. Split PDF
  split: [
    {
      question: 'Can I split a PDF into specific custom page ranges?',
      answer: 'Yes. You can extract individual pages, split the PDF at specific intervals (e.g., every 5 pages), or specify custom page ranges (e.g., 1-3, 5, 8-12) to generate separate PDF files.',
    },
    {
      question: 'What format do I get after splitting a large PDF document?',
      answer: 'Depending on your selection, you will receive a single newly created PDF containing your desired range or a ZIP package containing multiple split PDF documents.',
    },
    {
      question: 'Does splitting a PDF remove original bookmarks or hyperlinks?',
      answer: 'Internal page links pointing to remaining pages are preserved. Bookmarks referencing pages within the extracted range will continue to function properly.',
    },
    {
      question: 'Can I split scanned or image-heavy PDF files?',
      answer: 'Yes. The splitting engine works directly on the PDF structure and handles scanned documents, vector files, and text PDFs with equal precision.',
    },
    {
      question: 'How fast is the PDF splitting process?',
      answer: 'Because processing runs entirely in your local browser memory without network latency or file upload delays, splitting even a 500-page document usually takes under a second.',
    },
  ],

  // 3. Rotate PDF
  rotate: [
    {
      question: 'Can I rotate individual pages instead of the whole document?',
      answer: 'Yes. You can choose to rotate all pages at once or selectively rotate individual pages by 90°, 180°, or 270° clockwise and counterclockwise.',
    },
    {
      question: 'Is page rotation permanently saved in the output PDF?',
      answer: 'Yes. When you download the rotated file, the page rotation flags are permanently written into the PDF specifications so it displays correctly across all PDF readers and printers.',
    },
    {
      question: 'Will rotating pages affect the text quality or searchability?',
      answer: 'Not at all. Rotating pages simply updates the visual viewport metadata. Text searchability, fonts, and vector paths remain untouched.',
    },
    {
      question: 'Can I fix upside-down scanned documents with this tool?',
      answer: 'Yes. Select the inverted pages and apply a 180-degree rotation to instantly fix upside-down or sideways pages from bulk scanner runs.',
    },
    {
      question: 'Does rotating a PDF require uploading the file anywhere?',
      answer: 'No. Page rotation is performed entirely within your web browser memory, ensuring your confidential documents remain strictly private.',
    },
  ],

  // 4. Delete PDF Pages
  'delete-pages': [
    {
      question: 'How do I select multiple pages to delete from my PDF?',
      answer: 'You can click directly on page thumbnails to select or deselect them, or type page numbers and ranges (e.g., 2, 4, 7-10) in the selection bar.',
    },
    {
      question: 'Can I undo page deletion before downloading the new PDF?',
      answer: 'Yes. As long as you have not generated the output file, you can toggle pages back on or click "Reset Selection" to restore all original pages.',
    },
    {
      question: 'Does deleting pages reduce the overall PDF file size?',
      answer: 'Yes. Removing unnecessary pages, embedded images, and associated page objects naturally reduces the overall file size of the generated PDF.',
    },
    {
      question: 'What happens to page numbering after I delete pages?',
      answer: 'The physical page structure re-indexes automatically. If your document has printed footer numbers, they will stay as originally printed unless modified.',
    },
    {
      question: 'Are deleted PDF pages recoverable from the output file?',
      answer: 'No. Once you download the new PDF, deleted pages are completely purged from the binary structure of the output document.',
    },
  ],

  // 5. Extract PDF Pages
  'extract-pages': [
    {
      question: 'What is the difference between extracting pages and splitting a PDF?',
      answer: 'Extracting lets you select specific pages (e.g., pages 2, 5, and 9) to compile into a brand-new single PDF document, leaving the original file untouched.',
    },
    {
      question: 'Can I extract non-consecutive pages into one document?',
      answer: 'Yes. You can enter comma-separated lists like "1, 3, 7-12, 15" to combine disconnected pages into a single organized PDF file.',
    },
    {
      question: 'Will extracted pages retain interactive elements like links or form fields?',
      answer: 'Yes. Form fields, annotations, vector shapes, and active hyperlinks present on the extracted pages are retained in the new file.',
    },
    {
      question: 'Can I extract pages from encrypted or protected PDFs?',
      answer: 'If the PDF has an owner restriction that blocks page extraction, you can first process it through our Unlock PDF tool to remove the restriction.',
    },
    {
      question: 'Is there a limit to how many pages I can extract at once?',
      answer: 'No. You can extract any number of pages as long as the input document fits within your browser memory limits.',
    },
  ],

  // 6. Reorder PDF
  reorder: [
    {
      question: 'How do I reorder pages in my PDF file?',
      answer: 'Simply upload your PDF, view the visual page thumbnail grid, and drag & drop pages into your preferred sequence, or use the quick "Reverse Order" control.',
    },
    {
      question: 'Can I delete or rotate pages while reordering them?',
      answer: 'Yes. The reorder workspace includes controls on each page thumbnail to rotate or remove individual pages while arranging the sequence.',
    },
    {
      question: 'Will reordering pages break internal document bookmarks?',
      answer: 'Standard page navigation in PDF readers updates according to physical page indices, ensuring smooth reading in the new order.',
    },
    {
      question: 'Is page reordering instant?',
      answer: 'Yes. Because the visual grid and PDF compilation happen locally in browser memory using WebAssembly, reordering is practically instantaneous.',
    },
    {
      question: 'Are my reordered files uploaded to any server?',
      answer: 'No. All rendering and page shuffling happens strictly on your device for absolute data privacy.',
    },
  ],

  // 7. Page Numbers
  'page-numbers': [
    {
      question: 'Where can I position the page numbers on my PDF?',
      answer: 'You can choose between top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right alignments across all pages.',
    },
    {
      question: 'Can I customize the numbering format and starting number?',
      answer: 'Yes. You can select styles like "Page X of Y", "X", or "Page X", adjust font family and size, and set a custom starting number (e.g., start counting from 5).',
    },
    {
      question: 'Can I skip adding page numbers on the cover page?',
      answer: 'Yes. You can check the "Skip First Page" option so cover pages remain clean without header or footer numbering.',
    },
    {
      question: 'Will new page numbers overlap existing text in my PDF?',
      answer: 'You can adjust margin offsets and text positioning to ensure numbers sit neatly in document margins without obscuring content.',
    },
    {
      question: 'Are my numbered PDFs processed securely offline?',
      answer: 'Yes. Page numbering is added directly in your browser without uploading files to external servers.',
    },
  ],

  // 8. Watermark PDF
  watermark: [
    {
      question: 'What types of watermarks can I add to my PDF?',
      answer: 'You can add custom text watermarks (with custom fonts, colors, size, opacity, and rotation) or upload image logos (PNG, JPG) to overlay on your PDF pages.',
    },
    {
      question: 'Can I place the watermark behind or over the PDF text?',
      answer: 'Yes. You can control layer placement (overlay vs background underlay) and adjust transparency so watermarks do not block document readability.',
    },
    {
      question: 'Can I apply watermarks to specific page ranges only?',
      answer: 'Yes. You can apply the watermark across all pages or target specific page ranges (e.g., pages 2-10).',
    },
    {
      question: 'Will the watermark remain if someone prints or converts the PDF?',
      answer: 'Yes. The watermark becomes a permanent visual layer in the PDF specification and remains visible during printing or rasterization.',
    },
    {
      question: 'Is my watermarked document uploaded anywhere?',
      answer: 'No. Image and text watermarking runs entirely inside your client browser session.',
    },
  ],

  // 9. Protect PDF
  protect: [
    {
      question: 'What level of encryption does PdfMinty use to protect PDFs?',
      answer: 'PdfMinty applies strong standard AES encryption to encrypt your document content and restrict unauthorized access.',
    },
    {
      question: 'What is the difference between a User Password and an Owner Password?',
      answer: 'A User (Open) Password restricts who can open and view the document. An Owner Password restricts specific permissions like printing, copying text, or editing.',
    },
    {
      question: 'Can I recover my PDF if I forget the password I set?',
      answer: 'No. Because encryption is performed cryptographically inside your browser without storing keys on any server, lost passwords cannot be recovered.',
    },
    {
      question: 'Can I prevent users from printing or copying text from my PDF?',
      answer: 'Yes. You can toggle permission flags to disallow high-resolution printing, text extraction, and document modification.',
    },
    {
      question: 'Does password protecting a PDF send my password to a remote server?',
      answer: 'No. The password and encryption process are executed locally in your browser memory. Neither your file nor password is transmitted anywhere.',
    },
  ],

  // 10. Unlock PDF
  unlock: [
    {
      question: "What if I don't know my PDF's open password?",
      answer: "If a PDF is encrypted with a strong Open Password, you must enter the correct password to decrypt and remove protection. PdfMinty does not perform illegal brute-force password cracking.",
    },
    {
      question: 'Can this tool remove owner permissions restrictions (e.g., printing or editing blocks)?',
      answer: 'Yes. If the PDF only has owner restrictions or known passwords, PdfMinty can strip permission blocks so you can print, copy, and edit freely.',
    },
    {
      question: 'Is it legal to unlock password-protected PDF files?',
      answer: 'You should only unlock files that you own or have explicit legal authorization to decrypt and modify.',
    },
    {
      question: 'Will unlocking a PDF alter its original formatting or fonts?',
      answer: 'No. Unlocking simply removes the security wrapper. The visual content, layout, fonts, and images stay 100% identical.',
    },
    {
      question: 'Are my decrypted files sent to cloud servers during unlocking?',
      answer: 'No. Cryptographic decryption runs entirely inside your web browser using WebAssembly. Your password and files remain 100% private.',
    },
  ],

  // 11. Flatten PDF
  flatten: [
    {
      question: 'What does "flattening" a PDF actually do?',
      answer: 'Flattening merges interactive elements—such as fillable form fields, checkboxes, annotations, signatures, and comments—into a single non-editable background graphics layer.',
    },
    {
      question: 'Why should I flatten my PDF form before sending it?',
      answer: 'Flattening prevents recipient tampering, ensures form responses display identically on all devices and PDF viewers, and guarantees proper printing.',
    },
    {
      question: 'Can someone un-flatten a PDF to edit my submitted form data?',
      answer: 'No. Flattening bakes vector annotations and form text directly into the page layer, making it impossible to convert them back into interactive input fields.',
    },
    {
      question: 'Does flattening a PDF change its visual appearance?',
      answer: 'No. All text entries, drawings, and signatures look exactly the same; they simply lose their interactive click/edit capability.',
    },
    {
      question: 'Is document flattening executed locally?',
      answer: 'Yes. All PDF form flattening is processed in-browser without server uploads.',
    },
  ],

  // 12. Grayscale PDF
  grayscale: [
    {
      question: 'Why convert a color PDF to grayscale or black and white?',
      answer: 'Grayscale conversion drastically reduces printer ink/toner consumption, creates clean monochrome documents for official filing, and often decreases file size.',
    },
    {
      question: 'Will converting to grayscale make text blurry or unreadable?',
      answer: 'No. High-contrast text remains crisp and sharp. Colored images and graphics are smoothly transformed into clean tonal gray shades.',
    },
    {
      question: 'Does grayscale conversion reduce PDF file size?',
      answer: 'Yes. Transforming full-color RGB/CMYK image streams into single-channel monochrome streams often significantly compresses file size.',
    },
    {
      question: 'Can I convert scanned color documents to black and white?',
      answer: 'Yes. Scanned pages, diagrams, and photos are converted to smooth monochrome graphics suitable for archiving or printing.',
    },
    {
      question: 'Are my converted grayscale files uploaded to a server?',
      answer: 'No. The color conversion matrix runs locally inside your browser session.',
    },
  ],

  // 13. Sign PDF
  sign: [
    {
      question: 'How can I add my signature to a PDF document?',
      answer: 'You can draw your signature using your mouse, trackpad, or touchscreen, type your name in stylish script fonts, or upload an image of your physical signature.',
    },
    {
      question: 'Is a digital signature created with PdfMinty legally binding?',
      answer: 'In many jurisdictions (such as under the US ESIGN Act and EU eIDAS regulations for basic electronic signatures), electronic signatures placed on agreements are legally recognized.',
    },
    {
      question: 'Can I place signatures on multiple pages or add dates and initials?',
      answer: 'Yes. You can place your signature on any page, adjust its size and position, and add custom text overlays like dates, job titles, or initials.',
    },
    {
      question: 'Is my signature image saved on external servers?',
      answer: 'No! Your drawn or uploaded signature is held strictly in your browser memory and burned directly into the PDF. It is never stored on external databases.',
    },
    {
      question: 'Can recipients erase my signature after downloading the signed PDF?',
      answer: 'When you finalize and download your signed PDF, the signature is flattened directly into the page content layer to prevent easy removal.',
    },
  ],

  // 14. Add Blank Page
  'add-blank': [
    {
      question: 'Where can I insert a blank page in my PDF?',
      answer: 'You can insert blank pages at the very beginning, at the end, or after any specific page number in your document.',
    },
    {
      question: 'Will the added blank page match the dimensions of my existing PDF pages?',
      answer: 'Yes. By default, the inserted blank page automatically adopts the width, height, and orientation (portrait/landscape) of your document pages.',
    },
    {
      question: 'Can I insert multiple blank pages at once?',
      answer: 'Yes. You can specify how many blank pages to insert and where they should be positioned.',
    },
    {
      question: 'Why would I need to add blank pages to a PDF?',
      answer: 'Adding blank pages is essential for double-sided (duplex) booklet printing, separating document sections, or inserting note-taking pages.',
    },
    {
      question: 'Is adding blank pages processed client-side?',
      answer: 'Yes. Page insertion is performed entirely in your web browser memory.',
    },
  ],

  // 15. Edit PDF Metadata
  'edit-metadata': [
    {
      question: 'What PDF metadata properties can I edit or remove?',
      answer: 'You can edit or strip document Title, Author, Subject, Keywords, Creator application, Producer tool, and Creation/Modification dates.',
    },
    {
      question: 'Why is editing PDF metadata important for privacy?',
      answer: 'PDF metadata often contains hidden personal information, such as your full computer username, software versions, file paths, and editing history that you may not want to share publicly.',
    },
    {
      question: 'Will changing metadata alter the text or images inside the PDF?',
      answer: 'No. Metadata editing updates only the hidden XML/Header dictionary properties. Your document content remains 100% untouched.',
    },
    {
      question: 'Can search engines read PDF metadata?',
      answer: 'Yes. Web crawlers use PDF titles, authors, and keywords to index documents. Adding accurate metadata helps boost your document SEO when published online.',
    },
    {
      question: 'Are metadata changes saved instantly without cloud processing?',
      answer: 'Yes. The metadata dictionary is rewritten locally inside your browser within milliseconds.',
    },
  ],

  // 16. Sanitize PDF
  'sanitize-pdf': [
    {
      question: 'What is the difference between Sanitizing a PDF and editing metadata?',
      answer: 'Metadata editing changes header fields. Sanitization thoroughly purges hidden metadata, JavaScript actions, embedded file attachments, form scripts, links, and hidden layer data to eliminate security vectors.',
    },
    {
      question: 'Why should I sanitize PDFs before sharing them externally?',
      answer: 'Sanitizing removes malicious scripts, tracking links, confidential author histories, and hidden file attachments that could leak data or trigger security alerts.',
    },
    {
      question: 'Does sanitization remove embedded malware or suspicious scripts?',
      answer: 'Yes. Embedded JavaScript, external launch commands, and automatic action triggers are completely stripped from the document object tree.',
    },
    {
      question: 'Will sanitizing a PDF ruin the visible document text?',
      answer: 'No. Visible vector text, fonts, layout, and images are preserved intact while all active background code is stripped out.',
    },
    {
      question: 'Is my document uploaded anywhere during sanitization?',
      answer: 'No. Sanitization happens 100% locally on your machine, ensuring complete privacy for sensitive legal, financial, or corporate records.',
    },
  ],

  // 17. Repair PDF
  'repair-pdf': [
    {
      question: 'How does PdfMinty repair corrupted or unopenable PDF files?',
      answer: 'Our repair engine scans the binary structure of damaged PDFs, rebuilds broken cross-reference (XRef) tables, repairs corrupted headers, and recovers valid page objects.',
    },
    {
      question: 'Can all damaged PDF files be 100% repaired?',
      answer: 'If the core page streams and object data are present, repair success is very high. However, if a file has been severely truncated or overwritten with zeroes, data recovery may be partial.',
    },
    {
      question: 'Will repairing a PDF fix "File is damaged or corrupted" errors in Adobe Acrobat?',
      answer: 'Yes. Rebuilding internal structure tables usually resolves common PDF syntax and container errors that prevent standard viewers from opening the document.',
    },
    {
      question: 'Is my broken document uploaded to a server to be repaired?',
      answer: 'No. The binary reconstruction algorithm executes directly in your browser using client-side JavaScript and WebAssembly.',
    },
    {
      question: 'How long does PDF repair take?',
      answer: 'Most corrupted documents are analyzed and reconstructed within a few seconds.',
    },
  ],

  // 18. OCR PDF
  'ocr-pdf': [
    {
      question: 'Which languages are supported for OCR text recognition?',
      answer: 'Our browser-based OCR engine supports English, Spanish, French, German, Italian, Portuguese, Dutch, and many other major languages.',
    },
    {
      question: 'How does OCR make a scanned PDF searchable?',
      answer: 'OCR (Optical Character Recognition) analyzes letter shapes in scanned image pages and places an invisible searchable text layer over the image, allowing you to select, search, and copy text.',
    },
    {
      question: 'Does OCR processing happen in my browser or on a server?',
      answer: 'PdfMinty runs Tesseract OCR compiled to WebAssembly directly inside your browser. Your confidential scanned pages are processed locally without cloud server uploads.',
    },
    {
      question: 'What image quality gives the best OCR accuracy?',
      answer: 'Clear scans with 300 DPI resolution, good contrast, and minimal background noise produce the highest text accuracy.',
    },
    {
      question: 'Can I extract the recognized text directly to a file?',
      answer: 'Yes. You can download the newly searchable PDF or copy the extracted plain text directly to your clipboard.',
    },
  ],

  // 19. AI Analyze PDF (Intelligence)
  intelligence: [
    {
      question: 'What can AI PDF Analysis do with my documents?',
      answer: 'AI Analysis lets you instantly generate executive summaries, extract key data points, translate content, and ask natural language questions about your PDF document.',
    },
    {
      question: 'Is my confidential document sent to train public AI models?',
      answer: 'No. Requests are processed securely via encrypted API endpoints without retaining or training on your proprietary document data.',
    },
    {
      question: 'Can I analyze large PDF reports or research papers?',
      answer: 'Yes. The system parses multi-page documents, identifies key sections, and answers complex contextual questions about tables, findings, and figures.',
    },
    {
      question: 'What types of questions can I ask the PDF AI?',
      answer: 'You can ask for summaries, bulleted takeaways, specific numerical lookups, legal contract clause explanations, or key topic breakdowns.',
    },
    {
      question: 'Do I need to install any software or plugins to use AI PDF analysis?',
      answer: 'No. Processing runs directly inside your web browser on desktop, laptop, and mobile devices.',
    },
  ],

  // 20. Image to PDF
  'image-to-pdf': [
    {
      question: 'Which image formats can I convert into a PDF?',
      answer: 'You can convert JPG, JPEG, PNG, WebP, GIF, and BMP images into high-quality PDF documents.',
    },
    {
      question: 'Can I convert multiple images into a single multi-page PDF?',
      answer: 'Yes! Upload multiple images at once, reorder them as desired, and convert them into one combined PDF document or individual PDF files.',
    },
    {
      question: 'Can I adjust page margins and orientation (Portrait/Landscape)?',
      answer: 'Yes. You can configure page orientation, select standard sizes (like A4, Letter, or Fit to Image), and adjust margin spacing before conversion.',
    },
    {
      question: 'Will converting images to PDF reduce their visual quality?',
      answer: 'No. Images are embedded into the PDF container using original resolution to preserve clarity and detail.',
    },
    {
      question: 'Are my uploaded photos converted privately on my device?',
      answer: 'Yes. Image processing and PDF assembly occur 100% locally in your browser memory.',
    },
  ],

  // 21. PDF to Image
  'pdf-to-image': [
    {
      question: 'What image formats can I export my PDF pages to?',
      answer: 'You can convert PDF pages into high-resolution PNG or JPG image files.',
    },
    {
      question: 'Can I adjust the DPI image resolution for crisp printing or viewing?',
      answer: 'Yes. You can choose output resolution settings (e.g., standard 150 DPI or crisp 300 DPI) for optimal image clarity.',
    },
    {
      question: 'How do I download converted page images?',
      answer: 'You can download individual page images as standalone files or download all pages packaged neatly in a single ZIP archive.',
    },
    {
      question: 'Can I extract images from scanned PDFs or multi-page documents?',
      answer: 'Yes. Every page in your PDF is rendered to a clean pixel-perfect image frame ready for instant download.',
    },
    {
      question: 'Does converting PDF to images require uploading files to a server?',
      answer: 'No. Canvas rendering runs locally in your web browser, ensuring complete privacy for your documents.',
    },
  ],

  // 22. PDF to Markdown
  'pdf-to-markdown': [
    {
      question: 'How does PDF to Markdown conversion preserve document structure?',
      answer: 'The conversion engine detects headings (#, ##, ###), bullet lists, bold/italic text styling, code blocks, and blockquotes, mapping them cleanly to standard Markdown syntax.',
    },
    {
      question: 'Can I copy the Markdown output directly to my note-taking apps (Obsidian, Notion, Logseq)?',
      answer: 'Yes. With one click, you can copy formatted Markdown or download a `.md` file ready to import directly into Notion, Obsidian, GitHub, or LLM prompts.',
    },
    {
      question: 'Does PDF to Markdown work on scanned PDFs?',
      answer: 'For scanned PDFs without a text layer, you should first run our OCR PDF tool to create text before converting to Markdown.',
    },
    {
      question: 'What happens to tables when converting PDF to Markdown?',
      answer: 'Tabular data is parsed and formatted into clean Markdown grid tables whenever structured table columns are detected.',
    },
    {
      question: 'Is my document converted privately without cloud servers?',
      answer: 'Yes. Text extraction and Markdown formatting are processed completely inside your local web browser.',
    },
  ],
};

/**
 * Helper function to retrieve FAQs for a specific tool ID or slug.
 */
export function getToolFaqs(toolIdOrSlug: string): FAQItem[] {
  if (!toolIdOrSlug) return [];
  const normalized = toolIdOrSlug.toLowerCase().trim().replace(/^\//, '');

  // Exact match in TOOL_FAQS
  if (TOOL_FAQS[normalized]) {
    return TOOL_FAQS[normalized];
  }

  // Alias mappings if slug differs from key
  const aliasMap: Record<string, string> = {
    'merge-pdf': 'merge',
    'split-pdf': 'split',
    'rotate-pdf': 'rotate',
    'delete-pdf-pages': 'delete-pages',
    'extract-pages-pdf': 'extract-pages',
    'extract-pdf-pages': 'extract-pages',
    'reorder-pdf': 'reorder',
    'watermark-pdf': 'watermark',
    'add-page-numbers-pdf': 'page-numbers',
    'add-page-numbers': 'page-numbers',
    'add-blank-page-pdf': 'add-blank',
    'add-blank-page': 'add-blank',
    'encrypt-pdf': 'protect',
    'protect-pdf': 'protect',
    'unlock-pdf': 'unlock',
    'image-to-pdf': 'image-to-pdf',
    'jpg-to-pdf': 'image-to-pdf',
    'pdf-to-image': 'pdf-to-image',
    'pdf-to-jpg': 'pdf-to-image',
    'pdf-to-markdown': 'pdf-to-markdown',
    'ai-analyze-pdf': 'intelligence',
    'grayscale-pdf': 'grayscale-pdf',
    'flatten-pdf': 'flatten-pdf',
    'repair-pdf': 'repair-pdf',
    'edit-pdf-metadata': 'edit-metadata',
    'sanitize-pdf': 'sanitize-pdf',
    'sign-pdf': 'sign-pdf',
    'ocr-pdf': 'ocr-pdf',
  };

  const matchedKey = aliasMap[normalized];
  if (matchedKey && TOOL_FAQS[matchedKey]) {
    return TOOL_FAQS[matchedKey];
  }

  return [];
}
