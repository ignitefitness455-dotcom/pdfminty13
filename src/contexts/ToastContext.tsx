import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { logger } from '../utils/logger';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Stable fallback so consumers outside the provider don't get a new object
// every render (which would break referential equality in useEffect deps).
const FALLBACK: ToastContextValue = {
  showToast: (message, type = 'info') => {
    logger.info(`[toast:${type}] ${message}`);
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    // Clear any in-flight timer so a newer toast isn't cut off by an older one.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const id = crypto.randomUUID();
    setToast({ id, message, type });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timerRef.current = null;
    }, 3000);
  }, []);

  // Cleanup timer on unmount.
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? FALLBACK;
}
