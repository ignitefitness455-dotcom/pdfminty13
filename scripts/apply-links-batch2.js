import fs from 'fs';
import path from 'path';

const seoDataPath = path.resolve('src/config/seo-data.ts');
let content = fs.readFileSync(seoDataPath, 'utf8');

// 1. OCR Tool -> Scanned PDF Guide
const ocrTarget = 'directly into editable Markdown text sheets.</p>';
const ocrReplacement = 'directly into editable Markdown text sheets. For a full workflow on <a href="/blog/how-to-make-a-scanned-pdf-searchable/">diagnosing and extracting text from image-only documents</a>, read our extraction guide.</p>';
content = content.replace(ocrTarget, ocrReplacement);

// 2. PDF to Word Guide -> PDF to Markdown & Extract Pages
const p2wTarget = `      <ol class="list-decimal pl-6 space-y-3 mb-6">
        <li><strong>Step 1: Open the Extraction Tool</strong><br />Navigate to PdfMinty's <a href="/pdf-to-markdown/" class="text-emerald-600 font-bold underline">PDF to Markdown tool</a>.</li>
        <li><strong>Step 2: Load Your PDF Locally</strong><br />Select your file. The processing happens instantly in your browser. No files are uploaded to any server.</li>
        <li><strong>Step 3: Export Clean Text</strong><br />The tool extracts the logical text, headings, and lists into a clean Markdown format.</li>
        <li><strong>Step 4: Paste into Word</strong><br />Open a new, blank Microsoft Word document. Copy the extracted text from PdfMinty and paste it into Word. Now you have clean, natively flowing text that you can format exactly how you want—without fighting invisible text boxes.</li>
      </ol>`;
const p2wReplacement = `      <ol class="list-decimal pl-6 space-y-3 mb-6">
        <li><strong>Step 1: Prepare the File</strong><br />If your PDF is massive, consider <a href="/extract-pages-pdf/" class="text-emerald-600 font-bold underline">pulling out only the necessary pages</a> first.</li>
        <li><strong>Step 2: Open the Extraction Tool</strong><br />Begin by <a href="/pdf-to-markdown/" class="text-emerald-600 font-bold underline">extracting the logical text and headings into clean Markdown</a>. The processing happens instantly in your browser. No files are uploaded to any server.</li>
        <li><strong>Step 3: Paste into Word</strong><br />Open a new, blank Microsoft Word document. Copy the extracted text from PdfMinty and paste it into Word. Now you have clean, natively flowing text that you can format exactly how you want—without fighting invisible text boxes.</li>
      </ol>`;
content = content.replace(p2wTarget, p2wReplacement);

// 3. Scanned PDF Guide -> OCR Tool & PDF to Word Guide
const scannedTarget = `      <ol class="space-y-3 my-6">
        <li><strong>Open the Tool:</strong> Navigate to PdfMinty's <a href="/ocr-pdf/" class="text-emerald-600 font-bold underline">OCR PDF tool</a>.</li>
        <li><strong>Load the File Locally:</strong> Select your scan. The file remains on your device; no upload is required.</li>
        <li><strong>Transcribe:</strong> The local AI engine analyzes the pixel shapes and transcribes the characters.</li>
        <li><strong>Export and Edit:</strong> Download the extracted Markdown or Plain Text file. You can now copy the content and paste it into Word, Google Docs, or your email.</li>
      </ol>`;
const scannedReplacement = `      <ol class="space-y-3 my-6">
        <li><strong>Open the Tool:</strong> Open the OCR tool to begin <a href="/ocr-pdf/" class="text-emerald-600 font-bold underline">running optical character recognition locally</a>.</li>
        <li><strong>Load the File Locally:</strong> Select your scan. The file remains on your device; no upload is required.</li>
        <li><strong>Transcribe:</strong> The local AI engine analyzes the pixel shapes and transcribes the characters.</li>
        <li><strong>Export and Edit:</strong> Download the extracted Markdown. You can now copy the content and <a href="/blog/how-to-convert-pdf-to-word-for-free-2026/" class="text-emerald-600 font-bold underline">paste it safely into Microsoft Word without breaking formatting</a>.</li>
      </ol>`;
content = content.replace(scannedTarget, scannedReplacement);

fs.writeFileSync(seoDataPath, content, 'utf8');
console.log('Applied Second Batch Links successfully!');
