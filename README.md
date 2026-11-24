<div align="center">
  <h1>PDFMinty</h1>
  <p><strong>Privacy-first, client-side PDF tools for the browser</strong></p>
  <p><a href="https://pdfminty.com/">Try PdfMinty online</a> · Standard tools process locally in your browser</p>
</div>

> **Privacy scope:** PdfMinty’s 22 standard PDF operations (including Merge, Split, Compress, Sign, Protect, Unlock, and PDF to Markdown) run 100% locally in the browser with zero document uploads. Only our 2 opt-in cloud AI tools — **AI Analyze PDF** (`/ai-analyze-pdf/`) and **OCR PDF** (`/ocr-pdf/`) — use a separate encrypted serverless proxy (`/api/gemini-proxy`) routed to configured AI providers (**Google Gemini, Groq, and/or xAI Grok**) strictly after explicit user checkbox consent.

---

## 🌟 Overview

**PDFMinty** is a browser-based PDF toolkit with 24 tools (22 browser-local standard tools + 2 opt-in cloud AI tools) for merging, splitting, rotating, protecting, signing, sanitizing, converting, and organizing PDF files. All 22 standard operations process documents **100% inside the browser** using WebAssembly and client-side JavaScript without uploading files to any server.

Our 2 opt-in intelligent features (**AI Analyze PDF** and **OCR PDF**) use a stateless serverless proxy (`/api/gemini-proxy`) backed by Google Gemini, Groq, and/or xAI Grok only after the user checks an explicit consent box. See the [live PdfMinty website](https://pdfminty.com/) and [Privacy Policy](https://pdfminty.com/privacy-policy/) for full disclosures.

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
* **PDF to Markdown** — Convert structured PDF layouts into clean Markdown text 100% locally in your browser (with optional embedded image extraction).

### 🤖 Opt-In Cloud AI Intelligence (Explicit Consent Required)
* **AI Analyze PDF** — Ask questions, generate summaries, and extract insights from locally extracted PDF text via `/api/gemini-proxy` (Google Gemini, Groq, and/or xAI Grok).
* **OCR PDF** — Extract text from scanned documents using cloud vision OCR via `/api/gemini-proxy` (Google Gemini, Groq, and/or xAI Grok).

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

* **Client-First Philosophy:** All 22 standard PDF operations (including Merge, Split, Encrypt, Rotate, Watermark, Sign, Compress, and PDF to Markdown) run 100% in-browser. Your files are **never uploaded** to any server.
* **Opt-In AI Proxy Security:** Only **AI Analyze PDF** and **OCR PDF** transmit extracted text or selected rendered page images over HTTPS to `/api/gemini-proxy` (backed by configured Google Gemini, Groq, and/or xAI Grok keys) strictly after explicit user consent.
* **Content Security Policy:** Built-in dynamic CSP headers protect users against XSS and injection attacks.

---

## 📜 License

Distributed under the MIT License.
