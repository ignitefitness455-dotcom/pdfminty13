import React, { useEffect, useRef, useState } from 'react';

export const PWAController: React.FC = () => {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const userRequestedUpdateRef = useRef(false);

  useEffect(() => {
    // Don't register SW inside iframes, in non-secure contexts, or unsupported browsers.
    const isInsideIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    if (isInsideIframe || !('serviceWorker' in navigator) || !window.isSecureContext) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    // Track the latest statechange handler + worker so cleanup can remove it.
    // We lift the handler out of updateFoundHandler so the cleanup closure can access it.
    let trackedWorker: ServiceWorker | null = null;
    let trackedStateChangeHandler: (() => void) | null = null;

    const updateFoundHandler = () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      // If a previous worker was tracked, clean up its listener first.
      if (trackedWorker && trackedStateChangeHandler) {
        trackedWorker.removeEventListener('statechange', trackedStateChangeHandler);
      }

      trackedWorker = newWorker;

      const stateChangeHandler = () => {
        // Only show update toast if there's an existing controller (i.e., this is an UPDATE,
        // not a first-time install). First-time installs should NOT prompt reload.
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setShowUpdateToast(true);
        }
      };
      trackedStateChangeHandler = stateChangeHandler;
      newWorker.addEventListener('statechange', stateChangeHandler);
    };

    const hadController = Boolean(navigator.serviceWorker.controller);

    const controllerChangeHandler = () => {
      // If a previous Service Worker was controlling the page and a new one takes over,
      // reload to ensure the browser loads the newly deployed JavaScript bundle immediately.
      if (hadController || userRequestedUpdateRef.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        reg.addEventListener('updatefound', updateFoundHandler);
      })
      .catch(() => {
        // SW registration failure is non-fatal.
      });

    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

    return () => {
      if (registration) {
        registration.removeEventListener('updatefound', updateFoundHandler);
      }
      // Remove the statechange listener from the tracked worker to prevent leaks.
      if (trackedWorker && trackedStateChangeHandler) {
        trackedWorker.removeEventListener('statechange', trackedStateChangeHandler);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
    };
  }, []);

  const handleUpdate = () => {
    userRequestedUpdateRef.current = true;
    setShowUpdateToast(false);
    // Tell the waiting SW to skip waiting so it activates immediately.
    navigator.serviceWorker.getRegistration().then((reg) => {
      const waiting = reg?.waiting;
      if (waiting) {
        // Send a typed message object. sw.js checks `event.data?.type === 'SKIP_WAITING'`.
        waiting.postMessage({ type: 'SKIP_WAITING' } as { type: 'SKIP_WAITING' });
      } else {
        // No waiting worker; reload to pick up latest.
        window.location.reload();
      }
    });
  };

  if (!showUpdateToast) return null;

  return (
    <>
      {showUpdateToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-start space-x-3"
        >
          <span className="flex-1 text-sm">
            A new version is available. Update now to get the latest features.
          </span>
          <button
            type="button"
            onClick={handleUpdate}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold whitespace-nowrap"
          >
            Update Now
          </button>
          <button
            type="button"
            onClick={() => setShowUpdateToast(false)}
            aria-label="Dismiss update notification"
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

