import i18next from 'i18next';
import { ShieldAlert, RefreshCw, FileText } from 'lucide-react';
import React, { Component, ErrorInfo } from 'react';

import { reportErrorToTelemetry, getFileProcessingContext, FileProcessingContext } from '../error-handler';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  capturedContext: FileProcessingContext | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    capturedContext: null,
  };

  public static getDerivedStateFromError(error: unknown): Partial<State> {
    if (error && typeof (error as Record<string, unknown>).then === 'function') {
      throw error;
    }
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      capturedContext: getFileProcessingContext(),
    };
  }

  public componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps>) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null, capturedContext: null });
    }
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (error && typeof (error as Record<string, unknown>).then === 'function') {
      return;
    }
    const currentContext = getFileProcessingContext();
    this.setState({ errorInfo, capturedContext: currentContext });
    console.error('[ErrorBoundary caught error]', error, errorInfo, currentContext ? { fileContext: currentContext } : '');
    if (import.meta.env.PROD) {
      const err = error as { message?: string; stack?: string } | null;
      reportErrorToTelemetry(err?.message || String(error), errorInfo?.componentStack || err?.stack || '', currentContext);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || this.state.error?.toString() || 'Unknown runtime error';
      const errorStack = this.state.error?.stack || '';
      const fileCtx = this.state.capturedContext || getFileProcessingContext();
      return (
        <div
          className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none"
          id="error-boundary-container"
        >
          <div
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-6"
            id="error-boundary-icon-wrapper"
          >
            <ShieldAlert className="w-12 h-12 stroke-[1.5]" id="error-boundary-icon" />
          </div>
          <h1
            className="text-2xl font-bold font-sans text-on-surface mb-2"
            id="error-boundary-title"
          >
            {i18next.t('errorBoundary.somethingWentWrong', { defaultValue: 'Something went wrong' })}
          </h1>
          <p
            className="text-sm text-on-surface-variant max-w-sm mb-4 leading-relaxed"
            id="error-boundary-desc"
          >
            {i18next.t('errorBoundary.unexpected', { defaultValue: 'An unexpected error occurred in the view interface.' })}
          </p>

          {fileCtx && (fileCtx.fileName || fileCtx.fileSizeFormatted) && (
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-2xl w-full text-left mb-4 shadow-sm text-xs space-y-2 select-text">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Captured File Context for Debugging</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">File:</span> {fileCtx.fileName || 'N/A'}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Size:</span> {fileCtx.fileSizeFormatted || (fileCtx.fileSize ? `${fileCtx.fileSize} B` : 'N/A')}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">PDF Version:</span> {fileCtx.pdfVersion ? `v${fileCtx.pdfVersion}` : 'Unknown'}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Encrypted:</span> {fileCtx.isEncrypted ? 'Yes (Password Protected)' : 'No'}</div>
                {fileCtx.pageCount !== undefined && <div><span className="font-semibold text-slate-700 dark:text-slate-300">Pages:</span> {fileCtx.pageCount}</div>}
                {fileCtx.processingStep && <div className="col-span-2"><span className="font-semibold text-slate-700 dark:text-slate-300">Step:</span> {fileCtx.processingStep}</div>}
              </div>
            </div>
          )}

          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 max-w-2xl w-full text-left mb-6 overflow-x-auto text-xs font-mono text-red-700 dark:text-red-300 select-text shadow-sm">
            <p className="font-bold mb-1 break-all">Error: {errorMessage}</p>
            {errorStack && (
              <pre className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap opacity-80 border-t border-red-200 dark:border-red-800/40 pt-2">
                {errorStack}
              </pre>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="error-boundary-reload-btn"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-[#00FFC2] hover:bg-[#00e6af] text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 duration-100 cursor-pointer text-xs uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4" />
              {i18next.t('errorBoundary.reload', { defaultValue: 'Reload Application' })}
            </button>
            <a
              href="/blog/"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Knowledge Hub
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-on-surface font-bold px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Home Page
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
