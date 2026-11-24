import fs from 'fs';
import path from 'path';

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  LOCALIZED_CANONICAL_COPY,
  OPERATOR_INFO,
  QUOTA_TIERS,
  TOOL_PRIVACY_COUNTS,
} from '../config/quotas';
import { TOOLS } from '../config/seo-data';
import type { SupportedLocale } from '../i18n/config';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '../pages/TermsOfServicePage';

const LOCALES: SupportedLocale[] = ['en', 'bn', 'de', 'es', 'fr', 'hi', 'zh'];

function renderComponent(node: React.ReactElement): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <HelmetProvider>
        <MemoryRouter>{node}</MemoryRouter>
      </HelmetProvider>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('Trust & Legal Alignment Verification (Items 1-4)', () => {
  it('Item 1: TermsOfServicePage and seo-data.ts prerender body include full legal sections without stale team claims', () => {
    const { container, unmount } = renderComponent(<TermsOfServicePage />);
    const text = container.textContent || '';

    expect(text).toContain(OPERATOR_INFO.operatorName);
    expect(text).toContain(OPERATOR_INFO.location);
    expect(text).toContain(OPERATOR_INFO.supportEmail);
    expect(text).toContain('Monthly Pro Plan ($2.49 USD/month)');
    expect(text).toContain('Lifetime Pro Plan ($50 USD one-time payment)');
    expect(text).toContain('Lemon Squeezy');
    expect(text).toContain('Acceptable Use Policy');
    expect(text).toContain('Google Gemini');
    expect(text).toContain('Groq');
    expect(text).toContain('xAI Grok');
    expect(text).toContain('when enabled');
    expect(text).toContain('Limitation of Liability');
    expect(text).toContain('Indemnification');
    expect(text).toContain('Governing Law');
    expect(text).not.toContain('Legal & Compliance Team');
    expect(text).not.toContain('optional AI Vision mode in /pdf-to-markdown/');
    unmount();

    const tosSeo = TOOLS.find((t) => t.slug === 'terms-of-service');
    expect(tosSeo).toBeDefined();
    expect(tosSeo?.longFormBody).toContain('3A. Service Plans');
    expect(tosSeo?.longFormBody).toContain('Lemon Squeezy');
    expect(tosSeo?.longFormBody).toContain('5. Acceptable Use Policy');
    expect(tosSeo?.longFormBody).toContain('Google Gemini, Groq, and/or xAI Grok');
    expect(tosSeo?.longFormBody).toContain('When enabled');
    expect(tosSeo?.longFormBody).toContain('9. Limitation of Liability');
    expect(tosSeo?.longFormBody).toContain('10. Indemnification');
    expect(tosSeo?.longFormBody).toContain('13. Governing Law');
    expect(tosSeo?.longFormBody).not.toContain('Legal & Compliance Team');
  });

  it('Item 2: Only AiAnalyzePage and OcrPdfPage call /api/gemini-proxy; PdfToMarkdownPage is 100% browser-local', () => {
    const pagesDir = path.resolve(process.cwd(), 'src/pages');
    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));

    const proxyCallers: string[] = [];
    for (const file of pageFiles) {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
      if (/fetch\s*\(\s*['"`]\/api\/gemini-proxy['"`]/.test(content)) {
        proxyCallers.push(file);
      }
    }

    expect(proxyCallers.sort()).toEqual(['AiAnalyzePage.tsx', 'OcrPdfPage.tsx']);

    const pdfToMdSrc = fs.readFileSync(path.join(pagesDir, 'PdfToMarkdownPage.tsx'), 'utf8');
    expect(pdfToMdSrc).not.toContain('/api/gemini-proxy');
    expect(pdfToMdSrc).not.toContain('handleRunAiOcr');
    expect(pdfToMdSrc).toContain('ROUTES.OCR_PDF');

    const readme = fs.readFileSync(path.resolve(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Google Gemini');
    expect(readme).toContain('Groq');
    expect(readme).toContain('xAI Grok');
    expect(readme).toContain('22 browser-local standard tools');
    expect(readme).not.toContain('optional AI Vision mode in `/pdf-to-markdown/`');
  });

  it('Item 3: Single-source quota copy is synced across all 7 locales and contradicts no pricing tier', () => {
    expect(QUOTA_TIERS.guest.dailyTasks).toBe(5);
    expect(QUOTA_TIERS.freeAccount.dailyTasks).toBe(10);
    expect(TOOL_PRIVACY_COUNTS.localStandardTools).toBe(22);
    expect(TOOL_PRIVACY_COUNTS.optInAiTools).toBe(2);

    const splitSeo = TOOLS.find((t) => t.slug === 'split-pdf');
    expect(splitSeo?.longFormBody).not.toContain('No limits, no credentials needed.');

    for (const loc of LOCALES) {
      const common = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'src/locales', loc, 'common.json'), 'utf8')
      );
      const expected = LOCALIZED_CANONICAL_COPY[loc];

      expect(common.privacyPolicy.updated).toBe(expected.privacyUpdated);
      expect(common.termsOfService.updated).toBe(expected.termsUpdated);
      expect(common.privacyPolicy.sec4Intro).toBe(expected.privacySec4Intro);
      expect(common.home.whyChoose.freeDesc).toBe(expected.homeWhyChooseFreeDesc);
      expect(common.aboutUs.freeForever).toBe(expected.aboutUsFreeForever);
      expect(common.ocrPdf.consentDesc).toBe(expected.ocrConsentDesc);

      const serialized = JSON.stringify(common);
      expect(serialized).not.toContain('Security & Compliance Architecture Team');
      expect(serialized).not.toContain('Technical Reviewer: Legal & Compliance Team');
      expect(common.termsOfService.updated).not.toContain('Legal & Compliance Team');
      expect(serialized).not.toContain('কোনো দৈনিক লিমিট নেই');
      expect(serialized).not.toContain('পেমেন্ট ছাড়াই আজীবন ফ্রি');
    }

    const zhMerge = fs.readFileSync(
      path.resolve(process.cwd(), 'src/locales/zh/merge-pdf.json'),
      'utf8'
    );
    expect(zhMerge).not.toContain('没有每日使用次数限制');
    expect(zhMerge).not.toContain('无文件数量限制');
  });

  it('Item 4: PrivacyPolicyPage discloses solo Data Controller, removes duplicate summary, qualifies AdSense when enabled, lists all sub-processors, and preserves Google OAuth Limited Use', () => {
    const { container, unmount } = renderComponent(<PrivacyPolicyPage />);
    const text = container.textContent || '';

    // Solo Data Controller identity
    expect(text).toContain('Mohammed Tanveer Munshi');
    expect(text).toContain('Dhaka, Bangladesh');
    expect(text).toContain('support@pdfminty.com');
    expect(text).not.toContain('Security & Compliance Architecture Team');
    expect(text).not.toContain('Data Protection Team');

    // No duplicate executive summary sentence
    expect(text).not.toContain('PdfMinty provides 24 tools in total');
    expect(text).not.toContain('optional AI Vision mode in /pdf-to-markdown/');

    // AdSense qualified as when enabled
    expect(text.toLowerCase()).toContain('when enabled');

    // Complete sub-processor list
    expect(text).toContain('Google LLC (Google Gemini API)');
    expect(text).toContain('Groq, Inc. (Groq API)');
    expect(text).toContain('xAI Corp. (xAI Grok API)');
    expect(text).toContain('Lemon Squeezy LLC');
    expect(text).toContain('Cloudflare, Inc.');
    expect(text).toContain('Resend, Inc.');

    // Mandatory Google OAuth Limited Use Disclosure preserved
    expect(text).toContain(
      'adhere to the Google API Services User Data Policy, including the Limited Use requirements'
    );
    unmount();

    const privacySeo = TOOLS.find((t) => t.slug === 'privacy-policy');
    expect(privacySeo?.longFormBody).toContain('Mohammed Tanveer Munshi');
    expect(privacySeo?.longFormBody).toContain('Groq, Inc.');
    expect(privacySeo?.longFormBody).toContain('xAI Corp.');
    expect(privacySeo?.longFormBody).toContain('Lemon Squeezy LLC');
    expect(privacySeo?.longFormBody).toContain('When enabled');
    expect(privacySeo?.longFormBody).not.toContain('Security & Compliance Architecture Team');
    expect(privacySeo?.longFormBody).not.toContain('PdfMinty provides 24 tools in total');
    expect(privacySeo?.longFormBody).toContain(
      'adhere to the Google API Services User Data Policy, including the Limited Use requirements'
    );
  });
});
