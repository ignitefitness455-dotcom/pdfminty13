# PDFMinty Editorial Cadence & Anti-Scaled Content Policy

**Effective Date:** September 21, 2026  
**Last Audited:** October 1, 2026  
**Auditor & Editorial Lead:** Sayed Sunny, Lead Software Architect & Privacy Engineer  
**Entity:** PDFMinty (https://pdfminty.com)

---

## 1. Core Commitment & Philosophy

PDFMinty is committed to authentic, technically rigorous, human-authored editorial standards. We strictly reject programmatic mass generation, artificial backdating, and automated keyword spinning. 

In full compliance with **Google Search Essentials**, **Google AdSense Program Policies**, and the **Scaled Content Abuse Policy**, PDFMinty enforces a sustainable, quality-first publishing velocity.

---

## 2. Velocity Cap: Maximum 1–2 Articles Per Week

To ensure every article undergoes thorough research, code-level technical verification, and hands-on testing:

1. **Hard Upper Bound:** No more than **one to two (1–2) new articles** may be published in any 7-day calendar window.
2. **Batch Publishing Ban:** Bulk dumping of pre-generated articles is strictly prohibited. Every article must be published on the actual day it completes editorial review and technical verification.
3. **No Retroactive Scheduling:** Setting publication dates earlier than actual deployment to manufacture an artificial history is permanently banned.

---

## 3. Mandatory Non-Replicable Elements

Every newly published or significantly revised guide must contain **at least one** non-synthetic element that cannot be mass-produced by automated scripts:

* **Original Interface Demonstrations:** Actual screenshots or screen recordings showing edge-case execution in PDFMinty's client-side tools (e.g., memory indicators, file tree layouts, or redaction coordinates).
* **Empirical Performance Benchmarks:** Reproducible test metrics recorded on real hardware (e.g., exact processing times in milliseconds, memory heap sizes in MB, and compression ratios using standard PDF test fixtures).
* **First-Hand Technical & Forensic Notes:** Low-level object tree analysis (e.g., ISO 32000-1 dictionary inspections, ExifTool / QPDF command verification, hex byte diffs).
* **Real-World Practitioner Case Studies:** Detailed troubleshooting workflows derived from genuine user scenarios, legal e-discovery requirements, or HIPAA/GDPR compliance workflows.

---

## 4. Date Integrity & Maintenance Lifecycle

* **`datePublished`:** Must record the exact calendar date (`YYYY-MM-DD`) on which the article is first deployed to production. This date remains immutable.
* **`dateModified`:** Must only be updated when substantial editorial, architectural, or technical changes are introduced (e.g., tool algorithm upgrades, browser API deprecations, or regulatory changes). Minor typographical fixes do not warrant modified date bumps.
* **Sitemap Alignment:** The XML sitemap (`sitemap-blog.xml`) must dynamically mirror the article's true `dateModified` timestamp, ensuring search crawlers receive honest delta signals rather than synthetic build-time dates.

---

## 5. Pre-Publication Editorial Checklist

Before merging and deploying any new article or comparison guide:

- [ ] Technical review completed by the primary author/architect.
- [ ] At least one non-synthetic, verifiable artifact included (benchmark, screenshot, or reproducible CLI snippet).
- [ ] No unverified claims or fabricated statistics.
- [ ] Date published matches today's actual date (no backdating).
- [ ] Schema.org `Article` / `TechArticle` metadata validated with exact author attribution.
- [ ] Internal links point to existing, functional client-side tools.

---

*This policy is part of PDFMinty's permanent editorial governance and is audited on a quarterly cycle.*
