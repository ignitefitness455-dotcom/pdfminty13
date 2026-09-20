import fs from 'fs';
import path from 'path';

const seoDataPath = path.resolve('src/config/seo-data.ts');
let content = fs.readFileSync(seoDataPath, 'utf8');

const newGuides = `
  {
    id: 'blog-how-to-combine-scanned-documents-into-one-pdf',
    slug: 'blog/how-to-combine-scanned-documents-into-one-pdf',
    name: 'How to Combine Scanned Documents into One PDF (Without Crashing)',
    ogImage: '/og-image.png',
    shortDescription: 'Learn how to merge heavy scanned PDFs, reduce their file size using Grayscale conversion, and create a single clean document offline.',
    metaTitle: 'How to Combine Scanned Documents into One PDF | PdfMinty',
    metaDescription: 'Merge large scanned image PDFs safely offline. Learn how to combine documents, reduce file size with grayscale compression, and organize pages.',
    h1: 'How to Combine Scanned Documents into One PDF (Without Crashing)',
    icon: 'Layers',
    category: 'Optimization',
    priority: 0.7,
    changefreq: 'monthly',
    type: 'article',
    datePublished: '2026-09-04',
    dateModified: '2026-09-04',
    problemSolved: "Combining multiple high-resolution scanned PDFs often results in a massive, un-shareable file that crashes email clients. This guide solves the merging and optimization workflow.",
    relatedLinks: [
      {
        title: 'Merge PDF Tool',
        url: '/merge-pdf/',
        type: 'tool',
      },
      {
        title: 'Grayscale PDF Tool',
        url: '/grayscale-pdf/',
        type: 'tool',
      },
      {
        title: 'Why Is My PDF So Large?',
        url: '/blog/why-is-my-pdf-so-large/',
        type: 'article',
      },
    ],
    faqs: [
      {
        q: 'Why does my merged scanned PDF file get so large?',
        a: 'Scanners often capture 24-bit color at 600 DPI by default. When you combine several of these pages, you are essentially stacking massive raw images together.',
      },
      {
        q: 'How can I reduce the size after merging?',
        a: 'The most effective method for scanned documents is converting the final merged PDF to Grayscale. This instantly discards unnecessary color channel data and shrinks the file significantly.',
      }
    ],
    longFormBody: \`
      <h1>How to Combine Scanned Documents into One PDF (Without Crashing)</h1>

      <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        Merging normal text documents is easy. But when you try to combine multiple scanned contracts, receipts, or medical records, you often end up with a massive 50MB file that crashes your email client.
      </p>

      <p>
        Scanned PDFs are essentially collections of high-resolution photographs embedded in a document container. In this guide, we will show you how to safely combine them, organize the pages, and most importantly, compress the final output so it can actually be uploaded or emailed.
      </p>

      <h2>1. Merge the Scanned Files</h2>
      <p>
        First, bring all your documents into a single file. Use PdfMinty's <a href="/merge-pdf/" class="text-emerald-600 font-bold underline">Merge PDF tool</a>. Because this tool runs entirely in your browser, you don't have to wait for heavy 20MB scans to upload to a remote server. The files are combined instantly on your local device.
      </p>

      <h2>2. Reorder or Delete Blank Pages</h2>
      <p>
        Scanners often pull through blank sheets, or they might scan the back of a single-sided page. Once your files are merged, you can use the <a href="/delete-pages-pdf/" class="text-emerald-600 font-bold underline">Delete Pages</a> or <a href="/reorder-pdf/" class="text-emerald-600 font-bold underline">Reorder Pages</a> tools to clean up the structure of your newly combined document.
      </p>

      <h2>3. The Secret to Shrinking Scanned PDFs</h2>
      <p>
        Here is the critical step that most people miss: <strong>Color channel compression</strong>. Default scanner software usually captures in 24-bit RGB full color, even if the document is just black text on white paper.
      </p>
      <p>
        To fix this, take your merged file and run it through the <a href="/grayscale-pdf/" class="text-emerald-600 font-bold underline">Grayscale PDF tool</a>. Converting a scanned document from 24-bit color to 8-bit grayscale immediately throws away two-thirds of the image data weight. This can shrink a 40MB merged scan down to a manageable 10MB or 5MB file, without losing text crispness.
      </p>
    \`,
  },
  {
    id: 'blog-how-to-rearrange-pdf-pages-offline',
    slug: 'blog/how-to-rearrange-pdf-pages-offline',
    name: 'How to Rearrange Pages in a PDF (Offline Drag & Drop Guide)',
    ogImage: '/og-image.png',
    shortDescription: 'Learn how to visually rearrange, swap, and reorder PDF pages securely offline without using Adobe Acrobat.',
    metaTitle: 'How to Rearrange Pages in a PDF Offline | PdfMinty',
    metaDescription: 'Easily rearrange and swap PDF pages using an offline, visual drag-and-drop editor. No Adobe Acrobat required. 100% private in-browser processing.',
    h1: 'How to Rearrange Pages in a PDF (Offline Drag & Drop Guide)',
    icon: 'ListOrdered',
    category: 'organize',
    priority: 0.6,
    changefreq: 'monthly',
    type: 'article',
    datePublished: '2026-09-04',
    dateModified: '2026-09-04',
    problemSolved: "Users needing to fix the page order of a compiled PDF document without expensive desktop software or risky cloud uploads.",
    relatedLinks: [
      {
        title: 'Reorder PDF Pages Tool',
        url: '/reorder-pdf/',
        type: 'tool',
      },
      {
        title: 'Extract PDF Pages',
        url: '/extract-pages-pdf/',
        type: 'tool',
      },
    ],
    faqs: [
      {
        q: 'Do I need Adobe Acrobat to rearrange pages?',
        a: 'No. Modern browser-based tools like PdfMinty allow you to visually drag and drop pages into a new order completely for free, without installing desktop software.',
      },
      {
        q: 'Is the page quality preserved when I reorder them?',
        a: 'Yes. Reordering tools simply update the PDF catalog index. The actual page content, resolution, and quality remain 100% untouched and original.',
      }
    ],
    longFormBody: \`
      <h1>How to Rearrange Pages in a PDF (Offline Drag & Drop Guide)</h1>

      <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        Sometimes a scanned document comes out backward. Sometimes you need to move the Executive Summary to the front of the report. Fixing the page order of a PDF shouldn't require an expensive Adobe Acrobat subscription.
      </p>

      <p>
        In this guide, we'll show you how to use a visual, offline drag-and-drop workspace to reorder your PDF pages in seconds—without uploading your private documents to a cloud server.
      </p>

      <h2>The Visual Drag-and-Drop Workflow</h2>
      <p>
        The easiest way to fix page order is visually. Instead of typing page numbers like "1, 5, 2-4", you should be able to see thumbnails and move them with your mouse.
      </p>
      
      <ol class="space-y-3 my-6">
        <li><strong>Open the Tool:</strong> Go to PdfMinty's <a href="/reorder-pdf/" class="text-emerald-600 font-bold underline">Reorder PDF Pages</a> tool.</li>
        <li><strong>Load the File:</strong> Select your PDF. It loads instantly because the processing happens locally in your browser memory (WebAssembly), not on a remote server.</li>
        <li><strong>Drag to Swap:</strong> You will see a grid of page thumbnails. Click and hold on a page, then drag it to its correct position. The other pages will automatically shift to make room.</li>
        <li><strong>Export:</strong> Click the "Apply Changes" button. The new file is generated instantly.</li>
      </ol>

      <h2>Why Offline Processing Matters for Organizing</h2>
      <p>
        If you are rearranging a legal contract, financial report, or medical record, privacy is paramount. Traditional online PDF tools force you to upload the file to their servers, process it, and download it again. This introduces security risks and delays.
      </p>
      <p>
        PdfMinty's Reorder tool processes the file using your device's own CPU. The file never leaves your computer, ensuring absolute confidentiality.
      </p>
    \`,
  },
  {
    id: 'blog-how-to-convert-pdf-to-jpg-high-resolution',
    slug: 'blog/how-to-convert-pdf-to-jpg-high-resolution',
    name: 'How to Convert PDF to JPG High Resolution (Without Blurry Text)',
    ogImage: '/og-image.png',
    shortDescription: 'Stop getting blurry images when converting PDFs. Learn how to extract high-resolution, 300 DPI quality JPGs and PNGs from your PDF documents.',
    metaTitle: 'How to Convert PDF to JPG High Resolution | PdfMinty',
    metaDescription: 'Learn how to convert PDF pages into high-resolution JPG or PNG images without blurry text. Master scaling, DPI settings, and lossless extraction offline.',
    h1: 'How to Convert PDF to JPG High Resolution (Without Blurry Text)',
    icon: 'Image',
    category: 'convert',
    priority: 0.7,
    changefreq: 'monthly',
    type: 'article',
    datePublished: '2026-09-04',
    dateModified: '2026-09-04',
    problemSolved: "Users complaining that their exported JPGs from PDFs are blurry, pixelated, or unreadable, and seeking a high-DPI extraction workflow.",
    relatedLinks: [
      {
        title: 'PDF to Image Tool',
        url: '/pdf-to-image/',
        type: 'tool',
      },
      {
        title: 'Image to PDF Tool',
        url: '/image-to-pdf/',
        type: 'tool',
      },
    ],
    faqs: [
      {
        q: 'Why does my PDF look blurry when I convert it to a JPG?',
        a: 'PDFs are vector-based, meaning they can scale infinitely. When you convert to JPG, you are rasterizing it into pixels. If the conversion software uses a low default scale (like 72 DPI screen resolution), the text will appear pixelated and blurry.',
      },
      {
        q: 'Which is better for PDF extraction: JPG or PNG?',
        a: 'If your PDF contains mostly text, charts, or flat graphics, PNG is vastly superior because it uses lossless compression that keeps text edges sharp. JPG is better if the PDF consists entirely of photographs.',
      }
    ],
    longFormBody: \`
      <h1>How to Convert PDF to JPG High Resolution (Without Blurry Text)</h1>

      <p class="lead font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        The most common complaint when converting a PDF into an image format is that the resulting picture looks terrible. The text is pixelated, the logos are blurry, and it's impossible to read when printed.
      </p>

      <p>
        In this guide, we'll explain the technical reason why this happens, and how to use scaling settings to generate crisp, high-resolution (300+ DPI equivalent) images from your documents.
      </p>

      <h2>The DPI / Vector Scaling Problem</h2>
      <p>
        PDF files are unique because text and shapes are usually stored as <strong>vectors</strong>—mathematical curves that stay perfectly sharp whether viewed on a phone or printed on a billboard.
      </p>
      <p>
        JPG and PNG formats are <strong>rasters</strong>—fixed grids of pixels. To convert a vector PDF into a raster image, the software has to "paint" the pixels. If the software assumes you only want to view the image on a basic monitor, it will render it at a low scale (e.g., 72 or 96 dots per inch). When you try to zoom in, you just see large, blurry pixels.
      </p>

      <h2>How to Extract High-Resolution Images</h2>
      <p>
        To get sharp text, you must force the conversion engine to render the page at a higher scale.
      </p>
      
      <ol class="space-y-3 my-6">
        <li><strong>Open a Pro-Grade Tool:</strong> Navigate to PdfMinty's <a href="/pdf-to-image/" class="text-emerald-600 font-bold underline">PDF to Image tool</a>.</li>
        <li><strong>Adjust the Scale:</strong> In the tool settings, you will see a Scale or Resolution slider. Instead of the 1.0x default, bump it to <strong>1.5x or 2.0x</strong>. This simulates a high-DPI (e.g., 300 DPI) rendering pass.</li>
        <li><strong>Choose the Right Format:</strong> 
          <ul class="list-disc ml-6 mt-2 space-y-1">
            <li>Choose <strong>PNG</strong> if the document has crisp text, line art, or charts. PNG is lossless and will not introduce compression artifacts around letters.</li>
            <li>Choose <strong>JPG</strong> only if the PDF is a scanned photograph.</li>
          </ul>
        </li>
        <li><strong>Export:</strong> Run the conversion. The resulting file will have much larger pixel dimensions (e.g., 2000+ pixels wide), keeping text perfectly legible.</li>
      </ol>
    \`,
  },
`;

const insertIndex = content.lastIndexOf('];');
if (insertIndex !== -1) {
  content = content.slice(0, insertIndex) + newGuides + content.slice(insertIndex);
  fs.writeFileSync(seoDataPath, content, 'utf8');
  console.log('Added new guides successfully.');
} else {
  console.error('Could not find insert index');
}
