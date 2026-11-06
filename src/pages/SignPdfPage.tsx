import React from 'react';

import { SEO } from '../components/SEO';
import { SignPdfTool } from '../components/sign-pdf/sign-pdf-tool';
import { ToolHeader } from '../components/ToolHeader';
import { useSignatureFonts } from '../lib/signature-fonts';

export const SignPdfPage: React.FC = () => {
  useSignatureFonts();

  return (
    <div className="w-full flex flex-col bg-[#f8fafc] dark:bg-slate-950" id="pdf_editor_main_suite">
      <SEO slug="sign-pdf" />
      <div className="max-w-6xl w-full mx-auto px-4 pt-6">
        <ToolHeader slug="sign-pdf" />
      </div>
      <SignPdfTool />
    </div>
  );
};
