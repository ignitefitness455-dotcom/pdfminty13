import type { AppUser } from '../contexts/AuthContext';
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from '../lib/firebase';

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro';
  emailVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Synchronizes user profile to Firestore `users/{userId}` document.
 * Safe to call on sign-in and sign-up; merges existing fields to preserve custom claims.
 */
export async function syncUserProfileToFirestore(user: AppUser): Promise<void> {
  if (!db || !user?.uid) {
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);

    if (!existingSnap.exists()) {
      // First-time profile creation
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        plan: user.plan || 'free',
        emailVerified: Boolean(user.emailVerified),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Existing user: update metadata while preserving verified plan
      const existingData = existingSnap.data() as FirestoreUserProfile;
      await updateDoc(userRef, {
        displayName: user.displayName || existingData.displayName,
        photoURL: user.photoURL || existingData.photoURL,
        emailVerified: Boolean(user.emailVerified),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Log warning without blocking user session if Firestore rules or offline
    console.warn('[Firestore] Profile synchronization note:', err);
  }
}

/**
 * Fetches user profile data from Firestore.
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<FirestoreUserProfile | null> {
  if (!db || !uid) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }
  } catch (err) {
    console.warn('[Firestore] Failed to fetch user profile:', err);
  }
  return null;
}

/**
 * Subscribes to real-time changes on the user's Firestore document.
 * Returns unsubscribe function.
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: FirestoreUserProfile) => void
): () => void {
  if (!db || !uid) {
    return () => {};
  }

  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as FirestoreUserProfile);
        }
      },
      (err) => {
        console.warn('[Firestore] Profile listener note:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Could not attach user snapshot listener:', err);
    return () => {};
  }
}

/**
 * Increments or records monthly usage quota under `users/{uid}/usage/{period}`
 */
export async function recordUserUsage(
  uid: string,
  usageDelta: { aiAnalyses?: number; ocrPages?: number; heavyOps?: number }
): Promise<void> {
  if (!db || !uid) return;

  try {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = doc(db, 'users', uid, 'usage', period);
    const snap = await getDoc(usageRef);

    if (!snap.exists()) {
      await setDoc(usageRef, {
        period,
        aiAnalysesUsed: usageDelta.aiAnalyses || 0,
        ocrPagesProcessed: usageDelta.ocrPages || 0,
        heavyOperationsCount: usageDelta.heavyOps || 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snap.data();
      await updateDoc(usageRef, {
        aiAnalysesUsed: (data.aiAnalysesUsed || 0) + (usageDelta.aiAnalyses || 0),
        ocrPagesProcessed: (data.ocrPagesProcessed || 0) + (usageDelta.ocrPages || 0),
        heavyOperationsCount: (data.heavyOperationsCount || 0) + (usageDelta.heavyOps || 0),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[Firestore] Quota recording note:', err);
  }
}
