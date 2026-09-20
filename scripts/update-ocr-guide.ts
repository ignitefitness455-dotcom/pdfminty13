import fs from 'fs';
import path from 'path';

const seoDataPath = path.resolve('src/config/seo-data.ts');
let content = fs.readFileSync(seoDataPath, 'utf8');

const regex = /{[\s]*id:\s*'how-to-make-a-scanned-pdf-searchable'[\s\S]*?(?=},\s*{[\s]*id:|$)/;

const newGuide = `{
    id: 'how-to-make-a-scanned-pdf-searchable',
    slug: 'blog/how-to-make-a-scanned-pdf-searchable',
    name: 'How to Extract Text from a Scanned PDF Image Offline',
    ogImage: '/og-image.png',
    shortDescription: 'Learn how to use offline OCR to extract readable, copyable text or Markdown from scanned and image-only PDFs without uploading them.',
    metaTitle: 'How to Extract Text from a Scanned PDF Image (OCR Guide) | PdfMinty',
    metaDescription: 'Extract text from scanned PDFs safely offline. Learn how to run optical character recognition (OCR) locally to pull text and Markdown from image-only documents.',
    h1: 'How to Extract Text from a Scanned PDF Image Offline',
    icon: 'Scan',
    category: 'blog',
    priority: 0.8,
    changefreq: 'monthly',
    type: 'article',
    datePublished: '2026-08-26',
    dateModified: '2026-09-04',
    author: 'PdfMinty Editorial Team',
    reviewedBy: 'Alex Mercer, Security Lead',
    lastReviewedDate: 'September 4, 2026',
    problemSolved: "Users have an image-only PDF and need to extract the text out of it so they can paste it into Word, edit it, or search it—without relying on privacy-invasive cloud OCR services.",
    relatedLinks: [
      {
        title: 'OCR PDF Tool',
        url: '/ocr-pdf/',
        type: 'tool',
      },
      {
        title: 'PDF to Markdown Tool',
        url: '/pdf-to-markdown/',
        type: 'tool',
      },
      {
        title: 'Sanitize PDF Tool',
        url: '/sanitize-pdf/',
        type: 'tool',
      },
      {
        title: 'How to Convert PDF to Word for Free',
        url: '/blog/how-to-convert-pdf-to-word-for-free-2026/',
        type: 'article',
      },
    ],
    faqs: [
      {
        q: 'What does OCR do to a scanned PDF?',
        a: 'Optical Character Recognition (OCR) analyzes the visible pixels in an image-only document, recognizes the letters, and outputs them as machine-readable plain text or Markdown.',
      },
      {
        q: 'Does this create a "Searchable PDF" file?',
        a: 'No. Traditional "Searchable PDFs" try to hide text behind the original image, which often leads to bloated files and awkward selection errors. Our workflow extracts the clean text directly out of the PDF so you can edit, search, or paste it into a Word document.',
      },
      {
        q: 'How does PdfMinty handle privacy during OCR processing?',
        a: 'The OCR engine runs entirely inside your browser (using WebAssembly) on your local device. The text recognition happens offline, and your confidential scanned images are never uploaded to a cloud server.',
      }
    ],
    longFormBody: \`
      <h1>How to Extract Text from a Scanned PDF Image Offline</h1>

      <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        A scanned PDF may look like a normal document, but each page is actually just a photograph. That is why pressing <strong>Ctrl+F</strong> produces no results, and you cannot highlight or copy the text. To fix this, you need <strong>Optical Character Recognition (OCR)</strong>.
      </p>

      <p>
        In this guide, we will explain how to extract clean, readable text from your scanned documents entirely offline, so you can edit it or paste it into a Word document without risking your privacy.
      </p>

      <h2>How to Tell if Your PDF is Image-Only</h2>
      <p>
        Open the PDF in a viewer and try these quick tests:
      </p>
      <ol class="space-y-2 my-4">
        <li><strong>The Highlight Test:</strong> Try to drag your cursor to highlight a single sentence. If the entire page turns blue (selected as one giant image), there is no text layer.</li>
        <li><strong>The Search Test:</strong> Press <code>Ctrl+F</code> and search for a word you clearly see on the screen. If it finds 0 results, it's a scan.</li>
      </ol>

      <h2>The Workflow: Extracting Text (Not Hiding It)</h2>
      <p>
        Some older enterprise software attempts to create a "Searchable PDF" by keeping the heavy photograph and pasting an invisible text layer behind it. This creates massive, bloated files where the cursor often selects the wrong invisible word.
      </p>
      <p>
        Modern workflows prioritize <strong>extraction</strong>. Instead of hiding the text, PdfMinty pulls it out completely, giving you a clean Text (.txt) or Markdown (.md) file that you can easily read, search, or paste into Microsoft Word.
      </p>

      <ol class="space-y-3 my-6">
        <li><strong>Open the Tool:</strong> Navigate to PdfMinty's <a href="/ocr-pdf/" class="text-emerald-600 font-bold underline">OCR PDF tool</a>.</li>
        <li><strong>Load the File Locally:</strong> Select your scan. The file remains on your device; no upload is required.</li>
        <li><strong>Transcribe:</strong> The local AI engine analyzes the pixel shapes and transcribes the characters.</li>
        <li><strong>Export and Edit:</strong> Download the extracted Markdown or Plain Text file. You can now copy the content and paste it into Word, Google Docs, or your email.</li>
      </ol>

      <h2>How to Improve OCR Accuracy</h2>
      <p>
        OCR AI interprets pixels. A clean, straight, high-resolution scan (300 DPI) produces vastly better results than a blurry, skewed photograph taken in dim lighting. Remove dark borders and ensure the page is correctly rotated before running character recognition.
      </p>

      <div class="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3 my-6 not-prose">
        <h3 class="text-base font-bold text-emerald-900 dark:text-emerald-100 m-0">The Local Privacy Advantage</h3>
        <p class="text-sm text-emerald-700 dark:text-emerald-300 m-0 leading-relaxed">
          Traditional OCR services require you to upload your sensitive medical records or financial scans to remote servers. PdfMinty executes the OCR engine directly inside your web browser via WebAssembly. Your images are transcribed locally, ensuring absolute data sovereignty.
        </p>
      </div>
    \`
  }`;

if (regex.test(content)) {
  content = content.replace(regex, newGuide);
  fs.writeFileSync(seoDataPath, content, 'utf8');
  console.log('Updated OCR guide successfully.');
} else {
  console.error('Could not find OCR guide using regex.');
}
