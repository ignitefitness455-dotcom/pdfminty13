<div align="center">
  <h1>PDFMinty</h1>
  <p><strong>Privacy-first, client-side PDF tools for the browser</strong></p>
  <p><a href="https://pdfminty.com/">Try PdfMinty online</a> · Standard tools process locally in your browser</p>
</div>

> **Privacy scope:** PdfMinty’s standard PDF operations are designed to run locally in the browser. AI-powered workflows such as OCR, PDF analysis, and PDF-to-Markdown use a separate network path and should be used only after reviewing the product’s consent and provider disclosures. Do not treat this README as a promise that every feature has the same data path.

---

## 🌟 Overview

**PDFMinty** is a browser-based PDF toolkit for common document tasks such as merging, splitting, rotating, protecting, signing, sanitizing, converting, and organizing PDF files. Core operations are designed to process documents **inside the browser** using WebAssembly and client-side JavaScript, avoiding an upload-first workflow for those operations.

Intelligent features such as PDF Analysis, OCR, and PDF-to-Markdown use a separate serverless proxy/provider path. The live product explains the applicable consent and data-handling boundary; users should review that disclosure before sending extracted text or images to an AI provider. See the [live PdfMinty website](https://pdfminty.com/) for the current feature and privacy details.

---

## ✨ Features & Tools

### 📄 Document Manipulation
* **Merge PDF** — Combine multiple PDFs into a single organized document.
* **Split PDF** — Divide PDFs by page ranges or extract separate pages.
* **Reorder Pages** — Drag-and-drop page thumbnail arrangement.
* **Delete Pages** — Visual page selection and instant deletion.
* **Extract Pages** — Select and pull out specific pages into a new PDF.
* **Add Blank Page** — Insert blank pages at custom positions.
* **Rotate PDF** — Rotate individual or all pages with preview support.

### 🔒 Security & Privacy
* **Protect PDF** — Encrypt PDFs with user & owner passwords.
* **Unlock PDF** — Remove password protection from authorized PDFs.
* **Sanitize PDF** — Strip hidden metadata, embedded scripts, and hidden attachments.
* **Sign PDF** — Add signature stamps, drawing signatures, and text overlays.

### 🎨 Formatting & Conversion
* **Image to PDF** — Convert JPG, PNG, and WebP images to a PDF.
* **PDF to Image** — Export PDF pages as high-resolution PNG or JPEG images.
* **Watermark PDF** — Add custom text or image watermarks with controllable opacity and rotation.
* **Add Page Numbers** — Custom page numbering with header/footer alignment styles.
* **Grayscale PDF** — Convert colorful PDFs into monochrome documents.
* **Flatten PDF** — Lock form fields and annotations into static page elements.
* **Repair PDF** — Re-render corrupted or broken PDF structures.
* **Edit Metadata** — Update title, author, subject, and keywords.

### 🤖 AI-Powered Intelligence
* **AI Analyze PDF** — Ask questions, generate summaries, and extract insights from documents.
* **PDF to Markdown** — Convert structured PDF layouts into clean Markdown text.
* **OCR PDF** — Extract text from scanned documents using vision model OCR.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 18 + TypeScript + Vite
* **Styling:** Tailwind CSS + Lucide Icons
* **PDF Processing Engine:** `pdf-lib`, `@cantoo/pdf-lib`, `pdfjs-dist`
* **Serverless Backend:** Cloudflare Pages Functions
* **AI Provider Support:** Groq API (`GROQ_API_KEY`), Google Gemini API (`GEMINI_API_KEY`), xAI Grok (`GROK_API_KEY`)
* **Testing & Quality:** Vitest, ESLint, TypeScript

---

## 🚀 Local Development

### Prerequisites
* **Node.js**: v18+ 
* **npm** or **bun**
* **Wrangler CLI** (for Cloudflare Pages Functions testing)

### Quick Start

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (or set Cloudflare Secrets in production):
   ```env
   # API Keys for AI features (Groq, Gemini, or xAI)
   GROQ_API_KEY=your_groq_api_key_here
   # GEMINI_API_KEY=your_gemini_api_key_here
   # GROK_API_KEY=your_grok_api_key_here
   ```

3. **Start Vite Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Test Cloudflare Pages Functions locally (Proxy & AI API):**
   ```bash
   npm run pages:dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🧪 Code Quality & Testing

```bash
# Type check TypeScript files
npm run typecheck

# Run linter
npm run lint

# Run unit & component tests
npm run test

# Check formatting
npm run format:check
```

---

## 🔗 Links

* **Live website:** https://pdfminty.com/
* **Privacy policy:** https://pdfminty.com/privacy-policy/
* **Terms of service:** https://pdfminty.com/terms-of-service/
* **Blog:** https://pdfminty.com/blog/

## 🛡️ Security & Privacy Notice

* **Client-First Philosophy:** All core PDF editing operations (merge, split, encrypt, rotate, watermark, convert) run completely in-browser. Your files are **never uploaded** to any server.
* **AI Proxy Security:** When using AI features (OCR, Analyze, Markdown conversion), only the relevant text/images are sent securely over HTTPS to your configured AI provider proxy (`/api/gemini-proxy`).
* **Content Security Policy:** Built-in dynamic CSP headers protect users against XSS and injection attacks.

---

## 📜 License

Distributed under the MIT License.
