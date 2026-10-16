import { WifiOff, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation('common');
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowReconnected(false);
    } else if (hasBeenOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setHasBeenOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, hasBeenOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {!isOnline ? (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-emerald-500/30 shadow-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>{t('pwa.offlineActive', { defaultValue: 'Offline Mode Active' })}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                100% Ready
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {t('pwa.offlineNotice', {
                defaultValue:
                  'All core PDF tools process locally in your device RAM without internet.',
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/90 text-emerald-200 border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t('pwa.reconnected', { defaultValue: 'Back online. All services synced.' })}</span>
        </div>
      )}
    </div>
  );
};
