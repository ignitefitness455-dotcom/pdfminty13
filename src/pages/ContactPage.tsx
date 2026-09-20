import { Mail, Clock, Send, CheckCircle2, Copy, Shield, Sparkles, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { ROUTES } from '../config/routes';

export const ContactPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@pdfminty.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans text-on-surface transition-colors duration-200">
      <SEO
        titleOverride="Contact Us | PdfMinty"
        descriptionOverride="Have questions, feature requests, or feedback about PdfMinty? Get in touch with us at support@pdfminty.com. We usually respond within 24-48 hours."
      />

      <div className="max-w-4xl mx-auto space-y-12" id="contact-us-container">
        {/* Header Hero */}
        <div className="text-center space-y-4 border-b border-border-muted pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <Mail className="w-4 h-4" />
            <span>{t('contact.hereToHelp', { defaultValue: 'We\'re Here to Help' })}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">{t('contact.title', { defaultValue: 'Contact Us' })}</h1>
          <p className="text-base sm:text-lg font-medium text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            {t("contact.headerSub")}
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Email Box */}
          <div className="bg-surface-container-low border border-border-muted p-6 rounded-2xl space-y-3 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-on-surface">{t('contact.directEmail', { defaultValue: 'Direct Email' })}</h2>
            <p className="text-xs text-on-surface-variant">{t('contact.sendThoughts', { defaultValue: 'Send us your thoughts anytime' })}</p>
            <div className="pt-2 w-full">
              <div className="flex items-center justify-between gap-2 p-2.5 bg-surface-container-high border border-border-muted rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="truncate">support@pdfminty.com</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                  title="Copy email address"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Response Time Box */}
          <div className="bg-surface-container-low border border-border-muted p-6 rounded-2xl space-y-3 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-on-surface">{t('contact.responseTime', { defaultValue: 'Response Time' })}</h2>
            <p className="text-xs text-on-surface-variant">{t('contact.replyFast', { defaultValue: 'We reply as fast as possible' })}</p>
            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-extrabold text-sm">
                24 - 48 Hours
              </span>
            </div>
          </div>

          {/* Privacy & Guarantee Box */}
          <div className="bg-surface-container-low border border-border-muted p-6 rounded-2xl space-y-3 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-on-surface">{t('contact.privacyGuaranteed', { defaultValue: 'Privacy Guaranteed' })}</h2>
            <p className="text-xs text-on-surface-variant">{t("contact.localSecure")}</p>
            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-extrabold text-xs">{t('contact.zeroUploadsBadge', { defaultValue: 'Zero Cloud Uploads' })}</span>
            </div>
          </div>
        </div>

        {/* Main Form & Content Section */}
        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Form */}
          <div className="md:col-span-3 bg-surface-container-low border border-border-muted p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                {t("contact.sendUsMsg")}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t("contact.fillForm")} <a href="mailto:support@pdfminty.com" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">support@pdfminty.com</a>.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-on-surface">{t('contact.messageReceived', { defaultValue: 'Message Received!' })}</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
                  <span dangerouslySetInnerHTML={{ __html: t("contact.successMsg") }} />
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {t("contact.sendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      {t("contact.yourName")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-muted text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      {t("contact.yourEmail")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-muted text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    {t("contact.subject")}
                  </label>
                  <select
                    id="contact-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-muted text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="General Inquiry">{t("contact.optGeneral")}</option>
                    <option value="Feature Request">{t("contact.optFeature")}</option>
                    <option value="Bug Report">{t("contact.optBug")}</option>
                    <option value="Privacy Question">{t("contact.optPrivacy")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    {t("contact.message")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder={t("contact.helpPlaceholder")}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-muted text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>{t('contact.sending', { defaultValue: 'Sending...' })}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('contact.sendMessage', { defaultValue: 'Send Message' })}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column / FAQ */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface-container-low border border-border-muted p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-500" />
                {t("contact.aboutBoxTitle")}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t("contact.aboutBoxDesc")}
              </p>
              <div className="pt-2 border-t border-border-muted">
                <Link
                  to={ROUTES.ABOUT_US}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {t("contact.aboutBoxLink")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
