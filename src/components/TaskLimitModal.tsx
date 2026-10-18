import {
  X,
  Sparkles,
  Zap,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';
import { type UserTier } from '../utils/usageLimit';

export interface TaskLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'task_limit' | 'file_size';
  tier: UserTier;
  attemptedFileSizeMB?: number;
}

export const TaskLimitModal: React.FC<TaskLimitModalProps> = ({
  isOpen,
  onClose,
  reason,
  tier,
  attemptedFileSizeMB,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { upgradeToPro } = useAuth();

  const { modalRef, onKeyDown } = useModal(isOpen, onClose);

  if (!isOpen) return null;

  const isGuest = tier === 'guest';

  const handleSignIn = () => {
    onClose();
    navigate(ROUTES.SIGN_IN);
  };

  const handleUpgradePro = async () => {
    onClose();
    try {
      await upgradeToPro();
    } catch {
      navigate(ROUTES.PRICING);
    }
  };

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit_modal_title"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadein outline-none"
      id="task_limit_modal"
    >
      {/* Click outside backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent border-0"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-gradient-to-br from-emerald-500/15 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              reason === 'file_size'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {reason === 'file_size' ? (
              <HardDrive className="w-6 h-6" />
            ) : (
              <Zap className="w-6 h-6 fill-current" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              <span>
                {reason === 'file_size'
                  ? t('usageLimits.modal.badgeSize', { defaultValue: 'File Size Limit' })
                  : t('usageLimits.modal.badgeTask', { defaultValue: 'Daily Task Limit' })}
              </span>
            </div>

            <h3
              id="limit_modal_title"
              className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {reason === 'file_size'
                ? t('usageLimits.modal.sizeTitle', { defaultValue: 'File Size Limit Exceeded' })
                : isGuest
                  ? t('usageLimits.modal.taskTitleGuest', { defaultValue: 'Daily 5 Guest Tasks Completed!' })
                  : t('usageLimits.modal.taskTitleFree', { defaultValue: 'Daily 10 Free Tasks Completed!' })}
            </h3>
          </div>
        </div>

        {/* Explanatory Message */}
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          {reason === 'file_size' ? (
            <p>
              {isGuest
                ? t('usageLimits.modal.sizeDescGuest', {
                    size: attemptedFileSizeMB || 'large',
                    defaultValue: `Your file is ${attemptedFileSizeMB ? `${attemptedFileSizeMB} MB` : 'larger than allowed'}. Guests can upload up to 100 MB. Sign in for free to get 150 MB, or upgrade to Pro for 500 MB!`,
                  })
                : t('usageLimits.modal.sizeDescFree', {
                    size: attemptedFileSizeMB || 'large',
                    defaultValue: `Your file is ${attemptedFileSizeMB ? `${attemptedFileSizeMB} MB` : 'larger than allowed'}. Free accounts support up to 150 MB. Upgrade to Pro to process files up to 500 MB!`,
                  })}
            </p>
          ) : (
            <p>
              {isGuest
                ? t('usageLimits.modal.taskDescGuest', {
                    defaultValue:
                      'You have used all 5 free daily tasks available for guests. Create a free account or sign in to get 10 daily tasks & 150 MB uploads, or upgrade to Pro for unlimited daily access!',
                  })
                : t('usageLimits.modal.taskDescFree', {
                    defaultValue:
                      'You have completed all 10 free tasks for today. Upgrade to PDFMinty Pro to unlock unlimited daily tasks and 500 MB large batch processing.',
                  })}
            </p>
          )}
        </div>

        {/* 3-Tier Comparison Cards - Numbers always in English digits */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* Guest */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              tier === 'guest'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 opacity-75'
            }`}
          >
            <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
              {t('usageLimits.modal.colGuest', { defaultValue: 'Guest' })}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              100 MB
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {t('usageLimits.modal.colGuestTasks', { defaultValue: '5 tasks / day' })}
            </div>
          </div>

          {/* Free Account */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              tier === 'free'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
            }`}
          >
            <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
              {t('usageLimits.modal.colFree', { defaultValue: 'Free Login' })}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              150 MB
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {t('usageLimits.modal.colFreeTasks', { defaultValue: '10 tasks / day' })}
            </div>
          </div>

          {/* Pro Account */}
          <div className="p-3 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-500/15 relative overflow-hidden">
            <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
              <span>{t('usageLimits.modal.colPro', { defaultValue: 'Pro' })}</span>
              <Sparkles className="w-2.5 h-2.5 fill-current" />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              500 MB
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-black">
              {t('usageLimits.modal.colProTasks', { defaultValue: 'Unlimited' })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {isGuest ? (
            <>
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                id="limit_modal_signin_btn"
              >
                <span>
                  {t('usageLimits.modal.btnSignInGuest', {
                    defaultValue: 'Sign In Free (Get 10 Tasks & 150 MB)',
                  })}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleUpgradePro}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                id="limit_modal_pro_btn"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>
                  {t('usageLimits.modal.btnUpgradeGuest', {
                    defaultValue: 'Upgrade to Pro (BDT 299.99/month • 500 MB)',
                  })}
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleUpgradePro}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                id="limit_modal_upgrade_btn"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {t('usageLimits.modal.btnUpgradeFree', {
                    defaultValue: 'Upgrade to Pro (BDT 299.99/month • 500 MB)',
                  })}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('usageLimits.modal.btnLater', { defaultValue: 'Maybe Later' })}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
