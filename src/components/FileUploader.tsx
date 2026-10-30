import { Upload, File, AlertCircle, ShieldCheck, Crown, Zap, Sparkles } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { extractFileProcessingContext } from '../error-handler';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  maxSizeMB?: number;
  icon?: React.ComponentType<{ className?: string }>;
  id?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = '.pdf,application/pdf',
  multiple = false,
  title,
  subtitle,
  maxSizeMB = 100,
  icon: IconComponent = Upload,
  id,
}) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const {
    tier,
    tasksRemaining,
    isLimitReached,
    openLimitModal,
  } = useUsageLimit();

  const isPro = tier === 'pro';
  // Guest: 100MB (or custom tool limit), Logged-in Free: 150MB, Pro: 500MB
  const effectiveMaxMB = isPro
    ? Math.max(maxSizeMB, 500)
    : user || tier === 'free'
      ? Math.max(maxSizeMB, 150)
      : maxSizeMB;
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayTitle =
    title || t('fileUploader.dragDrop', { defaultValue: 'Drag and drop your files here' });
  const displaySubtitle =
    subtitle || t('fileUploader.orBrowse', { defaultValue: 'or click to browse from your device' });

  const processFiles = useCallback(
    async (filesList: FileList | null) => {
      if (!filesList || filesList.length === 0) return;
      setError(null);

      // Check daily task quota
      if (isLimitReached) {
        openLimitModal({ reason: 'task_limit' });
        setError(
          tier === 'guest'
            ? t('usageLimits.uploader.guestDailyLimitReached', {
                defaultValue:
                  'Daily guest task limit reached (5/5). Sign in for 10 tasks & 150MB, or upgrade to Pro for unlimited.',
              })
            : t('usageLimits.uploader.freeDailyLimitReached', {
                defaultValue:
                  'Daily free task limit reached (10/10). Upgrade to Pro for unlimited tasks.',
              })
        );
        return;
      }

      const validFiles: File[] = [];
      const expectedTypes = accept.split(',').map((t) => t.trim());
      const limitBytes = effectiveMaxMB * 1024 * 1024;

      const rejectedFiles: { name: string; reason: string }[] = [];

      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];

        // 1. Validate file format (extension + MIME type)
        const matchesType = expectedTypes.some((type) => {
          if (type === 'application/pdf' || type === '.pdf') {
            return (
              file.type === 'application/pdf' ||
              file.type === 'application/x-pdf' ||
              file.type === 'application/acrobat' ||
              file.name.toLowerCase().endsWith('.pdf')
            );
          }
          if (type === 'image/png') {
            return file.type === 'image/png' || /\.png$/i.test(file.name);
          }
          if (type === 'image/jpeg' || type === 'image/jpg') {
            return file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name);
          }
          if (type === 'image/webp') {
            return file.type === 'image/webp' || /\.webp$/i.test(file.name);
          }
          if (type === 'image/gif') {
            return file.type === 'image/gif' || /\.gif$/i.test(file.name);
          }
          if (type === 'image/bmp') {
            return file.type === 'image/bmp' || /\.bmp$/i.test(file.name);
          }
          if (type === 'image/avif') {
            return file.type === 'image/avif' || /\.avif$/i.test(file.name);
          }
          if (type === 'image/heic') {
            return file.type === 'image/heic' || /\.heic$/i.test(file.name);
          }
          if (type === 'image/heif') {
            return file.type === 'image/heif' || /\.heif$/i.test(file.name);
          }
          // Generic image/* fallback — accept any image type.
          if (type === 'image/*' || type === 'image/') {
            return file.type.startsWith('image/');
          }
          return true;
        });

        if (!matchesType) {
          rejectedFiles.push({
            name: file.name,
            reason: `Unsupported file format. Expected: ${accept}`,
          });
          continue;
        }

        // 1b. Reject empty 0-byte files immediately
        if (file.size === 0) {
          rejectedFiles.push({
            name: file.name,
            reason: t('fileUploader.emptyFile', {
              defaultValue: 'file is empty (0 bytes)',
            }),
          });
          continue;
        }

        // 2. Validate maximum file size limit
        if (file.size > limitBytes) {
          const sizeMB = Number((file.size / 1024 / 1024).toFixed(1));
          let tierReason = `too large (${sizeMB} MB, max ${effectiveMaxMB} MB)`;
          if (tier === 'guest') {
            tierReason = t('usageLimits.uploader.guestFileTooLarge', {
              size: sizeMB,
              defaultValue: `too large (${sizeMB} MB exceeds 100 MB guest limit. Log in for 150 MB!)`,
            });
          } else if (tier === 'free') {
            tierReason = t('usageLimits.uploader.freeFileTooLarge', {
              size: sizeMB,
              defaultValue: `too large (${sizeMB} MB exceeds 150 MB free limit. Upgrade to Pro for 500 MB!)`,
            });
          }

          rejectedFiles.push({
            name: file.name,
            reason: tierReason,
          });
          openLimitModal({ reason: 'file_size', attemptedFileSizeMB: sizeMB });
          continue;
        }

        // 3. For PDFs only, validate magic bytes (%PDF header).
        const isPdfExpected = expectedTypes.some((t) => t.includes('pdf') || t === '.pdf');
        if (
          isPdfExpected &&
          (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) &&
          file.size >= 4
        ) {
          try {
            const slice = file.slice(0, 100);
            const buf = new Uint8Array(await slice.arrayBuffer());
            let isPdfHeader = false;
            for (let j = 0; j <= buf.length - 4; j++) {
              if (
                buf[j] === 0x25 &&
                buf[j + 1] === 0x50 &&
                buf[j + 2] === 0x44 &&
                buf[j + 3] === 0x46
              ) {
                isPdfHeader = true;
                break;
              }
            }
            if (!isPdfHeader && buf.length >= 4) {
              rejectedFiles.push({
                name: file.name,
                reason: 'file does not have a valid PDF header (%PDF)',
              });
              continue;
            }
          } catch {
            // If we can't read the slice, let downstream handler process it.
          }
        }

        validFiles.push(file);
      }

      if (rejectedFiles.length > 0) {
        if (rejectedFiles.length === 1) {
          setError(`"${rejectedFiles[0].name}" rejected: ${rejectedFiles[0].reason}.`);
        } else {
          const first = rejectedFiles[0];
          setError(
            `${rejectedFiles.length} files rejected. First: "${first.name}" (${first.reason}).`
          );
        }
      }

      if (validFiles.length > 0) {
        // Register the primary file context for debugging any subsequent operation errors
        extractFileProcessingContext(validFiles[0]).catch(() => {});
        if (!multiple) {
          onFilesSelected([validFiles[0]]);
        } else {
          onFilesSelected(validFiles);
        }
      }
    },
    [
      accept,
      effectiveMaxMB,
      isLimitReached,
      multiple,
      onFilesSelected,
      openLimitModal,
      t,
      tier,
    ]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      await processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      await processFiles(e.target.files);
      // Reset value so selecting the same file again (e.g. retry after error)
      // still fires onChange.
      e.target.value = '';
    },
    [processFiles]
  );

  const triggerInputClick = useCallback(() => {
    if (isLimitReached) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }
    fileInputRef.current?.click();
  }, [isLimitReached, openLimitModal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter and Space both activate the file picker, matching native button behavior.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerInputClick();
      }
    },
    [triggerInputClick]
  );

  const supportedFormatLabel = accept.toLowerCase().includes('pdf')
    ? 'PDF'
    : 'JPG, PNG, WebP, HEIC';

  return (
    <div className="w-full flex flex-col space-y-3" id={id || 'file_uploader_wrapper'}>
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {t('fileUploader.clientSide', { defaultValue: '🔒 Client-Side In-Browser Processing' })}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
          {t('fileUploader.localMemory', { defaultValue: 'Local Browser Memory Only' })}
        </span>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${displayTitle}. ${displaySubtitle}. ${t('fileUploader.browseAria', { defaultValue: 'Press Enter or Space to browse.' })}`}
        aria-disabled={false}
        id="uploader_dropzone"
        className={`relative w-full border-2 border-dashed rounded-2xl py-8 sm:py-10 px-4 sm:px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-inner'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          className="sr-only"
          id={id ? `${id}_input` : 'uploader_hidden_input'}
          aria-label={t('fileUploader.inputAria', { defaultValue: 'File input' })}
        />

        <div
          className={`p-3.5 rounded-full mb-3 transition-transform duration-200 ${
            isDragActive
              ? 'bg-emerald-100 text-emerald-600 scale-110'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105'
          }`}
          aria-hidden="true"
        >
          <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base md:text-lg mb-1">
          {displayTitle}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4">
          {displaySubtitle}
        </p>

        {/* Explicit Touch Target Button for Mobile & First-Time Users (>= 44px height) */}
        <span
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 mb-4 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors select-none"
          data-testid="uploader-browse-cta"
        >
          <File className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {multiple
              ? t('fileUploader.selectFilesBtn', { defaultValue: 'Choose Files from Device' })
              : t('fileUploader.selectFileBtn', { defaultValue: 'Choose File from Device' })}
          </span>
        </span>

        <div className="flex items-center gap-2 justify-center flex-wrap pt-1">
          <span className="inline-flex py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            {t('fileUploader.supportedFormats', {
              formats: supportedFormatLabel,
              defaultValue: `Format: ${supportedFormatLabel}`,
            })}
          </span>
          <span className="inline-flex py-1 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium tabular-nums group-hover:border-emerald-200 group-hover:text-emerald-700">
            {t('usageLimits.uploader.maxSize', {
              size: effectiveMaxMB,
              defaultValue: `Max file size: ${effectiveMaxMB}MB`,
            })}
          </span>

          {tier === 'guest' && (
            <>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                <span>
                  {t('usageLimits.uploader.guestTasks', {
                    count: tasksRemaining,
                    defaultValue: `5 Daily Tasks (${tasksRemaining} left)`,
                  })}
                </span>
              </span>
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  openLimitModal({ reason: 'task_limit' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    openLimitModal({ reason: 'task_limit' });
                  }
                }}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {t('usageLimits.uploader.guestPrompt', {
                  defaultValue: 'Log in for 150MB & 10 tasks →',
                })}
              </span>
            </>
          )}

          {tier === 'free' && (
            <>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>
                  {t('usageLimits.uploader.freeTasks', {
                    count: tasksRemaining,
                    defaultValue: `10 Daily Tasks (${tasksRemaining} left)`,
                  })}
                </span>
              </span>
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  openLimitModal({ reason: 'task_limit' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    openLimitModal({ reason: 'task_limit' });
                  }
                }}
                className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {t('usageLimits.uploader.freePrompt', {
                    defaultValue: 'Pro: 500MB & Unlimited →',
                  })}
                </span>
              </span>
            </>
          )}

          {isPro && (
            <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 font-black">
              <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>
                {t('usageLimits.uploader.proTasks', {
                  defaultValue: 'PRO • 500MB • Unlimited Tasks',
                })}
              </span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          className="flex items-center space-x-2 p-3.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-800 text-xs font-semibold shadow-sm"
          id="uploader_error"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
