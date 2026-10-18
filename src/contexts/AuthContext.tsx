import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  onAuthStateChanged,
  isFirebaseConfigured,
  type User,
} from '../lib/firebase';
import { syncUserProfileToFirestore, subscribeToUserProfile } from '../services/userService';
import { isDisposableEmail } from '../utils/disposableEmailBlocker';
import { setSyncedProStatus } from '../utils/usageLimit';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isFirebaseConfigured();

  // Sync Firebase Auth state and real-time Firestore `users/{uid}` listener
  useEffect(() => {
    if (isConfigured && auth) {
      let unsubscribeFirestore: (() => void) | undefined;

      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = undefined;
        }

        setFirebaseUser(fbUser);
        if (fbUser) {
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
          setSyncedProStatus(false);

          // Synchronize profile metadata to Firestore (never writes isPro)
          syncUserProfileToFirestore(currentUser);

          // Subscribe in real time with Firestore onSnapshot to document `users/{uid}`
          unsubscribeFirestore = subscribeToUserProfile(fbUser.uid, (firestoreProfile) => {
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
          setIsPro(false);
          setSyncedProStatus(false);
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        unsubscribe();
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }
      };
    } else {
      // Offline / Developer preview fallback
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
      setLoading(false);
      return undefined;
    }
  }, [isConfigured]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        if (isConfigured && auth) {
          const result = await signInWithEmailAndPassword(auth, email, password);
          setFirebaseUser(result.user);
          setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || email.split('@')[0],
            photoURL: result.user.photoURL,
            plan: 'free',
            isPro: false,
            emailVerified: result.user.emailVerified,
          });
        } else {
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
        }
      } finally {
        setLoading(false);
      }
    },
    [isConfigured]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      if (isDisposableEmail(email)) {
        throw new Error('DISPOSABLE_EMAIL_NOT_ALLOWED');
      }
      setLoading(true);
      try {
        if (isConfigured && auth) {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          if (name && result.user) {
            await updateProfile(result.user, { displayName: name });
          }
          try {
            await sendEmailVerification(result.user);
          } catch (verErr) {
            console.warn('[Firebase Auth] Verification email dispatch note:', verErr);
          }
          setFirebaseUser(result.user);
          setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: name || result.user.displayName || email.split('@')[0],
            photoURL: result.user.photoURL,
            plan: 'free',
            isPro: false,
            emailVerified: result.user.emailVerified,
          });
        } else {
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
        }
      } finally {
        setLoading(false);
      }
    },
    [isConfigured]
  );

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured && auth) {
        const result = await signInWithPopup(auth, googleProvider);
        setFirebaseUser(result.user);
        setUser((prev) => ({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Google User',
          photoURL: result.user.photoURL,
          plan: prev?.uid === result.user.uid && prev.isPro ? 'pro' : 'free',
          isPro: prev?.uid === result.user.uid ? Boolean(prev.isPro) : false,
          emailVerified: result.user.emailVerified,
        }));
      } else {
        throw new Error('AUTH_NOT_CONFIGURED');
      }
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  /**
   * Prompts Google sign-in first if the user is not signed in.
   * Once signed in, redirects to the Lemon Squeezy Pro checkout URL with
   * `checkout[custom][uid]=<firebase uid>` and `checkout[email]=<user email>`.
   */
  const upgradeToPro = useCallback(async () => {
    const activeFbUser = auth?.currentUser || firebaseUser;
    if (activeFbUser?.uid) {
      const checkoutUrl = buildLemonSqueezyCheckoutUrl(
        activeFbUser.uid,
        activeFbUser.email || user?.email
      );
      window.location.assign(checkoutUrl);
      return;
    }

    if (user?.uid && !user.uid.startsWith('demo_')) {
      const checkoutUrl = buildLemonSqueezyCheckoutUrl(user.uid, user.email);
      window.location.assign(checkoutUrl);
      return;
    }

    // Not signed in: prompt Google sign-in first, then redirect to Lemon Squeezy checkout
    if (isConfigured && auth) {
      setLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        setFirebaseUser(result.user);
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
      } finally {
        setLoading(false);
      }
    } else {
      throw new Error('AUTH_NOT_CONFIGURED');
    }
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
    if (isConfigured && auth) {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('NO_CURRENT_USER');
      }
    }
  }, [isConfigured]);

  const verifyEmailWithCode = useCallback(async (code: string) => {
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

    await applyActionCode(auth, actionCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updated = auth.currentUser;
      setFirebaseUser(updated);
      setUser((prev) => (prev ? { ...prev, emailVerified: updated.emailVerified } : null));
    }
  }, []);

  const reloadUser = useCallback(async () => {
    if (isConfigured && auth?.currentUser) {
      await auth.currentUser.reload();
      const updated = auth.currentUser;
      setFirebaseUser(updated);
      setUser((prev) => (prev ? { ...prev, emailVerified: updated.emailVerified } : null));
    }
  }, [isConfigured]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured && auth) {
        await signOut(auth);
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setFirebaseUser(null);
      setIsPro(false);
      setSyncedProStatus(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (isConfigured && auth) {
        await sendPasswordResetEmail(auth, email);
      } else {
        console.log('[Auth] Password reset requested for demo:', email);
      }
    },
    [isConfigured]
  );

  const updateDisplayName = useCallback(
    async (newName: string) => {
      const cleanName = newName.trim();
      if (!cleanName) return;

      if (isConfigured && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: cleanName });
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
