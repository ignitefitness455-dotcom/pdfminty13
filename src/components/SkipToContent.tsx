import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-slate-950 focus:text-emerald-400 focus:font-black focus:rounded-2xl focus:shadow-2xl focus:border-2 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 uppercase tracking-wide text-xs transition-all"
      id="skip-to-content"
    >
      Skip to main content
    </a>
  );
};

export default SkipToContent;
