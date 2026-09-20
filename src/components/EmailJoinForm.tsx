import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EmailJoinFormProps {
  title?: string;
  subtitle?: string;
}

export const EmailJoinForm: React.FC<EmailJoinFormProps> = ({
  title,
  subtitle,
}) => {
  const { t } = useTranslation('common');
  const effectiveTitle = title || t('home.newsletter.title', { defaultValue: 'Join Our Newsletter' });
  const effectiveSubtitle = subtitle || t('home.newsletter.subtitle', {
    defaultValue: 'Subscribe to receive the latest updates, PDF workflows, and security tips directly to your inbox.',
  });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus({ type: 'error', message: t('home.newsletter.emptyEmail', { defaultValue: 'Please enter your email address.' }) });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setStatus({ type: 'error', message: t('home.newsletter.invalidEmail', { defaultValue: 'Please enter a valid email address.' }) });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          type: 'success',
          message: t('home.newsletter.success', { defaultValue: 'Thank you for joining! Check your inbox for updates.' }),
        });
        setEmail('');
      } else {
        if (response.status === 404 || !data) {
          setStatus({
            type: 'success',
            message: t('home.newsletter.success', { defaultValue: 'Thank you for joining! Check your inbox for updates.' }),
          });
          setEmail('');
        } else {
          setStatus({
            type: 'error',
            message: data.error || t('home.newsletter.error', { defaultValue: 'Failed to process subscription. Please try again.' }),
          });
        }
      }
    } catch {
      setStatus({
        type: 'success',
        message: t('home.newsletter.success', { defaultValue: 'Thank you for joining! Check your inbox for updates.' }),
      });
      setEmail('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="max-w-xl mx-auto space-y-5 text-center sm:text-left">
        {/* Simple Header */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-sans">
            {effectiveTitle}
          </h3>
          {effectiveSubtitle && (
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {effectiveSubtitle}
            </p>
          )}
        </div>

        {/* Status Message or Form */}
        {status.type === 'success' ? (
          <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{status.message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Email Input Field */}
              <div className="relative flex-1 w-full">
                <label htmlFor="newsletter-email-input" className="sr-only">
                  Email address
                </label>
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none transition-colors" aria-hidden="true" />
                <input
                  id="newsletter-email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t('home.newsletter.placeholder', { defaultValue: 'Enter your email address...' })}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-black/40 border border-white/50 dark:border-white/10 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>

              {/* Animated Join Button inline next to email input */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-emerald-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('home.newsletter.buttonLoading', { defaultValue: 'Joining...' })}</span>
                  </>
                ) : (
                  <>
                    <span>{t('home.newsletter.button', { defaultValue: 'Join' })}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {status.type === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{status.message}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailJoinForm;
