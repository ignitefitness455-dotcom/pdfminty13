export interface RecordedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  fileContext?: {
    fileSizeCategory?: string;
    pdfVersion?: string;
    isEncrypted?: boolean;
    pageCountRange?: string;
    processingStep?: string;
    toolName?: string;
    errorCategory?: string;
  } | null;
  userAgent: string;
}

const STORAGE_KEY = 'pdfminty_recorded_errors';
const MAX_ERRORS = 100;

export function getRecordedErrors(): RecordedError[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse recorded errors:', err);
    return [];
  }
}

export function addRecordedError(
  message: string,
  stack?: string,
  fileContext?: RecordedError['fileContext']
): RecordedError | null {
  if (typeof window === 'undefined') return null;

  try {
    const errors = getRecordedErrors();
    const newError: RecordedError = {
      id: crypto.randomUUID(),
      message,
      stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      fileContext: fileContext || null,
      userAgent: navigator.userAgent,
    };

    // Keep the most recent errors up to MAX_ERRORS
    const updated = [newError, ...errors].slice(0, MAX_ERRORS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newError;
  } catch (err) {
    console.error('Failed to save recorded error to local storage:', err);
    return null;
  }
}

export function clearRecordedErrors(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear recorded errors:', err);
  }
}

export function downloadErrorsAsJson(): void {
  if (typeof window === 'undefined') return;
  try {
    const errors = getRecordedErrors();
    const blob = new Blob([JSON.stringify(errors, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdfminty_error_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download error logs:', err);
  }
}
