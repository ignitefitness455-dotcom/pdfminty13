import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const getStoredConfig = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('pdfminty_custom_firebase_config');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const storedConfig = getStoredConfig();

/**
 * Firebase Client Configuration
 * Keys are loaded from client environment variables (VITE_FIREBASE_*)
 * or from user-entered custom project configuration.
 */
export const firebaseConfig = {
  apiKey:
    storedConfig.apiKey ||
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAeen88J5o3lrb8iQMNfOvRXGf3NTwVvuY',
  authDomain:
    storedConfig.authDomain ||
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'pdfminty-9836d.firebaseapp.com',
  projectId:
    storedConfig.projectId ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    'pdfminty-9836d',
  storageBucket:
    storedConfig.storageBucket ||
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'pdfminty-9836d.firebasestorage.app',
  messagingSenderId:
    storedConfig.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '177568247368',
  appId:
    storedConfig.appId ||
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:177568247368:web:e29df8db090f8d650bf27d',
};

/**
 * Checks whether real Firebase keys have been configured
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey.length > 5 &&
      firebaseConfig.projectId &&
      !firebaseConfig.apiKey.includes('your_') &&
      !firebaseConfig.projectId.includes('your_')
  );
};

export const saveCustomFirebaseConfig = (config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pdfminty_custom_firebase_config', JSON.stringify(config));
  window.location.reload();
};

export const clearCustomFirebaseConfig = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pdfminty_custom_firebase_config');
  window.location.reload();
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined') {
  try {
    if (isFirebaseConfigured()) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('[Firebase] Initialization deferred or failed:', err);
  }
}

export {
  app,
  auth,
  db,
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
  type User,
  type Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
};
