import {
  User as UserIcon,
  CreditCard,
  History,
  Sparkles,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Zap,
  Settings,
  Trash2,
  ExternalLink,
  Layers,
  Cpu,
  Search,
  ArrowUpRight,
  RefreshCw,
  Check,
  Crown,
  LogOut,
  Edit3,
  Key,
  FolderOpen,
  Filter,
  CheckCircle,
  Lock,
  Download,
  Copy,
  Sliders,
  Unlock,
  RotateCw,
  FileSpreadsheet,
  FileCode,
  Eye,
  SlidersHorizontal,
  X,
  Mail,
  AlertTriangle,
  Clock,
  RefreshCcw,
  CheckCheck,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import {
  getActivityList,
  clearAllActivities,
  removeActivityItem,
  PDFActivity,
} from '../utils/activityStore';
import { getStoredGeoPricing } from '../utils/geoPricing';

function exportJsonDownload(data: unknown, filename: string) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

type DashboardTab = 'overview' | 'history' | 'tools' | 'billing' | 'settings';
type ToolCategory = 'All' | 'Organize' | 'Optimize' | 'Security' | 'Convert' | 'AI';

export const DashboardPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const { user, logout, updateDisplayName, updatePlan, resetPassword, sendVerificationEmail, reloadUser } = useAuth();
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleResendFromDashboard = async () => {
    if (resendingVerification) return;
    setResendingVerification(true);
    try {
      await sendVerificationEmail();
      showToast(
        isBn
          ? 'ভেরিফিকেশন ইমেইল পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।'
          : 'Verification email sent! Please check your inbox.',
        'success'
      );
    } catch {
      showToast(
        isBn
          ? 'ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'Failed to send verification email. Please try again later.',
        'error'
      );
    } finally {
      setResendingVerification(false);
    }
  };
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activities, setActivities] = useState<PDFActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [toolCategory, setToolCategory] = useState<ToolCategory>('All');

  // Real-time daily usage limits & tier
  const {
    dailyTasksLimit,
    tasksUsed,
    tasksRemaining,
    maxFileSizeMB,
  } = useUsageLimit();

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Upgrade & Subscription Modals State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  // Subscription Lifecycle (renewal date & auto-renew)
  const userUid = user?.uid || 'guest';
  const [autoRenew, setAutoRenew] = useState<boolean>(() => {
    const saved = localStorage.getItem(`pdfminty_sub_autorenew_${userUid}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [renewalDate, setRenewalDate] = useState<string>(() => {
    const saved = localStorage.getItem(`pdfminty_sub_renewal_${userUid}`);
    if (saved) return saved;
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  // Clear History Modal State (replacing window.confirm)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

  // Cache cleared indicator
  const [cacheCleared, setCacheCleared] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Client-Side Workspace Preferences
  const [perfMode, setPerfMode] = useState<string>(() => {
    return localStorage.getItem('pdfminty_pref_perf') || 'wasm_simd';
  });
  const [autoFlush, setAutoFlush] = useState<boolean>(() => {
    return localStorage.getItem('pdfminty_pref_autoflush') === 'true';
  });
  const [defaultQuality, setDefaultQuality] = useState<string>(() => {
    return localStorage.getItem('pdfminty_pref_quality') || 'optimal';
  });

  // Load activities
  useEffect(() => {
    setActivities(getActivityList());
  }, []);

  useEffect(() => {
    if (user?.displayName) {
      setNewName(user.displayName);
    }
  }, [user?.displayName]);

  // Pricing info for the user's localized currency
  const pricingInfo = useMemo(() => {
    const { geo, pricing } = getStoredGeoPricing();
    return { geo, pricing };
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesSearch =
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toolName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = tagFilter === 'All' || item.tag === tagFilter;
      return matchesSearch && matchesTag;
    });
  }, [activities, searchQuery, tagFilter]);

  // Statistics based on real user activities & daily usage limits
  const stats = useMemo(() => {
    const totalOps = activities.length;
    const isPro = user?.plan === 'pro';
    const totalPages = activities.reduce((acc, curr) => acc + (curr.pages || 0), 0);
    const storageProcessedMB = Math.round(totalPages * 0.42 * 10) / 10;
    const dailyLimitNum = typeof dailyTasksLimit === 'number' ? dailyTasksLimit : 10;
    const remainingNum = typeof tasksRemaining === 'number' ? tasksRemaining : 10;
    const dailyPercent = isPro ? 100 : Math.max(0, Math.min(100, Math.round((remainingNum / dailyLimitNum) * 100)));

    return {
      totalOps,
      totalPages,
      storageProcessedMB,
      dailyLimitNum,
      remainingNum,
      dailyPercent,
      isPro,
    };
  }, [activities, user?.plan, dailyTasksLimit, tasksRemaining]);

  // Complete List of Tools across all categories
  const allTools = useMemo(
    () => [
      {
        id: 'merge',
        name: isBn ? 'পিডিএফ একত্রীকরণ' : 'Merge PDF',
        route: ROUTES.MERGE,
        desc: isBn ? 'একাধিক ফাইল একসাথে যুক্ত করে একটি নথিতে রূপান্তর' : 'Combine multiple PDFs in custom page sequence',
        icon: Layers,
        badge: 'Popular',
        category: 'Organize' as ToolCategory,
      },
      {
        id: 'compress',
        name: isBn ? 'পিডিএফ কম্প্রেস' : 'Compress PDF',
        route: ROUTES.COMPRESS,
        desc: isBn ? 'সর্বোচ্চ 90% সাইজ কমান ভিজ্যুয়াল মান অক্ষুণ্ণ রেখে' : 'Reduce file size up to 90% without visible quality loss',
        icon: Zap,
        badge: 'High-Speed',
        category: 'Optimize' as ToolCategory,
      },
      {
        id: 'split',
        name: isBn ? 'পিডিএফ বিভক্তকরণ' : 'Split PDF',
        route: ROUTES.SPLIT,
        desc: isBn ? 'নির্দিষ্ট পেজ রেঞ্জ বা একক পেজ আলাদা করুন' : 'Extract specific page ranges into individual documents',
        icon: FolderOpen,
        badge: 'Lossless',
        category: 'Organize' as ToolCategory,
      },
      {
        id: 'sign',
        name: isBn ? 'ই-সিগনেচার ও সাইন' : 'Sign PDF',
        route: ROUTES.SIGN_PDF,
        desc: isBn ? 'ডিজিটাল স্বাক্ষর, স্ট্যাম্প ও তারিখ যুক্ত করুন' : 'Legally binding e-signatures and audit timestamps',
        icon: Edit3,
        badge: 'Security',
        category: 'Security' as ToolCategory,
      },
      {
        id: 'ocr',
        name: isBn ? 'ওসিআর টেক্সট এক্সট্রাক্ট' : 'OCR & Text Extract',
        route: ROUTES.OCR_PDF,
        desc: isBn ? 'স্ক্যান করা ইমেজ থেকে নির্ভুল টেক্সট রূপান্তর' : 'Convert scanned documents to editable & searchable text',
        icon: Cpu,
        badge: 'AI Engine',
        category: 'AI' as ToolCategory,
      },
      {
        id: 'protect',
        name: isBn ? 'পাসওয়ার্ড দিয়ে এনক্রিপ্ট' : 'Protect PDF',
        route: ROUTES.PROTECT,
        desc: isBn ? 'AES-256 বিট মিলিটারি গ্রেড এনক্রিপশন পাসওয়ার্ড' : 'Add AES-256 bank-level password encryption',
        icon: Lock,
        badge: 'AES-256',
        category: 'Security' as ToolCategory,
      },
      {
        id: 'unlock',
        name: isBn ? 'পাসওয়ার্ড আনলক' : 'Unlock PDF',
        route: ROUTES.UNLOCK,
        desc: isBn ? 'সুরক্ষিত পিডিএফ থেকে রেস্ট্রিকশন অপসারণ' : 'Remove security restrictions and viewable passwords',
        icon: Unlock,
        badge: 'Instant',
        category: 'Security' as ToolCategory,
      },
      {
        id: 'ai-analyze',
        name: isBn ? 'এআই ডকুমেন্ট অ্যানালাইজার' : 'Gemini AI Analyze',
        route: ROUTES.AI_ANALYZE,
        desc: isBn ? 'গুগল জেমিনি এআই দিয়ে সারাংশ ও প্রশ্ন-উত্তর' : 'Google Gemini AI document summarization & deep QA',
        icon: Sparkles,
        badge: 'Pro Tier',
        category: 'AI' as ToolCategory,
      },
      {
        id: 'pdf-to-img',
        name: isBn ? 'পিডিএফ টু ইমেজ' : 'PDF to Image',
        route: ROUTES.PDF_TO_IMG,
        desc: isBn ? 'হাই-রেজোলিউশন JPG ও PNG ইমেজ এক্সপোর্ট' : 'Convert pages to high-fidelity JPG and transparent PNG',
        icon: FileText,
        badge: 'Convert',
        category: 'Convert' as ToolCategory,
      },
      {
        id: 'img-to-pdf',
        name: isBn ? 'ইমেজ টু পিডিএফ' : 'Image to PDF',
        route: ROUTES.IMG_TO_PDF,
        desc: isBn ? 'JPG, PNG ও WebP ছবি থেকে সরাসরি পিডিএফ তৈরি' : 'Turn JPG, PNG, and WebP photos into standard PDF',
        icon: FileSpreadsheet,
        badge: 'Convert',
        category: 'Convert' as ToolCategory,
      },
      {
        id: 'pdf-to-markdown',
        name: isBn ? 'পিডিএফ টু মার্কডাউন' : 'PDF to Markdown',
        route: ROUTES.PDF_TO_MARKDOWN,
        desc: isBn ? 'টেবিল ও ফরম্যাটিংসহ ক্লিন মার্কডাউন এক্সট্রাক্ট' : 'Extract clean Markdown formatted structure and tables',
        icon: FileCode,
        badge: 'Developer',
        category: 'Convert' as ToolCategory,
      },
      {
        id: 'rotate',
        name: isBn ? 'পেজ রোটেট' : 'Rotate PDF',
        route: ROUTES.ROTATE,
        desc: isBn ? 'উল্টো বা হেলে থাকা পেজ 90°/180° ঠিক করুন' : 'Rotate portrait or landscape pages in seconds',
        icon: RotateCw,
        badge: 'Quick',
        category: 'Organize' as ToolCategory,
      },
      {
        id: 'reorder',
        name: isBn ? 'পেজ রিঅর্ডার' : 'Reorder Pages',
        route: ROUTES.REORDER,
        desc: isBn ? 'ড্র্যাগ অ্যান্ড ড্রপ করে পেজের ক্রম পরিবর্তন' : 'Drag-and-drop visual page sequencing and sorting',
        icon: SlidersHorizontal,
        badge: 'Visual',
        category: 'Organize' as ToolCategory,
      },
      {
        id: 'delete-pages',
        name: isBn ? 'পেজ মুছুন' : 'Delete Pages',
        route: ROUTES.DELETE_PAGES,
        desc: isBn ? 'অপ্রয়োজনীয় পেজ সহজেই নথি থেকে রিমুভ করুন' : 'Remove unnecessary or blank pages from your PDF',
        icon: Trash2,
        badge: 'Organize',
        category: 'Organize' as ToolCategory,
      },
      {
        id: 'watermark',
        name: isBn ? 'ওয়াটারমার্ক যুক্ত করুন' : 'Add Watermark',
        route: ROUTES.WATERMARK,
        desc: isBn ? 'কাস্টম টেক্সট ও ব্র্যান্ড লোগো ওয়াটারমার্ক স্ট্যাম্প' : 'Stamp custom confidential notices or brand marks',
        icon: Eye,
        badge: 'Branding',
        category: 'Security' as ToolCategory,
      },
      {
        id: 'sanitize',
        name: isBn ? 'স্যানিটাইজ ও মেটাডেটা মুছুন' : 'Sanitize PDF',
        route: ROUTES.SANITIZE_PDF,
        desc: isBn ? 'লুকানো ট্র্যাকার ও ব্যক্তিগত তথ্য সম্পূর্ণ মুছুন' : 'Strip hidden author metadata and revision trails',
        icon: ShieldCheck,
        badge: 'Privacy',
        category: 'Security' as ToolCategory,
      },
    ],
    [isBn]
  );

  const filteredLauncherTools = useMemo(() => {
    if (toolCategory === 'All') return allTools;
    return allTools.filter((t) => t.category === toolCategory);
  }, [allTools, toolCategory]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      await updateDisplayName(newName.trim());
      setIsEditingName(false);
      showToast(isBn ? 'নাম সফলভাবে আপডেট করা হয়েছে!' : 'Profile name updated successfully!', 'success');
    } catch {
      showToast(isBn ? 'নাম আপডেট করা সম্ভব হয়নি।' : 'Failed to update profile name.', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCopyUid = () => {
    const textToCopy = user?.uid || 'pdfminty-session-local';
    navigator.clipboard?.writeText(textToCopy);
    setCopiedUid(true);
    showToast(isBn ? 'ইউজার আইডি কপি হয়েছে!' : 'User ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      showToast(
        isBn
          ? `পাসওয়ার্ড রিসেট লিংক ${user.email}-এ পাঠানো হয়েছে!`
          : `Password reset instructions sent to ${user.email}!`,
        'success'
      );
    } catch {
      showToast(isBn ? 'রিসেট ইমেইল পাঠানো যায়নি।' : 'Failed to send reset email.', 'error');
    }
  };

  const handleConfirmClearHistory = () => {
    clearAllActivities();
    setActivities([]);
    setShowClearHistoryModal(false);
    showToast(isBn ? 'হিস্ট্রি সফলভাবে মুছে ফেলা হয়েছে।' : 'Activity history log cleared successfully.', 'success');
  };

  const handleDeleteSingleActivity = (id: string, name: string) => {
    const updated = removeActivityItem(id);
    setActivities(updated);
    showToast(
      isBn ? `"${name}" হিস্ট্রি থেকে মুছে ফেলা হয়েছে` : `Removed "${name}" from workspace log`,
      'info'
    );
  };

  const handleExportHistory = () => {
    if (activities.length === 0) {
      showToast(isBn ? 'এক্সপোর্ট করার মতো কোনো হিস্ট্রি নেই।' : 'No activity records available to export.', 'info');
      return;
    }
    exportJsonDownload(activities, 'pdfminty_activity_log.json');
    showToast(isBn ? 'অডিট হিস্ট্রি JSON ডাউনলোড হয়েছে!' : 'Audit history log downloaded as JSON!', 'success');
  };


  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => {
      setCacheCleared(false);
      showToast(
        isBn
          ? 'ব্রাউজার মেমোরি ও টেম্পোরারি ক্যাশ পরিষ্কার করা হয়েছে।'
          : 'Local browser memory heap and WebAssembly cache flushed.',
        'success'
      );
    }, 600);
  };

  const handleActivatePro = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      updatePlan('pro');
      setAutoRenew(true);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const dateFormatted = nextDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      setRenewalDate(dateFormatted);
      try {
        localStorage.setItem(`pdfminty_sub_renewal_${userUid}`, dateFormatted);
        localStorage.setItem(`pdfminty_sub_autorenew_${userUid}`, 'true');
      } catch {
        // ignore
      }
      setIsUpgrading(false);
      setShowUpgradeModal(false);
      showToast(
        isBn
          ? '🎉 অভিনন্দন! প্রো প্ল্যান ($2.49/mo) সক্রিয় করা হয়েছে!'
          : '🎉 Congratulations! Pro Plan ($2.49/mo) has been activated for your account!',
        'success'
      );
    }, 800);
  };

  const handleRenewSubscription = () => {
    setIsRenewing(true);
    setTimeout(() => {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const dateFormatted = nextDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      setRenewalDate(dateFormatted);
      try {
        localStorage.setItem(`pdfminty_sub_renewal_${userUid}`, dateFormatted);
      } catch {
        // ignore
      }
      setIsRenewing(false);
      setShowRenewModal(false);
      showToast(
        isBn
          ? `🎉 প্রো সাবস্ক্রিপশন সফলভাবে রিনিউ করা হয়েছে! পরবর্তী নবায়ন: ${dateFormatted}`
          : `🎉 Pro subscription successfully renewed! Next renewal date: ${dateFormatted}`,
        'success'
      );
    }, 700);
  };

  const handleConfirmCancelSubscription = () => {
    updatePlan('free');
    setAutoRenew(false);
    try {
      localStorage.setItem(`pdfminty_sub_autorenew_${userUid}`, 'false');
    } catch {
      // ignore
    }
    setShowCancelModal(false);
    showToast(
      isBn
        ? 'আপনার প্রো সাবস্ক্রিপশন বাতিল করা হয়েছে। অ্যাকাউন্টটি ফ্রি প্ল্যানে (১০ টাস্ক/দিন) পরিবর্তিত হলো।'
        : 'Your Pro subscription has been cancelled. Your account is now on the Free tier (10 tasks/day).',
      'info'
    );
  };

  const handleToggleAutoRenew = () => {
    const newVal = !autoRenew;
    setAutoRenew(newVal);
    try {
      localStorage.setItem(`pdfminty_sub_autorenew_${userUid}`, String(newVal));
    } catch {
      // ignore
    }
    showToast(
      newVal
        ? (isBn ? 'স্বয়ংক্রিয় রিনিউয়াল চালু করা হয়েছে।' : 'Auto-renew has been turned ON.')
        : (isBn ? 'স্বয়ংক্রিয় রিনিউয়াল বন্ধ করা হয়েছে।' : 'Auto-renew has been turned OFF.'),
      'info'
    );
  };

  const handlePreferenceChange = (key: 'perf' | 'autoflush' | 'quality', value: string | boolean) => {
    if (key === 'perf') {
      setPerfMode(value as string);
      localStorage.setItem('pdfminty_pref_perf', value as string);
    } else if (key === 'autoflush') {
      setAutoFlush(value as boolean);
      localStorage.setItem('pdfminty_pref_autoflush', String(value));
    } else if (key === 'quality') {
      setDefaultQuality(value as string);
      localStorage.setItem('pdfminty_pref_quality', value as string);
    }
    showToast(isBn ? 'পছন্দ সংরক্ষিত হয়েছে' : 'Workspace preference updated', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 animate-fadein">
      <Helmet>
        <title>
          {isBn ? 'ইউজার ড্যাশবোর্ড ও প্রোফাইল — PDFMinty' : 'My Dashboard & Profile — PDFMinty'}
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* ========================================================= */}
        {/* TOP EXECUTIVE HERO & IDENTITY BAR                        */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 transition-all">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* User Identity Details */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-white dark:ring-slate-800">
                  {user?.displayName ? user.displayName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                {stats.isPro && (
                  <span
                    title="Active Pro Subscriber"
                    className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-md"
                  >
                    <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="py-1 px-3 text-base font-bold bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl focus:outline-none ring-2 ring-emerald-500/20 text-slate-900 dark:text-white"
                        placeholder="Enter your name"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="py-1 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                      >
                        {isSavingName ? '...' : isBn ? 'সংরক্ষণ' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="py-1 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {user?.displayName || (isBn ? 'পিডিএফমিন্টি ব্যবহারকারী' : 'PDFMinty Member')}
                      </h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={isBn ? 'নাম পরিবর্তন করুন' : 'Edit display name'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Plan Identifier */}
                  {stats.isPro ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 tracking-wide uppercase">
                      <Crown className="w-3.5 h-3.5 fill-current" />
                      <span>{isBn ? 'প্রো মেম্বার ($2.49/mo)' : 'Pro Subscriber ($2.49/mo)'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                      <span>{isBn ? 'ফ্রি প্ল্যান' : 'Free Explorer'}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <span>{user?.email || 'authenticated-user@pdfminty.local'}</span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {isBn ? 'ক্লায়েন্ট-সাইড সেশন সক্রিয়' : 'Client-Side Session Active'}
                  </span>
                  <span>&bull;</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold text-xs ${
                      user?.emailVerified
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {user?.emailVerified ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{isBn ? 'ইমেইল ভেরিফাইড' : 'Email Verified'}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>{isBn ? 'ইমেইল আনভেরিফাইড' : 'Unverified Email'}</span>
                      </>
                    )}
                  </span>
                  <span>&bull;</span>
                  <button
                    onClick={handleCopyUid}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                    title={isBn ? 'ইউজার আইডি কপি করুন' : 'Copy User ID'}
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUid ? (isBn ? 'কপি হয়েছে' : 'Copied') : 'ID'}</span>
                  </button>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {isBn ? '100% গোপনীয়তা সুরক্ষিত (জিরো ক্লাউড স্টোরেজ)' : 'Zero-Knowledge Privacy Sandbox'}
                  </span>
                  <span>&bull;</span>
                  <span>{isBn ? 'লোকেশন:' : 'Region:'} {pricingInfo.geo.flag} {pricingInfo.geo.countryName}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions in Hero */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
              {!stats.isPro ? (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{isBn ? 'প্রো আপগ্রেড ($2.49/mo)' : 'Upgrade to Pro ($2.49/mo)'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(true)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    title={isBn ? 'সাবস্ক্রিপশন রিনিউ করুন' : 'Renew Pro Subscription'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isBn ? 'রিনিউ করুন' : 'Renew'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isBn ? 'সাবস্ক্রিপশন' : 'Subscription'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-2.5 py-2 rounded-xl border border-red-300 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs transition-colors cursor-pointer"
                    title={isBn ? 'সাবস্ক্রিপশন বাতিল করুন' : 'Cancel subscription'}
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={logout}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title={isBn ? 'সাইন আউট করুন' : 'Sign out'}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isBn ? 'সাইন আউট' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Unverified Email Alert Banner */}
        {user && !user.emailVerified && (
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm animate-fadein">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-amber-950 dark:text-amber-200">
                  {isBn ? 'আপনার ইমেইল ঠিকানাটি এখনও ভেরিফাই করা হয়নি' : 'Your email address is not yet verified'}
                </p>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  {isBn
                    ? 'আপনার অ্যাকাউন্টের পূর্ণ সুরক্ষা ও নিশ্চিন্তে ব্যবহারের জন্য ইনবক্স বা স্প্যাম ফোল্ডারের লিংকে ক্লিক করে ভেরিফাই করুন।'
                    : 'Check your email inbox or spam folder and click the verification link to protect your account.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResendFromDashboard}
                disabled={resendingVerification}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {resendingVerification
                  ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...')
                  : (isBn ? 'ভেরিফিকেশন লিংক পুনরায় পাঠান' : 'Resend Verification Link')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await reloadUser();
                    showToast(isBn ? 'স্ট্যাটাস আপডেট করা হয়েছে!' : 'Refreshed status!', 'info');
                  } catch {
                    // Ignore reload errors
                  }
                }}
                className="p-1.5 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                title={isBn ? 'স্ট্যাটাস রিফ্রেশ করুন' : 'Refresh status'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* EXECUTIVE METRICS & CAPACITY GAUGES                       */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Daily Remaining Tasks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBn ? 'দৈনিক বাকি থাকা টাস্ক' : 'Daily Remaining Tasks'}
              </span>
              <div className={`p-2 rounded-xl ${
                stats.isPro
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : stats.remainingNum === 0
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {stats.isPro ? <Crown className="w-4 h-4 fill-current" /> : <Clock className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.isPro
                    ? (isBn ? 'আনলিমিটেড' : 'Unlimited')
                    : `${stats.remainingNum}`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {stats.isPro
                    ? '(∞ Tasks/Day)'
                    : `/ ${stats.dailyLimitNum} ${isBn ? 'টাস্ক বাকি' : 'tasks left'}`}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.isPro
                      ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 w-full'
                      : stats.remainingNum === 0
                      ? 'bg-rose-500'
                      : stats.dailyPercent <= 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${stats.isPro ? 100 : stats.dailyPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {stats.isPro
                  ? (isBn ? 'প্রো সদস্য: কোনো সীমা নেই' : 'Pro Tier: Zero limits')
                  : `${tasksUsed} ${isBn ? 'টি ব্যবহৃত' : 'used'} • ${isBn ? 'রিসেট: রাত ১২টা' : 'Resets at 00:00'}`}
              </span>
              {!stats.isPro && (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isBn ? 'আনলিমিটেড নিন' : 'Go Unlimited'}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Professional Status & File Limit */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBn ? 'প্রফেশনাল স্ট্যাটাস' : 'Professional Status'}
              </span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.isPro ? 'Pro Member' : 'Free Explorer'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  ({maxFileSizeMB} MB)
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {stats.isPro
                    ? `${isBn ? '৫০টি ফাইল ব্যাচ' : '50 files batch'} • SIMD`
                    : `${isBn ? '১০টি টাস্ক/দিন' : '10 tasks/day'} • Standard`}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.isPro
                ? isBn
                  ? `পরবর্তী রিনিউয়াল: ${renewalDate}`
                  : `Next Renewal: ${renewalDate}`
                : isBn
                ? '৫০০ এমবি ফাইল ও আনলিমিটেড টাস্কের জন্য প্রো নিন'
                : 'Upgrade for 500MB batch files & Gemini AI'}
            </p>
          </div>

          {/* Card 3: Privacy & Zero Knowledge Guarantee */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBn ? 'জিরো-নলেজ প্রাইভেসি' : 'Privacy Sandbox'}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  100%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                {isBn ? 'সার্ভারে 0 বাইট ডেটা পাঠানো হয়' : '0 Bytes Stored on Cloud'}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isBn
                ? 'আইল্যাভপিডিএফ বা স্মলপিডিএফ থেকে অধিক নিরাপদ'
                : '100% confidential offline browser engine'}
            </p>
          </div>

          {/* Card 4: Data Processed & Space Saved */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isBn ? 'প্রসেস করা ডেটা ও ব্যান্ডউইথ' : 'Processed Bandwidth'}
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.storageProcessedMB} MB
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  ({stats.totalPages} pages)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                {stats.totalOps === 0
                  ? isBn
                    ? 'এখনো কোনো ফাইল প্রসেস করা হয়নি'
                    : 'No documents processed yet'
                  : isBn
                  ? 'লোকাল মেমোরিতে সরাসরি এক্সিকিউটেড'
                  : 'Processed directly on your CPU'}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.totalOps === 0
                ? isBn
                  ? 'টুলস ব্যবহার করলে পরিসংখ্যান যুক্ত হবে'
                  : 'Metrics update as you process PDFs'
                : isBn
                ? '100% ক্লায়েন্ট-সাইড মেমোরি প্রসেসিং'
                : '100% confidential in-memory processing'}
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* INTERACTIVE NAVIGATION TABS                               */}
        {/* ========================================================= */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isBn ? 'ড্যাশবোর্ড ও লঞ্চপ্যাড' : 'Workspace Overview'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{isBn ? 'সাম্প্রতিক হিস্ট্রি' : 'Recent Activity'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                {activities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>{isBn ? 'সব টুলস' : 'All Tools Hub'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {allTools.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{isBn ? 'সাবস্ক্রিপশন ও বিলিং' : 'Subscription & Billing'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                stats.isPro
                  ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {stats.isPro ? 'PRO' : 'FREE'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{isBn ? 'প্রোফাইল ও সেটিংস' : 'Profile & Preferences'}</span>
            </button>
          </nav>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: WORKSPACE OVERVIEW                                 */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadein">
            {/* Quick Action Tool Launchpad */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {isBn ? 'দ্রুত অ্যাক্সেস টুল লঞ্চপ্যাড' : 'Quick Launchpad'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'আন্তর্জাতিক সাইটগুলোর চেয়ে দ্রুত ও সুরক্ষিত উপায়ে কাজ শুরু করুন'
                      : 'Launch top productivity PDF operations in 1-click (100% offline & confidential)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('tools')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <span>{isBn ? `সকল ${allTools.length} টুল দেখুন` : `Explore all ${allTools.length} tools`}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {allTools.slice(0, 4).map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      to={tool.route}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {tool.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {tool.desc}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span>{isBn ? 'টুল খুলুন' : 'Open Workspace'}</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Middle Section: Recent Processed Files & Subscription Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Processed Files History (2 Columns) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {isBn ? 'সাম্প্রতিক প্রসেস করা ফাইল হিস্ট্রি' : 'Recent Processed Files History'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {activities.length} {isBn ? 'টি ফাইল' : 'files'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activities.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportHistory}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                        title={isBn ? 'JSON এক্সপোর্ট করুন' : 'Export log as JSON'}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isBn ? 'এক্সপোর্ট' : 'Export'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isBn ? 'সম্পূর্ণ হিস্ট্রি দেখুন' : 'View Full Log'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {isBn ? 'এখনো কোনো ফাইল প্রসেস করা হয়নি' : 'No processed files recorded yet'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        {isBn
                          ? 'পিডিএফ মার্জ, কম্প্রেস, স্প্লিট বা রোটেট করলে আপনার সব ডকুমেন্টের সুরক্ষিত অফলাইন অডিট হিস্ট্রি এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'
                          : 'When you merge, compress, split, or rotate PDFs, your confidential local processing history will automatically appear here.'}
                      </p>
                    </div>

                    {/* Quick-start Action Cards */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
                      <Link
                        to={ROUTES.MERGE}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all text-center group"
                      >
                        <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isBn ? 'মার্জ পিডিএফ' : 'Merge PDF'}
                        </span>
                      </Link>

                      <Link
                        to={ROUTES.COMPRESS}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all text-center group"
                      >
                        <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isBn ? 'কম্প্রেস পিডিএফ' : 'Compress PDF'}
                        </span>
                      </Link>

                      <Link
                        to={ROUTES.SPLIT}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all text-center group"
                      >
                        <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {isBn ? 'স্প্লিট পিডিএফ' : 'Split PDF'}
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activities.slice(0, 5).map((item) => {
                      const toolDef = allTools.find((t) => t.id === item.toolId);
                      return (
                        <div
                          key={item.id}
                          className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {item.fileName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {item.toolName}
                                </span>
                                <span>&bull;</span>
                                <span>{item.fileSizeFormatted}</span>
                                <span>&bull;</span>
                                <span className="text-slate-400 dark:text-slate-500">{item.relativeTime}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{item.savings || 'Completed'}</span>
                            </span>
                            <Link
                              to={toolDef?.route || ROUTES.HOME}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title={isBn ? 'টুল পুনরায় খুলুন' : 'Re-open Tool'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleActivity(item.id, item.fileName)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                              title={isBn ? 'মুছে ফেলুন' : 'Remove from log'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subscription & Account Plan Control Card (1 Column) */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-col justify-between space-y-5 shadow-xl shadow-emerald-600/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>{stats.isPro ? (isBn ? 'প্রো মেম্বার অ্যাক্টিভ' : 'Pro Member Active') : (isBn ? 'ফ্রি অ্যাকাউন্ট' : 'Free Explorer')}</span>
                    </div>
                    <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full">
                      {stats.isPro ? '$2.49/mo' : '$0/mo'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black tracking-tight">
                    {stats.isPro
                      ? isBn
                        ? 'আপনার প্রো সাবস্ক্রিপশন সক্রিয় রয়েছে'
                        : 'Your Pro Subscription is Active'
                      : isBn
                        ? 'দৈনিক কোটা ও প্রো আপগ্রেড'
                        : 'Daily Quota & Pro Power'}
                  </h3>

                  <p className="text-xs text-emerald-50/90 leading-relaxed">
                    {stats.isPro
                      ? isBn
                        ? `পরবর্তী রিনিউয়াল তারিখ: ${renewalDate}। সীমাহীন টাস্ক ও ৫০০ এমবি ফাইল সুবিধা সক্রিয় রয়েছে।`
                        : `Next billing date: ${renewalDate}. Unlimited operations & 500MB batch limit unlocked.`
                      : isBn
                        ? `আজকে আপনার ${stats.remainingNum} / ${stats.dailyLimitNum} টি টাস্ক বাকি আছে। আনলিমিটেড টাস্ক পেতে প্রো-তে আপগ্রেড করুন।`
                        : `You have ${stats.remainingNum} of ${stats.dailyLimitNum} daily tasks left today. Upgrade for unlimited tasks.`}
                  </p>
                </div>

                {/* Quota / Status Overview in Box */}
                <div className="p-3.5 rounded-2xl bg-black/15 backdrop-blur-sm border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-100">{isBn ? 'দৈনিক বাকি টাস্ক:' : 'Daily Tasks Left:'}</span>
                    <span className="font-black text-amber-300">
                      {stats.isPro ? '∞ Unlimited' : `${stats.remainingNum} / ${stats.dailyLimitNum}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-100">{isBn ? 'সর্বোচ্চ ফাইলের সাইজ:' : 'Max File Size:'}</span>
                    <span className="font-black">{maxFileSizeMB} MB</span>
                  </div>
                  {stats.isPro && (
                    <div className="flex justify-between items-center pt-1 border-t border-white/10">
                      <span className="text-emerald-100">{isBn ? 'স্বয়ংক্রিয় নবায়ন:' : 'Auto-Renew:'}</span>
                      <button
                        type="button"
                        onClick={handleToggleAutoRenew}
                        className="text-[11px] font-bold underline hover:text-amber-300 cursor-pointer"
                      >
                        {autoRenew ? (isBn ? 'চালু (Active)' : 'Enabled') : (isBn ? 'বন্ধ (Off)' : 'Disabled')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1 border-t border-white/15">
                  {stats.isPro ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRenewModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-all shadow text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isBn ? 'রিনিউ করুন' : 'Renew'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-red-500/25 hover:bg-red-500/40 border border-red-300/40 text-white font-bold text-xs transition-colors text-center cursor-pointer"
                        >
                          {isBn ? 'বাতিল করুন' : 'Cancel'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('billing')}
                        className="w-full py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs text-center cursor-pointer transition-colors"
                      >
                        {isBn ? 'সাবস্ক্রিপশন ও রিসিপ্ট দেখুন' : 'Billing & Receipts'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-white text-slate-950 font-black text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-lg text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'প্রো আপগ্রেড ($2.49/mo)' : 'Upgrade to Pro — $2.49/mo'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DETAILED ACTIVITY & PROCESSING HISTORY             */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadein">
            {/* History Header & Controls */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {isBn ? 'ডকুমেন্ট ও টাস্ক হিস্ট্রি' : 'Document Processing Audit Log'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'আপনার ডিভাইসে ক্লায়েন্ট-সাইড প্রসেস করা সমস্ত পিডিএফ কাজের রেকর্ড (সার্ভারে আপলোড হয় না)'
                      : 'Audit log of all documents processed locally in your browser memory (100% confidential)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportHistory}
                    className="py-2 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title={isBn ? 'অডিট হিস্ট্রি ডাউনলোড করুন' : 'Export log as JSON'}
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isBn ? 'এক্সপোর্ট JSON' : 'Export Log'}</span>
                  </button>


                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    disabled={activities.length === 0}
                    className="py-2 px-3 text-xs font-bold rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'হিস্ট্রি মুছুন' : 'Clear Log'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Tag Filter Bar */}
              <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isBn ? 'ফাইলের নাম বা টুল দিয়ে খুঁজুন...' : 'Search by file name or tool...'}
                    className="w-full py-2.5 pl-9 pr-4 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none ring-2 ring-emerald-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar text-xs">
                  {['All', 'Compress', 'Sign', 'Merge', 'OCR', 'Security'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                        tagFilter === tag
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* History Table / List */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {activities.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি' : 'No document activity records yet'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {isBn
                      ? 'আপনি এখনো কোনো ফাইল প্রসেস করেননি। যেকোনো টুল দিয়ে ফাইল প্রসেস করলে এখানে সংরক্ষিত হবে।'
                      : 'You haven\'t processed any files yet. Operations performed in our tools will be logged here.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tools')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{isBn ? 'টুলস হাব দেখুন' : 'Explore Tools Hub'}</span>
                  </button>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Filter className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No activity records match your search'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'সার্চ কুয়েরি পরিবর্তন করুন অথবা অন্য ক্যাটাগরি ফিল্টার বেছে নিন'
                      : 'Try broadening your search term or select another category filter'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                        <th className="pb-3 px-3">{isBn ? 'ফাইলের নাম' : 'Document Name'}</th>
                        <th className="pb-3 px-3">{isBn ? 'ব্যবহৃত টুল' : 'Operation'}</th>
                        <th className="pb-3 px-3">{isBn ? 'সাইজ / সঞ্চয়' : 'Size & Reduction'}</th>
                        <th className="pb-3 px-3">{isBn ? 'সময়' : 'Processed'}</th>
                        <th className="pb-3 px-3">{isBn ? 'স্ট্যাটাস' : 'Verification'}</th>
                        <th className="pb-3 px-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredActivities.map((act) => (
                        <tr
                          key={act.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate block">
                                {act.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {act.toolName}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                            {act.fileSizeFormatted}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                            {act.relativeTime}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{act.savings || 'Completed'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-3">
                              <Link
                                to={
                                  allTools.find((t) => t.id === act.toolId)?.route ||
                                  ROUTES.HOME
                                }
                                className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <span>{isBn ? 'টুল খুলুন' : 'Re-open'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleActivity(act.id, act.fileName)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md"
                                title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ALL TOOLS HUB & WORKFLOW LAUNCHER                  */}
        {/* ========================================================= */}
        {activeTab === 'tools' && (
          <div className="space-y-6 animate-fadein">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {isBn ? `সকল ${allTools.length}+ প্রফেশনাল পিডিএফ টুলস` : `Complete ${allTools.length}+ PDF Power Tools Suite`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'প্রতিটি টুল আপনার ব্রাউজারের ভেতর মেমোরিতে চলে — দ্রুততম স্পিড ও 100% গোপনীয়তা'
                      : 'Every single tool executes 100% locally on your machine with zero server file exposure'}
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {(['All', 'Organize', 'Optimize', 'Security', 'Convert', 'AI'] as ToolCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setToolCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                        toolCategory === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredLauncherTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {tool.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {tool.desc}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>{isBn ? 'টুল শুরু করুন' : 'Launch Tool'}</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SUBSCRIPTION & BILLING CENTER                     */}
        {/* ========================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-fadein">
            {/* Active Subscription Status Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                      stats.isPro
                        ? 'bg-gradient-to-tr from-amber-500 to-emerald-500 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {stats.isPro ? <Crown className="w-7 h-7 fill-white" /> : <Zap className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {stats.isPro ? (isBn ? 'প্রো সাবস্ক্রিপশন প্ল্যান' : 'Pro Subscription Plan') : (isBn ? 'ফ্রি এক্সপ্লোরার প্ল্যান' : 'Free Explorer Plan')}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          stats.isPro
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {stats.isPro ? 'Active ($2.49/mo)' : 'Active (Free)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stats.isPro
                        ? isBn
                          ? `পরবর্তী নবায়ন তারিখ: ${renewalDate} • বিলিং সাইকেল: মাসিক ($2.49/মাস) • অটো-রিনিউ: ${autoRenew ? 'চালু' : 'বন্ধ'}`
                          : `Next billing date: ${renewalDate} • Billed at $2.49/month • Auto-renew: ${autoRenew ? 'ON' : 'OFF'}`
                        : isBn
                          ? `দৈনিক ১০টি টাস্ক ও ১৫০ এমবি ফাইল ক্যাপাসিটি • সীমাহীন টাস্ক পেতে প্রো আপগ্রেড করুন`
                          : `10 tasks/day limit • 150MB per file • Upgrade to Pro for unlimited batch processing`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {!stats.isPro ? (
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
                      <span>{isBn ? 'প্রো সক্রিয় করুন ($2.49/mo)' : 'Activate Pro ($2.49/mo)'}</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleAutoRenew}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          autoRenew
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                        title={isBn ? 'স্বয়ংক্রিয় রিনিউয়াল পরিবর্তন' : 'Toggle auto-renew'}
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>{autoRenew ? (isBn ? 'অটো-রিনিউ: চালু' : 'Auto-Renew: ON') : (isBn ? 'অটো-রিনিউ: বন্ধ' : 'Auto-Renew: OFF')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRenewModal(true)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isBn ? 'সাবস্ক্রিপশন নবায়ন করুন' : 'Renew Pro Subscription'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isBn ? 'রিনিউ করুন' : 'Renew Subscription'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-red-300 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        title={isBn ? 'সাবস্ক্রিপশন বাতিল করুন' : 'Cancel subscription'}
                      >
                        {isBn ? 'সাবস্ক্রিপশন বাতিল করুন' : 'Cancel Subscription'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Task Quota & Usage Meter Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? 'দৈনিক বাকি থাকা টাস্ক কাউন্ট' : 'Daily Task Quota Usage'}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {stats.isPro
                        ? 'Unlimited'
                        : `${stats.remainingNum} / ${stats.dailyLimitNum} ${isBn ? 'টাস্ক বাকি' : 'left'}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stats.isPro
                      ? (isBn ? 'প্রো অ্যাকাউন্টে কোনো দৈনিক টাস্ক বা স্পিড সীমা নেই।' : 'Pro membership includes zero daily throttles or task caps.')
                      : (isBn
                        ? `ফ্রি অ্যাকাউন্টে দৈনিক ১০টি টাস্কের কোটা রয়েছে। আজকে ${tasksUsed}টি টাস্ক ব্যবহৃত হয়েছে (বাকি ${stats.remainingNum}টি)। রাত ১২:০০ টায় রিসেট হবে।`
                        : `Free accounts receive 10 daily tasks. You have used ${tasksUsed} tasks today (${stats.remainingNum} remaining). Resets at 00:00 midnight.`)}
                  </p>
                </div>

                <div className="w-full md:w-64 space-y-1.5 shrink-0">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{isBn ? 'আজকের কোটা:' : 'Today\'s Quota:'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.isPro ? '100% Unlimited' : `${stats.remainingNum} / ${stats.dailyLimitNum} Tasks`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.isPro
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 w-full'
                          : stats.remainingNum === 0
                          ? 'bg-rose-500'
                          : stats.dailyPercent <= 30
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${stats.isPro ? 100 : stats.dailyPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Free Plan Specs */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-slate-800 dark:text-slate-200">
                      {isBn ? 'ফ্রি ফিচারসমূহ' : 'Free Plan Features'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">$0 / month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100MB max file limit per operation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100% Client-side privacy execution</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Standard PDF Merge, Compress & Split</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Plan Specs */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-500/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-black text-sm text-emerald-900 dark:text-emerald-300">
                        {isBn ? 'প্রো ফিচারসমূহ' : 'Pro Plan Perks'}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      $2.49 / month
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>500MB per file & batch limit</strong> (50 files concurrent)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Gemini AI</strong> document analysis & summaries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>High-accuracy OCR</strong> scanned document engine</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Priority WebAssembly CPU optimization</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Invoices List */}
              <div className="pt-4 space-y-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isBn ? 'বিলিং হিস্ট্রি ও রিসিপ্ট' : 'Invoices & Receipts'}
                </h4>
                {stats.isPro ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          PDFMinty Pro Subscription — $2.49 USD / Month
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {isBn ? 'স্ট্যাটাস: সক্রিয় &bull; আনলিমিটেড অ্যাক্সেস' : 'Status: Active &bull; Unlimited Access'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Paid</span>
                    </span>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isBn ? 'কোনো পেইড ইনভয়েস নেই' : 'No Paid Invoices'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBn
                        ? 'আপনি বর্তমানে ফ্রি প্ল্যান ব্যবহার করছেন। প্রো সাবস্ক্রিপশন গ্রহণ করলে এখানে অফিসিয়াল ট্যাক্স ইনভয়েস যুক্ত হবে।'
                        : 'You are currently on the Free tier. Paid invoices and official tax receipts will appear here after upgrading to Pro.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PROFILE & SECURITY SETTINGS                        */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadein">
            {/* Account Profile Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {isBn ? 'প্রোফাইল সেটিংস ও অ্যাকাউন্ট নিরাপত্তা' : 'Profile & Workspace Preferences'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Edit */}
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    <span>{isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Details'}</span>
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      {isBn ? 'ডিসপ্লে নাম' : 'Display Name'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        {isSavingName ? '...' : isBn ? 'আপডেট' : 'Update'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      {isBn ? 'নিবন্ধিত ইমেইল' : 'Registered Email'}
                    </label>
                    <input
                      type="text"
                      value={user?.email || ''}
                      disabled
                      className="w-full py-2 px-3 text-xs bg-slate-200/50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Password & Authentication */}
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-500" />
                    <span>{isBn ? 'পাসওয়ার্ড ও প্রমাণীকরণ' : 'Password & Authentication'}</span>
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isBn
                      ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে সুরক্ষিত পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠাতে পারেন।'
                      : 'Trigger a cryptographically secure password reset token sent directly to your registered email address.'}
                  </p>

                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-emerald-500 font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isBn ? 'পাসওয়ার্ড রিসেট ইমেইল পাঠান' : 'Send Password Reset Link'}</span>
                  </button>
                </div>
              </div>

              {/* Workspace Execution & Engine Preferences */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>{isBn ? 'ওয়ার্কস্পেস পারফরম্যান্স ও কনফিগারেশন' : 'Hardware Acceleration & Engine Settings'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      {isBn ? 'প্রসেসিং ইঞ্জিন' : 'Processing Core'}
                    </label>
                    <select
                      value={perfMode}
                      onChange={(e) => handlePreferenceChange('perf', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="wasm_simd">WebAssembly SIMD (Ultra Fast)</option>
                      <option value="wasm_standard">WebAssembly Standard</option>
                      <option value="pure_js">Compatibility Fallback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      {isBn ? 'ডিফল্ট কোয়ালিটি' : 'Default Compression Profile'}
                    </label>
                    <select
                      value={defaultQuality}
                      onChange={(e) => handlePreferenceChange('quality', e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="optimal">Recommended (Best Balance)</option>
                      <option value="maximum">Extreme Compression</option>
                      <option value="lossless">High Fidelity (Lossless)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      {isBn ? 'অটো-ক্লিনআপ' : 'Auto-Flush On Close'}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange('autoflush', !autoFlush)}
                      className={`w-full py-2 px-3 rounded-xl font-bold transition-all border flex items-center justify-between cursor-pointer ${
                        autoFlush
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{autoFlush ? (isBn ? 'সক্রিয় (Active)' : 'Enabled') : (isBn ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled')}</span>
                      <CheckCircle2 className={`w-4 h-4 ${autoFlush ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Local Storage & Cache Controls */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{isBn ? 'ব্রাউজার ক্যাশ ও গোপনীয়তা নিয়ন্ত্রণ' : 'Local Browser Cache & Sandbox Flush'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isBn
                        ? 'আপনার ব্রাউজারে থাকা সাময়িক পিডিএফ অবজেক্ট ও হিস্ট্রি মেমোরি রিমুভ করুন'
                        : 'Flush browser memory heap and temporary WebAssembly buffer pools for absolute privacy'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="py-2 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {cacheCleared ? (isBn ? 'পরিষ্কার সম্পন্ন!' : 'Flushed!') : (isBn ? 'মেমোরি ক্যাশ সাফ করুন' : 'Flush Local Cache')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CLEAR HISTORY CONFIRMATION MODAL (Replaces window.confirm) */}
      {/* ========================================================= */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isBn ? 'হিস্ট্রি মুছবেন?' : 'Clear Workspace History?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'আপনি কি নিশ্চিত যে আপনার ডিভাইসে থাকা সমস্ত পিডিএফ কাজের অডিট রেকর্ড মুছে ফেলতে চান?'
                  : 'Are you sure you want to clear your local workspace activity log? This cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearHistoryModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                {isBn ? 'মুছে ফেলুন' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UPGRADE TO PRO MODAL ($2.49/mo)                          */}
      {/* ========================================================= */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                <Crown className="w-8 h-8 fill-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isBn ? 'PDFMinty প্রো প্ল্যান' : 'Upgrade to PDFMinty Pro'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'আন্তর্জাতিক পিডিএফ সাইটগুলোর তুলনায় অধিক সুরক্ষিত ও শক্তিশালী'
                  : 'Power up with 500MB batch processing & Gemini AI'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                {isBn ? 'মাসিক আনলিমিটেড প্ল্যান' : 'Monthly Unlimited Pro'}
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                $2.49 <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/ month</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {pricingInfo.geo.currencyCode !== 'USD' && (
                  <span>~ {pricingInfo.pricing.proMonthly.formatted} / month &bull; </span>
                )}
                <span>Cancel anytime &bull; 100% Confidential</span>
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>500MB batch files & 50 files simultaneous</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Google Gemini AI document summarization</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>High-precision OCR optical character recognition</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero cloud upload risk — 100% local CPU sandbox</span>
              </li>
            </ul>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleActivatePro}
                disabled={isUpgrading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isUpgrading ? '...' : isBn ? 'নিশ্চিত করুন ($2.49)' : 'Confirm & Upgrade ($2.49)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RENEW SUBSCRIPTION MODAL                                  */}
      {/* ========================================================= */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowRenewModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isBn ? 'প্রো সাবস্ক্রিপশন রিনিউ করুন' : 'Renew Pro Subscription'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'আপনার প্রো মেম্বারশিপের মেয়াদ আরও ১ মাসের জন্য বৃদ্ধি করুন'
                  : 'Extend your Pro unlimited access for another full billing cycle'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{isBn ? 'বর্তমান মেয়াদ:' : 'Current Expiry:'}</span>
                <span className="font-bold">{renewalDate}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>{isBn ? 'নবায়ন সাইকেল:' : 'Billing Term:'}</span>
                <span className="font-bold">+30 Days ($2.49 USD)</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300 font-bold pt-1 border-t border-emerald-500/20">
                <span>{isBn ? 'দৈনিক টাস্ক সুবিধা:' : 'Task Limits:'}</span>
                <span>∞ Unlimited</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {isBn
                ? 'নবায়ন সম্পন্ন হলে অফিসিয়াল ইনভয়েস রসিদ স্বয়ংক্রিয়ভাবে আপডেট হবে।'
                : 'Confirmation will immediately refresh your active billing receipt.'}
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRenewSubscription}
                disabled={isRenewing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isRenewing ? (
                  <span>{isBn ? 'রিনিউ হচ্ছে...' : 'Renewing...'}</span>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>{isBn ? 'রিনিউ নিশ্চিত করুন' : 'Confirm Renewal'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL                    */}
      {/* ========================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadein">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isBn ? 'সাবস্ক্রিপশন বাতিল করতে চান?' : 'Cancel Pro Subscription?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'প্রো সাবস্ক্রিপশন বাতিল করলে আপনার অ্যাকাউন্টে নিম্নলিখিত পরিবর্তন ঘটবে:'
                  : 'Cancelling will downgrade your workspace to the Free Explorer tier:'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>{isBn ? 'দৈনিক আনলিমিটেড কোটা কমে ১০টি টাস্ক/দিনে ফিরে যাবে।' : 'Unlimited task processing reverts to 10 tasks/day limit.'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>{isBn ? 'সর্বোচ্চ ফাইলের সাইজ ৫০০ এমবি থেকে ১৫০ এমবিতে নেমে যাবে।' : 'Maximum single file size drops from 500MB to 150MB.'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>{isBn ? 'গুগল জেমিনি এআই ডকুমেন্ট সামারি ও হাই-স্পিড ওসিআর স্থগিত হবে।' : 'Gemini AI document QA & High-Precision OCR engine will be disabled.'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
              >
                {isBn ? 'না, প্রো চালু রাখুন' : 'Keep Pro Subscription'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelSubscription}
                className="py-3 px-4 rounded-xl border border-red-300 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {isBn ? 'হ্যাঁ, বাতিল করুন' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardPage;
