# Project Overview

**PDFMinty** is a high-performance, privacy-first, client-side PDF toolkit and knowledge portal built with React 18, TypeScript, and Vite. Standard document processing operations (such as merge, split, compress, protect, unlock, rotate, sanitize, watermark, page reordering, and e-signatures) execute 100% locally in the user's browser using WebAssembly (`@cantoo/pdf-lib`, `pdfjs-dist`), HTML5 Canvas (`fabric`, `signature_pad`), and Web Workers. Sensitive document binaries never leave the client device.

For opt-in advanced features (AI document analysis and Multimodal Vision OCR), the application interfaces with the **Google Gemini API** (`@google/genai`) via secure server-side proxy middleware. User authentication, daily task quota tracking, and subscription tiers (Guest, Free, PRO) are managed with **Firebase Auth & Firestore** (`firebase`). The application features full internationalization (`i18next`) supporting 7 locales (English, German, French, Spanish, Bengali, Hindi, and Simplified Chinese), comprehensive SEO schema automation, PWA offline capabilities, and deployment on Cloudflare Pages.

---

## Tech Stack

- **Core Framework & Runtime**: React 18 (`react`, `react-dom`), TypeScript 5 (`typescript`), Vite 5 (`vite`, `@vitejs/plugin-react`).
- **Client-Side PDF Engines**: `@cantoo/pdf-lib`, `@pdf-lib/fontkit`, `pdfjs-dist` (with CMaps), `jszip`.
- **Canvas & Interactive UI**: `fabric`, `signature_pad`, `canvas-confetti`.
- **Styling & Icons**: Tailwind CSS 3 (`tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`), `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.
- **Routing & Head Management**: React Router DOM 6 (`react-router-dom`), `react-helmet-async`.
- **Internationalization (i18n)**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-resources-to-backend`.
- **Validation**: Zod 4 (`zod`).
- **Cloud Backend & Edge Middleware**:
  - **AI / LLM**: Google Gemini API SDK (`@google/genai`).
  - **Auth & Database**: Firebase Authentication & Google Cloud Firestore (`firebase`).
  - **Edge Functions**: Cloudflare Pages Functions (`@cloudflare/workers-types`, `wrangler.toml`).
- **Testing & Quality Assurance**: Vitest 4 (`vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`), ESLint 9 (`eslint`, `typescript-eslint`), Prettier 3 (`prettier`), Knip (`knip`), Husky 9 (`husky`), Lint-Staged (`lint-staged`).
- **Build & Asset Automation**: `tsx`, `sharp`, `png-to-ico`, `esbuild`, `rollup-plugin-visualizer`.

---

## Commands

All scripts are executed via `npm`:

### Development & Preview
- `npm run dev`: Launch the Vite development server on `http://0.0.0.0:3000` with hot reload and embedded dev API proxy middleware.
- `npm run preview`: Preview the production build locally.
- `npm run pages:dev`: Run Cloudflare Pages local development emulator using Wrangler.

### Production Build & Static Asset Generation
- `npm run build`: Execute production build with Vite, generate OG images, child XML sitemaps, pre-render static HTML pages for SEO, and minify HTML.
- `npm run generate:sitemap`: Build `sitemap.xml` and granular sitemaps (`sitemap-tools.xml`, `sitemap-blog.xml`, `sitemap-pages.xml`).
- `npm run generate:og-images`: Render high-resolution OpenGraph preview images.
- `npm run generate:icons`: Generate PWA icons and multi-size `favicon.ico`.
- `npm run generate:images`: Optimize static web graphics using Sharp.
- `npm run download:font`: Fetch and optimize local web fonts into `public/fonts/`.

### Code Quality, Linting & Formatting
- `npm run typecheck`: Run TypeScript compiler type-check (`tsc --noEmit`).
- `npm run lint`: Run ESLint over `src/` and `functions/`.
- `npm run lint:fix`: Automatically fix linting and style errors.
- `npm run format`: Format TypeScript, TSX, and CSS code with Prettier.
- `npm run format:check`: Check files against Prettier formatting rules.
- `npm run knip`: Detect unused files, dependencies, and exports.
- `npm run knip:fix`: Automatically prune unused code identified by Knip.

### Testing & Audits
- `npm run test`: Run the test suite with Vitest in headless mode.
- `npm run test:ui`: Launch Vitest with the interactive web UI.
- `npm run test:coverage`: Run Vitest and output test coverage report.
- `npm run validate:seo`: Audit metadata, canonical tags, and schema tags across all routes.
- `npm run validate:parity`: Verify key parity across all 7 translation locales.
- `npm run seo:refresh`: Run annual SEO refresh automations.
- `npm run seo:audit`: Audit SEO configurations without modifying content.
- `npm run ci`: Complete CI validation pipeline (`typecheck`, `validate:seo`, `lint`, `format:check`, `test`, `build`).

---

## Project Directory & Architecture

```text
├── .aistudio/                 # AI Studio configuration and planning artifacts
├── docs/                      # SEO refresh schedules and editorial guidelines
├── errors/                    # Telemetry templates and error log processors
├── functions/                 # Cloudflare Pages Functions & Edge Middleware
│   ├── _middleware.ts         # Edge routing, canonical 301 redirects, security headers (CSP, HSTS)
│   ├── api/                   # Serverless edge API endpoints (gemini-proxy, contact, error, subscribe)
│   └── utils/                 # CORS, edge rate limiting, and schema validation
├── public/                    # Static web assets
│   ├── cmaps/                 # PDF.js character maps (CJK font support)
│   ├── fonts/                 # Self-hosted web fonts (Sora, JetBrains Mono)
│   ├── standard_fonts/        # Standard PDF Type1 fonts
│   ├── _headers / _redirects  # Cloudflare Pages edge header rules & 301 redirects
│   ├── manifest.json / sw.js  # Progressive Web App manifest and Service Worker
│   ├── robots.txt / ads.txt   # Web crawler and Google AdSense configuration
│   └── sitemap*.xml           # Generated XML sitemaps
├── scripts/                   # Node/TSX build automation & SEO scripts
│   ├── generate-static-pages.ts # Generates static pre-rendered HTML for search crawlers
│   ├── generate-sitemap.ts    # Generates canonical sitemaps
│   ├── validate-locale-parity.ts # Validates i18n key consistency
│   └── ...                    # Image generation, SEO validation, and translation scripts
├── src/                       # Application Frontend Source
│   ├── components/            # Reusable UI & architectural components
│   │   ├── sign-pdf/          # Digital signing canvas and PDF coordinate placement
│   │   ├── ui/                # Base primitives (button, dialog, input, label, switch, tabs)
│   │   ├── ConsentManager.tsx # Google-certified CMP & IAB TCF v2.2 consent manager
│   │   ├── FileUploader.tsx   # Drag-and-drop file uploader with size & quota checks
│   │   ├── Header.tsx / Footer.tsx # Layout components
│   │   ├── SEO.tsx / FaqSchema.tsx # Dynamic meta tags and JSON-LD schema injection
│   │   └── ...                # Feature-specific components
│   ├── config/                # Global configuration
│   │   ├── routes.ts          # Centralized route constants
│   │   ├── seo-data.ts        # Comprehensive SEO metadata, tool definitions, and articles
│   │   └── homeConfig.ts      # Homepage headlines and category settings
│   ├── contexts/              # React Context Providers
│   │   ├── AuthContext.tsx    # Firebase Google OAuth & Email/Password session state
│   │   ├── ThemeContext.tsx   # Dark/light theme management
│   │   ├── ToastContext.tsx   # Global notification toasts
│   │   └── UsageLimitContext.tsx # Tier limits (Guest: 5, Free: 10, Pro: Unlimited)
│   ├── core/                  # Core PDF manipulation modules & WebAssembly helpers
│   │   ├── pdf-operations.ts  # Merge, split, rotate, compress, protect, watermark logic
│   │   ├── PDFSanitizer.ts    # Metadata removal and document sanitization
│   │   └── WorkerManager.ts   # Web Worker dispatch for background file operations
│   ├── data/                  # Static FAQs and localized tool data
│   ├── hooks/                 # Custom React hooks (debounce, online status, PWA install)
│   ├── i18n/                  # i18next configuration and dynamic locale chunking
│   ├── lib/                   # Firebase initialization and signature font definitions
│   ├── locales/               # Translations in JSON (bn, de, en, es, fr, hi, zh)
│   ├── pages/                 # Tool pages and informational routes
│   │   ├── home/              # Homepage sub-sections (Hero, ToolGrid, FAQ, TrustBadges)
│   │   ├── HomePage.tsx       # Root landing page displaying all tools
│   │   ├── MergePage.tsx, SplitPage.tsx, CompressPdfPage.tsx, ... # 30+ interactive tool pages
│   │   ├── PrivacyPolicyPage.tsx # Google OAuth compliant privacy policy
│   │   └── AuthPage.tsx, DashboardPage.tsx, PricingPage.tsx # Account and pricing pages
│   ├── services/              # External services (userService for Firestore synchronization)
│   ├── utils/                 # Utility functions (analytics, logger, download, usageLimit)
│   ├── workers/               # Web Worker entry points (pdf-worker.ts)
│   ├── App.tsx                # Main router tree with lazy-loaded chunks and ErrorBoundary
│   ├── index.css              # Global styles, fonts, and Tailwind utilities
│   └── main.tsx               # Client React DOM root initialization with providers
├── firestore.rules            # Firestore security rules enforcing user data isolation
├── package.json               # Dependency definitions and lifecycle scripts
├── tsconfig.json              # TypeScript strict configuration
├── tailwind.config.js         # Tailwind theme extension and typography plugin setup
├── vite.config.ts             # Vite configuration with chunk splitting and dev API proxy
└── wrangler.toml              # Cloudflare Pages build and KV bindings configuration
```

---

## Coding Standards & Conventions

### 1. TypeScript & Architecture
- **Strict Typing**: TypeScript `strict` mode is enabled. Do not use `any` unless strictly interfacing with legacy third-party objects; favor `unknown` with type guards or strict interfaces.
- **Path Aliases**: Use `@/*` to reference paths inside `/src` (e.g., `import { ROUTES } from '@/config/routes'`).
- **Standard Enums**: Standard TypeScript enums or `as const` object maps must be used; avoid non-standard ambient global declarations.
- **Modular Components**: Maintain modular, functional components utilizing standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`). Complex state machines should be handled via dedicated custom hooks in `src/hooks/`.

### 2. Styling & Design Systems
- **Tailwind CSS Exclusivity**: Style components using Tailwind CSS classes. Do not use inline `style={{ ... }}` blocks or external CSS modules.
- **Dark Mode Support**: Use Tailwind's `dark:` variant across all UI components, respecting the theme set by `ThemeContext`.
- **Contrast & Accessibility**: Ensure contrast ratios conform to WCAG 2.1 AA standards. Ensure interactive buttons, links, and forms include semantic `aria-*` tags and keyboard navigation (`useModal`).

### 3. Internationalization (i18n)
- **Zero Hardcoded Strings**: All UI copy must be translated via `useTranslation('common')`. Keys must be mirrored across all 7 supported locales in `src/locales/{en,bn,de,es,fr,hi,zh}/common.json`.
- **Locale Parity**: Run `npm run validate:parity` before committing any changes to translation files to ensure no missing keys exist.

### 4. Client-Side Processing Discipline
- **Zero Unintended Uploads**: Core PDF operations (merge, split, protect, compress, watermark, etc.) must NEVER transmit files to an external server. Transformations must run entirely within client memory using `@cantoo/pdf-lib`, `pdfjs-dist`, or WebAssembly.
- **Memory Purging**: Revoke all `URL.createObjectURL()` references and purge ArrayBuffers from memory when documents are closed or operations conclude.

---

## Strict Rules & Boundaries ("Never Do This")

1. **Never Send User Files to External Backends for Standard Tools**:
   - Standard PDF utilities must remain 100% client-side.
   - External API calls are ONLY permissible for the opt-in AI Assistant (`/ai-analyze-pdf`) and OCR (`/ocr-pdf`), and MUST pass through the server-side proxy `/api/gemini-proxy` after affirmative user consent.
2. **Never Expose Secret API Keys in Client Code**:
   - Never prefix server secrets with `VITE_`.
   - `GEMINI_API_KEY`, `RESEND_API_KEY`, and administrative keys must be accessed server-side only via environment variables in `vite.config.ts` or Cloudflare Pages environment secrets.
3. **Never Block or Gate the Homepage Behind Authentication**:
   - The root domain (`/` or `https://pdfminty.com/`) must always be 100% publicly accessible.
   - All 30+ tools must allow guest access (5 free daily operations). Do not introduce authentication guards, force redirects, or full-screen blocking modals on the homepage.
4. **Never Modify Google OAuth & Limited Use Disclosures Without Compliance Verification**:
   - The disclosures in `src/pages/PrivacyPolicyPage.tsx` and `src/config/seo-data.ts` regarding Google User Data, data retention, account deletion, and the exact **Google API Services User Data Policy (Limited Use Disclosure)** must be preserved to maintain Google Cloud verification compliance.
5. **Never Use `window.alert` or `window.confirm`**:
   - Use the non-blocking global toast system (`ToastContext`) or custom accessible dialogs (`src/components/ui/dialog.tsx`).
6. **Never Bypass Package Lock Constraints in CI**:
   - Keep `.npmrc` configured with `legacy-peer-deps=true` and commit `package-lock.json` to prevent peer resolution conflicts in npm v10 / Cloudflare Pages.
7. **Never Break Canonical URL Trailing Slashes**:
   - Canonical URLs must always maintain trailing slashes (e.g., `/privacy-policy/`, `/merge-pdf/`). Maintain both client-side route normalization in `App.tsx` and edge 301 normalization in `public/_redirects` and `functions/_middleware.ts`.
