export interface PDFActivity {
  id: string;
  toolName: string;
  toolId: string;
  fileName: string;
  fileSizeFormatted: string;
  timestamp: string;
  relativeTime: string;
  pages?: number;
  status: 'completed' | 'processing' | 'ready';
  tag: 'Merge' | 'Compress' | 'Sign' | 'OCR' | 'Security' | 'Convert' | 'Edit';
  savings?: string;
}

const STORAGE_KEY = 'pdfminty_user_activities';

// Demo activities list kept for reference or opt-in preview, never auto-injected
export const INITIAL_DEMO_ACTIVITIES: PDFActivity[] = [];

/**
 * Returns the genuine user activity log from local browser storage.
 * Defaults to an empty list `[]` for newly logged-in accounts.
 * Purges any previously auto-seeded fake demo activities.
 */
export const getActivityList = (): PDFActivity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any legacy fake demo records that were automatically injected in older builds
    const cleanList = parsed.filter(
      (item: PDFActivity) =>
        item &&
        item.id &&
        !item.id.startsWith('act-1') &&
        !item.id.startsWith('act-2') &&
        !item.id.startsWith('act-3') &&
        !item.id.startsWith('act-4') &&
        !item.id.startsWith('act-5') &&
        item.fileName !== 'Quarterly_Financial_Report_2025.pdf' &&
        item.fileName !== 'Non_Disclosure_Agreement_Signed.pdf' &&
        item.fileName !== 'Merged_Tax_Documents_Q1_Q4.pdf' &&
        item.fileName !== 'Scanned_Legal_Affidavit_Scan.pdf' &&
        item.fileName !== 'Confidential_Audit_Report.pdf'
    );

    if (cleanList.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }

    return cleanList;
  } catch {
    return [];
  }
};

/**
 * Appends a real user activity when an operation (Merge, Compress, Sign, etc.) completes.
 */
export const addActivityItem = (
  activity: Omit<PDFActivity, 'id' | 'timestamp' | 'relativeTime'>
): PDFActivity => {
  const current = getActivityList();
  const newItem: PDFActivity = {
    ...activity,
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    relativeTime: 'Just now',
  };
  const updated = [newItem, ...current].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }
  return newItem;
};

export const removeActivityItem = (id: string): PDFActivity[] => {
  const current = getActivityList();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
  return updated;
};

export const clearAllActivities = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};
