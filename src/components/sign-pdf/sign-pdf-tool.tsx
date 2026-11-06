import { FileText, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getToolLimit } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useUsageLimit } from '../../contexts/UsageLimitContext';
import { PDFSanitizer } from '../../core/PDFSanitizer';
import { addActivityItem } from '../../utils/activityStore';
import { downloadBlob, sanitizeDownloadFilename } from '../../utils/download';
import { logger } from '../../utils/logger';
import { Button } from '../ui/button';

import { exportSignedPdf } from './export';
import { PdfPage } from './pdf-page';
import { loadPdfDocument, readPageInfos } from './pdfjs';
import { SignSidebar } from './sign-sidebar';
import { SignatureDialog } from './signature-dialog';
import type { FieldKind, PageInfo, PlacedField, SavedSignaturePreset, SignatureSet } from './types';
import { UploadScreen } from './upload-screen';

const EMPTY_SIGNATURES: SignatureSet = {
  fullName: '',
  initialsText: '',
  signature: null,
  initials: null,
};

const MAX_AUTO_DETECT_PAGES = 100;

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export function SignPdfTool() {
  const { t } = useTranslation('common');
  const { user, isPro: authIsPro } = useAuth();
  const { canPerformTask, openLimitModal } = useUsageLimit();
  const isPro = Boolean(
    authIsPro || user?.isPro === true || user?.plan === 'pro' || user?.plan === 'lifetime'
  );
  const isLoggedIn = Boolean(user);
  const maxSavedSignatures = isPro ? 5 : 1;
  const storageKey = `pdfminty_saved_signatures_${user?.uid || 'guest'}`;
  const currentLimits = getToolLimit('sign-pdf', isPro, isLoggedIn);
  const limitMB = currentLimits.maxSingleMB;
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedSignaturePreset[]>(() => {
    try {
      const raw = localStorage.getItem(`pdfminty_saved_signatures_${user?.uid || 'guest'}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedSignaturePreset[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [signatures, setSignatures] = useState<SignatureSet>(() => {
    try {
      const raw = localStorage.getItem(`pdfminty_saved_signatures_${user?.uid || 'guest'}`);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSignaturePreset[];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].set) {
          return parsed[0].set;
        }
      }
    } catch {
      // ignore
    }
    return EMPTY_SIGNATURES;
  });
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [pendingKind, setPendingKind] = useState<FieldKind | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateText, setDateText] = useState(() =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())
  );
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewerWidth, setViewerWidth] = useState(720);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  const openTokenRef = useRef(0);
  const isExportingRef = useRef(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync saved signature presets when auth user hydrates or switches
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setSavedPresets([]);
        return;
      }
      const parsed = JSON.parse(raw) as SavedSignaturePreset[];
      if (Array.isArray(parsed)) {
        setSavedPresets(parsed);
        if (parsed.length > 0 && parsed[0].set) {
          setSignatures((prev) => (prev.signature ? prev : parsed[0].set));
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewerWidth(Math.max(280, entry.contentRect.width - 48))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc]);

  useEffect(() => {
    return () => {
      openTokenRef.current += 1;
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
      if (docRef.current) {
        docRef.current.destroy().catch(() => {
          /* ignore */
        });
        docRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    openTokenRef.current += 1;
    isExportingRef.current = false;
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    docRef.current?.destroy().catch(() => {
      /* ignore */
    });
    docRef.current = null;
    setFile(null);
    setBytes(null);
    setDoc(null);
    setPages([]);
    setFields([]);
    setSelectedId(null);
    setPendingKind(null);
    setError(null);
    setExporting(false);
    setZoom(1);
  }, []);

  const openFile = useCallback(
    async (nextFile: File) => {
      if (!canPerformTask()) {
        openLimitModal({ reason: 'task_limit' });
        return;
      }
      if (nextFile.type !== 'application/pdf' && !nextFile.name.toLowerCase().endsWith('.pdf')) {
        setError(t('signPdf.errors.choosePdf', { defaultValue: 'Please choose a PDF file.' }));
        return;
      }
      if (nextFile.size === 0) {
        setError(
          t('signPdf.errors.emptyPdf', {
            defaultValue: 'This PDF file is empty (0 bytes). Please choose a valid PDF.',
          })
        );
        return;
      }
      if (nextFile.size > limitMB * 1024 * 1024) {
        setError(
          t('signPdf.errors.fileTooLarge', {
            limit: limitMB,
            defaultValue: `This PDF is larger than ${limitMB} MB.`,
          })
        );
        return;
      }
      setError(null);
      const token = ++openTokenRef.current;
      try {
        if (docRef.current) {
          await docRef.current.destroy().catch(() => {
            /* ignore */
          });
          docRef.current = null;
        }
        const nextBytes = await nextFile.arrayBuffer();
        if (token !== openTokenRef.current) return;

        const rawUint8 = new Uint8Array(nextBytes);
        // Validate %PDF- magic header and non-empty structural boundary using the user's tier maxBytes
        const { bytes: sanitizedUint8 } = PDFSanitizer.sanitize(rawUint8, {
          maxBytes: limitMB * 1024 * 1024,
        });
        if (await PDFSanitizer.isEncrypted(sanitizedUint8)) {
          if (token !== openTokenRef.current) return;
          setError(
            t('signPdf.errors.encryptedPdf', {
              defaultValue:
                'This PDF is password-protected or encrypted. Please use the Unlock PDF tool first.',
            })
          );
          return;
        }
        const sanitizedBuffer = sanitizedUint8.buffer.slice(
          sanitizedUint8.byteOffset,
          sanitizedUint8.byteOffset + sanitizedUint8.byteLength
        ) as ArrayBuffer;
        const nextDoc = await loadPdfDocument(sanitizedBuffer);
        if (token !== openTokenRef.current) {
          await nextDoc.destroy().catch(() => {});
          return;
        }
        const nextPages = await readPageInfos(nextDoc);
        if (token !== openTokenRef.current) {
          await nextDoc.destroy().catch(() => {});
          return;
        }
        if (nextPages.length === 0) {
          await nextDoc.destroy().catch(() => {});
          setError(
            t('signPdf.errors.emptyPdf', {
              defaultValue: 'This PDF has 0 pages. Please choose a valid PDF document.',
            })
          );
          return;
        }
        docRef.current = nextDoc;
        setFile(nextFile);
        setBytes(sanitizedBuffer);
        setDoc(nextDoc);
        setPages(nextPages);
        setFields([]);
        setSelectedId(null);
      } catch (err) {
        if (token !== openTokenRef.current) return;
        logger.error('Sign PDF load failed:', err);
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        if (msg.includes('password') || msg.includes('encrypt') || msg.includes('secured_locked')) {
          setError(
            t('signPdf.errors.encryptedPdf', {
              defaultValue:
                'This PDF is password-protected or encrypted. Please use the Unlock PDF tool first.',
            })
          );
        } else {
          setError(
            t('signPdf.errors.cannotOpen', {
              defaultValue: 'This file could not be opened. Please try another PDF.',
            })
          );
        }
      }
    },
    [canPerformTask, limitMB, openLimitModal, t]
  );

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  const addField = useCallback(
    (pageIndex: number, kind: FieldKind, nx: number, ny: number) => {
      const defaults: Record<FieldKind, { w: number; h: number }> = {
        signature: { w: 0.24, h: 0.075 },
        initials: { w: 0.12, h: 0.065 },
        name: { w: 0.25, h: 0.045 },
        date: { w: 0.2, h: 0.045 },
        text: { w: 0.28, h: 0.05 },
        checkmark: { w: 0.06, h: 0.045 },
        cross: { w: 0.06, h: 0.045 },
        stamp: { w: 0.32, h: 0.12 },
      };
      let { w, h } = defaults[kind];
      const pageInfo = pages[pageIndex];
      const asset =
        kind === 'signature'
          ? signatures.signature
          : kind === 'initials'
            ? signatures.initials
            : null;
      if (
        asset &&
        asset.width > 0 &&
        asset.height > 0 &&
        pageInfo &&
        pageInfo.width > 0 &&
        pageInfo.height > 0
      ) {
        const assetAspect = asset.width / asset.height;
        const rawH = (w * pageInfo.width) / (assetAspect * pageInfo.height);
        h = Math.min(Math.max(rawH, 0.03), 0.15);
        w = Math.min(Math.max((h * pageInfo.height * assetAspect) / pageInfo.width, 0.06), 0.45);
      }
      const field: PlacedField = {
        id: crypto.randomUUID(),
        kind,
        pageIndex,
        x: Math.min(Math.max(nx - w / 2, 0), 1 - w),
        y: Math.min(Math.max(ny - h / 2, 0), 1 - h),
        w,
        h,
        text: kind === 'text' ? '' : undefined,
      };
      setFields((current) => [...current, field]);
      setSelectedId(field.id);
      setPendingKind(null);
    },
    [pages, signatures.initials, signatures.signature]
  );

  const autoDetectFields = useCallback(async () => {
    if (!doc || !pages.length || isDetecting) return;
    const token = openTokenRef.current;
    setIsDetecting(true);
    setDetectionNotice(null);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    try {
      const detected: PlacedField[] = [];
      const pagesToScan = Math.min(pages.length, MAX_AUTO_DETECT_PAGES);

      for (let pIdx = 0; pIdx < pagesToScan; pIdx++) {
        if (token !== openTokenRef.current) return;
        const info = pages[pIdx];
        const page = await doc.getPage(pIdx + 1);
        try {
          const viewport = page.getViewport({ scale: 1 });

          // 1. Check interactive form annotations using viewport coordinate conversion
          try {
            const annotations = await page.getAnnotations();
            for (const annot of annotations) {
              if (annot.subtype === 'Widget' && annot.rect) {
                const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(annot.rect);
                const w = Math.abs(vx2 - vx1) / info.width;
                const h = Math.abs(vy2 - vy1) / info.height;
                const x = Math.min(vx1, vx2) / info.width;
                const y = Math.min(vy1, vy2) / info.height;

                let kind: FieldKind = 'text';
                if (annot.fieldType === 'Sig') kind = 'signature';
                else if (annot.fieldType === 'Btn') kind = 'checkmark';

                const clampedW = Math.max(0.04, Math.min(w, 0.4));
                const clampedH = Math.max(0.03, Math.min(h, 0.15));
                detected.push({
                  id: crypto.randomUUID(),
                  kind,
                  pageIndex: pIdx,
                  x: Math.max(0, Math.min(x, 1 - clampedW)),
                  y: Math.max(0, Math.min(y, 1 - clampedH)),
                  w: clampedW,
                  h: clampedH,
                });
              }
            }
          } catch {
            // ignore annotation check errors
          }

          // 2. Scan text content for signature & form prompt labels
          try {
            const textContent = await page.getTextContent();
            for (const item of textContent.items) {
              if (!('str' in item)) continue;
              const text = item.str.toLowerCase();
              const transform = item.transform;
              const [vx, vy] = viewport.convertToViewportPoint(transform[4], transform[5]);
              const itemW = item.width || 40;
              const itemH = item.height || 12;

              const nx = vx / info.width;
              const ny = (vy - itemH) / info.height;

              if (text.includes('signature') || text.includes('sign here')) {
                detected.push({
                  id: crypto.randomUUID(),
                  kind: 'signature',
                  pageIndex: pIdx,
                  x: Math.max(0, Math.min(nx + itemW / info.width + 0.02, 0.72)),
                  y: Math.max(0, Math.min(ny - 0.01, 1 - 0.075)),
                  w: 0.24,
                  h: 0.075,
                });
              } else if (text.includes('date:')) {
                detected.push({
                  id: crypto.randomUUID(),
                  kind: 'date',
                  pageIndex: pIdx,
                  x: Math.max(0, Math.min(nx + itemW / info.width + 0.02, 0.76)),
                  y: Math.max(0, Math.min(ny, 1 - 0.045)),
                  w: 0.2,
                  h: 0.045,
                });
              }
            }
          } catch {
            // ignore text check errors
          }
        } finally {
          page.cleanup();
        }
      }

      if (token !== openTokenRef.current) return;

      const candidates: PlacedField[] =
        detected.length > 0
          ? detected
          : [
              {
                id: crypto.randomUUID(),
                kind: 'signature',
                pageIndex: pages.length - 1,
                x: 0.55,
                y: 0.82,
                w: 0.24,
                h: 0.075,
              },
              {
                id: crypto.randomUUID(),
                kind: 'date',
                pageIndex: pages.length - 1,
                x: 0.15,
                y: 0.84,
                w: 0.2,
                h: 0.045,
              },
            ];

      let addedCount = 0;
      setFields((prev) => {
        const unique = candidates.filter(
          (cand) =>
            !prev.some(
              (existing) =>
                existing.pageIndex === cand.pageIndex &&
                existing.kind === cand.kind &&
                Math.abs(existing.x - cand.x) < 0.02 &&
                Math.abs(existing.y - cand.y) < 0.02
            )
        );
        addedCount = unique.length;
        return unique.length > 0 ? [...prev, ...unique] : prev;
      });

      if (addedCount === 0) {
        setDetectionNotice('All detected form and signature zones are already placed.');
      } else if (detected.length > 0) {
        setDetectionNotice(`Auto-detected ${addedCount} form field & signature zone(s)!`);
      } else {
        setDetectionNotice('Placed standard signature & date fields on the document.');
      }
    } finally {
      if (token === openTokenRef.current) {
        setIsDetecting(false);
        noticeTimerRef.current = setTimeout(() => setDetectionNotice(null), 5000);
      }
    }
  }, [doc, isDetecting, pages]);

  const updateField = (id: string, patch: Partial<PlacedField>) =>
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  const removeField = (id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
    setSelectedId(null);
  };

  const exportPdf = async () => {
    if (!bytes || !fields.length || exporting || isExportingRef.current) return;
    if (!canPerformTask()) {
      openLimitModal({ reason: 'task_limit' });
      return;
    }

    const needsSignature = fields.some((f) => f.kind === 'signature') && !signatures.signature;
    const needsInitials = fields.some((f) => f.kind === 'initials') && !signatures.initials;
    const needsFullName = fields.some((f) => f.kind === 'name') && !signatures.fullName.trim();
    if (needsSignature || needsInitials || needsFullName) {
      setSignatureOpen(true);
      setError(
        t('signPdf.errors.missingSignatureSetup', {
          defaultValue:
            'Please set up your signature, initials, or name details before signing and downloading.',
        })
      );
      return;
    }

    const hasRenderableField = fields.some((f) => {
      if (f.kind === 'signature') return Boolean(signatures.signature);
      if (f.kind === 'initials') return Boolean(signatures.initials);
      if (f.kind === 'name') return Boolean(signatures.fullName.trim());
      if (f.kind === 'date') return Boolean(dateText.trim());
      if (f.kind === 'text') return Boolean(f.text?.trim());
      return true; // checkmark, cross, stamp
    });
    if (!hasRenderableField) {
      setError(
        t('signPdf.errors.emptyFields', {
          defaultValue: 'Please enter text or configure your placed fields before downloading.',
        })
      );
      return;
    }

    isExportingRef.current = true;
    setExporting(true);
    setError(null);
    try {
      const output = await exportSignedPdf({ bytes, pages, fields, signatures, dateText });
      const filename = sanitizeDownloadFilename(
        `${file?.name.replace(/\.pdf$/i, '') || 'document'}-signed.pdf`
      );
      const blob = new Blob([output as unknown as BlobPart], { type: 'application/pdf' });
      await downloadBlob(blob, filename);
      addActivityItem({
        toolName: 'Sign PDF',
        toolId: 'sign-pdf',
        fileName: filename,
        fileSizeFormatted: formatBytes(blob.size),
        status: 'completed',
        tag: 'Sign',
        savings: `${fields.length} field(s)`,
      });
    } catch (err) {
      logger.error('Sign PDF export failed:', err);
      setError(
        t('signPdf.errors.exportFailed', {
          defaultValue: 'The signed PDF could not be created. Please try again.',
        })
      );
    } finally {
      setExporting(false);
      isExportingRef.current = false;
    }
  };

  const pageWidth = useMemo(
    () => Math.max(280, Math.min(850, viewerWidth)) * zoom,
    [viewerWidth, zoom]
  );

  if (!doc || !bytes) return <UploadScreen onFile={openFile} error={error} limitMB={limitMB} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <main
        ref={viewerRef}
        className="min-w-0 flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 px-6 py-8"
      >
        <div className="mx-auto flex max-w-[980px] flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{file?.name}</span>
              <span>
                ·{' '}
                {pages.length === 1
                  ? t('signPdf.header.pageCount', { count: 1, defaultValue: '1 page' })
                  : t('signPdf.header.pagesCount', {
                      count: pages.length,
                      defaultValue: `${pages.length} pages`,
                    })}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-sm">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('signPdf.header.zoomOut', { defaultValue: 'Zoom out' })}
                onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
              >
                <Minus />
              </Button>
              <span className="w-12 text-center text-xs font-medium text-slate-900 dark:text-slate-100">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('signPdf.header.zoomIn', { defaultValue: 'Zoom in' })}
                onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
              >
                <Plus />
              </Button>
            </div>
          </div>
          {detectionNotice ? (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {detectionNotice}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-600 dark:text-rose-400"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-8">
            {pages.map((info) => (
              <PdfPage
                key={info.index}
                doc={doc}
                info={info}
                cssWidth={pageWidth}
                fields={fields.filter((field) => field.pageIndex === info.index)}
                signatures={signatures}
                dateText={dateText}
                selectedId={selectedId}
                pendingKind={pendingKind}
                onSelect={setSelectedId}
                onChangeField={updateField}
                onRemoveField={removeField}
                onDropField={addField}
              />
            ))}
          </div>
        </div>
      </main>
      <div className="w-full shrink-0 lg:w-[340px] xl:w-[380px]">
        <SignSidebar
          signatures={signatures}
          savedPresets={savedPresets}
          isPro={isPro}
          maxSavedSignatures={maxSavedSignatures}
          onSelectPreset={(preset) => setSignatures(preset.set)}
          onDeletePreset={(id) => {
            const next = savedPresets.filter((p) => p.id !== id);
            setSavedPresets(next);
            try {
              localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
              // ignore
            }
          }}
          dateText={dateText}
          onDateChange={setDateText}
          onEditSignature={() => setSignatureOpen(true)}
          pendingKind={pendingKind}
          onPickKind={setPendingKind}
          fieldCount={fields.length}
          exporting={exporting}
          onExport={exportPdf}
          onReset={reset}
          onAutoDetect={autoDetectFields}
          isDetecting={isDetecting}
        />
      </div>
      <SignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        initial={signatures}
        onApply={(nextSig) => {
          setSignatures(nextSig);
          if (nextSig.signature) {
            const newPreset: SavedSignaturePreset = {
              id: crypto.randomUUID(),
              label: nextSig.fullName || `Stamp ${savedPresets.length + 1}`,
              createdAt: new Date().toLocaleDateString(),
              set: nextSig,
            };
            const updated = [newPreset, ...savedPresets].slice(0, maxSavedSignatures);
            setSavedPresets(updated);
            try {
              localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch {
              // ignore
            }
          }
        }}
      />
    </div>
  );
}
