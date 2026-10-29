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
