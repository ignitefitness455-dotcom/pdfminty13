# STEP 0 — Capability Check (`audit/00-capabilities.md`)

**Session Date:** 2026-10-20
**Session Mode:** `AUDIT_ONLY` (Read-only outside `audit/`)
**Project / Branch Binding:**
- **AI Studio Applet ID:** `4e7c340b-9502-4a89-8f0f-5ff5f6fd162a` (mounted at `/app/applet`)
- **Git Branch Binding:** **UNKNOWN / UNVERIFIED IN CONTAINER** — `.git` is stripped in the AI Studio runtime (`fatal: not a git repository`), and the `<repo_context>` prompt header contains unfilled `[FILL]` placeholders. **STOP / CONFIRMATION REQUIRED BEFORE FIX MODE:** Please confirm which GitHub branch your AI Studio sync is bound to and verify it is NOT `main`/`master` before authorising any code edits outside `audit/`.

---

## 1. Capability Test Results

| Capability | Status | How It Was Tested & Evidence |
| :--- | :---: | :--- |
| **List the file tree** | **YES** | Tested `list_dir` on `/` (returned 34 root entries) and verified against the full workspace file tree (353 files across `/.aistudio`, `/docs`, `/errors`, `/functions`, `/public`, `/scripts`, `/src`). |
| **Read any file** | **YES** | Tested `view_file` on `/package.json`, `/README.md`, `/metadata.json`, `/vite.config.ts`, `/firebase-blueprint.json`, `/.env.example`, `/functions/api/gemini-proxy.ts`, `/src/lib/firebase.ts`, `/GEMINI.md`, `/firestore.rules`, `/wrangler.toml`, `/eslint.config.ts`, `/.gitignore`, `/package-lock.json`, and `/public/sitemap.xml`. |
| **Search across files** | **YES** | Tested `run_command` with `grep -rn "PDFMinty" src/config/ \| head -n 5`. Returned exact file paths and line numbers (`src/config/seo-data.ts:6`, `:9`, `:212`, `:269`, `:321`). |
| **Create / edit / delete files** | **YES** | Tested on a harmless target inside `/audit/`: created `/audit/_cap_test.tmp` with `write_to_file`, modified line 1 with `replace_file_content`, and removed `/audit/_cap_test.tmp` with `delete_file`. |
| **Run build, lint, type-check and tests and see their output** | **YES** | Tested via `compile_applet`, `lint_applet`, and `run_command` (`npm run typecheck`, `npm run lint`, `npm run test`):<br>• **Build (`compile_applet`)**: Succeeded.<br>• **Lint (`npm run lint` / `lint_applet`)**: Succeeded (`eslint src/ functions/`, exit code `0`, 0 errors).<br>• **Type-check (`npm run typecheck` / `tsc --noEmit`)**: Executed and returned full compiler output (exit code `2`; 24 TypeScript errors across `src/__tests__/error-handler.test.tsx`, `src/components/__tests__/FileUploader.test.tsx`, `src/components/__tests__/InternalSEO.test.tsx`, and `src/core/pdf-operations.ts`).<br>• **Tests (`npm run test` / `vitest run`)**: Executed and returned full Vitest v4.1.12 output (exit code `1`; 7 test suites failed to import due to `Error: Cannot find package '@testing-library/dom' imported from /app/applet/node_modules/@testing-library/jest-dom/dist/vitest.mjs`). |
| **View git history or a diff** | **NO** | Tested `run_command` with `git status && git branch -a && git remote -v && git log -n 15 --oneline` in `/`. Exited with code `128`: `fatal: not a git repository (or any of the parent directories): .git`. **Fallback:** Ask the user to supply git log/diff outputs when commit history is needed. |
| **Fetch a live URL** | **YES** | Tested `run_command` with `curl -I -s --max-time 8 https://pdfminty.com/`. Returned `HTTP/2 200` from Cloudflare (`server: cloudflare`) along with live response headers (`content-security-policy`, `strict-transport-security`, `x-frame-options: DENY`, `cf-cache-status: HIT`). |
| **Use web search** | **YES** | Tested `search_web` with queries `site:pdfminty.com` and `Cloudflare Pages _headers _redirects documentation`. Returned grounded search summaries and source URLs. |
| **Commit and push through the GitHub sync** | **NO** | Because `.git` is absent inside the container (`fatal: not a git repository`), the agent cannot run `git commit` or `git push` from the shell. **Fallback:** File edits made in the workspace must be committed and pushed by the user via the AI Studio GitHub Sync UI, or output as complete files/diffs in chat. |

---

## 2. Status of `audit/data/` Inputs

Checked the file tree for `/audit/data/`: the directory does **not** exist yet.

| Requested Audit Dataset | Status in `audit/data/` | Notes / Available Live Fallback |
| :--- | :---: | :--- |
| PageSpeed Insights mobile & desktop (home, 2–3 tool pages, 1 blog post) | **MISSING** | Please place exports in `audit/data/` or paste metrics in chat when needed. |
| Search Console Performance export (queries & pages, last 3 months) | **MISSING** | Please place CSV/JSON in `audit/data/` or supply in chat. |
| Search Console Pages (indexing) export | **MISSING** | Please place CSV/JSON in `audit/data/` or supply in chat. |
| Search Console Core Web Vitals export | **MISSING** | Please place CSV/JSON in `audit/data/` or supply in chat. |
| `robots.txt` and `sitemap.xml` from the live site | **MISSING** in `audit/data/` (Available in `/public/` & live via `curl`) | Static copies exist at `/public/robots.txt`, `/public/sitemap.xml`, `/public/sitemap-tools.xml`, `/public/sitemap-blog.xml`, `/public/sitemap-pages.xml`, and live URLs at `https://pdfminty.com/robots.txt` and `https://pdfminty.com/sitemap.xml` are directly fetchable via `curl`. |
| Blog post list with URL, title, date, clicks, impressions | **MISSING** (GSC metrics) | URL, title, and publish/modified dates can be computed directly from `/src/config/seo-data.ts`; GSC clicks & impressions require user export. |

---

## 3. Detected Repository Commands (from `package.json` lines 6–33)

- **Install:** `npm install` (with `.npmrc` `legacy-peer-deps=true`)
- **Dev:** `npm run dev` (`vite --host 0.0.0.0 --port 3000`)
- **Build:** `npm run build` (`vite build && tsx scripts/generate-og-images.ts && tsx scripts/generate-sitemap.ts && tsx scripts/generate-static-pages.ts && tsx scripts/minify-html.ts`)
- **Lint:** `npm run lint` (`eslint src/ functions/`)
- **Type-check:** `npm run typecheck` (`tsc --noEmit`)
- **Test:** `npm run test` (`vitest run`)
- **Additional Validators:** `npm run validate:seo` (`tsx scripts/validate-seo.ts`), `npm run validate:parity` (`tsx scripts/validate-locale-parity.ts`), `npm run format:check` (`prettier --check "src/**/*.{ts,tsx,css}" "functions/**/*.ts"`), `npm run knip` (`knip`)
