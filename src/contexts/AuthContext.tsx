import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { isFirebaseConfigured } from '../lib/firebaseConfig';
import { setSyncedProStatus, setSyncedAuthUid } from '../utils/usageLimit';

export const LEMON_SQUEEZY_CHECKOUT_URL =
  'https://pdfminty.lemonsqueezy.com/checkout/buy/6cc92d05-f59d-4a1b-9d04-abcb89f50da6';

export function buildLemonSqueezyCheckoutUrl(uid: string, email?: string | null): string {
  const url = new URL(LEMON_SQUEEZY_CHECKOUT_URL);
  url.searchParams.set('checkout[custom][uid]', uid);
  url.searchParams.set('checkout[email]', email || '');
  return url.toString();
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro';
  isPro?: boolean;
  emailVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  isPro: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  signInAsDemo: (customEmail?: string) => void;
  sendVerificationEmail: () => Promise<void>;
  verifyEmailWithCode: (code: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePlan: (plan: 'free' | 'pro') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'pdfminty_demo_user';
const HAS_AUTH_SESSION_KEY = 'pdfminty_has_auth_session';

const loadFirebaseSdk = () => import('../lib/firebase');
const loadUserService = () => import('../services/userService');

function hasLikelyActiveAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(HAS_AUTH_SESSION_KEY) === '1') return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('firebase:authUser:')) return true;
    }
    const path = window.location.pathname || '';
    if (
      path.includes('/login') ||
      path.includes('/signup') ||
      path.includes('/dashboard') ||
      path.includes('/pricing')
    ) {
      return true;
    }
  } catch {
    // Ignore storage access errors
  }
  return false;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => hasLikelyActiveAuthSession());
  const isConfigured = isFirebaseConfigured();

  // Sync Firebase Auth state and real-time Firestore `users/{uid}` listener
  useEffect(() => {
    if (!isConfigured) {
      try {
        const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppUser;
          setUser({ ...parsed, plan: 'free', isPro: false });
        }
      } catch {
        // Ignore local storage errors
      }
      setIsPro(false);
      setSyncedProStatus(false);
      setSyncedAuthUid(null);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeFirestore: (() => void) | undefined;
    let idleTimerId: number | undefined;

    const initFirebaseAuth = async () => {
      try {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (!isMounted || !auth) {
          if (isMounted) setLoading(false);
          return;
        }

        unsubscribeAuth = fb.onAuthStateChanged(auth, async (fbUser) => {
          if (!isMounted) return;
          if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = undefined;
          }

          setFirebaseUser(fbUser);
          if (fbUser) {
            try {
              localStorage.setItem(HAS_AUTH_SESSION_KEY, '1');
            } catch {
              // Ignore
            }
            const currentUser: AppUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              photoURL: fbUser.photoURL,
              plan: 'free',
              isPro: false,
              emailVerified: fbUser.emailVerified,
            };
            setUser(currentUser);
            setIsPro(false);
            setSyncedAuthUid(fbUser.uid);
            setSyncedProStatus(false);
            setLoading(false);

            const userSvc = await loadUserService();
            if (!isMounted) return;
            void userSvc.syncUserProfileToFirestore(currentUser);
            unsubscribeFirestore = userSvc.subscribeToUserProfile(fbUser.uid, (firestoreProfile) => {
              if (!isMounted) return;
              const proActive = firestoreProfile.isPro === true;
              setIsPro(proActive);
              setSyncedProStatus(proActive);
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      isPro: proActive,
                      plan: proActive ? 'pro' : 'free',
                    }
                  : null
              );
            });
          } else {
            try {
              localStorage.removeItem(HAS_AUTH_SESSION_KEY);
            } catch {
              // Ignore
            }
            setIsPro(false);
            setSyncedAuthUid(null);
            setSyncedProStatus(false);
            setUser(null);
            setLoading(false);
          }
        });
      } catch {
        if (isMounted) setLoading(false);
      }
    };

    if (hasLikelyActiveAuthSession()) {
      void initFirebaseAuth();
    } else if (typeof window !== 'undefined') {
      // Guest user with no stored auth session: defer 685KB Firebase SDK load until browser is idle
      const win = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof win.requestIdleCallback === 'function') {
        const idleId = win.requestIdleCallback(() => void initFirebaseAuth(), { timeout: 3500 });
        return () => {
          isMounted = false;
          win.cancelIdleCallback?.(idleId);
          unsubscribeAuth?.();
          unsubscribeFirestore?.();
        };
      } else {
        idleTimerId = window.setTimeout(() => void initFirebaseAuth(), 2500);
      }
    }

    return () => {
      isMounted = false;
      if (idleTimerId !== undefined) window.clearTimeout(idleTimerId);
      unsubscribeAuth?.();
      unsubscribeFirestore?.();
    };
  }, [isConfigured]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        if (isConfigured) {
          const fb = await loadFirebaseSdk();
          const auth = fb.auth;
          if (auth) {
            const result = await fb.signInWithEmailAndPassword(auth, email, password);
            setFirebaseUser(result.user);
            setSyncedAuthUid(result.user.uid);
            setUser({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName || email.split('@')[0],
              photoURL: result.user.photoURL,
              plan: 'free',
              isPro: false,
              emailVerified: result.user.emailVerified,
            });
            return;
          }
        }
        const demoUser: AppUser = {
          uid: 'demo_' + Date.now(),
          email,
          displayName: email.split('@')[0],
          photoURL: null,
          plan: 'free',
          isPro: false,
          emailVerified: true,
        };
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
      } finally {
        setLoading(false);
      }
    },
    [isConfigured]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const { isDisposableEmail } = await import('../utils/disposableEmailBlocker');
      if (isDisposableEmail(email)) {
        throw new Error('DISPOSABLE_EMAIL_NOT_ALLOWED');
      }
      setLoading(true);
      try {
        if (isConfigured) {
          const fb = await loadFirebaseSdk();
          const auth = fb.auth;
          if (auth) {
            const result = await fb.createUserWithEmailAndPassword(auth, email, password);
            if (name && result.user) {
              await fb.updateProfile(result.user, { displayName: name });
            }
            try {
              await fb.sendEmailVerification(result.user);
            } catch (verErr) {
              console.warn('[Firebase Auth] Verification email dispatch note:', verErr);
            }
            setFirebaseUser(result.user);
            setSyncedAuthUid(result.user.uid);
            setUser({
              uid: result.user.uid,
              email: result.user.email,
              displayName: name || result.user.displayName || email.split('@')[0],
              photoURL: result.user.photoURL,
              plan: 'free',
              isPro: false,
              emailVerified: result.user.emailVerified,
            });
            return;
          }
        }
        const demoUser: AppUser = {
          uid: 'demo_' + Date.now(),
          email,
          displayName: name || email.split('@')[0],
          photoURL: null,
          plan: 'free',
          isPro: false,
          emailVerified: false,
        };
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
      } finally {
        setLoading(false);
      }
    },
    [isConfigured]
  );

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (auth) {
          const result = await fb.signInWithPopup(auth, fb.googleProvider);
          setFirebaseUser(result.user);
          setSyncedAuthUid(result.user.uid);
          setUser((prev) => ({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Google User',
            photoURL: result.user.photoURL,
            plan: prev?.uid === result.user.uid && prev.isPro ? 'pro' : 'free',
            isPro: prev?.uid === result.user.uid ? Boolean(prev.isPro) : false,
            emailVerified: result.user.emailVerified,
          }));
          return;
        }
      }
      throw new Error('AUTH_NOT_CONFIGURED');
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const upgradeToPro = useCallback(async () => {
    if (firebaseUser?.uid) {
      const checkoutUrl = buildLemonSqueezyCheckoutUrl(
        firebaseUser.uid,
        firebaseUser.email || user?.email
      );
      window.location.assign(checkoutUrl);
      return;
    }

    if (user?.uid && !user.uid.startsWith('demo_')) {
      const checkoutUrl = buildLemonSqueezyCheckoutUrl(user.uid, user.email);
      window.location.assign(checkoutUrl);
      return;
    }

    if (isConfigured) {
      setLoading(true);
      try {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (auth?.currentUser?.uid) {
          const checkoutUrl = buildLemonSqueezyCheckoutUrl(
            auth.currentUser.uid,
            auth.currentUser.email || user?.email
          );
          window.location.assign(checkoutUrl);
          return;
        }
        if (auth) {
          const result = await fb.signInWithPopup(auth, fb.googleProvider);
          setFirebaseUser(result.user);
          setSyncedAuthUid(result.user.uid);
          setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Google User',
            photoURL: result.user.photoURL,
            plan: 'free',
            isPro: false,
            emailVerified: result.user.emailVerified,
          });
          const checkoutUrl = buildLemonSqueezyCheckoutUrl(result.user.uid, result.user.email);
          window.location.assign(checkoutUrl);
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    throw new Error('AUTH_NOT_CONFIGURED');
  }, [firebaseUser, user, isConfigured]);

  const signInAsDemo = useCallback((customEmail?: string) => {
    const demoEmail = customEmail || 'demo.user@pdfminty.com';
    const demoUser: AppUser = {
      uid: 'demo_' + Date.now(),
      email: demoEmail,
      displayName: demoEmail.split('@')[0],
      photoURL: null,
      plan: 'free',
      isPro: false,
      emailVerified: true,
    };
    try {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    } catch {
      // Ignore storage errors
    }
    setIsPro(false);
    setSyncedProStatus(false);
    setUser(demoUser);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (isConfigured) {
      const fb = await loadFirebaseSdk();
      const auth = fb.auth;
      if (auth?.currentUser) {
        await fb.sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('NO_CURRENT_USER');
      }
    }
  }, [isConfigured]);

  const verifyEmailWithCode = useCallback(async (code: string) => {
    const fb = await loadFirebaseSdk();
    const auth = fb.auth;
    if (!auth) throw new Error('AUTH_UNAVAILABLE');
    const trimmed = code.trim();
    if (!trimmed) throw new Error('EMPTY_CODE');

    let actionCode = trimmed;
    if (trimmed.includes('oobCode=')) {
      try {
        const dummyUrl = trimmed.startsWith('http') ? trimmed : `https://example.com?${trimmed}`;
        const parsed = new URL(dummyUrl);
        const extracted = parsed.searchParams.get('oobCode');
        if (extracted) {
          actionCode = extracted;
        }
      } catch {
        // Fall back to trimmed string
      }
    }

    await fb.applyActionCode(auth, actionCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updated = auth.currentUser;
      setFirebaseUser(updated);
      setUser((prev) => (prev ? { ...prev, emailVerified: updated.emailVerified } : null));
    }
  }, []);

  const reloadUser = useCallback(async () => {
    if (isConfigured) {
      const fb = await loadFirebaseSdk();
      const auth = fb.auth;
      if (auth?.currentUser) {
        await auth.currentUser.reload();
        const updated = auth.currentUser;
        setFirebaseUser(updated);
        setUser((prev) => (prev ? { ...prev, emailVerified: updated.emailVerified } : null));
      }
    }
  }, [isConfigured]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured) {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (auth) {
          await fb.signOut(auth);
        }
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      localStorage.removeItem(HAS_AUTH_SESSION_KEY);
      setFirebaseUser(null);
      setIsPro(false);
      setSyncedAuthUid(null);
      setSyncedProStatus(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (isConfigured) {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (auth) {
          await fb.sendPasswordResetEmail(auth, email);
          return;
        }
      }
      console.log('[Auth] Password reset requested for demo:', email);
    },
    [isConfigured]
  );

  const updateDisplayName = useCallback(
    async (newName: string) => {
      const cleanName = newName.trim();
      if (!cleanName) return;

      if (isConfigured) {
        const fb = await loadFirebaseSdk();
        const auth = fb.auth;
        if (auth?.currentUser) {
          await fb.updateProfile(auth.currentUser, { displayName: cleanName });
        }
      }

      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, displayName: cleanName };
        if (!isConfigured) {
          localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [isConfigured]
  );

  // Client never writes `isPro` — only the Cloudflare Worker webhook writes `isPro` to Firestore.
  const updatePlan = useCallback((_newPlan: 'free' | 'pro') => {
    // Intentionally a no-op on the client to enforce server-authoritative `isPro`
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isPro,
        loading,
        isConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        upgradeToPro,
        signInAsDemo,
        sendVerificationEmail,
        verifyEmailWithCode,
        reloadUser,
        logout,
        resetPassword,
        updateDisplayName,
        updatePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  firebaseUser: null,
  isPro: false,
  loading: false,
  isConfigured: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  upgradeToPro: async () => {},
  signInAsDemo: () => {},
  sendVerificationEmail: async () => {},
  verifyEmailWithCode: async () => {},
  reloadUser: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateDisplayName: async () => {},
  updatePlan: () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};

export const usePro = () => {
  const { isPro, upgradeToPro, loading } = useAuth();
  return { isPro, upgradeToPro, loading };
};
