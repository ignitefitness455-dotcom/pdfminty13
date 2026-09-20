import fs from 'fs';
import path from 'path';

const REPLACEMENTS = [
  // Buttons
  { pattern: />\s*Change File\s*</g, replace: ">{t('toolCommon.changeFile', { defaultValue: 'Change File' })}<" },
  { pattern: />\s*Remove\s*</g, replace: ">{t('toolCommon.changeFile', { defaultValue: 'Remove' })}<" },
  { pattern: />\s*Download\s*</g, replace: ">{t('toolCommon.download', { defaultValue: 'Download' })}<" },
  { pattern: />\s*Download All\s*</g, replace: ">{t('toolCommon.downloadAll', { defaultValue: 'Download All' })}<" },
  { pattern: />\s*Process\s*</g, replace: ">{t('toolCommon.process', { defaultValue: 'Process' })}<" },
  { pattern: />\s*Apply\s*</g, replace: ">{t('toolCommon.apply', { defaultValue: 'Apply' })}<" },
  { pattern: />\s*Reset\s*</g, replace: ">{t('toolCommon.reset', { defaultValue: 'Reset' })}<" },
  
  // States
  { pattern: />\s*Loading Document\.\.\.\s*</g, replace: ">{t('toolCommon.processing', { defaultValue: 'Loading Document...' })}<" },
  { pattern: />\s*Processing\.\.\.\s*</g, replace: ">{t('toolCommon.processing', { defaultValue: 'Processing...' })}<" },
  
  // Options / Settings
  { pattern: />\s*Options\s*</g, replace: ">{t('toolCommon.options', { defaultValue: 'Options' })}<" },
  { pattern: />\s*Settings\s*</g, replace: ">{t('toolCommon.settings', { defaultValue: 'Settings' })}<" },
  { pattern: />\s*Page Range\s*</g, replace: ">{t('toolCommon.pageRange', { defaultValue: 'Page Range' })}<" },
  { pattern: />\s*All Pages\s*</g, replace: ">{t('toolCommon.allPages', { defaultValue: 'All Pages' })}<" },
  { pattern: />\s*Selected Pages\s*</g, replace: ">{t('toolCommon.selectedPages', { defaultValue: 'Selected Pages' })}<" },
  { pattern: />\s*Live Preview\s*</g, replace: ">{t('toolCommon.preview', { defaultValue: 'Live Preview' })}<" },
  { pattern: />\s*Template View\s*</g, replace: ">{t('toolCommon.preview', { defaultValue: 'Template View' })}<" },

  // Banners
  { pattern: />\s*[A-Za-z0-9\s]+ Completed Successfully! [A-Za-z0-9\s.]+\s*</g, replace: ">{t('toolCommon.success', { defaultValue: 'Completed Successfully! Your document is ready.' })}<" },

  // Empty State Fallbacks
  { pattern: />\s*Upload PDFs to[a-zA-Z\s]+\s*</g, replace: ">{t('emptyState.title', { defaultValue: 'Upload a PDF to start' })}<" },
  
  // Return to dashboard
  { pattern: />\s*Return to Dashboard\s*</g, replace: ">{t('toolCommon.returnToDashboard', { defaultValue: 'Return to Dashboard' })}<" },
  
  // Specific tool titles missing translation
  { pattern: /title=\{\s*t\('dropzone\.title'[^}]+\}\s*\}/g, replace: "title={t('fileUploader.selectPdf', { defaultValue: 'Select a PDF file' })}" },
  { pattern: /subtitle=\{\s*t\('dropzone\.subtitleWithLimit'[^}]+\}\s*\}/g, replace: "subtitle={t('fileUploader.dragDrop', { defaultValue: 'Drag and drop your files here' })}" },
  { pattern: /title="Select a PDF to [^"]+"/g, replace: "title={t('fileUploader.selectPdf', { defaultValue: 'Select a PDF file' })}" },
  { pattern: /subtitle="Drag and drop[^"]+"/g, replace: "subtitle={t('fileUploader.dragDrop', { defaultValue: 'Drag and drop your files here' })}" },
];

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Ensure useTranslation is imported if we are replacing something
  let willReplace = REPLACEMENTS.some(r => r.pattern.test(content));
  if (willReplace) {
    if (!content.includes('useTranslation')) {
      content = content.replace(
        "import React",
        "import { useTranslation } from 'react-i18next';\nimport React"
      );
    }
  
    // 2. Ensure const { t } = useTranslation('common'); is in the main component
    const componentMatch = content.match(/export const [A-Za-z0-9_]+: React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{/);
    if (componentMatch && !content.includes('const { t } = useTranslation')) {
      content = content.replace(
        componentMatch[0],
        `${componentMatch[0]}\n  const { t } = useTranslation('common');`
      );
    }
  }

  for (const r of REPLACEMENTS) {
    content = content.replace(r.pattern, r.replace);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', path.basename(filePath));
  }
}

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('Page.tsx'));
for (const file of files) {
  processFile(path.join(pagesDir, file));
}
console.log('Finished applying common translations.');
