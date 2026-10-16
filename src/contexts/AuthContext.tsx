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

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro';
  emailVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isFirebaseConfigured();

  // Sync Firebase Auth state or local session
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
          const savedPlan = (localStorage.getItem(`pdfminty_plan_${fbUser.uid}`) as 'free' | 'pro') || 'free';
          const currentUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photoURL: fbUser.photoURL,
            plan: savedPlan,
            emailVerified: fbUser.emailVerified,
          };
          setUser(currentUser);

          // Synchronize profile to Firestore
          syncUserProfileToFirestore(currentUser);

          // Listen for real-time Firestore profile changes (e.g. cloud plan upgrade)
          unsubscribeFirestore = subscribeToUserProfile(fbUser.uid, (firestoreProfile) => {
            if (firestoreProfile.plan) {
              try {
                localStorage.setItem(`pdfminty_plan_${fbUser.uid}`, firestoreProfile.plan);
              } catch {
                // Ignore storage error
              }
              setUser((prev) => (prev ? { ...prev, plan: firestoreProfile.plan } : null));
            }
          });
        } else {
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
      // Offline / Developer preview fallback so user can inspect features before pasting Firebase keys
      try {
        const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }
      } catch {
        // Ignore local storage errors
      }
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
            emailVerified: result.user.emailVerified,
          });
        } else {
          // Simulated demo mode when keys are not yet pasted
          const demoUser: AppUser = {
            uid: 'demo_' + Date.now(),
            email,
            displayName: email.split('@')[0],
            photoURL: null,
            plan: 'free',
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
          // Automatically dispatch verification email via Firebase Auth
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
            emailVerified: result.user.emailVerified,
          });
        } else {
          const demoUser: AppUser = {
            uid: 'demo_' + Date.now(),
            email,
            displayName: name || email.split('@')[0],
            photoURL: null,
            plan: 'free',
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
        // Authenticate with real Firebase Google Auth popup.
        // If domain is unauthorized or popup is closed, throw real error so UI guides the user properly.
        // Never auto-sign-in a fake user!
        const result = await signInWithPopup(auth, googleProvider);
        setFirebaseUser(result.user);
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Google User',
          photoURL: result.user.photoURL,
          plan: 'free',
          emailVerified: result.user.emailVerified,
        });
      } else {
        throw new Error('AUTH_NOT_CONFIGURED');
      }
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const signInAsDemo = useCallback((customEmail?: string) => {
    const demoEmail = customEmail || 'demo.user@pdfminty.com';
    const demoUser: AppUser = {
      uid: 'demo_' + Date.now(),
      email: demoEmail,
      displayName: demoEmail.split('@')[0],
      photoURL: null,
      plan: 'free',
      emailVerified: true,
    };
    try {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    } catch {
      // Ignore storage errors
    }
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

    // Extract oobCode if the user pasted the entire verification link from the email
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

  const updatePlan = useCallback(
    (newPlan: 'free' | 'pro') => {
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, plan: newPlan };
        if (isConfigured && auth?.currentUser) {
          localStorage.setItem(`pdfminty_plan_${auth.currentUser.uid}`, newPlan);
        } else {
          localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [isConfigured]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
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
  loading: false,
  isConfigured: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
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
