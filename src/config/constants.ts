export interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  icon: string;
}

export const tools: Tool[] = [
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description:
      'Combine multiple PDF files into a single, clean document in any order you choose.',
    category: 'page-operations',
    path: '/merge-pdf',
    icon: 'Merge',
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description:
      'Extract ranges of pages or split custom pages into multi-part individual documents.',
    category: 'page-operations',
    path: '/split-pdf',
    icon: 'Scissors',
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description:
      'Rotate single pages or the entire document pages 90, 180, or 270 degrees clockwise.',
    category: 'page-operations',
    path: '/rotate-pdf',
    icon: 'RotateCw',
  },
  {
    id: 'delete-pages-pdf',
    title: 'Delete Pages',
    description:
      'Selectively strip out unwanted, trailing, or confidential pages from your master files.',
    category: 'organize',
    path: '/delete-pages-pdf',
    icon: 'Trash2',
  },
  {
    id: 'watermark-pdf',
    title: 'Watermark PDF',
    description:
      'Superimpose elegant, custom diagonal text stamps with configurable size and transparency.',
    category: 'security-edit',
    path: '/watermark-pdf',
    icon: 'Bookmark',
  },
  {
    id: 'add-page-numbers',
    title: 'Page Numbers',
    description: 'Stitch standard page indices automatically onto document page footer panels.',
    category: 'security-edit',
    path: '/add-page-numbers',
    icon: 'Hash',
  },
  {
    id: 'add-blank-page',
    title: 'Add Blank Page',
    description:
      'Incorporate empty page spacing into start, middle, or end of your document flows.',
    category: 'organize',
    path: '/add-blank-page',
    icon: 'FilePlus',
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description:
      'Encrypt and secure sensitive PDFs using client-side AES standard algorithms.',
    category: 'security-edit',
    path: '/protect-pdf',
    icon: 'Shield',
  },
  {
    id: 'unlock-pdf',
    title: 'Unlock PDF',
    description:
      'Strip document lock credentials from your standard user files for clear, unlocked reading.',
    category: 'security-edit',
    path: '/unlock-pdf',
    icon: 'Lock',
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert multiple PNG or JPG photos into clean formatted PDF pages instantly.',
    category: 'convert',
    path: '/image-to-pdf',
    icon: 'Image',
  },
  {
    id: 'pdf-to-image',
    title: 'PDF to Image',
    description:
      'Convert multiple pages from document directly into portable standard image canvases.',
    category: 'convert',
    path: '/pdf-to-image',
    icon: 'Eye',
  },
  {
    id: 'pdf-to-markdown',
    title: 'PDF to Markdown',
    description:
      'Convert PDF files into clean structured Markdown text offline and extract embedded figures.',
    category: 'convert',
    path: '/pdf-to-markdown',
    icon: 'FileCode2',
  },
  {
    id: 'ai-analyze',
    title: 'AI Analyze',
    description:
      'Summarize, analyze, and inspect your PDF document content using secure offline local text parsing boosted by premium AI assistance.',
    category: 'intelligence',
    path: '/ai-analyze-pdf',
    icon: 'Sparkles',
  },
  {
    id: 'grayscale-pdf',
    title: 'Grayscale PDF',
    description: 'Convert colored PDF documents to beautiful grayscale/monochrome layouts locally.',
    category: 'convert',
    path: '/grayscale-pdf',
    icon: 'Printer',
  },
  {
    id: 'extract-pages',
    title: 'Extract Pages',
    description: 'Selectively extract and export individual pages into a separate, clean PDF document instantly.',
    category: 'organize',
    path: '/extract-pages-pdf',
    icon: 'CheckSquare',
  },
  {
    id: 'reorder',
    title: 'Reorder PDF',
    description: 'Sort, rearrange, or shuffle PDF pages interactively with real-time thumbnail previews.',
    category: 'organize',
    path: '/reorder-pdf',
    icon: 'Move',
  },
  {
    id: 'flatten-pdf',
    title: 'Flatten PDF',
    description: 'Make fillable form fields and annotations permanent and non-editable locally.',
    category: 'security',
    path: '/flatten-pdf',
    icon: 'FileText',
  },
  {
    id: 'repair-pdf',
    title: 'Repair PDF',
    description: 'Fix corrupt cross-reference tables (XREFs), strip trailing junk bytes, and align headers locally.',
    category: 'security-edit',
    path: '/repair-pdf',
    icon: 'Wrench',
  },
  {
    id: 'edit-metadata',
    title: 'Edit Metadata',
    description: 'Change PDF title, author, subject, and keywords securely without uploading.',
    category: 'security-edit',
    path: '/edit-pdf-metadata',
    icon: 'FilePenLine',
  },
  {
    id: 'sanitize-pdf',
    title: 'Sanitize PDF',
    description: 'Remove embedded scripts, hidden metadata, and malicious actions for secure sharing.',
    category: 'security-edit',
    path: '/sanitize-pdf',
    icon: 'ShieldBan',
  },
  {
    id: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Draw, type, or upload custom electronic signatures onto PDF pages locally.',
    category: 'security-edit',
    path: '/sign-pdf',
    icon: 'FilePenLine',
  },
  {
    id: 'ocr-pdf',
    title: 'OCR PDF',
    description: 'Extract clean, searchable text or Markdown from scanned and image-only PDFs with AI Vision.',
    category: 'intelligence',
    path: '/ocr-pdf',
    icon: 'Sparkles',
  },
];

export const PDF_PAGE_SIZES = {
  A4: [595.28, 841.89] as readonly [number, number],
  Letter: [612, 792] as readonly [number, number],
  Legal: [612, 1008] as readonly [number, number],
};

export const WATERMARK_DEFAULTS = {
  opacity: 0.35,
  size: 50,
  rotationDegrees: 45,
  colorHex: '#94a3b8',
};

export const PAGE_NUMBER_DEFAULTS = {
  position: 'bottom-right' as const,
  format: 'Page {n} of {total}',
  startFrom: 1,
  skipFirstPage: false,
};

export const UPLOAD_LIMITS = {
  MAX_TOTAL_SIZE: 150 * 1024 * 1024,
  MAX_FILES: 50,
  MAX_SINGLE_FILE: 100 * 1024 * 1024,
};

export const TOOL_SIZE_LIMITS: Record<string, { maxSingleMB: number; maxTotalMB?: number }> = {
  'merge-pdf': { maxSingleMB: 50, maxTotalMB: 150 },
  'split-pdf': { maxSingleMB: 50 },
  'rotate-pdf': { maxSingleMB: 50 },
  'delete-pages-pdf': { maxSingleMB: 50 },
  'watermark-pdf': { maxSingleMB: 50 },
  'add-page-numbers': { maxSingleMB: 50 },
  'add-blank-page': { maxSingleMB: 50 },
  'protect-pdf': { maxSingleMB: 100 },
  'unlock-pdf': { maxSingleMB: 100 },
  'image-to-pdf': { maxSingleMB: 20, maxTotalMB: 100 },
  'pdf-to-image': { maxSingleMB: 35 },
  'pdf-to-markdown': { maxSingleMB: 35 },
  'ai-analyze': { maxSingleMB: 15 },
  'extract-pages-pdf': { maxSingleMB: 50 },
  'reorder-pdf': { maxSingleMB: 50 },
  'grayscale-pdf': { maxSingleMB: 30 },
  'flatten-pdf': { maxSingleMB: 50 },
  'repair-pdf': { maxSingleMB: 50 },
  'edit-metadata': { maxSingleMB: 50 },
  'sanitize-pdf': { maxSingleMB: 50 },
  'sign-pdf': { maxSingleMB: 50 },
  'ocr-pdf': { maxSingleMB: 35 },
};

export const AI_LIMITS = {
  MAX_TEXT_LENGTH: 30000,
  DEFAULT_MODEL: 'gemini-2.0-flash',
};

/**
 * Rate limit constants.
 *
 * NOTE: These values are documentation-only. The actual rate limits are
 * enforced in the Cloudflare Pages Functions under functions/api/. The
 * values here MUST be kept in sync with:
 *   - functions/api/gemini-proxy.ts → LIMIT_PER_HOUR (default 30)
 *   - functions/api/contact.ts     → LIMIT_PER_HOUR (default 3)
 *   - functions/api/feedback.ts    → LIMIT_PER_HOUR (default 3)
 *   - functions/api/error.ts       → RATE_LIMIT_PER_HOUR (default 30)
 *
 * If you change a limit in a Worker function, update this constant too.
 */
export const RATE_LIMITS = {
  GEMINI_PROXY: 30,
  CONTACT: 3,
  FEEDBACK: 3,
  ERROR: 30,
};

export const APP_INFO = {
  NAME: 'PDFMinty',
  VERSION: '1.0.0',
  URL: 'https://pdfminty.com',
  REPO_URL: 'https://github.com/pdfminty/pdfminty',
};

export const NORD_AFFILIATE_LINKS = {
  NORDVPN: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=153942&url_id=902',
  NORDPASS: 'https://go.nordpass.io/aff_c?offer_id=488&aff_id=153942&url_id=9356',
  NORDVPN_ARABIA: 'https://go.getnord.net/aff_c?offer_id=226&aff_id=153942',
  THREAT_PROTECTION: 'https://go.nordvpn.net/aff_c?offer_id=725&aff_id=153942',
};
