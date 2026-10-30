export interface TierConfig {
  name: string;
  maxFileSizeMB: number;
  dailyTasks: number; // Infinity for unlimited
}

export const TIER_LIMITS = {
  guest: {
    name: 'Guest',
    maxFileSizeMB: 100,
    dailyTasks: 5,
  },
  free: {
    name: 'Free Account',
    maxFileSizeMB: 150,
    dailyTasks: 10,
  },
  pro: {
    name: 'Pro Member',
    maxFileSizeMB: 500,
    dailyTasks: Infinity,
  },
} as const;

export type UserTier = keyof typeof TIER_LIMITS;

export interface DailyUsageStorage {
  date: string; // YYYY-MM-DD
  guestCount: number;
  userCounts: Record<string, number>; // uid -> count
}

const STORAGE_KEY = 'pdfminty_daily_task_usage';
const USAGE_EVENT_NAME = 'pdfminty-usage-updated';

/**
 * Returns today's local date in YYYY-MM-DD format.
 */
export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Reads usage data from localStorage, resetting if the day has rolled over.
 */
export const getStoredUsage = (): DailyUsageStorage => {
  if (typeof window === 'undefined') {
    return { date: getTodayDateKey(), guestCount: 0, userCounts: {} };
  }

  const today = getTodayDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: DailyUsageStorage = { date: today, guestCount: 0, userCounts: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: DailyUsageStorage = JSON.parse(raw);
    if (parsed.date !== today) {
      // New day, reset counts
      const reset: DailyUsageStorage = { date: today, guestCount: 0, userCounts: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
      return reset;
    }

    if (typeof parsed.guestCount !== 'number') parsed.guestCount = 0;
    if (!parsed.userCounts || typeof parsed.userCounts !== 'object') parsed.userCounts = {};

    return parsed;
  } catch {
    return { date: today, guestCount: 0, userCounts: {} };
  }
};

let syncedProStatus = false;
let syncedAuthUid: string | null = null;

/**
 * Updates the in-memory synced Pro status from Firestore `users/{uid}` onSnapshot.
 */
export const setSyncedProStatus = (isPro: boolean): void => {
  if (syncedProStatus !== isPro) {
    syncedProStatus = isPro;
    notifyUsageChanged();
  }
};

export const setSyncedAuthUid = (uid: string | null): void => {
  if (syncedAuthUid !== uid) {
    syncedAuthUid = uid;
    notifyUsageChanged();
  }
};

/**
 * Resolves current user tier and user ID from auth and Firestore-synced `isPro` state.
 * Keep free-tier and guest behavior unchanged; `pro` tier is active only when `isPro === true`.
 */
export const resolveCurrentSession = (
  providedUser?: { uid?: string; plan?: 'free' | 'pro'; isPro?: boolean } | null
): {
  tier: UserTier;
  uid: string | null;
} => {
  if (providedUser && providedUser.uid) {
    if (providedUser.isPro === true || providedUser.plan === 'pro' || syncedProStatus) {
      return { tier: 'pro', uid: providedUser.uid };
    }
    return { tier: 'free', uid: providedUser.uid };
  }

  // Fallback to Firebase current user UID synced from AuthContext
  if (typeof window !== 'undefined' && syncedAuthUid) {
    if (syncedProStatus) {
      return { tier: 'pro', uid: syncedAuthUid };
    }
    return { tier: 'free', uid: syncedAuthUid };
  }

  // Fallback to Demo user in localStorage (always free tier, never client-writable pro)
  if (typeof window !== 'undefined') {
    try {
      const demoRaw = localStorage.getItem('pdfminty_demo_user');
      if (demoRaw) {
        const demo = JSON.parse(demoRaw);
        if (demo && demo.uid) {
          return { tier: 'free', uid: demo.uid };
        }
      }
    } catch {
      // Ignore
    }
  }

  return { tier: 'guest', uid: null };
};

export interface UsageStatus {
  tier: UserTier;
  maxFileSizeMB: number;
  dailyTasksLimit: number | 'unlimited';
  tasksUsed: number;
  tasksRemaining: number | 'unlimited';
  isLimitReached: boolean;
}

/**
 * Returns complete usage statistics for the given session.
 */
export const getUsageStatus = (
  user?: { uid?: string; plan?: 'free' | 'pro'; isPro?: boolean } | null
): UsageStatus => {
  const { tier, uid } = resolveCurrentSession(user);
  const data = getStoredUsage();
  const config = TIER_LIMITS[tier];

  if (tier === 'pro') {
    const used = uid ? (data.userCounts[uid] || 0) : 0;
    return {
      tier: 'pro',
      maxFileSizeMB: config.maxFileSizeMB, // 500 MB
      dailyTasksLimit: 'unlimited',
      tasksUsed: used,
      tasksRemaining: 'unlimited',
      isLimitReached: false,
    };
  }

  if (tier === 'free') {
    const used = uid ? (data.userCounts[uid] || 0) : 0;
    const remaining = Math.max(0, config.dailyTasks - used);
    return {
      tier: 'free',
      maxFileSizeMB: config.maxFileSizeMB, // 150 MB
      dailyTasksLimit: config.dailyTasks, // 10
      tasksUsed: used,
      tasksRemaining: remaining,
      isLimitReached: remaining <= 0,
    };
  }

  // Guest tier
  const used = data.guestCount || 0;
  const remaining = Math.max(0, config.dailyTasks - used);
  return {
    tier: 'guest',
    maxFileSizeMB: config.maxFileSizeMB, // 100 MB
    dailyTasksLimit: config.dailyTasks, // 5
    tasksUsed: used,
    tasksRemaining: remaining,
    isLimitReached: remaining <= 0,
  };
};

let lastRecordedTimestamp = 0;
let lastRecordedKey = '';

/**
 * Resets the 500ms deduplicator state (intended for deterministic unit tests).
 */
export const _resetUsageDeduplicatorForTesting = (): void => {
  lastRecordedTimestamp = 0;
  lastRecordedKey = '';
};

/**
 * Records a completed task, incrementing today's counter.
 * Includes a 500ms deduplication window to guard against duplicate events.
 */
export const recordDailyTask = (
  user?: { uid?: string; plan?: 'free' | 'pro'; isPro?: boolean } | null,
  taskIdentifier = 'task'
): { success: boolean; remaining: number | 'unlimited'; tier: UserTier } => {
  const { tier, uid } = resolveCurrentSession(user);
  const now = Date.now();
  const dedupKey = `${taskIdentifier}_${uid || 'guest'}`;

  // If duplicate call within 500ms, consider it already recorded
  if (now - lastRecordedTimestamp < 500 && lastRecordedKey === dedupKey) {
    const status = getUsageStatus(user);
    return {
      success: !status.isLimitReached,
      remaining: status.tasksRemaining,
      tier: status.tier,
    };
  }

  lastRecordedTimestamp = now;
  lastRecordedKey = dedupKey;

  const data = getStoredUsage();
  const config = TIER_LIMITS[tier];

  if (tier === 'pro') {
    if (uid) {
      data.userCounts[uid] = (data.userCounts[uid] || 0) + 1;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore quota error
      }
    }
    notifyUsageChanged();
    return { success: true, remaining: 'unlimited', tier: 'pro' };
  }

  if (tier === 'free') {
    const currentUsed = uid ? (data.userCounts[uid] || 0) : 0;
    if (currentUsed >= config.dailyTasks) {
      return { success: false, remaining: 0, tier: 'free' };
    }
    if (uid) {
      data.userCounts[uid] = currentUsed + 1;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore quota error
      }
    }
    notifyUsageChanged();
    return {
      success: true,
      remaining: Math.max(0, config.dailyTasks - (currentUsed + 1)),
      tier: 'free',
    };
  }

  // Guest tier
  const currentUsed = data.guestCount || 0;
  if (currentUsed >= config.dailyTasks) {
    return { success: false, remaining: 0, tier: 'guest' };
  }

  data.guestCount = currentUsed + 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota error
  }
  notifyUsageChanged();

  return {
    success: true,
    remaining: Math.max(0, config.dailyTasks - (currentUsed + 1)),
    tier: 'guest',
  };
};

/**
 * Fires custom event to notify all components to re-read usage status.
 */
export const notifyUsageChanged = (): void => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(USAGE_EVENT_NAME));
    } catch {
      // Ignore
    }
  }
};

/**
 * Subscribe to usage updates (storage changes or custom events).
 */
export const subscribeUsage = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(USAGE_EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(USAGE_EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
};
