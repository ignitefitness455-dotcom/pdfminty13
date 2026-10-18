import {
  Shield,
  Lock,
  EyeOff,
  Server,
  HardDrive,
  Globe,
  Database,
  HelpCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  AlertCircle,
  Scale,
  Mail,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="Privacy Policy — 100% Zero-Data Collection & Google OAuth Compliance | PDFMinty"
        descriptionOverride="Read PDFMinty's comprehensive Privacy Policy. Standard PDF tools process files 100% locally in your browser with zero uploads. Includes complete Google OAuth Limited Use, Google Gemini AI, AdSense, GDPR, and CCPA disclosures."
      />

      <div className="max-w-4xl mx-auto space-y-10" id="privacy-policy-container">
        {/* Header Hero */}
        <div className="text-center space-y-4 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Shield className="w-4 h-4" />
            <span>
              {t('privacyPolicy.badge', {
                defaultValue: 'Complete Data Sovereignty & Privacy Standards',
              })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">
            {t('privacyPolicy.title', { defaultValue: 'Privacy Policy' })}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-on-surface-variant max-w-2xl mx-auto">
            {t('privacyPolicy.updated', {
              defaultValue:
                'Effective Date: January 1, 2026 • Last Updated & Reviewed: October 18, 2026 • Controller: PDFMinty Security & Compliance Architecture Team',
            })}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
              ✓
            </div>
            <h2 className="text-lg font-extrabold text-on-surface">
              {t('privacyPolicy.shortVersion', {
                defaultValue: 'Executive Summary (The Short Version)',
              })}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
            {t('privacyPolicy.summary', {
              defaultValue:
                "PDFMinty's 30+ standard PDF tools process your files 100% locally inside your web browser using WebAssembly and HTML5 Canvas without uploading your documents to any server. Your sensitive files never leave your device. If you explicitly opt in to use our Cloud AI tools — the AI PDF Assistant (/ai-analyze-pdf/) or the OCR PDF tool (/ocr-pdf/) — extracted text or selected page images are transmitted securely via TLS-encrypted HTTPS proxy to the Google Gemini API solely to fulfill your immediate request after you grant explicit consent. If you optionally sign in with Google OAuth or Email/Password, we store only your basic account profile (email, name, avatar URL, UID, and subscription/quota status) in Google Cloud Firestore in strict compliance with the Google API Services User Data Policy (Limited Use requirements).",
            })}
          </p>
        </div>

        {/* Data Processing Summary Matrix */}
        <div className="bg-surface-container-low border border-border-muted p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>Data Processing &amp; Privacy Architecture Matrix</span>
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            The table below summarizes exactly how data is handled across every part of the PDFMinty
            platform (<strong>https://pdfminty.com/</strong>):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border-muted text-on-surface font-bold bg-surface-variant/40">
                  <th className="py-3 px-4">Service / Feature Category</th>
                  <th className="py-3 px-4">Data Accessed or Collected</th>
                  <th className="py-3 px-4">Processing Location</th>
                  <th className="py-3 px-4">Retention &amp; Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted text-on-surface-variant">
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    30+ Standard PDF Tools (Merge, Split, Compress, Sign, Protect, Unlock, etc.)
                  </td>
                  <td className="py-3 px-4">
                    User-selected PDF/Image files in local browser memory only
                  </td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                    100% Client-Side (In-Browser WebAssembly &amp; RAM)
                  </td>
                  <td className="py-3 px-4">
                    Zero server upload; purged immediately when tab closes
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    Opt-In Cloud AI Tools (/ai-analyze-pdf/ &amp; /ocr-pdf/)
                  </td>
                  <td className="py-3 px-4">
                    Extracted document text (up to 12 pages) or rendered page images (up to 5 pages)
                    after explicit user consent
                  </td>
                  <td className="py-3 px-4">
                    Encrypted HTTPS Proxy (/api/gemini-proxy) to Google Gemini API
                  </td>
                  <td className="py-3 px-4">
                    Ephemeral in-memory processing only; never stored on PDFMinty servers
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    Optional User Accounts &amp; Google Sign-In (OAuth 2.0)
                  </td>
                  <td className="py-3 px-4">
                    Email address, display name, profile photo URL, unique user ID (UID), plan tier
                  </td>
                  <td className="py-3 px-4">
                    Google Firebase Authentication &amp; Google Cloud Firestore
                  </td>
                  <td className="py-3 px-4">
                    Retained while account is active; deleted within 7 business days upon request
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    Guest Quota &amp; UI Preferences
                  </td>
                  <td className="py-3 px-4">
                    Daily task counter, dark/light theme, language preference, cookie consent state
                  </td>
                  <td className="py-3 px-4">Client-Side Browser localStorage</td>
                  <td className="py-3 px-4">
                    Stored locally in user&apos;s browser; user can clear anytime
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-8 bg-surface-container-low border border-border-muted p-6 sm:p-10 rounded-3xl shadow-sm text-xs sm:text-sm leading-relaxed text-on-surface-variant font-medium">
          {/* Section 1 */}
          <section className="space-y-3" id="local-processing">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec1Title', {
                  defaultValue: '1. Local In-Browser Processing (Standard PDF Tools)',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec1Desc', {
                defaultValue:
                  'When you select a PDF or image file in any of PDFMinty’s standard utilities (including Merge PDF, Split PDF, Compress PDF, Protect PDF, Unlock PDF, Rotate PDF, Sign PDF, Watermark PDF, Add Page Numbers, Delete Pages, Extract Pages, Reorder Pages, Flatten PDF, Grayscale PDF, Repair PDF, Edit PDF Metadata, Sanitize PDF, PDF to Image, Image to PDF, Compare PDF, and PDF to Markdown), the entire operation executes locally on your device using client-side WebAssembly (@cantoo/pdf-lib, pdfjs-dist), HTML5 Canvas (fabric, signature_pad), and dedicated Web Workers.',
              })}
            </p>
            <p>
              Your files are read directly from your local disk into your web browser&apos;s
              isolated memory sandbox using the standard HTML5 <code>FileReader</code> and{' '}
              <code>ArrayBuffer</code> APIs. At no point during standard PDF operations are your
              files uploaded, transmitted, streamed, or copied to PDFMinty servers or any external
              cloud infrastructure. All standard tools work completely offline once the web
              application has loaded in your browser.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="zero-storage">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec2Title', {
                  defaultValue: '2. Zero Document Storage, No File Uploads & Memory Purging',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec2Desc', {
                defaultValue:
                  'We do not operate backend file servers, cloud storage buckets (such as AWS S3 or Google Cloud Storage), or document databases that store, cache, or log your PDF files. All binary file transformations happen strictly within your device’s volatile Random Access Memory (RAM).',
              })}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Automatic Blob &amp; Buffer Cleanup:</strong> Temporary download links are
                generated locally in your browser via <code>URL.createObjectURL()</code> and are
                systematically revoked via <code>URL.revokeObjectURL()</code> when you reset a tool,
                close the preview, or navigate away.
              </li>
              <li>
                <strong>Complete Session Erasure:</strong> When you close your browser tab or
                refresh the page, the browser&apos;s garbage collector immediately and irreversibly
                purges all allocated <code>ArrayBuffer</code> and <code>Uint8Array</code> memory
                segments.
              </li>
              <li>
                <strong>Cryptographic Password Operations:</strong> When you encrypt a PDF using{' '}
                <Link
                  to={ROUTES.PROTECT}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Protect PDF
                </Link>{' '}
                or decrypt a file using{' '}
                <Link
                  to={ROUTES.UNLOCK}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Unlock PDF
                </Link>
                , passwords are processed exclusively inside your local browser memory and are never
                transmitted over the network.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="ai-features">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec3Title', {
                  defaultValue:
                    '3. Opt-In Cloud AI Features Disclosure (AI Analyze PDF & OCR PDF)',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec3Desc', {
                defaultValue:
                  'PDFMinty provides two clearly labeled, optional AI-powered tools: the AI PDF Assistant (/ai-analyze-pdf/) and OCR PDF (/ocr-pdf/). Unlike our standard local tools, these two features require cloud inference via the Google Gemini API.',
              })}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Affirmative User Consent Required:</strong> Neither tool transmits any data
                automatically. Before any AI analysis or OCR transcription begins, you must actively
                initiate the action and confirm consent in the user interface.
              </li>
              <li>
                <strong>Data Minimized &amp; Scoped:</strong> For{' '}
                <Link
                  to={ROUTES.AI_ANALYZE}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  AI Analyze PDF
                </Link>
                , text is first extracted locally in your browser (up to 12 pages / 40,000
                characters) and only the extracted plain text and your prompt are sent over a TLS
                1.3 encrypted HTTPS connection to our serverless edge proxy (
                <code>/api/gemini-proxy</code>) for processing by the Google Gemini API. For{' '}
                <Link
                  to={ROUTES.OCR_PDF}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  OCR PDF
                </Link>
                , only the rendered page images you select (up to 5 pages per batch) are transmitted
                for optical character recognition.
              </li>
              <li>
                <strong>Zero Retention &amp; Ephemeral Processing:</strong> PDFMinty&apos;s edge
                proxy acts purely as a stateless pass-through to protect API credentials. We never
                log, store, cache, or retain your document text, page images, prompts, or AI
                responses in any database or storage medium.
              </li>
            </ul>
          </section>

          {/* Section 4: Google User Data & OAuth 2.0 */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="google-oauth">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.secGoogleTitle', {
                  defaultValue:
                    '4. Google User Data, OAuth 2.0 Authentication & Account Information',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.secGoogleDesc', {
                defaultValue:
                  'All 30+ PDF tools on PDFMinty are publicly accessible to guest users without requiring registration or login. However, if you optionally choose to create an account or sign in using Google Sign-In (OAuth 2.0) or Email/Password authentication (powered by Google Firebase Authentication), we collect and process specific basic account information.',
              })}
            </p>
            <div className="space-y-2">
              <p className="font-bold text-on-surface">
                4.1 Specific Google User Data We Access (OAuth 2.0 Scopes):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <code>openid</code> — Verifies your unique Google Account identifier (UID) for
                  secure authentication.
                </li>
                <li>
                  <code>https://www.googleapis.com/auth/userinfo.email</code> — Accesses your
                  primary Google Account email address and email verification status to identify
                  your account and communicate essential account security notices.
                </li>
                <li>
                  <code>https://www.googleapis.com/auth/userinfo.profile</code> — Accesses your
                  public display name and profile picture URL so we can display your name and avatar
                  in the application header and your Account Dashboard.
                </li>
              </ul>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-bold text-on-surface">
                4.2 How We Use &amp; Store Google User Data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Authentication &amp; Session Security:</strong> To sign you in securely,
                  maintain your authenticated session token, and protect your account against
                  unauthorized access.
                </li>
                <li>
                  <strong>Quota &amp; Subscription Management:</strong> To synchronize your account
                  profile and membership plan (<code>free</code> vs. <code>pro</code> tier) in our
                  Google Cloud Firestore database (under the isolated document path{' '}
                  <code>/users/&#123;uid&#125;</code>), unlocking higher daily task allowances and
                  file size limits (150 MB for Free accounts; 500 MB and unlimited tasks for PRO
                  members).
                </li>
                <li>
                  <strong>Strict Scope Limitation:</strong> PDFMinty <strong>never</strong> requests
                  access to restricted or sensitive Google Workspace scopes. We never access, read,
                  modify, or delete your Google Drive files, Gmail messages, Google Contacts, or
                  Google Calendar.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Mandatory Limited Use Disclosure */}
          <section
            className="space-y-3 pt-6 border-t border-border-muted bg-emerald-500/5 p-5 sm:p-6 rounded-2xl border border-emerald-500/20"
            id="google-limited-use"
          >
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t('privacyPolicy.secLimitedUseTitle', {
                  defaultValue:
                    '5. Google API Services User Data Policy (Mandatory Limited Use Disclosure)',
                })}
              </span>
            </h2>
            <p className="text-on-surface leading-relaxed font-bold">
              {t('privacyPolicy.secLimitedUseDesc', {
                defaultValue:
                  "PDFMinty's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.",
              })}{' '}
              Please review the official{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline font-extrabold"
              >
                Google API Services User Data Policy
              </a>
              .
            </p>
            <p>
              In strict accordance with Google&apos;s Limited Use requirements, PDFMinty guarantees
              and enforces the following binding commitments regarding all Google User Data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Limited to User-Facing Features:</strong> We only use Google user data to
                provide or improve user-facing authentication and account management features that
                are prominent in the PDFMinty application interface.
              </li>
              <li>
                <strong>No Unauthorized Third-Party Transfers:</strong> We do not transfer, sell,
                rent, lease, or disclose Google user data to any third parties, data brokers, or
                external platforms, except as strictly necessary to provide the user-facing
                authentication service (via Google Firebase), to comply with applicable laws, or as
                part of a merger, acquisition, or sale of assets after obtaining explicit prior user
                consent.
              </li>
              <li>
                <strong>Zero Use for Advertising:</strong> We never use or transfer Google user data
                for serving advertisements, including retargeting, personalized advertising, or
                interest-based advertising.
              </li>
              <li>
                <strong>Prohibition on Human Inspection:</strong> No human personnel are permitted
                to read or inspect Google user data unless we first obtain your affirmative
                agreement for specific support inquiries, it is necessary for security purposes
                (such as investigating abuse), or it is required to comply with applicable law.
              </li>
              <li>
                <strong>No AI or ML Model Training:</strong> Google user data is never used to
                train, fine-tune, or improve generalized Artificial Intelligence (AI) or Machine
                Learning (ML) models.
              </li>
            </ul>
          </section>

          {/* Section 6: Data Retention, Account Deletion & Access Revocation */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="data-retention">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.secRetentionTitle', {
                  defaultValue: '6. Data Retention, Account Deletion & Access Revocation',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.secRetentionDesc', {
                defaultValue:
                  'We retain your user account profile (email, display name, UID, and subscription status) in Google Cloud Firestore only for as long as you maintain an active account with PDFMinty. You have the absolute right to revoke access and delete your personal data at any time:',
              })}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Revoking Google OAuth Permissions:</strong> You can immediately revoke
                PDFMinty&apos;s access to your Google Account at any time via your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Google Account Security &amp; Third-Party Access Settings
                </a>
                .
              </li>
              <li>
                <strong>Account &amp; Database Deletion:</strong> You may request permanent deletion
                of your PDFMinty user account and all associated Firestore profile records directly
                from your{' '}
                <Link
                  to={ROUTES.DASHBOARD}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Account Dashboard
                </Link>{' '}
                or by emailing our Data Protection Team at{' '}
                <a
                  href="mailto:support@pdfminty.com"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  support@pdfminty.com
                </a>{' '}
                or{' '}
                <a
                  href="mailto:pdfminty@gmail.com"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  pdfminty@gmail.com
                </a>{' '}
                with the subject line <em>&ldquo;Account Deletion Request&rdquo;</em>. All account
                records and authentication identifiers are permanently and irreversibly purged
                within <strong>7 business days</strong>.
              </li>
              <li>
                <strong>Clearing Local Browser Data:</strong> Guest task counters, recent tool
                activity summaries, theme settings, and consent tokens stored in your browser&apos;s{' '}
                <code>localStorage</code> can be cleared instantly at any time through your browser
                settings.
              </li>
            </ul>
          </section>

          {/* Section 7: Data Security & Infrastructure */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="security-measures">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <span>7. Data Security, Encryption &amp; Firestore Isolation Rules</span>
            </h2>
            <p>
              PDFMinty implements defense-in-depth technical and organizational security safeguards
              to protect application integrity and user account records:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Transport Layer Encryption:</strong> All network traffic across{' '}
                <code>pdfminty.com</code> is encrypted in transit using HTTPS / TLS 1.3 with HTTP
                Strict Transport Security (HSTS) preloading enabled (
                <code>max-age=31536000; includeSubDomains; preload</code>).
              </li>
              <li>
                <strong>Strict Firestore Security Rules:</strong> User profile records in Google
                Cloud Firestore are protected by strict cryptographic security rules that enforce
                strict user isolation (<code>request.auth != null &amp;&amp; request.auth.uid == userId</code>
                ), preventing any user from reading or modifying another user&apos;s profile, email,
                or privilege tier.
              </li>
              <li>
                <strong>Browser Hardening Headers:</strong> Every page response enforces a strict{' '}
                <code>Content-Security-Policy (CSP)</code>, <code>X-Frame-Options: DENY</code>,{' '}
                <code>X-Content-Type-Options: nosniff</code>, and restrictive{' '}
                <code>Permissions-Policy</code> headers (disabling unauthorized camera, microphone,
                geolocation, and USB access).
              </li>
            </ul>
          </section>

          {/* Section 8: Google AdSense & Third-Party Advertising */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="advertising">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec4Title', {
                  defaultValue: '8. Google AdSense & Third-Party Advertising Cookies',
                })}
              </span>
            </h2>
            <div className="space-y-3">
              <p>
                {t('privacyPolicy.sec4Intro', {
                  defaultValue:
                    'PDFMinty uses Google AdSense to display advertisements on public informational pages to support free access to our browser PDF toolkit. To comply with Google Publisher and AdSense policies, please review the following disclosures:',
                })}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {t('privacyPolicy.sec4Li1', {
                    defaultValue:
                      "Third-party vendors, including Google, use cookies (such as the DoubleClick DART cookie) to serve ads based on a user's prior visits to this website or other websites on the Internet.",
                  })}
                </li>
                <li>
                  {t('privacyPolicy.sec4Li2', {
                    defaultValue:
                      "Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to PDFMinty and/or other sites on the Internet.",
                  })}
                </li>
                <li>
                  {t('privacyPolicy.sec4OptOut', {
                    defaultValue:
                      "Users may opt out of personalized advertising at any time by visiting Google's",
                  })}{' '}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Ads Settings
                  </a>{' '}
                  {t('privacyPolicy.sec4Or', { defaultValue: 'or by visiting' })}{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    www.aboutads.info
                  </a>
                  .
                </li>
                <li>
                  {t('privacyPolicy.sec4Partner', {
                    defaultValue:
                      'For more details on how Google processes data when you visit partner sites, please see Google’s official policy at',
                  })}{' '}
                  <a
                    href="https://policies.google.com/technologies/partner-sites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    How Google uses information from sites or apps that use our services
                  </a>
                  .
                </li>
              </ul>
            </div>
          </section>

          {/* Section 9: CMP & Cookie Policy */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="cookie-consent">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.secCmpTitle', {
                  defaultValue:
                    '9. Consent Management Platform (CMP) & Cookie Preferences (EEA, UK & Switzerland)',
                })}
              </span>
            </h2>
            <div className="space-y-3">
              <p>
                {t('privacyPolicy.secCmpIntro', {
                  defaultValue:
                    'For visitors located in the European Economic Area (EEA), the United Kingdom, and Switzerland, PDFMinty deploys a Google-Certified Consent Management Platform (CMP) — Cookiebot by Usercentrics (CMP ID: 134) — in strict adherence to the IAB Europe Transparency and Consent Framework (TCF v2.2) and Google Consent Mode v2.',
                })}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>CMP Provider &amp; Certification:</strong> Our consent management
                  infrastructure integrates{' '}
                  <a
                    href="https://www.cookiebot.com/en/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Cookiebot by Usercentrics
                  </a>{' '}
                  (IAB TCF ID: 134), certified under Google&apos;s EU User Consent Policy.
                </li>
                <li>
                  <strong>Default Privacy Protection:</strong> Under Google Consent Mode v2, all
                  advertising signals (<code>ad_storage</code>, <code>ad_user_data</code>, and{' '}
                  <code>ad_personalization</code>) default to <code>denied</code> until you grant
                  affirmative consent. Core PDF processing runs 100% locally in your browser and
                  requires no advertising cookies.
                </li>
                <li>
                  <strong>Granular Controls &amp; Instant Revocation:</strong> You can independently
                  control permissions for advertising cookies, user identifiers, and anonymous
                  analytics storage (<code>analytics_storage</code>), and modify or withdraw your
                  consent at any time using the button below.
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const win = window as unknown as { openCookiePreferences?: () => void };
                    if (typeof win.openCookiePreferences === 'function') {
                      win.openCookiePreferences();
                    } else {
                      window.dispatchEvent(new CustomEvent('open-cmp-preferences'));
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {t('consentBanner.managePreferences', {
                      defaultValue: 'Manage Cookie & Privacy Preferences',
                    })}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 10: Web Analytics & Abuse Prevention */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="analytics">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec5Title', {
                  defaultValue: '10. Web Analytics, Error Telemetry & Abuse Prevention',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec5Desc', {
                defaultValue:
                  'PDFMinty uses privacy-respecting website performance analytics (Google Analytics 4 with IP anonymization enabled and Cloudflare Web Analytics) to measure aggregate traffic trends, page load speeds, and core web vitals. We never log document filenames, PDF text contents, or personal identities in analytics events.',
              })}
            </p>
            <p>
              To protect our serverless API endpoints (<code>/api/gemini-proxy</code>,{' '}
              <code>/api/contact</code>, <code>/api/subscribe</code>, and{' '}
              <code>/api/feedback</code>) against automated DDoS attacks and quota abuse, our edge
              middleware utilizes ephemeral rate-limiting counters via Cloudflare KV and
              cryptographically signed HMAC-SHA256 state tokens that expire automatically within 60
              seconds.
            </p>
          </section>

          {/* Section 11: Third-Party Sub-Processors */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="subprocessors">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              <span>11. Third-Party Service Providers &amp; Sub-Processors</span>
            </h2>
            <p>
              PDFMinty partners with the following industry-certified infrastructure providers to
              deliver specific platform capabilities:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cloudflare, Inc. (Cloudflare Pages &amp; Workers):</strong> Global CDN
                hosting, DDoS protection, TLS termination, and serverless edge routing.
              </li>
              <li>
                <strong>Google LLC (Firebase Authentication &amp; Cloud Firestore):</strong> Optional
                user authentication, OAuth 2.0 session management, and user account tier storage.
              </li>
              <li>
                <strong>Google LLC (Google Gemini API):</strong> Ephemeral cloud AI document
                summarization and optical character recognition strictly when initiated by user
                opt-in.
              </li>
              <li>
                <strong>Google LLC (Google AdSense &amp; Google Analytics 4):</strong> Website
                monetization and anonymized traffic measurement subject to user cookie consent.
              </li>
              <li>
                <strong>Resend, Inc.:</strong> Transactional email delivery strictly when a user
                voluntarily submits our Contact Us form or subscribes to our optional newsletter.
              </li>
            </ul>
          </section>

          {/* Section 12: GDPR & CCPA/CPRA Privacy Rights */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="privacy-rights">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec6Title', {
                  defaultValue:
                    '12. International Privacy Rights (GDPR, UK GDPR, CCPA/CPRA & Global Laws)',
                })}
              </span>
            </h2>
            <div className="space-y-3">
              <p>
                {t('privacyPolicy.sec6Intro', {
                  defaultValue:
                    'Depending on your jurisdiction, you hold statutory rights under data protection regulations including the European Union General Data Protection Regulation (GDPR), the UK GDPR, the California Consumer Privacy Act (CCPA/CPRA), and Brazil’s LGPD:',
                })}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>
                    {t('privacyPolicy.sec6Li1Title', {
                      defaultValue: 'Right of Access, Portability & Deletion (GDPR Arts. 15–20):',
                    })}
                  </strong>{' '}
                  {t('privacyPolicy.sec6Li1', {
                    defaultValue:
                      'You have the right to request a copy of any personal account data held by PDFMinty, request correction of inaccurate data, or demand complete erasure. Because standard PDF tools run 100% locally in your browser, we never possess your PDF files.',
                  })}
                </li>
                <li>
                  <strong>
                    {t('privacyPolicy.sec6Li2Title', {
                      defaultValue: 'Do Not Sell or Share My Personal Information (CCPA/CPRA):',
                    })}
                  </strong>{' '}
                  {t('privacyPolicy.sec6Li2', {
                    defaultValue:
                      'PDFMinty does not sell, rent, or monetize your personal information, Google user data, or document contents to any third parties.',
                  })}
                </li>
                <li>
                  <strong>Legal Basis for Processing (EEA/UK Users):</strong> We process optional
                  account data under <em>Contractual Necessity</em> (GDPR Art. 6(1)(b)) to provide
                  your requested account features, opt-in AI/cookie processing under{' '}
                  <em>Explicit Consent</em> (GDPR Art. 6(1)(a)), and edge security/anti-abuse under{' '}
                  <em>Legitimate Interests</em> (GDPR Art. 6(1)(f)).
                </li>
                <li>
                  <strong>
                    {t('privacyPolicy.sec6Li3Title', { defaultValue: 'Browser & Cookie Controls:' })}
                  </strong>{' '}
                  {t('privacyPolicy.sec6Li3', {
                    defaultValue:
                      'You may configure your web browser to reject cookies or clear local storage at any time without impacting the core functionality of our client-side PDF tools.',
                  })}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 13: Children's Privacy */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="childrens-privacy">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-500" />
              <span>13. Children&apos;s Privacy (COPPA Compliance)</span>
            </h2>
            <p>
              PDFMinty is a general-audience productivity toolkit and is not directed to children
              under the age of 13 (or under 16 in applicable EEA jurisdictions). We do not knowingly
              collect personally identifiable information from children. If you are a parent or
              guardian and believe that a child has created an account or provided personal
              information to us, please contact us immediately at{' '}
              <a
                href="mailto:support@pdfminty.com"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                support@pdfminty.com
              </a>{' '}
              so we can promptly delete such information.
            </p>
          </section>

          {/* Section 14: Crawlers & Verification Bots */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="crawler-access">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec7Title', {
                  defaultValue: '14. AI Bots, Crawlers & Search Engine Verification Access Policy',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec7Desc', {
                defaultValue:
                  'PDFMinty supports open web standards. Search engine crawlers (Googlebot, Bingbot), Google OAuth and Brand Verification crawlers, Google AdSense crawlers (Mediapartners-Google and Google-Display-Ads-Bot), and benign AI indexers (GPTBot, ClaudeBot, PerplexityBot) are explicitly permitted to access, crawl, and verify our homepage, privacy policy, terms of service, and all 30+ public PDF tools without authentication.',
              })}
            </p>
          </section>

          {/* Section 15: Contact Us */}
          <section className="space-y-3 pt-6 border-t border-border-muted" id="contact-privacy">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              <span>
                {t('privacyPolicy.sec8Title', {
                  defaultValue: '15. Contact Us & Data Protection Inquiries',
                })}
              </span>
            </h2>
            <p>
              {t('privacyPolicy.sec8Desc', {
                defaultValue:
                  'If you have any questions, data subject access requests (DSAR), account deletion requests, or inquiries regarding this Privacy Policy or our Google OAuth compliance, please contact our Data Protection & Support Team via our',
              })}{' '}
              <Link
                to={ROUTES.CONTACT}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {t('privacyPolicy.contactPage', { defaultValue: 'Contact Page' })}
              </Link>{' '}
              {t('privacyPolicy.orEmail', { defaultValue: 'or directly by email at' })}{' '}
              <a
                href="mailto:support@pdfminty.com"
                className="font-semibold text-on-surface underline hover:text-emerald-500"
              >
                support@pdfminty.com
              </a>{' '}
              or{' '}
              <a
                href="mailto:pdfminty@gmail.com"
                className="font-semibold text-on-surface underline hover:text-emerald-500"
              >
                pdfminty@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
