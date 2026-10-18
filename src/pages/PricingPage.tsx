import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  HeartHandshake,
  CreditCard,
  X,
  Lock,
  Globe,
  ChevronDown,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { SecurityAffiliateBanner } from '../components/SecurityAffiliateBanner';
import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  detectCountrySync,
  detectCountryAsync,
  calculateLocalizedPricing,
  COUNTRY_CURRENCY_MAP,
  type GeoLocationInfo,
} from '../utils/geoPricing';

export const PricingPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const { user, isPro, upgradeToPro } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Auto-detected country & local currency
  const [geo, setGeo] = useState<GeoLocationInfo>(() => detectCountrySync());
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  useEffect(() => {
    let mounted = true;
    detectCountryAsync().then((detected) => {
      if (mounted) {
        setGeo(detected);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const pricing = calculateLocalizedPricing(geo);

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'Free') {
      showToast(
        isBn
          ? 'আপনি ইতিমধ্যেই 100% ফ্রি ব্রাউজার PDF টুলস উপভোগ করছেন!'
          : 'You are already enjoying our 100% free browser PDF tools!',
        'info'
      );
      navigate(ROUTES.HOME);
      return;
    }

    setIsProcessingCheckout(true);
    try {
      await upgradeToPro();
    } catch {
      showToast(
        isBn
          ? 'প্রো চেকআউট শুরু করতে অনুগ্রহ করে গুগল সাইন-ইন সম্পন্ন করুন।'
          : 'Please complete Google sign-in to proceed to Pro checkout.',
        'info'
      );
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleConfirmCheckout = async () => {
    setIsProcessingCheckout(true);
    try {
      await upgradeToPro();
    } finally {
      setIsProcessingCheckout(false);
      setCheckoutModalPlan(null);
    }
  };

  const handleManualCountryChange = (countryCode: string) => {
    if (COUNTRY_CURRENCY_MAP[countryCode]) {
      const selected = COUNTRY_CURRENCY_MAP[countryCode];
      setGeo(selected);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pdfminty_user_geo_code', countryCode);
      }
      setShowCurrencySelector(false);
      showToast(
        isBn
          ? `মূল্য পরিবর্তিত হয়েছে: ${selected.flag} ${selected.countryName} (${selected.currencyCode})`
          : `Pricing updated to ${selected.flag} ${selected.countryName} (${selected.currencyCode})`,
        'info'
      );
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 animate-fadein">
      <Helmet>
        <title>
          {isBn
            ? 'প্রাইসিং ও সাবস্ক্রিপশন — সাশ্রয়ী PDF টুলস | PDFMinty'
            : 'Pricing Plans — Affordable Privacy-First PDF Tools | PDFMinty'}
        </title>
        <meta
          name="description"
          content="Simple, affordable pricing for PDFMinty. 100% free forever core tier with budget-friendly upgrades for 500MB batch processing, Priority Gemini 2.5 Flash AI analysis, and batch OCR."
        />
        <link rel="canonical" href="https://pdfminty.com/pricing/" />
      </Helmet>

      {/* Hero Heading */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBn ? 'সুলভ ও সহজ প্ল্যান' : 'Affordable & Honest Pricing'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
          {isBn ? 'আপনার প্রয়োজনীয় সেরা প্ল্যানটি বেছে নিন' : 'Pick the plan that fits your workflow'}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          {isBn
            ? 'সবগুলো 23টি ব্রাউজার PDF টুল সম্পূর্ণ বিনামূল্যে ব্যবহার করুন। 500MB ব্যাচ প্রসেসিং, Gemini AI ডকুমেন্ট অ্যানালাইসিস এবং OCR-এর জন্য সুলভ আপগ্রেড নিন।'
            : 'Start 100% free with all 23 browser PDF tools. Upgrade only if you need large 500MB batch processing, Gemini AI document analysis, and batch OCR.'}
        </p>

        {/* Location & Local Currency Auto-Detection Indicator */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 p-1.5 px-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {isBn ? 'লোকেশন অনুযায়ী স্বয়ংক্রিয় মূল্য:' : 'Auto-detected location:'}
          </span>
          <span className="font-bold inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
            <span className="text-sm">{geo.flag}</span>
            <span>{geo.countryName}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              ({geo.currencyCode} {geo.currencySymbol})
            </span>
          </span>
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <span>{isBn ? 'পরিবর্তন' : 'Change currency'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Quick direct switch to USD $2.49/mo */}
            {geo.currencyCode !== 'USD' && (
              <button
                type="button"
                onClick={() => handleManualCountryChange('US')}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer ml-1.5"
                title="View in USD ($2.49/month)"
              >
                USD ($2.49/mo)
              </button>
            )}

            {/* Currency switcher dropdown */}
            {showCurrencySelector && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 text-left max-h-60 overflow-y-auto">
                <p className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {isBn ? 'দেশ ও মুদ্রা নির্বাচন করুন' : 'Select Country & Currency'}
                </p>
                {Object.values(COUNTRY_CURRENCY_MAP).map((c) => (
                  <button
                    key={c.countryCode}
                    type="button"
                    onClick={() => handleManualCountryChange(c.countryCode)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      geo.countryCode === c.countryCode
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.countryName}</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {c.currencyCode} ({c.currencySymbol})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly / Annual Toggle Switch */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl shadow-inner select-none border border-slate-300/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{isBn ? 'মাসিক বিলিং' : 'Monthly Billing'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                $2.49/mo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{isBn ? 'বার্ষিক বিলিং' : 'Annual Billing'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wide uppercase">
                {isBn ? '50% ছাড় ($1.25/মাস)' : 'Save 50% ($1.25/mo)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {/* Card 1: Free Forever */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-black/5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isBn ? 'শুরু ও সাধারণ ব্যবহার' : 'Starter & Casual'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                {isBn ? '100% ফ্রি' : '100% Free'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isBn ? 'চিরতরে ফ্রি' : 'Free Forever'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isBn
                ? 'দৈনন্দিন ব্যক্তিগত PDF এডিটিংয়ের জন্য যা যা দরকার, সার্ভার আপলোড ছাড়াই।'
                : 'Everything you need for everyday, private PDF editing with zero uploads.'}
            </p>

            <div className="mt-6 mb-8 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {pricing.free.formatted}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-bold uppercase tracking-wider">
                {isBn ? '/ কার্ড লাগবে না' : '/ No card needed'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'সবগুলো 23টি ব্রাউজার PDF কোর টুল' : 'All 23 in-browser core PDF tools'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'লগইন ছাড়া (Guest):' : 'Guest (No Login):'}</strong>{' '}
                  {isBn ? '100 MB ফাইল সাইজ • দৈনিক 5টি ফ্রি টাস্ক' : '100 MB file limit • 5 tasks/day'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'ফ্রি অ্যাকাউন্ট (Logged In):' : 'Free Account (Logged In):'}</strong>{' '}
                  {isBn ? '150 MB ফাইল সাইজ • দৈনিক 10টি ফ্রি টাস্ক' : '150 MB file limit • 10 tasks/day'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? '100% ক্লায়েন্ট-সাইড WebAssembly প্রাইভেসি' : '100% client-side WebAssembly privacy'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'একবার লোড হলে অফলাইনে কাজ করে' : 'Works offline once loaded'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link
              to={ROUTES.HOME}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>{isBn ? 'ফ্রি শুরু করুন' : 'Start Free (No Login)'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Pro Plan (Highlighted Best Value) */}
        <div className="bg-gradient-to-b from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 backdrop-blur-xl border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-emerald-500/10 relative transform lg:-translate-y-2">
          {/* Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30 whitespace-nowrap">
            {isBn ? 'সবচেয়ে জনপ্রিয় • সাশ্রয়ী প্রো' : 'MOST POPULAR • AFFORDABLE PRO'}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 mt-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isBn ? 'পাওয়ার ইউজার ও প্রফেশনাল' : 'Power Users & Teams'}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                {isBn ? 'প্রো অ্যাক্সেস' : 'Pro Access'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">PDFMinty Pro</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isBn
                ? 'দ্রুতগতির 500MB ব্যাচ লিমিট, Gemini AI কোটা এবং অটোমেটেড OCR।'
                : 'High-speed 500MB batch limits, Gemini 2.5 AI quotas, and OCR automation.'}
            </p>

            {/* Dynamic Localized Pricing */}
            <div className="mt-6 mb-1 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {billingCycle === 'annual'
                  ? pricing.proAnnual.formattedMonthly
                  : pricing.proMonthly.formatted}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-bold">
                {billingCycle === 'annual'
                  ? isBn
                    ? `/ মাস (${pricing.proAnnual.formattedAnnual}/বছর)`
                    : `/ mo (${pricing.proAnnual.formattedAnnual}/year)`
                  : isBn
                    ? '/ মাস ($2.49 USD/মাস)'
                    : '/ month ($2.49 USD/mo)'}
              </span>
            </div>

            {/* Clear Monthly $2.49 USD badge */}
            <div className="mt-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  {billingCycle === 'monthly'
                    ? (isBn
                        ? 'মাসিক প্ল্যান: মাত্র $2.49 ডলার / মাস (যেকোনো সময় বাতিলযোগ্য)'
                        : 'Monthly Plan: Just $2.49 USD / month (Cancel anytime)')
                    : (isBn
                        ? 'বার্ষিক প্ল্যান: মাত্র $1.25/মাস ($14.99/বছর • 50% সাশ্রয়)'
                        : 'Annual Plan: Just $1.25/mo ($14.99/yr • Save 50%)')}
                </span>
              </div>
            </div>

            {/* Secondary USD reference if local currency is different */}
            {geo.currencyCode !== 'USD' && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-3">
                {billingCycle === 'annual'
                  ? '(Equivalent to ~$1.25/mo USD • $14.99/yr)'
                  : '(Equivalent to ~$2.49/mo USD)'}
              </p>
            )}

            <div className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200 mt-4">
              <div className="flex items-center gap-2.5 font-semibold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'ফ্রি প্ল্যানের সবকিছু, সাথে আরও:' : 'Everything in Free, plus:'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? '500MB ব্যাচ ও ফাইল লিমিট:' : '500MB Batch & File Limit:'}</strong>{' '}
                  {isBn ? 'ভারী স্ক্যান ও আইনি PDF নির্বিঘ্নে প্রসেস করুন' : 'Seamlessly process heavy scanned and legal PDFs'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'প্রায়োরিটি AI অ্যানালাইসিস (50 কুয়েরি/দিন):' : 'Priority AI Analysis (50/day • 50 pages/PDF):'}</strong>{' '}
                  {isBn ? 'Gemini 2.5 Flash দিয়ে সারসংক্ষেপ ও তথ্য এক্সট্রাক্ট' : 'Summarize, query & extract insights using Gemini 2.5 Flash'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'সম্পূর্ণ ব্যাচ OCR (15 পেজ/ব্যাচ):' : 'Full Batch OCR (Up to 15 pages/run):'}</strong>{' '}
                  {isBn ? 'স্ক্যান করা ডকুমেন্ট এডিটেবল Markdown ও Text-এ রূপান্তর' : 'Convert scanned documents & images into editable Markdown & Text'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'সংরক্ষিত স্বাক্ষর (Saved Signatures):' : 'Saved Signatures:'}</strong>{' '}
                  {isBn ? 'একাধিক সিগনেচার স্ট্যাম্প সংরক্ষণ ও তাৎক্ষণিক প্রয়োগ' : 'Store and apply multiple signature stamps instantly'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? '100% বিজ্ঞাপন মুক্ত:' : '100% Ad-Free:'}</strong>{' '}
                  {isBn ? 'পরিচ্ছন্ন ও মনোযোগহীন কাজের ইন্টারফেস' : 'Clean, distraction-free interface'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>{isBn ? 'প্রায়োরিটি সাপোর্ট:' : 'Priority Support:'}</strong>{' '}
                  {isBn ? 'দ্রুত ইমেইল রেসপন্স ও সরাসরি ফিচার রিকোয়েস্ট' : 'Fast email responses and direct feature requests'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-500/20">
            {isPro ? (
              <div
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2"
                id="pricing-pro-active-badge"
              >
                <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Pro Active</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('Pro')}
                disabled={isProcessingCheckout}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                id="pricing-upgrade-pro-btn"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {isProcessingCheckout
                    ? 'Redirecting to Checkout...'
                    : 'Upgrade to Pro (BDT 299.99/month)'}
                </span>
              </button>
            )}
            <p className="text-[11px] text-center text-slate-400 mt-2">
              {isBn
                ? '14 দিনের 100% মানি-ব্যাক গ্যারান্টি • যেকোনো সময় বাতিলযোগ্য'
                : '14-day 100% money-back guarantee • Cancel anytime'}
            </p>
          </div>
        </div>

        {/* Card 3: Lifetime Access */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-black/5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isBn ? 'এককালীন বিনিয়োগ' : 'Single Investment'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                {isBn ? 'একবার পেমেন্ট' : 'Pay Once'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isBn ? 'লাইফটাইম ডিল' : 'Lifetime Deal'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {isBn
                ? 'একবার পেমেন্ট করুন, আজীবনের জন্য প্রো অ্যাক্সেস এবং ভবিষ্যতের সব আপডেট পান।'
                : 'Pay once, enjoy lifetime Pro access and all future PDF feature updates.'}
            </p>

            <div className="mt-6 mb-1 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {pricing.lifetime.formatted}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-bold uppercase tracking-wider">
                {isBn ? '/ এককালীন মূল্য' : '/ One-time payment'}
              </span>
            </div>

            {geo.currencyCode !== 'USD' && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-5">
                (Equivalent to ~$29 USD one-time)
              </p>
            )}

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 mt-4">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'সব PDFMinty Pro সুবিধা আজীবনের জন্য' : 'All PDFMinty Pro features included forever'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'কোনো মাসিক বা বার্ষিক রিনিউয়াল নেই' : 'No recurring monthly or annual renewals'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'ভবিষ্যতের সমস্ত নতুন PDF টুলের নিশ্চয়তা' : 'Guaranteed access to all future PDF tools'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'ব্যক্তিগত ও ব্যবসায়িক ব্যবহারের জন্য কমার্শিয়াল লাইসেন্স' : 'Commercial license for personal & business use'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isBn ? 'ভিআইপি ডিরেক্ট ইঞ্জিনিয়ারিং সাপোর্ট' : 'VIP direct engineering priority support'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSelectPlan('Lifetime')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isBn
                  ? `লাইফটাইম ডিল নিন (${pricing.lifetime.formatted})`
                  : `Get Lifetime Deal (${pricing.lifetime.formatted})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges Section */}
      <div className="mt-16 py-8 px-6 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>{isBn ? 'জিরো সার্ভার আপলোড • 100% প্রাইভেসি' : 'Zero Server Uploads • 100% Privacy'}</span>
        </div>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-500" />
          <span>{isBn ? '14 দিনের মানি-ব্যাক গ্যারান্টি' : '14-Day Money-Back Guarantee'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          <span>{isBn ? 'তাৎক্ষণিক সক্রিয়করণ • 1-ক্লিকে বাতিল' : 'Instant Activation • 1-Click Cancel'}</span>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-20 max-w-4xl mx-auto">
        <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white tracking-tight mb-8">
          {isBn ? 'বিস্তারিত ফিচার তুলনা' : 'Detailed Feature Comparison'}
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'ফিচার' : 'Feature'}
                </th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'ফ্রি' : 'Free'}
                </th>
                <th className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Pro ({pricing.proAnnual.formattedMonthly}/mo)
                </th>
                <th className="p-4 font-bold text-slate-800 dark:text-slate-200">
                  Lifetime ({pricing.lifetime.formatted})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? '23টি স্ট্যান্ডার্ড PDF টুলস' : '23 Standard PDF Tools'}
                </td>
                <td className="p-4 text-emerald-600 font-bold">&check; Included</td>
                <td className="p-4 text-emerald-600 font-bold">&check; Included</td>
                <td className="p-4 text-emerald-600 font-bold">&check; Included</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'দৈনিক ফ্রি টাস্ক' : 'Daily Task Limit'}
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                  {isBn ? '5টি (গেস্ট) • 10টি (লগইন)' : '5/day (Guest) • 10/day (Login)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'আনলিমিটেড' : 'Unlimited'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'আনলিমিটেড' : 'Unlimited'}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'সর্বোচ্চ ফাইল সাইজ' : 'Maximum File Size'}
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                  {isBn ? '100 MB (গেস্ট) • 150 MB (লগইন)' : '100 MB (Guest) • 150 MB (Login)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  500 MB per file
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  500 MB per file
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'ব্যাচ প্রসেসিং লিমিট' : 'Batch Processing Limit'}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">150 MB Total</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  1,000 MB Total
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  1,000 MB Total
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'AI ডকুমেন্ট অ্যানালাইসিস (Gemini 2.5 Flash)' : 'AI Document Analysis (Gemini 2.5 Flash)'}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">
                  {isBn ? 'স্ট্যান্ডার্ড (15 পেজ/PDF)' : 'Standard (Up to 15 pages/PDF)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? '50 কুয়েরি/দিন (50 পেজ/PDF)' : '50 Queries/Day (Up to 50 pages/PDF)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? '50 কুয়েরি/দিন (50 পেজ/PDF)' : '50 Queries/Day (Up to 50 pages/PDF)'}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'ব্যাচ অপটিক্যাল ক্যারেক্টার রিকগনিশন (OCR)' : 'Batch Optical Character Recognition (OCR)'}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">
                  {isBn ? 'সর্বোচ্চ 5 পেজ/রান' : 'Up to 5 pages/run'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'ফুল ব্যাচ OCR (15 পেজ/ব্যাচ)' : 'Full Batch OCR (15 pages/batch)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'ফুল ব্যাচ OCR (15 পেজ/ব্যাচ)' : 'Full Batch OCR (15 pages/batch)'}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'সংরক্ষিত সিগনেচার স্ট্যাম্প (Saved Signatures)' : 'Saved Signature Stamps'}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">
                  {isBn ? '1টি সিগনেচার প্রিসেট' : '1 Signature Preset'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'একাধিক স্ট্যাম্প সংরক্ষণ (5টি পর্যন্ত)' : 'Multiple Saved Stamps (Up to 5)'}
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  {isBn ? 'একাধিক স্ট্যাম্প সংরক্ষণ (5টি পর্যন্ত)' : 'Multiple Saved Stamps (Up to 5)'}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'বিজ্ঞাপনমুক্ত পরিবেশ' : 'Ad-Free Workspace'}
                </td>
                <td className="p-4 text-slate-400">&mdash;</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  &check; 100% Ad-Free
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  &check; 100% Ad-Free
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? 'কাস্টমার সাপোর্ট' : 'Customer Support'}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">Community / FAQ</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  Priority Email (&lt;4h)
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                  VIP Direct Channel
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Security Partners */}
      <div className="mt-16 max-w-4xl mx-auto">
        <SecurityAffiliateBanner
          variant="dual"
          contextTitle={isBn ? 'সম্পূর্ণ ডিজিটাল নিরাপত্তার জন্য' : 'For Complete Digital Privacy'}
          contextDesc={
            isBn
              ? 'ডকুমেন্ট প্রসেসিং-এর পাশাপাশি আপনার সম্পূর্ণ ইন্টারনেট ট্রাফিকের জন্য মিলিটারি-গ্রেড সুরক্ষা নিশ্চিত করুন।'
              : 'Complement in-browser PDF processing with military-grade encryption for all your device traffic.'
          }
        />
      </div>

      {/* Pricing FAQs */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white tracking-tight mb-8">
          {isBn ? 'সাধারণ প্রশ্নোত্তর (FAQ)' : 'Frequently Asked Questions'}
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {isBn ? 'ফ্রি প্ল্যান কি সত্যিই চিরতরে ফ্রি?' : 'Is the Free Plan truly free forever?'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'হ্যাঁ, অবশ্যই! আমাদের 23টি মূল PDF টুল (মার্জ, স্প্লিট, রোটেট, ওয়াটারমার্ক, ফ্ল্যাটেন, পাসওয়ার্ড লক ও আনলক) আজীবন 100% ফ্রি থাকবে এবং কোনো রেজিস্ট্রেশনের দরকার হবে না।'
                : 'Yes, absolutely! All 23 standard PDF tools (merging, splitting, rotating, watermarking, flattening, protecting, unlocking) will remain 100% free with zero registration required.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {isBn
                ? 'Adobe Acrobat-এর তুলনায় PDFMinty Pro এত সাশ্রয়ী কেন?'
                : 'Why is PDFMinty Pro so affordable compared to Adobe Acrobat?'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'Adobe Acrobat Pro সাধারণত বছরে $239.88 ($19.99/মাস) চার্জ করে। যেহেতু PDFMinty আপনার ব্রাউজারে ক্লায়েন্ট-সাইডে কাজ করে তাই আমাদের সার্ভার খরচ অনেক কম। সেই সাশ্রয়ের সুবিধা সরাসরি আপনাদেরকে নামমাত্র মূল্যে দিচ্ছি!'
                : 'Adobe Acrobat Pro charges $239.88/year ($19.99/month). Because PDFMinty processes your documents client-side directly in your browser rather than burning expensive cloud server clusters, our infrastructure costs are low. We pass those massive savings directly to you at affordable local rates!'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {isBn
                ? '14 দিনের মানি-ব্যাক গ্যারান্টি কীভাবে কাজ করে?'
                : 'How does the 14-day money-back guarantee work?'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'যেকোনো কারণে সেবা পছন্দ না হলে ক্রয়ের 14 দিনের মধ্যে support@pdfminty.com এ যোগাযোগ করলে কোনো শর্ত ছাড়াই সম্পূর্ণ অর্থ ফেরত দেওয়া হবে।'
                : 'If for any reason you are not completely satisfied with PDFMinty Pro, contact us at support@pdfminty.com within 14 days of purchase and we will issue an immediate, full refund with no questions asked.'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Checkout Modal */}
      {checkoutModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setCheckoutModalPlan(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Checkout — {checkoutModalPlan}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {billingCycle === 'annual' && checkoutModalPlan === 'Pro'
                    ? `${pricing.proAnnual.formattedAnnual} / year (~${pricing.proAnnual.formattedMonthly}/mo • $14.99 USD)`
                    : checkoutModalPlan === 'Pro'
                      ? `${pricing.proMonthly.formatted} / month ($2.49 USD/mo)`
                      : `${pricing.lifetime.formatted} one-time payment ($29 USD)`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Account:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {checkoutModalPlan} Member
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Billing Cycle:</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {checkoutModalPlan === 'Lifetime' ? 'One-Time' : billingCycle}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Currency / Country:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {geo.flag} {geo.currencyCode} ({geo.countryName})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isProcessingCheckout}
                onClick={handleConfirmCheckout}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessingCheckout ? (
                  <span>Activating Plan...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Activate Pro Access</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-bit SSL Encrypted • 14-day refund guarantee</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
