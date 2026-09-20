import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import FaqSchema from './components/FaqSchema';
import HowToSchema from './components/HowToSchema';
import { Layout } from './components/Layout';
import { PWAController } from './components/PWAController';
import { SkipToContent } from './components/SkipToContent';
import ToolSkeleton from './components/ToolSkeleton';
import { ROUTES } from './config/routes';
import { AboutUsPage } from './pages/AboutUsPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy: all interactive heavy tools — splits each tool's code out of the initial bundle.
const MergePage = lazyWithRetry(() => import('./pages/MergePage').then((m) => ({ default: m.MergePage })));
const SplitPage = lazyWithRetry(() => import('./pages/SplitPage').then((m) => ({ default: m.SplitPage })));
const RotatePage = lazyWithRetry(() => import('./pages/RotatePage').then((m) => ({ default: m.RotatePage })));
const DeletePagesPage = lazyWithRetry(() => import('./pages/DeletePagesPage').then((m) => ({ default: m.DeletePagesPage })));
const ExtractPagesPdfPage = lazyWithRetry(() => import('./pages/ExtractPagesPdfPage').then((m) => ({ default: m.ExtractPagesPdfPage })));
const ReorderPdfPage = lazyWithRetry(() => import('./pages/ReorderPdfPage').then((m) => ({ default: m.ReorderPdfPage })));
const WatermarkPage = lazyWithRetry(() => import('./pages/WatermarkPage').then((m) => ({ default: m.WatermarkPage })));
const PageNumbersPage = lazyWithRetry(() => import('./pages/PageNumbersPage').then((m) => ({ default: m.PageNumbersPage })));
const AddBlankPage = lazyWithRetry(() => import('./pages/AddBlankPage').then((m) => ({ default: m.AddBlankPage })));
const ProtectPage = lazyWithRetry(() => import('./pages/ProtectPage').then((m) => ({ default: m.ProtectPage })));
const UnlockPage = lazyWithRetry(() => import('./pages/UnlockPage').then((m) => ({ default: m.UnlockPage })));
const ImgToPdfPage = lazyWithRetry(() => import('./pages/ImgToPdfPage').then((m) => ({ default: m.ImgToPdfPage })));
const PdfToImgPage = lazyWithRetry(() => import('./pages/PdfToImgPage').then((m) => ({ default: m.PdfToImgPage })));
const PdfToMarkdownPage = lazyWithRetry(() => import('./pages/PdfToMarkdownPage').then((m) => ({ default: m.PdfToMarkdownPage })));
const AiAnalyzePage = lazyWithRetry(() => import('./pages/AiAnalyzePage').then((m) => ({ default: m.AiAnalyzePage })));
const GrayscalePdfPage = lazyWithRetry(() => import('./pages/GrayscalePdfPage').then((m) => ({ default: m.GrayscalePdfPage })));
const FlattenPdfPage = lazyWithRetry(() => import('./pages/FlattenPdfPage').then((m) => ({ default: m.FlattenPdfPage })));
const RepairPdfPage = lazyWithRetry(() => import('./pages/RepairPdfPage').then((m) => ({ default: m.RepairPdfPage })));
const IsSafePdfArticlePage = lazyWithRetry(() => import('./pages/IsSafePdfArticlePage').then((m) => ({ default: m.IsSafePdfArticlePage })));
const EditMetadataPage = lazyWithRetry(() => import('./pages/EditMetadataPage').then((m) => ({ default: m.default })));
const SanitizePdfPage = lazyWithRetry(() => import('./pages/SanitizePdfPage').then((m) => ({ default: m.default })));
const SignPdfPage = lazyWithRetry(() => import('./pages/SignPdfPage').then((m) => ({ default: m.SignPdfPage })));
const OcrPdfPage = lazyWithRetry(() => import('./pages/OcrPdfPage').then((m) => ({ default: m.OcrPdfPage })));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })));
const AdobeAlternativePage = lazyWithRetry(() => import('./pages/AdobeAlternativePage').then((m) => ({ default: m.AdobeAlternativePage })));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * Normalizes browser URL to the canonical trailing-slash structure.
 * Redirects any non-slash or malformed directory paths to their canonical trailing-slash equivalent.
 */
const TrailingSlashRedirect: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  let normalizedPath = pathname;
  if (!normalizedPath.startsWith('/api') && !normalizedPath.includes('.')) {
    // Strip trailing brackets/parentheses from link typos (e.g. /privacy-policy/))
    normalizedPath = normalizedPath.replace(/[)\]}>,;]+$/, '');
    if (/\/{2,}/.test(normalizedPath)) {
      normalizedPath = normalizedPath.replace(/\/{2,}/g, '/');
    }
    const lower = normalizedPath.toLowerCase();
    if (normalizedPath !== lower) {
      normalizedPath = lower;
    }
    if (normalizedPath !== '/' && !normalizedPath.endsWith('/')) {
      normalizedPath = `${normalizedPath}/`;
    }
  }

  if (normalizedPath !== pathname) {
    return <Navigate to={`${normalizedPath}${search}${hash}`} replace />;
  }

  return null;
};

export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <TrailingSlashRedirect />
      <SkipToContent />
      <Layout>
        <PWAController />
        <HowToSchema />
        <FaqSchema />
        <Suspense fallback={<ToolSkeleton />}>
          <Routes>
            <Route
              path={ROUTES.HOME}
              element={
                <ErrorBoundary resetKey="home">
                  <HomePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.MERGE}
              element={
                <ErrorBoundary resetKey="merge">
                  <MergePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.SPLIT}
              element={
                <ErrorBoundary resetKey="split">
                  <SplitPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.ROTATE}
              element={
                <ErrorBoundary resetKey="rotate">
                  <RotatePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.DELETE_PAGES}
              element={
                <ErrorBoundary resetKey="delete-pages">
                  <DeletePagesPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.EXTRACT_PAGES}
              element={
                <ErrorBoundary resetKey="extract-pages">
                  <ExtractPagesPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.REORDER}
              element={
                <ErrorBoundary resetKey="reorder">
                  <ReorderPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.WATERMARK}
              element={
                <ErrorBoundary resetKey="watermark">
                  <WatermarkPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.PAGE_NUMBERS}
              element={
                <ErrorBoundary resetKey="page-numbers">
                  <PageNumbersPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.ADD_BLANK}
              element={
                <ErrorBoundary resetKey="add-blank">
                  <AddBlankPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.PROTECT}
              element={
                <ErrorBoundary resetKey="protect">
                  <ProtectPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.UNLOCK}
              element={
                <ErrorBoundary resetKey="unlock">
                  <UnlockPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.IMG_TO_PDF}
              element={
                <ErrorBoundary resetKey="img-to-pdf">
                  <ImgToPdfPage />
                </ErrorBoundary>
              }
            />
            {/* Search-intent alias routes */}
            <Route path="/jpg-to-pdf" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/jpg-to-pdf/" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/jpeg-to-pdf" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/jpeg-to-pdf/" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/png-to-pdf" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/png-to-pdf/" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route
              path={ROUTES.PDF_TO_IMG}
              element={
                <ErrorBoundary resetKey="pdf-to-img">
                  <PdfToImgPage />
                </ErrorBoundary>
              }
            />
            <Route path="/pdf-to-jpg" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/pdf-to-jpg/" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/pdf-to-jpeg" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/pdf-to-jpeg/" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/pdf-to-png" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/pdf-to-png/" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route
              path={ROUTES.PDF_TO_MARKDOWN}
              element={
                <ErrorBoundary resetKey="pdf-to-markdown">
                  <PdfToMarkdownPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.AI_ANALYZE}
              element={
                <ErrorBoundary resetKey="ai-analyze">
                  <AiAnalyzePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.GRAYSCALE}
              element={
                <ErrorBoundary resetKey="grayscale">
                  <GrayscalePdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.FLATTEN}
              element={
                <ErrorBoundary resetKey="flatten">
                  <FlattenPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.REPAIR}
              element={
                <ErrorBoundary resetKey="repair">
                  <RepairPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.EDIT_METADATA}
              element={
                <ErrorBoundary resetKey="edit-metadata">
                  <EditMetadataPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.SANITIZE_PDF}
              element={
                <ErrorBoundary resetKey="sanitize-pdf">
                  <SanitizePdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.SIGN_PDF}
              element={
                <ErrorBoundary resetKey="sign-pdf">
                  <SignPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.OCR_PDF}
              element={
                <ErrorBoundary resetKey="ocr-pdf">
                  <OcrPdfPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.TRUST_ARTICLE}
              element={
                <ErrorBoundary resetKey="trust-article">
                  <IsSafePdfArticlePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.BLOG}
              element={
                <ErrorBoundary resetKey="blog">
                  <BlogPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.BLOG_POST}
              element={
                <ErrorBoundary resetKey="blog-post">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/blog/:postSlug"
              element={
                <ErrorBoundary resetKey="blog-post">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.COMPARE_SMALLPDF}
              element={
                <ErrorBoundary resetKey="compare-smallpdf">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.COMPARE_ILOVEPDF}
              element={
                <ErrorBoundary resetKey="compare-ilovepdf">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.COMPARE_PAGE}
              element={
                <ErrorBoundary resetKey="compare-page">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/compare/:postSlug"
              element={
                <ErrorBoundary resetKey="compare-page">
                  <BlogPostPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.PRIVACY_POLICY}
              element={
                <ErrorBoundary resetKey="privacy-policy">
                  <PrivacyPolicyPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.TERMS_OF_SERVICE}
              element={
                <ErrorBoundary resetKey="terms-of-service">
                  <TermsOfServicePage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.ABOUT_US}
              element={
                <ErrorBoundary resetKey="about-us">
                  <AboutUsPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.CONTACT}
              element={
                <ErrorBoundary resetKey="contact">
                  <ContactPage />
                </ErrorBoundary>
              }
            />
            <Route
              path={ROUTES.ADOBE_ALTERNATIVE}
              element={
                <ErrorBoundary resetKey="adobe-alternative">
                  <AdobeAlternativePage />
                </ErrorBoundary>
              }
            />
            {/* Legacy path redirects */}
            <Route path="/about" element={<Navigate to={ROUTES.ABOUT_US} replace />} />
            <Route path="/contact-us" element={<Navigate to={ROUTES.CONTACT} replace />} />
            <Route path="/privacy" element={<Navigate to={ROUTES.PRIVACY_POLICY} replace />} />
            <Route path="/terms" element={<Navigate to={ROUTES.TERMS_OF_SERVICE} replace />} />
            <Route path="/tos" element={<Navigate to={ROUTES.TERMS_OF_SERVICE} replace />} />
            <Route path="/edit-metadata" element={<Navigate to={ROUTES.EDIT_METADATA} replace />} />
            <Route path="/intelligence" element={<Navigate to={ROUTES.AI_ANALYZE} replace />} />
            <Route path="/protect" element={<Navigate to={ROUTES.PROTECT} replace />} />
            <Route path="/unlock" element={<Navigate to={ROUTES.UNLOCK} replace />} />
            <Route path="/compress" element={<Navigate to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/" replace />} />
            <Route path="/compress-pdf" element={<Navigate to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/" replace />} />
            <Route path="/delete-pages" element={<Navigate to={ROUTES.DELETE_PAGES} replace />} />
            <Route path="/extract-pages" element={<Navigate to={ROUTES.EXTRACT_PAGES} replace />} />
            <Route path="/reorder" element={<Navigate to={ROUTES.REORDER} replace />} />
            <Route path="/watermark" element={<Navigate to={ROUTES.WATERMARK} replace />} />
            <Route path="/page-numbers" element={<Navigate to={ROUTES.PAGE_NUMBERS} replace />} />
            <Route path="/add-blank" element={<Navigate to={ROUTES.ADD_BLANK} replace />} />
            <Route path="/img-to-pdf" element={<Navigate to={ROUTES.IMG_TO_PDF} replace />} />
            <Route path="/pdf-to-img" element={<Navigate to={ROUTES.PDF_TO_IMG} replace />} />
            <Route path="/grayscale" element={<Navigate to={ROUTES.GRAYSCALE} replace />} />
            <Route path="/flatten" element={<Navigate to={ROUTES.FLATTEN} replace />} />
            <Route path="/repair" element={<Navigate to={ROUTES.REPAIR} replace />} />
            <Route path="/sign" element={<Navigate to={ROUTES.SIGN_PDF} replace />} />
            <Route path="/ocr" element={<Navigate to={ROUTES.OCR_PDF} replace />} />
            <Route path="/sanitize" element={<Navigate to={ROUTES.SANITIZE_PDF} replace />} />
            <Route path="/merge" element={<Navigate to={ROUTES.MERGE} replace />} />
            <Route path="/split" element={<Navigate to={ROUTES.SPLIT} replace />} />
            <Route path="/rotate" element={<Navigate to={ROUTES.ROTATE} replace />} />
            <Route path="/switch-from-adobe-acrobat" element={<Navigate to={ROUTES.ADOBE_ALTERNATIVE} replace />} />
            <Route path="/is-it-safe-to-upload-pdf-to-online-tools" element={<Navigate to={ROUTES.TRUST_ARTICLE} replace />} />
            <Route path="/pdfminty-vs-smallpdf" element={<Navigate to={ROUTES.COMPARE_SMALLPDF} replace />} />
            <Route path="/pdfminty-vs-ilovepdf" element={<Navigate to={ROUTES.COMPARE_ILOVEPDF} replace />} />

            {/* Merged / Consolidated Blog Post Redirects */}
            <Route path="/blog/best-free-pdf-compressor-without-losing-quality" element={<Navigate to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/" replace />} />
            <Route path="/blog/how-to-compress-pdf-without-losing-quality-locally" element={<Navigate to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/" replace />} />
            <Route path="/blog/how-to-protect-a-pdf-with-password-in-3-easy-steps" element={<Navigate to="/blog/how-to-password-protect-a-pdf-offline/" replace />} />
            <Route path="/blog/how-to-edit-a-pdf-offline-without-uploading-it" element={<Navigate to="/blog/secure-pdf-editing-without-uploading/" replace />} />
            <Route path="/blog/why-offline-pdf-editors-are-the-future-of-privacy" element={<Navigate to="/blog/why-privacy-first-pdf-tools-matter-in-2026/" replace />} />

            {/* 404 fallback — shows real 404 page with noindex */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
};

export default App;
