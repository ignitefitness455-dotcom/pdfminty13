import { useState, useEffect, useCallback } from 'react';

export const HERO_3D_STORAGE_KEY = 'pdfminty-3d';
const LEGACY_3D_STORAGE_KEY = 'pdfminty_3d_enabled';
export const HERO_3D_CHANGE_EVENT = 'pdfminty-3d-change';
const DESKTOP_INTERACTION_TIMEOUT_MS = 3000;

interface NetworkInformationLike {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export function checkCss3DSupported(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (typeof window.CSS !== 'undefined' && typeof window.CSS.supports === 'function') {
      return (
        window.CSS.supports('transform', 'perspective(1px) rotate3d(1, 0, 0, 1deg)') ||
        window.CSS.supports('transform', 'translate3d(0px, 0px, 0px)')
      );
    }
    return true;
  } catch {
    return true;
  }
}

export function detectIsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hasFineHover =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
        : false;
    return hasFineHover && window.innerWidth >= 1024;
  } catch {
    return false;
  }
}

/**
 * Detects whether the device signals low memory (< 4GB RAM), limited touch/coarse pointer
 * capabilities, reduced motion, or data-saver mode, requiring Performance Mode to disable
 * expensive 3D transformations.
 */
export function detectPerformanceMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
      }
      if (
        window.matchMedia('(hover: none)').matches ||
        window.matchMedia('(pointer: coarse)').matches
      ) {
        return true;
      }
    }

    if (typeof navigator !== 'undefined') {
      const nav = navigator as NavigatorWithConnection;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (conn?.saveData === true) return true;

      if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory < 4) {
        return true;
      }

      const hasFinePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 0 && !hasFinePointer) {
        return true;
      }
    }
  } catch {
    // Ignore environment detection errors
  }
  return false;
}

export function shouldDefaultDisableForMotionOrData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return true;

    if (typeof navigator !== 'undefined') {
      const nav = navigator as NavigatorWithConnection;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (conn?.saveData === true) return true;
      if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory < 4) {
        return true;
      }
    }
  } catch {
    // Ignore environment detection errors
  }
  return false;
}

export function readStored3DPreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HERO_3D_STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;

    const legacy = window.localStorage.getItem(LEGACY_3D_STORAGE_KEY);
    if (legacy === 'true') return true;
    if (legacy === 'false') return false;
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function writeStored3DPreference(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HERO_3D_STORAGE_KEY, value ? 'true' : 'false');
    window.localStorage.setItem(LEGACY_3D_STORAGE_KEY, value ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent<{ enabled: boolean }>(HERO_3D_CHANGE_EVENT, {
        detail: { enabled: value },
      })
    );
  } catch {
    // Ignore storage access errors
  }
}

export interface UseHero3DReturn {
  enabled: boolean;
  toggle: () => void;
  isDesktop: boolean;
  supported: boolean;
  isPerformanceMode: boolean;
  shouldRender3D: boolean;
  isLoading3D: boolean;
  autoDisabledNotice: boolean;
  setEnabled: (next: boolean) => void;
  handleLowFps: () => void;
  handleSceneMounted: () => void;
}

export function useHero3D(): UseHero3DReturn {
  const [supported] = useState<boolean>(() => checkCss3DSupported());
  const [isDesktop, setIsDesktop] = useState<boolean>(() => detectIsDesktop());
  const [hardwarePerfMode, setHardwarePerfMode] = useState<boolean>(() => detectPerformanceMode());

  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (!checkCss3DSupported()) return false;
    const saved = readStored3DPreference();
    if (saved !== null) {
      return saved;
    }
    if (shouldDefaultDisableForMotionOrData() || detectPerformanceMode()) {
      return false;
    }
    return detectIsDesktop();
  });

  // Tracks whether the lazy 3D chunk is allowed to be fetched/mounted.
  // Desktop (enabled): waits for first user interaction (scroll, pointermove, keydown) or 3000ms.
  // Mobile/Tablet: never downloads until the user explicitly taps the toggle button.
  const [chunkReady, setChunkReady] = useState<boolean>(() => {
    return readStored3DPreference() === true;
  });
  const [sceneMounted, setSceneMounted] = useState<boolean>(false);
  const [autoDisabledNotice, setAutoDisabledNotice] = useState<boolean>(false);

  // Sync isDesktop and hardwarePerfMode on viewport resize
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => {
      setIsDesktop(detectIsDesktop());
      setHardwarePerfMode(detectPerformanceMode());
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Sync across components (Footer, Dashboard, Scroll3DControlBar, HomePage) when preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePreferenceEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      const next =
        typeof customEvent.detail?.enabled === 'boolean'
          ? customEvent.detail.enabled
          : readStored3DPreference();
      if (typeof next === 'boolean') {
        setAutoDisabledNotice(false);
        setEnabledState(next);
        if (next) {
          setChunkReady(true);
        } else {
          setSceneMounted(false);
        }
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === HERO_3D_STORAGE_KEY || event.key === LEGACY_3D_STORAGE_KEY) {
        const next = readStored3DPreference();
        if (typeof next === 'boolean') {
          setEnabledState(next);
          if (next) {
            setChunkReady(true);
          } else {
            setSceneMounted(false);
          }
        }
      }
    };

    window.addEventListener(HERO_3D_CHANGE_EVENT, handlePreferenceEvent);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener(HERO_3D_CHANGE_EVENT, handlePreferenceEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Desktop interaction / 3000ms deferred loader (never during initial page load)
  useEffect(() => {
    if (typeof window === 'undefined' || !supported || !enabled) {
      return undefined;
    }

    // If the chunk is already ready, nothing to wait for
    if (chunkReady) {
      return undefined;
    }

    // Mobile/tablet rule: do NOT download the 3D chunk until the user taps the toggle button
    if (!isDesktop) {
      return undefined;
    }

    let triggered = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener('scroll', onFirstInteraction);
      window.removeEventListener('pointermove', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    function onFirstInteraction() {
      if (triggered) return;
      triggered = true;
      cleanup();
      setChunkReady(true);
    }

    const listenerOpts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener('scroll', onFirstInteraction, listenerOpts);
    window.addEventListener('pointermove', onFirstInteraction, listenerOpts);
    window.addEventListener('keydown', onFirstInteraction, listenerOpts);
    timerId = setTimeout(onFirstInteraction, DESKTOP_INTERACTION_TIMEOUT_MS);

    return cleanup;
  }, [supported, enabled, isDesktop, chunkReady]);

  const setEnabled = useCallback(
    (next: boolean) => {
      if (!supported) return;
      setAutoDisabledNotice(false);
      setEnabledState(next);
      writeStored3DPreference(next);
      if (next) {
        setChunkReady(true);
      } else {
        setSceneMounted(false);
      }
    },
    [supported]
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    setAutoDisabledNotice(false);
    setEnabledState((prev) => {
      const next = !prev;
      writeStored3DPreference(next);
      if (next) {
        setChunkReady(true);
      } else {
        setSceneMounted(false);
      }
      return next;
    });
  }, [supported]);

  const handleLowFps = useCallback(() => {
    setEnabledState(false);
    setSceneMounted(false);
    setAutoDisabledNotice(true);
    writeStored3DPreference(false);
  }, []);

  const handleSceneMounted = useCallback(() => {
    setSceneMounted(true);
  }, []);

  const userExplicitlyEnabled = readStored3DPreference() === true;
  const isPerformanceMode = !supported || !enabled || (hardwarePerfMode && !userExplicitlyEnabled);
  const shouldRender3D = supported && enabled && chunkReady && !isPerformanceMode;
  const isLoading3D = shouldRender3D && !sceneMounted;

  return {
    enabled: supported && enabled,
    toggle,
    isDesktop,
    supported,
    isPerformanceMode,
    shouldRender3D,
    isLoading3D,
    autoDisabledNotice,
    setEnabled,
    handleLowFps,
    handleSceneMounted,
  };
}
