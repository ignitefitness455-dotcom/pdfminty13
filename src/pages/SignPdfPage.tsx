import React from 'react';

import { SEO } from '../components/SEO';
import { SignPdfTool } from '../components/sign-pdf/sign-pdf-tool';
import { useSignatureFonts } from '../lib/signature-fonts';

export const SignPdfPage: React.FC = () => {
  useSignatureFonts();

  return (
    <div className="w-full flex flex-col bg-[#f8fafc]" id="pdf_editor_main_suite">
      <SEO slug="sign-pdf" />
      <SignPdfTool />
    </div>
  );
};
