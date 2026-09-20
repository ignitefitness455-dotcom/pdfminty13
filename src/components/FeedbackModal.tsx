import { MessageSquare, X, Mail, Check, Copy } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useModal } from '../hooks/useModal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
    setCopied(false);
  }, [onClose]);

  const { modalRef, onKeyDown } = useModal(isOpen, handleClose);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText('feedback@pdfminty.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!isOpen) return null;

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadein outline-none"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
        <div className="flex justify-between items-center">
          <h3 id="feedback-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> Share Your Feedback
          </h3>
          <button
            onClick={handleClose}
            aria-label="Close feedback dialog"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            We would love to hear your experiences, ideas, or feedback. Please reach out to us directly:
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white select-all">
              feedback@pdfminty.com
            </span>
            
            <div className="flex gap-2 w-full">
              <a
                href="mailto:feedback@pdfminty.com"
                className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" /> Send Email
              </a>
              <button
                onClick={handleCopy}
                className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold cursor-pointer transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
