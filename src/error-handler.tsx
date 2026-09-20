import { ShieldAlert, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import React, { Component, ErrorInfo, createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { addRecordedError } from './utils/errorStore';
import { logger } from './utils/logger';

/**
 * Scrub common PII patterns from a string before logging or telemetry.
 *
 * Covered:
 * - Email addresses
 * - IPv4 addresses
 * - IPv6 addresses (compressed and full forms)
 * - JWT tokens (eyJ... header.payload.signature)
 * - Bearer tokens in Authorization-style strings
 * - Generic API key patterns (key=..., token=...)
 * - Unix/macOS home folder paths (/Users/foo, /home/foo)
 * - Windows user profile paths (C:\Users\foo)
 * - US phone numbers (XXX-XXX-XXXX, (XXX) XXX-XXXX, XXX.XXX.XXXX)
 * - Credit-card-shaped digit sequences (groups of 4 digits, 13-19 total)
 *
 * Best-effort, not a security boundary. Never log raw user-controlled input.
 */
export function scrubPII(input: string): string {
  if (!input) return '';

  const patterns: Array<[RegExp, string]> = [
    // JWT (must come before generic bearer to be more specific).
    [/\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '[REDACTED_JWT]'],
    // Authorization: Bearer ...
    [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED_TOKEN]'],
    // Use capturing group (not non-capturing) so $1 refers to the key name.
    [/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|token)\s*[:=]\s*[^\s&]+/gi, '$1=[REDACTED]'],
    // Email.
    [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]'],
    // IPv4.
    [/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[REDACTED_IP]'],
    // IPv6 (full and compressed).
    [/\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g, '[REDACTED_IP]'],
    [/\b(?:[A-Fa-f0-9]{1,4}:){1,7}:\b/g, '[REDACTED_IP]'],
    [/\b::(?:[A-Fa-f0-9]{1,4}:){0,6}[A-Fa-f0-9]{1,4}\b/g, '[REDACTED_IP]'],
    // US phone numbers.
    [/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]'],
    // Credit-card-shaped (groups of 4 digits, 13-19 total).
    [/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED_CC]'],
    // Unix/macOS home folders.
    [/(\/(?:Users|home)\/)[a-zA-Z0-9._-]+/g, '$1[REDACTED_USER]'],
    // Windows user profile paths.
    [/([a-zA-Z]:\\Users\\)[a-zA-Z0-9._-]+/g, '$1[REDACTED_USER]'],
  ];

  let result = input;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement as string);
  }
  return result;
}

/**
 * File processing context interface to provide granular metadata
 * when a user experiences an error during PDF or file transformations.
 */
export interface FileProcessingContext {
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  pdfVersion?: string;
  isEncrypted?: boolean;
  pageCount?: number;
  toolName?: string;
  processingStep?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// Global singleton state for active file processing context
let activeFileContext: FileProcessingContext | null = null;

/**
 * Set or replace the global active file processing context.
 */
export function setFileProcessingContext(ctx: Partial<FileProcessingContext> | null): FileProcessingContext | null {
  if (!ctx) {
    activeFileContext = null;
    return null;
  }
  activeFileContext = {
    timestamp: new Date().toISOString(),
    ...ctx,
  };
  return activeFileContext;
}

/**
 * Update current file processing context incrementally (e.g. adding step or page count).
 */
export function updateFileProcessingContext(ctx: Partial<FileProcessingContext>): FileProcessingContext {
  activeFileContext = {
    ...(activeFileContext || { timestamp: new Date().toISOString() }),
    ...ctx,
    timestamp: new Date().toISOString(),
  };
  return activeFileContext;
}

/**
 * Clear the current active file processing context upon successful completion or reset.
 */
export function clearFileProcessingContext(): void {
  activeFileContext = null;
}

/**
 * Retrieve the current active file processing context.
 */
export function getFileProcessingContext(): FileProcessingContext | null {
  return activeFileContext ? { ...activeFileContext } : null;
}

/**
 * Format bytes into readable human string (e.g., "2.45 MB").
 */
export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Inspect file header and extract PDF version and file context.
 * Updates global context automatically.
 */
export async function extractFileProcessingContext(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  additional?: Partial<FileProcessingContext>
): Promise<FileProcessingContext> {
  let fileName = additional?.fileName;
  let fileSize = additional?.fileSize;
  let mimeType = additional?.mimeType;
  let pdfVersion = additional?.pdfVersion;
  let isEncrypted = additional?.isEncrypted;

  if (typeof Blob !== 'undefined' && fileOrBuffer instanceof Blob) {
    fileName = fileName || ((fileOrBuffer as { name?: string }).name);
    fileSize = fileSize || fileOrBuffer.size;
    mimeType = mimeType || fileOrBuffer.type || 'application/pdf';

    try {
      // Slice first 256 bytes to inspect PDF header (%PDF-1.x / %PDF-2.0)
      const slice = fileOrBuffer.slice(0, 256);
      const buf = new Uint8Array(await slice.arrayBuffer());
      const headerStr = new TextDecoder('utf-8').decode(buf);
      const versionMatch = headerStr.match(/%PDF-(\d+\.\d+)/);
      if (versionMatch) {
        pdfVersion = versionMatch[1];
      }
    } catch {
      // Fallback if slicing fails
    }
  } else if (fileOrBuffer && (ArrayBuffer.isView(fileOrBuffer) || fileOrBuffer instanceof ArrayBuffer)) {
    const bytes = ArrayBuffer.isView(fileOrBuffer)
      ? new Uint8Array(fileOrBuffer.buffer, fileOrBuffer.byteOffset, fileOrBuffer.byteLength)
      : new Uint8Array(fileOrBuffer);
    fileSize = fileSize || bytes.byteLength;
    try {
      const headerBuf = bytes.subarray(0, Math.min(bytes.length, 256));
      const headerStr = new TextDecoder('utf-8').decode(headerBuf);
      const versionMatch = headerStr.match(/%PDF-(\d+\.\d+)/);
      if (versionMatch) {
        pdfVersion = versionMatch[1];
      }
      // Simple scan for /Encrypt dictionary keyword in trailer/body
      if (isEncrypted === undefined) {
        const fullStr = new TextDecoder('utf-8').decode(bytes.subarray(Math.max(0, bytes.length - 8192)));
        if (fullStr.includes('/Encrypt')) {
          isEncrypted = true;
        }
      }
    } catch {
      // Ignore text decoding errors on raw binary
    }
  }

  const newContext: FileProcessingContext = {
    fileName: scrubPII(fileName || 'untitled.pdf'),
    fileSize,
    fileSizeFormatted: formatBytes(fileSize),
    mimeType: mimeType || 'application/pdf',
    pdfVersion: pdfVersion || 'Unknown',
    isEncrypted,
    toolName: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additional,
    timestamp: new Date().toISOString(),
  };

  return updateFileProcessingContext(newContext);
}

/**
 * Format file context into a clean human-readable log string for debugging.
 */
export function formatFileContextForLog(ctx?: FileProcessingContext | null): string {
  const context = ctx || activeFileContext;
  if (!context) return 'No active file context logged.';
  const parts: string[] = [];
  if (context.fileName) parts.push(`File: ${context.fileName}`);
  if (context.fileSizeFormatted) parts.push(`Size: ${context.fileSizeFormatted}`);
  else if (context.fileSize !== undefined) parts.push(`Size: ${context.fileSize} B`);
  if (context.pdfVersion) parts.push(`PDF Version: v${context.pdfVersion}`);
  if (context.pageCount !== undefined) parts.push(`Pages: ${context.pageCount}`);
  if (context.isEncrypted !== undefined) parts.push(`Encrypted: ${context.isEncrypted ? 'YES' : 'NO'}`);
  if (context.toolName) parts.push(`Tool: ${context.toolName}`);
  if (context.processingStep) parts.push(`Step: ${context.processingStep}`);
  return parts.join(' | ');
}

const REPORT_TIMEOUT_MS = 5000;

/**
 * Report error with file processing context to telemetry endpoint.
 */
export function reportErrorToTelemetry(
  message: string,
  stack: string,
  extraContext?: Partial<FileProcessingContext> | null
): void {
  const cleanMessage = scrubPII(message);
  const cleanStack = scrubPII(stack);
  const fileContext = extraContext !== undefined ? extraContext : getFileProcessingContext();

  logger.error(`[GlobalError] ${cleanMessage}`, {
    fileContext: fileContext ? formatFileContextForLog(fileContext) : null,
  });

  // Sanitize fileContext to completely strip raw fileName and sensitive fields before telemetry transmission
  const anonymizedContext = fileContext
    ? {
        fileSizeCategory: formatBytes(fileContext.fileSize),
        pdfVersion: fileContext.pdfVersion || 'Unknown',
        isEncrypted: !!fileContext.isEncrypted,
        pageCount: fileContext.pageCount,
        processingStep: fileContext.processingStep || 'processing',
        toolName: fileContext.toolName,
      }
    : null;

  // Persistently record error locally as well
  addRecordedError(cleanMessage, cleanStack, anonymizedContext);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);

  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: cleanMessage,
      stack: cleanStack,
      fileContext: anonymizedContext,
      fileContextLog: formatFileContextForLog(fileContext),
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    }),
    signal: controller.signal,
    keepalive: true,
  })
    .catch((err) => {
      logger.debug('Error telemetry failed:', err);
    })
    .finally(() => clearTimeout(timer));
}

/**
 * Install global error and unhandled-rejection listeners that attach active file context.
 * Returns a cleanup function so callers can remove duplicate listeners.
 */
export function setupErrorTelemetry(): () => void {
  const onError = (event: ErrorEvent) => {
    if (!event.message) return;
    const msg = event.message.toLowerCase();
    if (
      msg.includes('resizeobserver') ||
      msg.includes('script error') ||
      msg.includes('non-error promise rejection')
    ) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
      return;
    }
    const fileContext = getFileProcessingContext();
    if (fileContext) {
      console.error(`[Error with File Context] ${formatFileContextForLog(fileContext)}`);
    }
    reportErrorToTelemetry(event.message, event.error?.stack || '', fileContext);
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const msgLower = message.toLowerCase();
    if (
      msgLower.includes('resizeobserver') ||
      msgLower.includes('script error') ||
      msgLower.includes('abort') ||
      msgLower.includes('canceled')
    ) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
      return;
    }
    const stack = reason instanceof Error ? reason.stack || '' : '';
    const fileContext = getFileProcessingContext();
    if (fileContext) {
      console.error(`[Unhandled Rejection with File Context] ${formatFileContextForLog(fileContext)}`);
    }
    reportErrorToTelemetry(`Unhandled promise rejection: ${message}`, stack, fileContext);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    }
  };
}

// React Context for File Processing Context
interface FileProcessingContextValue {
  context: FileProcessingContext | null;
  setContext: (ctx: Partial<FileProcessingContext> | null) => void;
  updateContext: (ctx: Partial<FileProcessingContext>) => void;
  clearContext: () => void;
  logError: (err: unknown, step?: string) => void;
}

const FileProcessingContextStore = createContext<FileProcessingContextValue>({
  context: null,
  setContext: () => {},
  updateContext: () => {},
  clearContext: () => {},
  logError: () => {},
});

export const useFileProcessingContext = () => useContext(FileProcessingContextStore);

export const FileProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [context, setContextState] = useState<FileProcessingContext | null>(() => getFileProcessingContext());

  const setContext = useCallback((ctx: Partial<FileProcessingContext> | null) => {
    const updated = setFileProcessingContext(ctx);
    setContextState(updated);
  }, []);

  const updateContext = useCallback((ctx: Partial<FileProcessingContext>) => {
    const updated = updateFileProcessingContext(ctx);
    setContextState({ ...updated });
  }, []);

  const clearContext = useCallback(() => {
    clearFileProcessingContext();
    setContextState(null);
  }, []);

  const logError = useCallback((err: unknown, step?: string) => {
    if (step) updateFileProcessingContext({ processingStep: step });
    const current = getFileProcessingContext();
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack || '' : '';
    reportErrorToTelemetry(msg, stack, current);
  }, []);

  return (
    <FileProcessingContextStore.Provider value={{ context, setContext, updateContext, clearContext, logError }}>
      {children}
    </FileProcessingContextStore.Provider>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  capturedContext: FileProcessingContext | null;
}

/**
 * FileProcessingErrorBoundary: React Error Boundary that captures and logs
 * detailed file processing context (PDF version, file size, operation step)
 * whenever a child component crashes during rendering.
 */
export class FileProcessingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    capturedContext: null,
  };

  public static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    if (error && typeof (error as Record<string, unknown>).then === 'function') {
      throw error;
    }
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      capturedContext: getFileProcessingContext(),
    };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (error && typeof (error as Record<string, unknown>).then === 'function') {
      return;
    }
    const currentContext = getFileProcessingContext();
    this.setState({ errorInfo, capturedContext: currentContext });

    console.error('[FileProcessingErrorBoundary caught error]', error, errorInfo);
    if (currentContext) {
      console.error('[Captured File Context]', formatFileContextForLog(currentContext));
    }

    const err = error as { message?: string; stack?: string } | null;
    reportErrorToTelemetry(
      err?.message || String(error),
      errorInfo?.componentStack || err?.stack || '',
      currentContext
    );
  }

  private handleReload = () => {
    clearFileProcessingContext();
    this.setState({ hasError: false, error: null, errorInfo: null, capturedContext: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown runtime error occurred during file operation.';
      const errorStack = this.state.error?.stack || '';
      const fileCtx = this.state.capturedContext || getFileProcessingContext();

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-5">
            <ShieldAlert className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-bold font-sans text-on-surface mb-2">
            {this.props.fallbackTitle || 'File Processing Error'}
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while processing your document. File properties and error logs have been safely captured for debugging.
          </p>

          {fileCtx && (fileCtx.fileName || fileCtx.fileSizeFormatted) && (
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-xl w-full text-left mb-4 shadow-sm text-xs space-y-2 select-text">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Context for Debugging</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">File:</span> {fileCtx.fileName || 'N/A'}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Size:</span> {fileCtx.fileSizeFormatted || (fileCtx.fileSize ? `${fileCtx.fileSize} B` : 'N/A')}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">PDF Version:</span> {fileCtx.pdfVersion ? `v${fileCtx.pdfVersion}` : 'Unknown'}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Encrypted:</span> {fileCtx.isEncrypted ? 'Yes (Password Protected)' : 'No'}</div>
                {fileCtx.pageCount !== undefined && <div><span className="font-semibold text-slate-700 dark:text-slate-300">Pages:</span> {fileCtx.pageCount}</div>}
                {fileCtx.processingStep && <div className="col-span-2"><span className="font-semibold text-slate-700 dark:text-slate-300">Last Step:</span> {fileCtx.processingStep}</div>}
              </div>
            </div>
          )}

          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 max-w-xl w-full text-left mb-6 overflow-x-auto text-xs font-mono text-red-700 dark:text-red-300 select-text shadow-sm">
            <div className="flex items-center gap-1.5 font-bold mb-1 break-all">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Error: {errorMessage}</span>
            </div>
            {errorStack && (
              <pre className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap opacity-80 border-t border-red-200 dark:border-red-800/40 pt-2">
                {errorStack}
              </pre>
            )}
          </div>

          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 bg-[#00FFC2] hover:bg-[#00e6af] text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 duration-100 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reset & Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GlobalErrorWrapper combines FileProcessingProvider and FileProcessingErrorBoundary
 * into a single comprehensive wrapper for application routes or tools.
 */
export const GlobalErrorWrapper: React.FC<{ children: ReactNode; fallbackTitle?: string }> = ({
  children,
  fallbackTitle,
}) => (
  <FileProcessingProvider>
    <FileProcessingErrorBoundary fallbackTitle={fallbackTitle}>
      {children}
    </FileProcessingErrorBoundary>
  </FileProcessingProvider>
);
