import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Sparkles,
  X,
  KeyRound,
  RefreshCw,
  Edit3,
  Check,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  firebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
} from '../lib/firebase';
import { isDisposableEmail, getDisposableEmailError } from '../utils/disposableEmailBlocker';

import { DashboardPage } from './DashboardPage';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    user,
    firebaseUser,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendVerificationEmail,
    verifyEmailWithCode,
    reloadUser,
    resetPassword,
    loading: authLoading,
  } = useAuth();

  const isSignUpDefault =
    initialMode === 'signup' ||
    location.pathname.includes('/signup') ||
    location.pathname.includes('/register');

  const [isSignUp, setIsSignUp] = useState<boolean>(isSignUpDefault);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [showSignUpHint, setShowSignUpHint] = useState<boolean>(false);

  // Email verification states
  const [showVerificationNotice, setShowVerificationNotice] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const [showFirebaseHelp, setShowFirebaseHelp] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState(firebaseConfig.apiKey || '');
  const [customProjectId, setCustomProjectId] = useState(firebaseConfig.projectId || '');
  const [customAuthDomain, setCustomAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [customAppId, setCustomAppId] = useState(firebaseConfig.appId || '');

  // Live detection of disposable/temporary email
  const isTempEmail = isSignUp && email.trim().length > 3 ? isDisposableEmail(email.trim()) : false;

  // Resend cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Live password strength calculation
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: isBn ? 'খালি' : 'Empty', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: isBn ? 'দুর্বল' : 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score: 2, label: isBn ? 'মোটামুটি' : 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: isBn ? 'ভালো' : 'Good', color: 'bg-teal-500' };
    return { score: 4, label: isBn ? 'শক্তিশালী' : 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowSignUpHint(false);
    setUnauthorizedDomain(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMessage(
        isBn ? 'আপনার ইমেইল এবং পাসওয়ার্ড উভয়ই লিখুন।' : 'Please enter both your email and password.'
      );
      return;
    }

    // Strict Disposable / Temporary Email Check on Sign-up
    if (isSignUp) {
      const disposableError = getDisposableEmailError(cleanEmail, isBn);
      if (disposableError) {
        setErrorMessage(disposableError);
        showToast(disposableError, 'error');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(
          isBn
            ? 'উভয় পাসওয়ার্ড একই হতে হবে। অনুগ্রহ করে যাচাই করুন।'
            : 'Passwords do not match. Please verify both password fields.'
        );
        return;
      }
    }

    if (password.length < 6) {
      setErrorMessage(
        isBn
          ? 'পাসওয়ার্ডটি কমপক্ষে 6 অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(cleanEmail, password, name.trim());
        setVerificationEmail(cleanEmail);
        setShowVerificationNotice(true);
        setVerificationCode('');
        setVerificationError(null);
        setVerificationSuccess(false);
        setResendCooldown(60);
        showToast(
          isBn
            ? 'অ্যাকাউন্ট তৈরি হয়েছে! একটি ভেরিফিকেশন ইমেইল পাঠানো হয়েছে।'
            : 'Account created! A verification email has been sent.',
          'success'
        );
        return;
      } else {
        await signInWithEmail(cleanEmail, password);
        showToast(
          isBn ? 'স্বাগতম! সফলভাবে সাইন ইন হয়েছে।' : 'Welcome back! Signed in successfully.',
          'success'
        );
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      console.warn('[Auth Sign-in]:', errObj.code || err);

      if (
        errObj.message === 'DISPOSABLE_EMAIL_NOT_ALLOWED' ||
        (errObj.message && errObj.message.includes('DISPOSABLE'))
      ) {
        setErrorMessage(
          isBn
            ? 'টেম্পোরারি বা ডিসপোজেবল ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে একটি আসল জিমেইল বা পার্সোনাল ইমেইল ব্যবহার করুন।'
            : 'Temporary or disposable email addresses are not permitted. Please use a valid personal or business email address.'
        );
      } else if (
        errObj.code === 'auth/invalid-credential' ||
        errObj.code === 'auth/user-not-found' ||
        errObj.code === 'auth/wrong-password'
      ) {
        setShowSignUpHint(!isSignUp);
        setErrorMessage(
          isBn
            ? isSignUp
              ? 'ভুল তথ্য প্রদান করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিন।'
              : 'ইমেইল বা পাসওয়ার্ড ভুল। আপনার যদি নতুন প্রজেক্টে এখনও অ্যাকাউন্ট না থাকে, তাহলে নিচে "অ্যাকাউন্ট তৈরি করুন" ট্যাবে গিয়ে সাইন-আপ করুন।'
            : isSignUp
              ? 'Invalid credentials provided. Please check your details.'
              : 'Invalid email or password. If you have not created an account on this Firebase project yet, please switch to Sign Up below.'
        );
      } else if (errObj.code === 'auth/email-already-in-use') {
        setErrorMessage(
          isBn
            ? 'এই ইমেইলটি ইতিমধ্যেই নিবন্ধিত। অনুগ্রহ করে সাইন ইন করুন।'
            : 'This email is already registered. Please sign in instead.'
        );
      } else if (errObj.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          isBn
            ? 'Firebase Console-এ Email/Password অথেনটিকেশন এনেবল করা নেই। Firebase Console > Authentication > Sign-in method-এ গিয়ে Email/Password সক্রিয় করুন।'
            : 'Email/Password sign-in is not enabled in Firebase Console. Please enable it in Firebase Console > Authentication > Sign-in method.'
        );
      } else if (errObj.code === 'auth/weak-password') {
        setErrorMessage(
          isBn
            ? 'পাসওয়ার্ড অত্যন্ত দুর্বল। কমপক্ষে 6 অক্ষর ব্যবহার করুন।'
            : 'The password is too weak. Please use at least 6 characters.'
        );
      } else if (errObj.code === 'auth/invalid-email') {
        setErrorMessage(
          isBn ? 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।' : 'Please enter a valid email address.'
        );
      } else {
        setErrorMessage(
          errObj.message ||
            (isBn
              ? 'অথেন্টিকেশন ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
              : 'Authentication error. Please check your credentials or try again.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    setShowSignUpHint(false);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      showToast(
        isBn ? 'Google দিয়ে সফলভাবে সাইন ইন হয়েছে!' : 'Signed in with Google successfully!',
        'success'
      );
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const errCode = (errObj.code || '').toLowerCase();
      const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
      console.warn('[Google Auth Info]:', errObj.code || err);

      const isUnauthorizedDomain =
        errCode === 'auth/unauthorized-domain' ||
        errStr.includes('auth/unauthorized-domain') ||
        errStr.includes('unauthorized domain') ||
        errStr.includes('unauthorized-domain');

      const isOpNotAllowed =
        errCode === 'auth/operation-not-allowed' ||
        errStr.includes('auth/operation-not-allowed') ||
        errStr.includes('operation-not-allowed');

      const isPopupBlocked =
        errCode === 'auth/popup-blocked' ||
        errStr.includes('auth/popup-blocked') ||
        errStr.includes('popup-blocked') ||
        errStr.includes('popup was blocked');

      const isPopupClosed =
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/cancelled-popup-request' ||
        errStr.includes('popup-closed-by-user') ||
        errStr.includes('cancelled-popup-request');

      if (isUnauthorizedDomain) {
        setUnauthorizedDomain(window.location.hostname);
        setShowFirebaseHelp(true);
        setErrorMessage(
          isBn
            ? `এই ডোমেনটি (${window.location.hostname}) Firebase Console-এ অনুমোদিত নয় (auth/unauthorized-domain)। নিচে দেওয়া ৩টি সহজ ধাপে এটি ঠিক করুন, অথবা সরাসরি ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন।`
            : `This domain (${window.location.hostname}) is not authorized in Firebase Authentication (auth/unauthorized-domain). Follow the 3 steps below to authorize it, or sign in with email.`
        );
      } else if (isOpNotAllowed) {
        setShowFirebaseHelp(true);
        setErrorMessage(
          isBn
            ? 'Firebase Console-এ Google Sign-In মেথড এনেবল করা নেই (auth/operation-not-allowed)। Firebase Console > Authentication > Sign-in method-এ গিয়ে Google সক্রিয় করুন।'
            : 'Google Sign-In is not enabled in Firebase Console (auth/operation-not-allowed). Please enable it in Firebase Console > Authentication > Sign-in method.'
        );
      } else if (isPopupBlocked) {
        setErrorMessage(
          isBn
            ? 'আপনার ব্রাউজারে পপ-আপ উইন্ডো ব্লক করা রয়েছে (auth/popup-blocked)। ব্রাউজারের অ্যাড্রেস বার থেকে Pop-ups অনুমোদন করুন অথবা ইমেইল দিয়ে লগইন করুন।'
            : 'Google pop-up was blocked by your browser (auth/popup-blocked). Please allow pop-ups for this site or sign in with email.'
        );
      } else if (isPopupClosed) {
        // User voluntarily closed the Google popup window
        setErrorMessage(null);
      } else {
        setShowFirebaseHelp(true);
        setErrorMessage(
          errObj.message ||
            (isBn
              ? 'Google সাইন-ইন সম্পন্ন করা যায়নি। অনুগ্রহ করে Firebase Console সেটিংস ও Authorized Domains পরীক্ষা করুন।'
              : 'Could not complete Google Sign-In. Please check your Firebase Console settings and Authorized domains.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customApiKey || !customProjectId) {
      showToast(isBn ? 'API Key এবং Project ID আবশ্যক' : 'API Key and Project ID are required', 'error');
      return;
    }
    saveCustomFirebaseConfig({
      apiKey: customApiKey.trim(),
      projectId: customProjectId.trim(),
      authDomain: customAuthDomain.trim() || `${customProjectId.trim()}.firebaseapp.com`,
      appId: customAppId.trim(),
    });
  };

  const handleResetConfig = () => {
    clearCustomFirebaseConfig();
    window.location.reload();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess(true);
      showToast(
        isBn ? 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!' : 'Password reset link sent to your email!',
        'success'
      );
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(errObj.message || (isBn ? 'রিসেট লিংক পাঠানো যায়নি' : 'Failed to send reset link'), 'error');
    }
  };

  // Resend verification email with timer & feedback
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setVerificationError(null);
    try {
      await sendVerificationEmail();
      setResendCooldown(60);
      showToast(
        isBn
          ? 'নতুন ভেরিফিকেশন ইমেইল পাঠানো হয়েছে! ইনবক্স এবং স্প্যাম ফোল্ডার চেক করুন।'
          : 'New verification email sent! Please check your inbox and Spam folder.',
        'success'
      );
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj.code === 'auth/too-many-requests') {
        showToast(
          isBn
            ? 'খুব বেশি অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে পুনরায় চেষ্টা করুন।'
            : 'Too many requests. Please wait a moment before trying again.',
          'error'
        );
      } else {
        showToast(
          isBn
            ? 'ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'Could not send email right now. Please try again later.',
          'error'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  // Direct Verification Code / Action Link input handler
  const handleVerifyWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (!cleanCode || isVerifyingCode) return;

    setIsVerifyingCode(true);
    setVerificationError(null);
    try {
      await verifyEmailWithCode(cleanCode);
      setVerificationSuccess(true);
      showToast(
        isBn
          ? 'অভিনন্দন! আপনার ইমেইল সফলভাবে ভেরিফাই হয়েছে।'
          : 'Congratulations! Your email has been verified successfully.',
        'success'
      );
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1000);
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      console.warn('[Verification Code Error]:', errObj);
      let msg = isBn
        ? 'ভেরিফিকেশন কোডটি সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে "পুনরায় লিংক পাঠান" চাপুন।'
        : 'Invalid or expired verification code. Please click "Resend Verification Link".';
      if (errObj.code === 'auth/invalid-action-code') {
        msg = isBn
          ? 'এই ভেরিফিকেশন কোডটি সঠিক নয় অথবা ইতিমধ্যে ব্যবহার করা হয়েছে।'
          : 'This verification code is invalid or has already been used.';
      } else if (errObj.code === 'auth/expired-action-code') {
        msg = isBn
          ? 'এই কোডটির মেয়াদ উত্তীর্ণ হয়ে গেছে। অনুগ্রহ করে একটি নতুন ভেরিফিকেশন লিংক নিন।'
          : 'This verification code has expired. Please request a new verification link.';
      }
      setVerificationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Reload user profile to check if email was verified via the link
  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      await reloadUser();
      const isVerified = Boolean(firebaseUser?.emailVerified || user?.emailVerified);
      if (isVerified) {
        showToast(
          isBn
            ? 'ইমেইল ভেরিফিকেশন নিশ্চিত হয়েছে! স্বাগতম।'
            : 'Email verification confirmed! Welcome aboard.',
          'success'
        );
        navigate(ROUTES.DASHBOARD);
      } else {
        showToast(
          isBn
            ? 'ইমেইল এখনও ভেরিফাই হয়নি। আপনার ইনবক্স চেক করে লিংকে ক্লিক করুন অথবা নিচে কোড পেস্ট করুন।'
            : 'Email not verified yet. Please check your inbox and click the link or paste the verification code below.',
          'info'
        );
      }
    } catch {
      // Non-blocking reload
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // Change email in case of typos during signup
  const handleChangeEmail = () => {
    setShowVerificationNotice(false);
    setIsSignUp(true);
    setVerificationCode('');
    setVerificationError(null);
  };

  // If user is already logged in and verified (or not on verification screen), navigate to dashboard
  if (user && !showVerificationNotice && user.emailVerified) {
    return <DashboardPage />;
  }

  // Interactive Verification Confirmation Screen
  if (showVerificationNotice) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto flex flex-col justify-center animate-fadein">
        <Helmet>
          <title>{isBn ? 'ইমেইল ভেরিফাই করুন — PDFMinty' : 'Verify Your Email — PDFMinty'}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="space-y-6">
          <div className="text-center">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/logo.svg" alt="PDFMinty" width="30" height="30" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                PDF<span className="text-emerald-500">Minty</span>
              </span>
            </Link>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center relative">
              <Mail className="w-8 h-8" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isBn ? 'আপনার ইমেইল ভেরিফাই করুন' : 'Verify Your Email Address'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isBn
                  ? 'আমরা আপনার এই ঠিকানায় একটি ভেরিফিকেশন ও এক্টিভেশন লিংক পাঠিয়েছি:'
                  : 'We have dispatched a verification link to:'}
              </p>

              {/* Target Email Badge with Change Option */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-mono text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 break-all select-all flex items-center justify-between gap-2">
                <span>{verificationEmail || email}</span>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-sans font-medium transition-colors cursor-pointer shrink-0"
                  title={isBn ? 'ইমেইল পরিবর্তন করুন' : 'Change Email'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পরিবর্তন' : 'Edit'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isBn
                  ? 'অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম (Spam) ফোল্ডারটি চেক করে লিংকে ক্লিক করুন।'
                  : 'Please check your inbox or Spam folder and click the link to activate your account.'}
              </p>
            </div>

            {/* Direct Verification Code / Action Link Input */}
            <form onSubmit={handleVerifyWithCode} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {isBn
                      ? 'ভেরিফিকেশন কোড বা লিংক পেস্ট করুন (ঐচ্ছিক):'
                      : 'Enter Verification Code or Action Link (Optional):'}
                  </span>
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    if (verificationError) setVerificationError(null);
                  }}
                  placeholder={
                    isBn
                      ? 'কোড বা সম্পূর্ণ লিংক পেস্ট করুন'
                      : 'Paste oobCode or full verification link'
                  }
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono placeholder:font-sans placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!verificationCode.trim() || isVerifyingCode}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                >
                  {isVerifyingCode ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isVerifyingCode
                      ? isBn
                        ? 'যাচাই হচ্ছে...'
                        : 'Verifying...'
                      : isBn
                      ? 'কোড ভেরিফাই করুন'
                      : 'Verify Code'}
                  </span>
                </button>
              </div>

              {verificationError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fadein">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {verificationSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fadein">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isBn
                      ? 'অভিনন্দন! আপনার অ্যাকাউন্ট সক্রিয় হয়েছে। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
                      : 'Success! Your account is activated. Redirecting to dashboard...'}
                  </span>
                </div>
              )}
            </form>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isCheckingVerification}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isCheckingVerification ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {isCheckingVerification
                    ? isBn
                      ? 'স্ট্যাটাস চেক করা হচ্ছে...'
                      : 'Checking verification...'
                    : isBn
                    ? 'ভেরিফাই সম্পন্ন হয়েছে / ড্যাশবোর্ডে প্রবেশ করুন'
                    : 'I Have Verified / Continue to Dashboard'}
                </span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isResending}
                onClick={handleResendVerification}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>
                  {isResending
                    ? isBn
                      ? 'নতুন লিংক পাঠানো হচ্ছে...'
                      : 'Sending...'
                    : resendCooldown > 0
                    ? isBn
                      ? `পুনরায় লিংক পাঠান (${resendCooldown}s পর)`
                      : `Resend link in ${resendCooldown}s`
                    : isBn
                    ? 'পুনরায় ভেরিফিকেশন লিংক পাঠান (Resend Link)'
                    : 'Resend Verification Link'}
                </span>
              </button>

              <div className="text-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationNotice(false);
                    setIsSignUp(false);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন পেজে যান' : 'Already have an account? Go to Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto flex flex-col justify-center animate-fadein">
      <Helmet>
        <title>
          {isSignUp
            ? isBn
              ? 'অ্যাকাউন্ট তৈরি করুন — PDFMinty'
              : 'Sign Up & Create Account — PDFMinty'
            : isBn
              ? 'সাইন ইন — PDFMinty'
              : 'Sign In — PDFMinty'}
        </title>
        <meta
          name="description"
          content="Sign in or create a PDFMinty account to manage Pro features, sync offline settings, and process documents securely."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/logo.svg" alt="PDFMinty" width="30" height="30" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              PDFMinty
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isSignUp
              ? isBn
                ? 'আপনার অ্যাকাউন্ট তৈরি করুন'
                : 'Create your account'
              : isBn
                ? 'স্বাগতম'
                : 'Welcome back'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            {isSignUp
              ? isBn
                ? 'ক্লায়েন্ট-সাইড আনলিমিটেড PDF সুবিধার জন্য PDFMinty-তে যোগ দিন।'
                : 'Join PDFMinty for unlimited client-side PDF productivity.'
              : isBn
                ? 'আপনার টুলস, পছন্দ এবং প্রো ফিচার অ্যাক্সেস করতে সাইন ইন করুন।'
                : 'Sign in to access your tools, preferences, and Pro features.'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
                setUnauthorizedDomain(null);
                setShowSignUpHint(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              id="tab-sign-in"
            >
              {isBn ? 'সাইন ইন' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
                setUnauthorizedDomain(null);
                setShowSignUpHint(false);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              id="tab-sign-up"
            >
              {isBn ? 'সাইন আপ' : 'Sign Up'}
            </button>
          </div>

          {/* Real Google Sign-In Popup */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || authLoading}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            id="auth-google-button"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isBn ? 'Google দিয়ে এগিয়ে যান' : 'Continue with Google'}</span>
          </button>

          {/* Quick Help Toggle for Google Sign-In & Firebase Settings */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setShowFirebaseHelp(!showFirebaseHelp)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>
                {isBn
                  ? 'Google সাইন-ইন সমস্যা? সমাধানের সহজ ধাপ দেখুন'
                  : 'Google Sign-In issue? View quick fix steps'}
              </span>
              {showFirebaseHelp ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          {/* Comprehensive Guidance Box when domain is unauthorized or user toggles help */}
          {(unauthorizedDomain || showFirebaseHelp) && (
            <div className="mt-4 mb-2 p-4 rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-b from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 text-xs space-y-3.5 shadow-sm animate-fadein">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {isBn
                      ? 'Firebase Console-এ এই ডোমেনটি অনুমোদন (Authorize) করার নিয়ম'
                      : 'How to Fix Firebase Google Sign-In Error'}
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                    {isBn
                      ? 'Google সাইন-ইন কাজ না করার মূল কারণ হলো বর্তমান ওয়েবসাইট ডোমেনটি Firebase Authentication-এর অনুমোদিত তালিকায় (Authorized Domains) যুক্ত না থাকা।'
                      : 'Firebase blocks Google popup logins if the current website domain is not listed under Authorized Domains in Firebase Console.'}
                  </p>
                </div>
              </div>

              {/* Current Domain Box with One-Click Copy */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isBn ? 'আপনার বর্তমান ডোমেন / হোস্টনেম:' : 'Your Current Domain / Hostname:'}
                </span>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                  <code className="text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate flex-1 select-all font-semibold">
                    {window.location.hostname}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopiedDomain(true);
                      showToast(isBn ? 'ডোমেন কপি করা হয়েছে!' : 'Domain copied to clipboard!', 'success');
                      setTimeout(() => setCopiedDomain(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? (isBn ? 'কপি হয়েছে' : 'Copied') : isBn ? 'কপি করুন' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Tutorial */}
              <div className="bg-white/90 dark:bg-slate-900/90 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {isBn ? 'সহজ ৩টি ধাপে সমাধান করুন:' : 'Follow these 3 easy steps:'}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-0.5 leading-relaxed">
                  <li>
                    <span>
                      {isBn ? 'Firebase Console-এর ' : 'Go to '}
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        Authentication &gt; Settings
                        <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
                      </a>
                      {isBn ? '-এ যান।' : '.'}
                    </span>
                  </li>
                  <li>
                    {isBn ? (
                      <span>
                        নিচে স্ক্রোল করে <b>Authorized domains</b> সেকশনে <b>Add domain</b> বাটনে ক্লিক করুন।
                      </span>
                    ) : (
                      <span>
                        Scroll down to <b>Authorized domains</b> and click <b>Add domain</b>.
                      </span>
                    )}
                  </li>
                  <li>
                    {isBn ? (
                      <span>
                        উপরে কপি করা ডোমেন (<code>{window.location.hostname}</code>) পেস্ট করে <b>Save / Add</b> করুন।
                      </span>
                    ) : (
                      <span>
                        Paste your domain (<code>{window.location.hostname}</code>) and click <b>Add</b>.
                      </span>
                    )}
                  </li>
                  <li>
                    {isBn ? (
                      <span>
                        <a
                          href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Sign-in method
                          <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
                        </a>{' '}
                        ট্যাবে <b>Google</b> এনাবল করা আছে কিনা নিশ্চিত করুন।
                      </span>
                    ) : (
                      <span>
                        Verify that <b>Google</b> is enabled under{' '}
                        <a
                          href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Sign-in method
                          <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
                        </a>.
                      </span>
                    )}
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-amber-200/80 dark:border-amber-800/60 text-[11px]">
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>{isBn ? 'Firebase Settings খুলুন' : 'Open Firebase Console'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{isBn ? 'কাস্টম Firebase প্রজেক্ট সেট করুন' : 'Custom Firebase Project'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] text-slate-400 uppercase font-black tracking-wider">
              {isBn ? 'অথবা ইমেইল ব্যবহার করুন' : 'Or continue with email'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1.5 animate-fadein">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
              {showSignUpHint && !isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setShowSignUpHint(false);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline pl-6 block text-left cursor-pointer"
                >
                  {isBn ? '→ নতুন অ্যাকাউন্ট খুলতে সাইন-আপ ফর্মে যান' : '→ Click here to switch to Sign Up form'}
                </button>
              )}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {isBn ? 'পুরো নাম' : 'Full Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-fullname"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isBn ? 'আপনার নাম লিখুন' : 'Alex Johnson'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    isTempEmail
                      ? 'border-red-500 focus:ring-red-500 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* Real-Time Live Disposable Email Alert */}
              {isSignUp && isTempEmail && (
                <div className="mt-1.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fadein">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium leading-relaxed">
                    {isBn
                      ? 'টেম্পোরারি বা ডিসপোজেবল ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে আসল জিমেইল বা পার্সোনাল ইমেইল ব্যবহার করুন।'
                      : 'Temporary or disposable email addresses are not permitted. Please use a valid personal or business email address.'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  {isBn ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                      setForgotSuccess(false);
                    }}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator on sign up */}
              {isSignUp && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isBn ? 'পাসওয়ার্ড শক্তি:' : 'Strength:'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-full transition-all duration-300 ${
                          step <= strength.score ? strength.color : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'আমাকে মনে রাখুন' : 'Remember me'}
                </span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isBn ? 'সুরক্ষিত' : 'Encrypted'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading || (isSignUp && isTempEmail)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              id="auth-submit-button"
            >
              {isSubmitting ? (
                <span>{isBn ? 'প্রসেসিং হচ্ছে...' : 'Processing...'}</span>
              ) : isSignUp ? (
                <>
                  <span>{isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Free Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{isBn ? 'সাইন ইন করুন' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode footer */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {isSignUp ? (
              <p>
                {isBn ? 'ইতিমধ্যেই একটি অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                >
                  {isBn ? 'সাইন ইন করুন' : 'Sign In'}
                </button>
              </p>
            ) : (
              <p>
                {isBn ? 'নতুন অ্যাকাউন্ট খুলতে চান?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                >
                  {isBn ? 'বিনামূল্যে সাইন আপ করুন' : 'Sign up for free'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Pricing Quick Link */}
        <div className="text-center">
          <Link
            to={ROUTES.PRICING}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isBn
                ? 'সুলভ প্রো প্ল্যান দেখতে প্রাইসিং পেজে যান'
                : 'Explore affordable Pro upgrade plans on Pricing'}
            </span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isBn ? 'পাসওয়ার্ড রিসেট' : 'Reset your password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'আপনার ইমেইল লিখুন। আমরা পাসওয়ার্ড রিসেট করার একটি লিংক পাঠাব।'
                : 'Enter your email address and we will send you a link to reset your password.'}
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {isBn
                    ? 'আপনার ইনবক্স চেক করুন! রিসেট নির্দেশাবলী পাঠানো হয়েছে।'
                    : 'Check your inbox! Reset instructions have been sent.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    {isBn ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Firebase Configuration Modal (Development Only) */}
      {import.meta.env.DEV && showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isBn ? 'Firebase কনফিগারেশন সেটিংস' : 'Firebase Project Configuration'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'আপনি চাইলে আপনার নিজস্ব Firebase Project-এর Web Client Keys এখানে যুক্ত করতে পারেন। এই তথ্যগুলো শুধুমাত্র আপনার ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত থাকবে।'
                : 'Connect your own Firebase Project by providing your Web App client keys from Firebase Console > Project Settings.'}
            </p>

            <form onSubmit={handleSaveCustomConfig} className="space-y-3 pt-1">
              <div>
                <label htmlFor="custom-firebase-project-id" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Firebase Project ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-firebase-project-id"
                  type="text"
                  required
                  value={customProjectId}
                  onChange={(e) => setCustomProjectId(e.target.value)}
                  placeholder="e.g. my-pdf-app-12345"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="custom-firebase-api-key" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-firebase-api-key"
                  type="text"
                  required
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="custom-firebase-auth-domain" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Auth Domain (Optional)
                </label>
                <input
                  id="custom-firebase-auth-domain"
                  type="text"
                  value={customAuthDomain}
                  onChange={(e) => setCustomAuthDomain(e.target.value)}
                  placeholder="my-pdf-app-12345.firebaseapp.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="custom-firebase-app-id" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  App ID (Optional)
                </label>
                <input
                  id="custom-firebase-app-id"
                  type="text"
                  value={customAppId}
                  onChange={(e) => setCustomAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-[11px] text-red-500 hover:underline cursor-pointer"
                >
                  {isBn ? 'ডিফল্ট সেটিংসে ফিরুন' : 'Reset to Default'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                  >
                    {isBn ? 'সংরক্ষণ করুন' : 'Save & Reload'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
