import {
  FileText,
  CheckCircle2,
  Shield,
  Scale,
  HelpCircle,
  Bot,
  AlertTriangle,
  Mail,
  Sparkles,
  Globe,
  FileCheck2,
  UserCheck,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        slug="terms-of-service"
        titleOverride="Terms of Service — PdfMinty"
        descriptionOverride="Read PdfMinty's Terms of Service. Understand our terms of use, client-side in-browser processing guarantee, opt-in AI disclosures, acceptable use policy, and advertising guidelines."
      />

      <div className="max-w-4xl mx-auto space-y-12" id="terms-of-service-container">
        {/* Header Hero */}
        <header className="text-center space-y-4 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Scale className="w-4 h-4" />
            <span>
              {t('termsOfService.badge', { defaultValue: 'Service Terms & Usage Guidelines' })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">
            {t('termsOfService.title', { defaultValue: 'Terms of Service' })}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-on-surface-variant max-w-2xl mx-auto">
            {t('termsOfService.updated', {
              defaultValue:
                'Last Updated & Effective Date: October 2026 • Publisher: PdfMinty (Operated by Mohammed Tanveer Munshi, Dhaka, Bangladesh)',
            })}
          </p>
        </header>

        {/* Executive Summary Box */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">
                Key Takeaways in Plain English (Summary)
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                A quick summary of our privacy-first service model before reading the full agreement
                below.
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium pt-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>100% In-Browser Standard Tools:</strong> 22 core client-side tools (Merge,
                Split, Rotate, Compress, Protect, Unlock, Watermark, Compare, etc.) run locally in
                your browser memory without server uploads.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Opt-In Cloud AI Disclosures:</strong> Only AI Analyze, OCR PDF, and the
                optional AI Vision mode in PDF to Markdown send text or rendered page images to
                Google Gemini API, strictly upon your explicit checkbox consent.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>You Own Your Documents:</strong> You retain 100% ownership and copyright of
                your files. PdfMinty makes zero claim of ownership over your documents.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>No Mandatory Accounts or Paywalls:</strong> Free for personal and commercial
                usage without forced user registrations or hidden subscription paywalls.
              </span>
            </li>
          </ul>
        </div>

        {/* Detailed Legal Sections */}
        <div className="space-y-8 bg-surface-container-low border border-border-muted p-6 sm:p-10 rounded-3xl shadow-sm text-xs sm:text-sm leading-relaxed text-on-surface-variant font-medium">
          {/* Section 1: Acceptance */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              1. Acceptance of Terms & Eligibility
            </h2>
            <p>
              By visiting, accessing, browsing, or utilizing PdfMinty (
              <a
                href="https://pdfminty.com"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                https://pdfminty.com
              </a>
              ) and any of its 24 document manipulation tools, web applications, or documentation,
              you enter into a legally binding agreement with PdfMinty and agree to comply with and
              be bound by these Terms of Service, our Privacy Policy, and all applicable
              international laws and regulations.
            </p>
            <p>
              You represent and warrant that you are at least 13 years of age (or the minimum age of
              digital consent in your jurisdiction). If you are accessing PdfMinty on behalf of a
              company, educational institution, government body, or legal entity, you represent that
              you possess the full legal authority to bind that entity to these Terms. If you do not
              agree with any part of these Terms, you must immediately terminate access to the
              website and cease using our services.
            </p>
          </section>

          {/* Section 2: Architecture & Service Scope */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              2. Technical Architecture & Client-Side Local Execution Guarantee
            </h2>
            <p>
              PdfMinty provides free, high-performance, client-side document utilities. Our
              architectural philosophy is built on data sovereignty:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Client-Side Standard Tools:</strong> All 22 standard PDF tools (including
                Merge PDF, Split PDF, Rotate PDF, Compress PDF, Protect PDF, Unlock PDF, Watermark
                PDF, Add Page Numbers, Delete Pages, Extract Pages, Reorder Pages, Add Blank Page,
                Image to PDF, PDF to Image, PDF to Markdown in Standard Mode, Grayscale PDF, Flatten
                PDF, Repair PDF, Edit Metadata, Sanitize PDF, Sign PDF, and Compare PDF) execute
                100% locally on your personal computer, smartphone, or tablet using WebAssembly,
                client-side JavaScript, and Web Workers.
              </li>
              <li>
                <strong>Zero Server File Uploads:</strong> Under our standard tool workflows, binary
                PDF files are read directly into your web browser&apos;s local memory (RAM) and
                processed on your device CPU/GPU. Documents are never transmitted across the
                network, uploaded to backend servers, cached in external databases, or written to
                cloud object storage buckets.
              </li>
              <li>
                <strong>Ephemeral In-Memory Lifecycle:</strong> When you reload your browser,
                navigate away, or close your browser tab, all document buffers are automatically
                purged from system memory.
              </li>
            </ul>
          </section>

          {/* Section 3: Cloud AI Vision & LLM Analysis Disclosures */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              3. Opt-In Cloud AI Vision & Document Intelligence Disclosure (Google Gemini)
            </h2>
            <p>
              While standard utilities operate completely offline in your browser, certain advanced
              analytical capabilities require cloud-scale artificial intelligence:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>
                  AI Document Analysis (
                  <Link
                    to={ROUTES.AI_ANALYZE}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    /ai-analyze-pdf/
                  </Link>
                  ):
                </strong>{' '}
                The AI Document Assistant extracts selectable text locally in your browser first.
                When you ask questions or request summaries, only extracted text fragments (up to 15
                pages / 30,000 characters on Standard tiers, or up to 50 pages / 60,000 characters
                on Pro) are transmitted via an encrypted HTTPS connection to Google Gemini API
                solely to generate answers.
              </li>
              <li>
                <strong>
                  AI Vision OCR (
                  <Link
                    to={ROUTES.OCR_PDF}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    /ocr-pdf/
                  </Link>{' '}
                  &amp; optional AI Vision mode in{' '}
                  <Link
                    to={ROUTES.PDF_TO_MARKDOWN}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    /pdf-to-markdown/
                  </Link>
                  ):
                </strong>{' '}
                For scanned documents containing unindexed bitmaps, OCR is powered by Google Gemini
                Multimodal Vision API. Up to 5 selected page images per run on Standard tiers (up to
                15 pages on Pro in OCR PDF, or up to 6 pages in PDF to Markdown AI Vision mode) are
                rendered locally and transmitted securely via HTTPS proxy solely to perform
                character and table recognition.
              </li>
              <li>
                <strong>Strict Explicit User Consent:</strong> Neither of these AI tools will
                transmit data without your deliberate action. You must affirmatively check an
                explicit consent checkbox before any payload leaves your device.
              </li>
              <li>
                <strong>No Document Retention:</strong> PdfMinty never retains, caches, or stores
                your documents on our servers. Transmission to Google Gemini is governed by standard
                enterprise API security and Google&apos;s data governance policies.
              </li>
            </ul>
          </section>

          {/* Section 4: User Ownership & IP */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-500" />
              4. Document Ownership & Intellectual Property Rights
            </h2>
            <p>
              <strong>You Retain Full Ownership:</strong> You retain complete and exclusive
              ownership, copyright, title, and all intellectual property rights in and to any
              documents, text, images, or data you process through PdfMinty. PdfMinty claims zero
              ownership, license, or proprietary interest in your content.
            </p>
            <p>
              <strong>User Warranties:</strong> You represent, warrant, and covenant that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You are the sole author, owner, or licensee of any document processed, or you have
                obtained all necessary express permissions, authorizations, and licenses from the
                legal copyright holder.
              </li>
              <li>
                Your documents do not violate or infringe upon the copyright, trademark, patent,
                trade secret, privacy rights, publicity rights, or other proprietary rights of any
                third party.
              </li>
              <li>
                Your documents do not contain malicious code, spyware, trojans, automated exploit
                triggers, or unlawful material (including child sexual abuse material or terrorist
                incitement).
              </li>
            </ul>
          </section>

          {/* Section 5: Acceptable Use */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              5. Acceptable Use Policy & Prohibited Activities
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>API Abuse &amp; Denial of Service:</strong> Flooding, scraping, or launching
                automated volume attacks against our backend proxy endpoints (<code>/api/*</code>),
                or attempting to bypass rate limits and cloud security firewalls.
              </li>
              <li>
                <strong>Reverse Engineering &amp; Tampering:</strong> Attempting to decompile,
                reverse-engineer, or disassemble proprietary server configurations, proxy
                microservices, or bypass integrity validation tokens.
              </li>
              <li>
                <strong>Security Circumvention:</strong> Exploiting vulnerabilities, tampering with
                consent verification states, or deploying automated bots to circumvent API
                safeguards.
              </li>
              <li>
                <strong>Unlawful Activity:</strong> Using PdfMinty to facilitate fraudulent
                transactions, forging legal documents, forging signatures without authorization, or
                violating export control and sanction regulations.
              </li>
            </ul>
          </section>

          {/* Section 6: Web Crawlers & AI Bots */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              6. Permitted Web Crawlers, Search Engines & AI Discovery
            </h2>
            <p>
              PdfMinty supports open web standards, transparent search indexing, and ethical
              artificial intelligence discovery:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Authorized Search &amp; Verification Crawlers:</strong> Legitimate web
                search engines (Googlebot, Bingbot, Applebot, etc.), advertising verification
                crawlers (including Google AdSense crawlers Mediapartners-Google and
                Google-Display-Ads-Bot), and benign AI assistant crawlers (such as GPTBot,
                ClaudeBot, PerplexityBot, Cohere, and CCBot) are granted explicit permission to
                crawl, index, and cache all public pages, tools, documentation, and blog guides.
              </li>
              <li>
                <strong>Direct AI Documentation:</strong> Autonomous agents and researchers may
                consult{' '}
                <a
                  href="/llms.txt"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  /llms.txt
                </a>{' '}
                and{' '}
                <a
                  href="/llms-full.txt"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  /llms-full.txt
                </a>{' '}
                for machine-readable site directories, schema specifications, and developer
                documentation.
              </li>
              <li>
                <strong>API Protection:</strong> Crawlers are strictly prohibited from submitting
                automated programmatic requests to <code>/api/*</code> endpoints.
              </li>
            </ul>
          </section>

          {/* Section 7: AdSense & Third-Party Advertising */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              7. Third-Party Advertisements, Google AdSense & Cookies Disclosures
            </h2>
            <p>
              To keep our tools free and accessible to users worldwide without paid subscriptions,
              PdfMinty displays advertisements served by Google AdSense and reputable third-party
              advertising partners:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Advertising Cookies:</strong> Third-party vendors, including Google, use
                cookies to serve advertisements based on a user&apos;s previous visits to PdfMinty
                or other websites on the internet.
              </li>
              <li>
                <strong>Ad Personalization:</strong> Google&apos;s use of advertising cookies
                enables it and its partners to serve ads based on your visit to PdfMinty and/or
                other sites across the internet.
              </li>
              <li>
                <strong>User Opt-Out:</strong> You may opt out of personalized advertising by
                visiting Google&apos;s{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Ads Settings <ExternalLink className="w-3 h-3" />
                </a>{' '}
                or by visiting{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  www.aboutads.info <ExternalLink className="w-3 h-3" />
                </a>
                .
              </li>
              <li>
                <strong>Consent Management Platform (CMP):</strong> For visitors within the European
                Economic Area (EEA), United Kingdom, and Switzerland, PdfMinty implements a
                certified Consent Management Platform (Cookiebot by Usercentrics, IAB TCF ID: 134)
                adhering to Google Consent Mode v2. All advertising storage is denied by default
                until you grant explicit consent.
              </li>
            </ul>
          </section>

          {/* Section 8: Disclaimer of Warranties */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-500" />
              8. Disclaimer of Warranties (&ldquo;AS IS&rdquo; Basis)
            </h2>
            <p className="uppercase text-[11px] font-bold tracking-wider text-on-surface">
              PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LEGAL RESPONSIBILITIES:
            </p>
            <p>
              PdfMinty, its website, tools, client-side libraries, documentation, and services are
              provided strictly on an <strong>&ldquo;AS IS&rdquo;</strong> and{' '}
              <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis, without warranties of any kind,
              whether express, implied, statutory, or otherwise.
            </p>
            <p>
              To the fullest extent permissible pursuant to applicable law, PdfMinty and its
              founder, developers, affiliates, and partners disclaim all warranties, express or
              implied, including, but not limited to, implied warranties of merchantability, fitness
              for a particular purpose, non-infringement, accuracy, uninterrupted operation,
              compatibility with all browser versions, or freedom from technical errors.
            </p>
            <p>
              <strong>Maintain Local Backups:</strong> Because file processing takes place in your
              local browser sandbox and RAM, unexpected browser tab crashes, operating system
              out-of-memory errors, or hardware issues can cause sudden termination. You are solely
              responsible for maintaining permanent, unedited backup copies of your files prior to
              processing.
            </p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-500" />
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall PdfMinty, its
              operator (Mohammed Tanveer Munshi), contributors, licensors, or agents be liable for
              any direct, indirect, incidental, special, exemplary, consequential, or punitive
              damages whatsoever (including, without limitation, damages for loss of profits,
              goodwill, business interruption, loss of document data, corruption of digital files,
              cost of procurement of substitute goods or services, or computer failure).
            </p>
            <p>
              This limitation applies regardless of whether the alleged liability is based on
              contract, tort, negligence, strict liability, or any other legal theory, even if
              PdfMinty has been advised of the possibility of such damages. In jurisdictions that do
              not allow the exclusion or limitation of incidental or consequential damages,
              PdfMinty&apos;s total aggregate liability shall be limited to the minimum amount
              permitted by law or ten United States dollars ($10.00 USD), whichever is lower.
            </p>
          </section>

          {/* Section 10: Indemnification */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              10. Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless PdfMinty, its founder, operators,
              contributors, employees, and third-party partners from and against any and all claims,
              liabilities, damages, losses, costs, expenses, fees, and reasonable legal fees arising
              out of or related to: (a) your use or misuse of the services; (b) any document, text,
              or file processed by you through the tools; (c) your violation of these Terms; or (d)
              your infringement or violation of any intellectual property, privacy, or other rights
              of any third party.
            </p>
          </section>

          {/* Section 11: Copyright & DMCA */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              11. Copyright Infringement & DMCA Takedown Procedure
            </h2>
            <p>
              PdfMinty respects the intellectual property rights of creators and copyright owners
              worldwide. Because standard document conversions take place 100% locally on user
              devices without server storage, PdfMinty does not host, curate, or publish user
              documents.
            </p>
            <p>
              However, if you believe that any public text, image, documentation, or tutorial on our
              website infringes upon your copyright, you may submit a formal notification to our
              Designated Copyright Agent at{' '}
              <span className="font-bold text-on-surface">support@pdfminty.com</span> including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                A physical or electronic signature of the copyright owner or authorized
                representative;
              </li>
              <li>Identification of the copyrighted work claimed to have been infringed;</li>
              <li>
                Identification of the material claimed to be infringing and its specific URL on
                PdfMinty;
              </li>
              <li>Your contact information (name, address, telephone number, and email);</li>
              <li>
                A statement that you have a good-faith belief that use of the material is not
                authorized; and
              </li>
              <li>
                A statement that the information provided is accurate under penalty of perjury.
              </li>
            </ul>
          </section>

          {/* Section 12: Modifications & Severability */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              12. Modifications to Services, Terms & Severability
            </h2>
            <p>
              PdfMinty reserves the right to modify, suspend, update, or discontinue any aspect,
              tool, feature, or route of the service at any time without prior notice. We may
              periodically update these Terms of Service to reflect evolving technical capabilities,
              legal standards, or advertising guidelines.
            </p>
            <p>
              Your continued access or use of PdfMinty following the publication of updated Terms
              constitutes your binding acceptance of the changes. If any provision of these Terms is
              determined by a court of competent jurisdiction to be invalid, illegal, or
              unenforceable, that provision shall be enforced to the maximum extent permissible, and
              the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Section 13: Governing Law */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-500" />
              13. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms of Service and any dispute, controversy, or claim arising out of or
              related to your use of PdfMinty shall be governed by and construed in accordance with
              the laws of Bangladesh, without giving effect to any principles of conflicts of law.
            </p>
            <p>
              You and PdfMinty agree to first attempt in good faith to resolve any claim or
              controversy informally by contacting us directly. If informal resolution is
              unsuccessful within 30 days, any dispute shall be submitted to the exclusive
              jurisdiction of the competent civil courts of Dhaka, Bangladesh, or, where applicable,
              mutually agreed international arbitration.
            </p>
          </section>

          {/* Section 14: Contact */}
          <section className="space-y-3 pt-6 border-t border-border-muted">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              14. Contact Us & Legal Inquiries
            </h2>
            <p>
              If you have any questions, clarifications, legal inquiries, or feedback regarding
              these Terms of Service, please reach out to us:
            </p>
            <div className="p-4 rounded-2xl bg-surface-container-high border border-border-muted space-y-1.5 font-medium">
              <p>
                <strong>Publisher / Operator:</strong> Mohammed Tanveer Munshi
              </p>
              <p>
                <strong>Website:</strong>{' '}
                <a
                  href="https://pdfminty.com"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  https://pdfminty.com
                </a>
              </p>
              <p>
                <strong>Official Email:</strong>{' '}
                <a
                  href="mailto:support@pdfminty.com"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  support@pdfminty.com
                </a>
              </p>
              <p>
                <strong>Contact Page:</strong>{' '}
                <Link
                  to={ROUTES.CONTACT}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  https://pdfminty.com/contact/
                </Link>
              </p>
              <p>
                <strong>Location:</strong> Dhaka, Bangladesh
              </p>
            </div>
            <p className="text-xs text-on-surface-variant pt-2">
              Our compliance and technical support team typically responds to verified inquiries
              within 24 to 48 business hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
