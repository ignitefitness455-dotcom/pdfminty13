# STEP 0 — AI Studio Import & Session Artifacts (`audit/00-import-artifacts.md`)

**Session Date:** 2026-10-20
**Purpose:** Identify files added or modified by Google AI Studio during repository import or previous AI Studio sessions so they are treated as **OUT OF SCOPE** (not reported as site defects, not modified as production fixes, and not included in production commits unless explicitly requested).

---

## 1. Confirmed AI Studio Artifacts (Strictly Out of Scope)

| Path | Type | Evidence |
| :--- | :--- | :--- |
| `/.aistudio/artifacts/brain/4e7c340b-9502-4a89-8f0f-5ff5f6fd162a/*`<br>`/.aistudio/artifacts/brain/ff1d94ca-8844-480c-a061-c7a76b7ce750/*` | Directory (8 files) | AI Studio internal agent artifact storage containing `implementation_plan.md`, `implementation_plan.md.metadata.json`, and `.tempmediaStorage/media_*.jpg` from two AI Studio sessions (`ff1d94ca-...` and `4e7c340b-...`). |
| `/metadata.json` | File (lines 1–7) | Standard AI Studio applet manifest (`"name": "PDFMinty"`, `"requestFramePermissions": []`, `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`). Not used by Vite or Cloudflare Pages (`wrangler.toml`). |
| `/GEMINI.md` | File (lines 1–179) | AI Studio system rule file defining agent instructions and explicitly listing `├── .aistudio/ # AI Studio configuration and planning artifacts` at line 68. |
| `/public/assets/aistudio/Screenshot_20261020_091332_com_android_chrome_ChromeTabbedActivity_693a7531.jpg`<br>`/public/assets/aistudio/Screenshot_20261020_091343_com_android_chrome_ChromeTabbedActivity_6143b1e2.jpg`<br>`/public/assets/aistudio/Screenshot_20261020_131729_com_android_chrome_ChromeTabbedActivity_228e75a1.jpg` | Directory (3 files) | User-uploaded mobile Chrome screenshots stored automatically by AI Studio in `/public/assets/aistudio/` during a prior session (referenced in `/.aistudio/artifacts/brain/4e7c340b-9502-4a89-8f0f-5ff5f6fd162a/implementation_plan.md` lines 3–13). Note: because this folder sits inside `/public/`, Vite copies it into `dist/assets/aistudio/` on build unless excluded. |
| `/firebase-blueprint.json` | File (lines 1–118) | AI Studio Firebase skill intermediate schema file (`entities: UserProfile, UserUsageQuota, UserFeedback`). Explicitly documented as created in prior AI Studio session `ff1d94ca-8844-480c-a061-c7a76b7ce750/implementation_plan.md` (lines 201–203). |
| `/vite.config.ts` (`devApiPlugin`, lines 52–254) | Embedded Dev Middleware | While `/vite.config.ts` itself is a core project file, `devApiPlugin()` (lines 52–254) is an AI Studio local preview wrapper that mocks `/api/subscribe` and `/api/gemini-proxy` inside the Vite dev server (whereas production uses Cloudflare Pages Functions in `/functions/api/subscribe.ts` and `/functions/api/gemini-proxy.ts`). Evidence: line 178 sets `'User-Agent': 'aistudio-build'` and line 223 calls model `'gemini-3.8-flash'` via `@google/genai`. |

---

## 2. Suspected / Hybrid AI Studio Modifications (Ask Before Touching)

Because `.git` history is stripped in the container, the following files show evidence of having been added or modified during prior AI Studio sessions (per `/.aistudio/artifacts/brain/*/implementation_plan.md` and `README.md` vs `package.json` comparisons). **I will ask for your confirmation before treating these as either out-of-scope artifacts or in-scope production code:**

| Path | Evidence of AI Studio Modification |
| :--- | :--- |
| `/package.json` (line 36) & `/vite.config.ts` (lines 349–351) | `"@google/genai": "^2.9.0"` is listed in `dependencies` and chunked into `vendor-genai` in `vite.config.ts` (line 349), but is only imported by the AI Studio `devApiPlugin` in `vite.config.ts` (line 173). Production `/functions/api/gemini-proxy.ts` (lines 309, 374, 420) uses native `fetch()` against Groq, xAI Grok, and Gemini REST APIs without importing `@google/genai`. Furthermore, `README.md` (line 59) documents Groq (`GROQ_API_KEY`), Gemini (`GEMINI_API_KEY`), and xAI Grok (`GROK_API_KEY`), whereas `.env.example` (lines 1–11) omits `GROQ_API_KEY` and `GROK_API_KEY`. |
| `/firestore.rules` (lines 1–71) | Created/updated during the prior AI Studio session documented in `/.aistudio/artifacts/brain/ff1d94ca-8844-480c-a061-c7a76b7ce750/implementation_plan.md` (lines 119–195, 204–205). |
| `/src/lib/firebase.ts` (lines 17–26, 45–70, 115) & `/src/services/userService.ts` | Firestore initialization (`getFirestore`, `db`) and hardcoded fallback Firebase project keys (`pdfminty-9836d`) in `src/lib/firebase.ts` alongside `/src/services/userService.ts` correspond to Phase A of `/.aistudio/artifacts/brain/ff1d94ca-8844-480c-a061-c7a76b7ce750/implementation_plan.md` (lines 206–211). |
| `/src/components/Header.tsx` & `/src/pages/DashboardPage.tsx` | Targeted by the prior AI Studio session plan in `/.aistudio/artifacts/brain/4e7c340b-9502-4a89-8f0f-5ff5f6fd162a/implementation_plan.md` (lines 39–58). |
