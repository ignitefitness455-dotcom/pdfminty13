# 📅 PDFMinty Annual December SEO Refresh Calendar & SOP

## 1. Executive Overview
Search queries with specific years (e.g., *"Best offline PDF tools 2026"*, *"Merge PDF free 2026 guide"*, *"Adobe Acrobat alternatives 2026"*) experience steep drop-offs in Organic Click-Through Rate (CTR) starting in January if users perceive the content to be outdated.

To capture upcoming search volume and prevent search engine result page (SERP) degradation, PDFMinty enforces an **Annual December Refresh Calendar**.

---

## 2. Annual Refresh Schedule (December 10 – January 05)

| Date Window | Phase | Responsible / Tool | Action Items |
| :--- | :--- | :--- | :--- |
| **Dec 10 – Dec 15** | **Pre-Audit & Discovery** | `npm run seo:audit` | Audit all current year citations across `src/config/seo-data.ts`, `src/config/homeConfig.ts`, and blog articles. |
| **Dec 16 – Dec 20** | **Automated Content Refresh** | `npm run seo:refresh` | Execute automated title, heading, and review date rollover for target year (e.g. `2026` → `2027`). |
| **Dec 21 – Dec 25** | **Benchmark & Comparison Update** | Editorial / Security Team | Review annual benchmark numbers (speed tests, compression ratios, browser WebAssembly support stats) in `seo-data.ts`. |
| **Dec 26 – Dec 30** | **Build, Schema & Sitemap Generation** | `npm run build`<br>`npm run validate:seo` | Regenerate sitemaps (`sitemap-tools.xml`, `sitemap-blog.xml`), JSON-LD Article `dateModified` timestamps, and static pre-rendered HTML. |
| **Jan 01 – Jan 05** | **Search Console Deployment** | Webmaster / DevOps | Verify deployment on production, submit updated sitemaps to Google Search Console and Bing Webmaster Tools. |

---

## 3. Strict Rules for URL Slug & Permalinks

> ⚠️ **CRITICAL SEO RULE: NEVER CHANGE EXISTING URL SLUGS**

1. **Slugs Must Remain Evergreen**:
   - ✅ Keep: `/blog/why-privacy-first-pdf-tools-matter-in-2026/` (or stable slugs)
   - ❌ **DO NOT** modify the URL slug unless a 301 redirect is simultaneously registered in `src/App.tsx`, `scripts/generate-static-pages.ts`, and `public/_redirects`.
   - Modifying a URL slug without redirects destroys accrued inbound backlinks and resets Google PageRank.

2. **What SHOULD be refreshed**:
   - `metaTitle`: (e.g., `"Best Offline PDF Tools 2027 | PDFMinty"`)
   - `h1`: (e.g., `"Best Offline PDF Tools for Sensitive Documents (2027 Ranking Guide)"`)
   - `name`: Display title in internal navigation and blog index cards.
   - `lastReviewedDate`: (e.g., `"January 2027 • Verified by Security Architecture Team"`)
   - `dateModified`: Schema.org timestamp for Google freshness signals.

---

## 4. Automation Commands

### 1. Audit Current Year References
Scans all SEO configs, templates, and components to detect any expiring year references:
```bash
npm run seo:audit
# or specify an explicit year:
npx tsx scripts/annual-seo-refresh.ts --audit --from-year=2026
```

### 2. Preview Changes (Dry Run)
Simulates title and date updates without writing to disk:
```bash
npx tsx scripts/annual-seo-refresh.ts --target-year=2027 --dry-run
```

### 3. Execute Annual Rollover
Safely updates title tags, headings, and metadata from 2026 to 2027:
```bash
npm run seo:refresh -- --target-year=2027
```

### 4. Build & Verify Everything
```bash
npm run build
npm run validate:seo
```

---

## 5. Annual Checklist Summary

- [ ] All `metaTitle` and `h1` tags updated for the new year.
- [ ] Schema `dateModified` updated to reflect recent editorial review.
- [ ] Comparison tables (e.g., Acrobat pricing, Smallpdf limits) audited for current market prices.
- [ ] Reciprocal hreflang tags validated (`en`, `de`, `fr`, `es`, `x-default`).
- [ ] Sitemaps generated and verified with valid URLs and clean response codes.
