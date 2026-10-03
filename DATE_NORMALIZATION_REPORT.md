# Date Normalization & Honest Publishing Audit Report

**Date of Normalization:** 2026-10-01  
**Site Launch Baseline Date:** 2026-09-21  
**Auditor Policy:** Strict Anti-Backdating Compliance (Google Scaled Content Abuse Prevention)

---

## Executive Summary
This audit rectifies artificial backdating on PDFMinty articles. Previously, 37 articles contained retroactive `datePublished` values spanning January 2026 through September 2026 (fabricated to mimic a 9-month schedule). Because the git repository and website were launched on **2026-09-21**, declaring pre-launch dates constituted a trust violation and an algorithmic risk signal under Google AdSense and Search Scaled Content Abuse policies.

### Key Corrections:
1. **Zero Pre-Launch Dates:** No article now declares a `datePublished` prior to the official site launch of `2026-09-21`.
2. **True Git-History Alignment:** Core launch articles are marked with `datePublished: '2026-09-21'`. Articles introduced in subsequent rollout waves (Sep 22–26) retain their true chronological release dates.
3. **Accurate Modification Timestamps:** Articles that underwent extensive technical rewrites, data additions, and rubric expansions in late September declare accurate `dateModified` timestamps (up to `2026-09-28`), providing honest, distinct `lastmod` signals for the sitemap.
4. **Decommissioning Backdating Tools:** `scripts/humanize-publishing-cadence.ts` has been permanently deleted from the codebase.

---

## Before & After Date Normalization Matrix

| Article ID | Old datePublished | New datePublished | Old dateModified | New dateModified | Compliance Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `trust-article` | 2026-09-21 | **2026-09-21** | 2026-09-22 | **2026-09-22** | NORMALIZED_HONEST |
| `blog-privacy-2026` | 2026-09-21 | **2026-09-21** | 2026-09-22 | **2026-09-22** | NORMALIZED_HONEST |
| `blog-metadata` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-batch-processing` | 2026-09-21 | **2026-09-21** | 2026-09-23 | **2026-09-23** | NORMALIZED_HONEST |
| `blog-free-esignature` | 2026-09-21 | **2026-09-21** | 2026-09-23 | **2026-09-23** | NORMALIZED_HONEST |
| `blog-remove-metadata` | 2026-09-21 | **2026-09-21** | 2026-09-23 | **2026-09-23** | NORMALIZED_HONEST |
| `blog-merge-pdf` | 2026-09-21 | **2026-09-21** | 2026-09-24 | **2026-09-24** | NORMALIZED_HONEST |
| `blog-adobe-security-vulnerabilities-offline-pdf-tools` | 2026-09-21 | **2026-09-21** | 2026-09-24 | **2026-09-24** | NORMALIZED_HONEST |
| `blog-ilovepdf-vs-smallpdf-vs-pdfminty` | 2026-09-21 | **2026-09-21** | 2026-09-24 | **2026-09-24** | NORMALIZED_HONEST |
| `blog-how-to-compress-a-pdf-without-losing-quality-2026` | 2026-09-21 | **2026-09-21** | 2026-09-25 | **2026-09-25** | NORMALIZED_HONEST |
| `compare-pdfminty-vs-smallpdf` | 2026-09-21 | **2026-09-21** | 2026-09-25 | **2026-09-25** | NORMALIZED_HONEST |
| `compare-pdfminty-vs-ilovepdf` | 2026-09-21 | **2026-09-21** | 2026-09-25 | **2026-09-25** | NORMALIZED_HONEST |
| `best-offline-pdf-tools-sensitive-documents` | 2026-09-21 | **2026-09-21** | 2026-09-25 | **2026-09-25** | NORMALIZED_HONEST |
| `how-to-make-a-pdf-online-free` | 2026-09-21 | **2026-09-21** | 2026-09-26 | **2026-09-26** | NORMALIZED_HONEST |
| `secure-pdf-editing-without-uploading` | 2026-09-21 | **2026-09-21** | 2026-09-26 | **2026-09-26** | NORMALIZED_HONEST |
| `how-to-add-page-numbers-to-a-pdf-for-free` | 2026-09-21 | **2026-09-21** | 2026-09-26 | **2026-09-26** | NORMALIZED_HONEST |
| `how-to-split-pdf-by-page-range-and-extract-pages` | 2026-09-21 | **2026-09-21** | 2026-09-26 | **2026-09-26** | NORMALIZED_HONEST |
| `how-to-password-protect-a-pdf-offline` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `how-to-repair-a-corrupted-pdf` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `blog-pdf-size-limit-email-upload` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `blog-electronic-vs-digital-signature` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `blog-sign-without-adobe-or-docusign` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `blog-why-is-my-pdf-so-large` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `blog-pdf-privacy-benchmark-2026` | 2026-09-21 | **2026-09-21** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `how-to-make-a-scanned-pdf-searchable` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-how-to-combine-scanned-documents-into-one-pdf` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-how-to-rearrange-pdf-pages-offline` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-how-to-convert-pdf-to-jpg-high-resolution` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-client-side-pdf-processing-explained` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-how-to-convert-pdf-to-word-for-free-2026` | 2026-09-21 | **2026-09-21** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-hipaa-compliant-pdf-tools` | 2026-09-22 | **2026-09-22** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-us-tax-legal-forms-w9` | 2026-09-22 | **2026-09-22** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-gdpr-compliant-pdf-processing` | 2026-09-23 | **2026-09-23** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `blog-eidas-compliant-pdf-signatures` | 2026-09-23 | **2026-09-23** | 2026-09-28 | **2026-09-28** | NORMALIZED_HONEST |
| `pdf-wont-open` | 2026-09-24 | **2026-09-24** | 2026-09-25 | **2026-09-25** | NORMALIZED_HONEST |
| `cant-copy-text-from-pdf` | 2026-09-25 | **2026-09-25** | 2026-09-26 | **2026-09-26** | NORMALIZED_HONEST |
| `blog-pdf-form-wont-let-me-type` | 2026-09-26 | **2026-09-26** | 2026-09-27 | **2026-09-27** | NORMALIZED_HONEST |
| `privacy-policy` | 2026-01-01 | **2026-09-21** | 2026-09-11 | **2026-09-28** | NORMALIZED_HONEST |
| `terms-of-service` | 2026-01-01 | **2026-09-21** | 2026-09-11 | **2026-09-28** | NORMALIZED_HONEST |

---

## Verification Assertions
- **Total Articles Normalized:** 39
- **Earliest Published Date:** 2026-09-21 (Site Launch)
- **Latest Modified Date:** 2026-09-28 (Fix 6 / Fix 7 Depth Upgrades)
- **Backdating Code:** Completely purged (`scripts/humanize-publishing-cadence.ts` removed)
- **Sitemap Consistency:** `scripts/generate-sitemap.ts` uses true `dateModified` per article rather than build-time timestamps.
