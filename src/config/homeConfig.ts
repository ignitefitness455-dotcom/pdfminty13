import {
  Merge,
  Scissors,
  CheckSquare,
  Move,
  Minimize2,
  RotateCw,
  Trash2,
  Bookmark,
  Hash,
  FilePlus,
  Shield,
  Lock,
  Image,
  Eye,
  Sparkles,
  Printer,
  FileText,
  Wrench,
  FilePenLine,
  ShieldBan,
  FileCode2,
} from 'lucide-react';
import React from 'react';

import { logger } from '../utils/logger';

export const prefetchMap: Record<string, () => Promise<unknown>> = {
  'merge-pdf': () => import('../pages/MergePage'),
  'split-pdf': () => import('../pages/SplitPage'),
  'rotate-pdf': () => import('../pages/RotatePage'),
  'delete-pages-pdf': () => import('../pages/DeletePagesPage'),
  'extract-pages-pdf': () => import('../pages/ExtractPagesPdfPage'),
  'reorder-pdf': () => import('../pages/ReorderPdfPage'),
  'watermark-pdf': () => import('../pages/WatermarkPage'),
  'add-page-numbers': () => import('../pages/PageNumbersPage'),
  'add-blank-page': () => import('../pages/AddBlankPage'),
  'protect-pdf': () => import('../pages/ProtectPage'),
  'unlock-pdf': () => import('../pages/UnlockPage'),
  'image-to-pdf': () => import('../pages/ImgToPdfPage'),
  'pdf-to-image': () => import('../pages/PdfToImgPage'),
  'ai-analyze-pdf': () => import('../pages/AiAnalyzePage'),
  'grayscale-pdf': () => import('../pages/GrayscalePdfPage'),
  'flatten-pdf': () => import('../pages/FlattenPdfPage'),
  'repair-pdf': () => import('../pages/RepairPdfPage'),
  'edit-pdf-metadata': () => import('../pages/EditMetadataPage'),
  'sanitize-pdf': () => import('../pages/SanitizePdfPage'),
  'pdf-to-markdown': () => import('../pages/PdfToMarkdownPage'),
  'sign-pdf': () => import('../pages/SignPdfPage'),
  'ocr-pdf': () => import('../pages/OcrPdfPage'),
};

const prefetchedSet = new Set<string>();

export const prefetchToolChunk = (slug: string): void => {
  const key = slug.toLowerCase();
  if (prefetchedSet.has(key)) return;
  prefetchedSet.add(key);
  const loader = prefetchMap[key];
  if (loader) {
    loader().catch((err: unknown) => logger.debug('[prefetch] chunk error:', err));
  }
};

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Merge,
  Scissors,
  CheckSquare,
  Move,
  Minimize2,
  RotateCw,
  Trash2,
  Bookmark,
  Hash,
  FilePlus,
  Shield,
  Lock,
  Image,
  Eye,
  Sparkles,
  Printer,
  FileText,
  Wrench,
  FilePenLine,
  ShieldBan,
  FileCode2,
};

export const badgeColors: Record<string, string> = {
  popular: 'bg-security-green/10 text-security-green border-security-green/20',
  smart_reduction: 'bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim border-tertiary-fixed-dim/20',
  ai_hybrid: 'bg-primary-fixed/10 text-primary-fixed border-primary-fixed/20',
  offline_aes: 'bg-critical-red/10 text-critical-red border-critical-red/20',
  fast_convert: 'bg-warning-amber/10 text-warning-amber border-warning-amber/20',
  extractor: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
  visual_extract: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  interactive_order: 'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20',
  secure: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
};

export const badgeLabels: Record<string, string> = {
  popular: 'POPULAR',
  smart_reduction: 'SMART REDUCTION',
  ai_hybrid: 'AI HYBRID',
  offline_aes: 'OFFLINE AES',
  fast_convert: 'FAST CONVERT',
  extractor: 'EXTRACTOR',
  visual_extract: 'VISUAL EXTRACT',
  interactive_order: 'INTERACTIVE ORDER',
  secure: 'SECURE',
};

export const HOMEPAGE_H1_PART1 = "Free Browser-Based PDF Tools — 100% Private, ";
export const HOMEPAGE_H1_PART2 = "Zero Uploads";
export const HOMEPAGE_H1 = `${HOMEPAGE_H1_PART1}${HOMEPAGE_H1_PART2}`;

export const HOMEPAGE_META = {
  title: 'PDFMinty — Free Browser-Based PDF Tools & Privacy Toolkit',
  description: 'Free browser-based PDF toolkit. Merge, split, compress, protect, and edit PDFs 100% in your browser. No uploads, no sign-up, complete confidentiality.',
};
