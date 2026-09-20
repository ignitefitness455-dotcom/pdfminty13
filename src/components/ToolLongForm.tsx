import React from 'react';

import { TOOLS } from '../config/seo-data';

interface ToolLongFormProps {
  slug: string;
}

export const ToolLongForm: React.FC<ToolLongFormProps> = ({ slug }) => {
  const tool = TOOLS.find((t) => t.slug === slug);

  if (!tool || !tool.longFormBody) {
    return null;
  }

  // Strip leading <h1>...</h1> tag and convert any secondary <h1> to <h2> so there is strictly ONLY ONE H1 tag on the page.
  const cleanHtml = tool.longFormBody
    .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '')
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '<h2>$1</h2>');

  return (
    <div className="mt-16 pt-12 border-t border-border-muted" id="tool-long-form-wrapper">
      <article
        className="max-w-3xl mx-auto 
          [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-on-surface dark:[&_h2]:text-slate-100 [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-4 
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-on-surface dark:[&_h3]:text-slate-100 [&_h3]:mt-8 [&_h3]:mb-3 
          [&_p]:text-on-surface-variant dark:[&_p]:text-slate-300 [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-6
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-6 [&_ul_li]:text-on-surface-variant dark:[&_ul_li]:text-slate-300 [&_ul_li]:text-base
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-6 [&_ol_li]:text-on-surface-variant dark:[&_ol_li]:text-slate-300 [&_ol_li]:text-base
          [&_strong]:font-semibold [&_strong]:text-on-surface dark:[&_strong]:text-white
          [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline hover:[&_a]:opacity-80"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        id="tool-long-form-content"
      />
    </div>
  );
};

export default ToolLongForm;
