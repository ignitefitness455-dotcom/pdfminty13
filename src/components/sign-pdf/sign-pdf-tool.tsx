import { FileText, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { PDFSanitizer } from '../../core/PDFSanitizer';
import { downloadBlob, sanitizeDownloadFilename } from '../../utils/download';
import { recordDailyTask } from '../../utils/usageLimit';
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

export function SignPdfTool() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const isPro = user?.plan === 'pro';
  const maxSavedSignatures = isPro ? 5 : 1;
  const storageKey = `pdfminty_saved_signatures_${user?.uid || 'guest'}`;
  // Guest: 100MB, Logged-in Free: 150MB, Pro: 500MB
  const limitMB = isPro ? 500 : user ? 150 : 100;
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

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewerWidth(Math.max(280, entry.contentRect.width - 48))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc]);

  const docRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    return () => {
      if (docRef.current) {
        docRef.current.destroy().catch(() => {
          /* ignore */
        });
        docRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
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
    setZoom(1);
  }, []);

  const openFile = useCallback(
    async (nextFile: File) => {
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
      try {
        if (docRef.current) {
          await docRef.current.destroy().catch(() => {
            /* ignore */
          });
          docRef.current = null;
        }
        const nextBytes = await nextFile.arrayBuffer();
        const rawUint8 = new Uint8Array(nextBytes);
        // Validate %PDF- magic header and non-empty structural boundary
        const { bytes: sanitizedUint8 } = PDFSanitizer.sanitize(rawUint8);
        if (await PDFSanitizer.isEncrypted(sanitizedUint8)) {
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
        const nextPages = await readPageInfos(nextDoc);
        docRef.current = nextDoc;
        setFile(nextFile);
        setBytes(sanitizedBuffer);
        setDoc(nextDoc);
        setPages(nextPages);
        setFields([]);
        setSelectedId(null);
      } catch (err) {
        console.error('[v0] PDF load failed', err);
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
    [limitMB, t]
  );

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  const addField = useCallback((pageIndex: number, kind: FieldKind, nx: number, ny: number) => {
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
    const size = defaults[kind];
    const field: PlacedField = {
      id: crypto.randomUUID(),
      kind,
      pageIndex,
      x: Math.min(Math.max(nx - size.w / 2, 0), 1 - size.w),
      y: Math.min(Math.max(ny - size.h / 2, 0), 1 - size.h),
      ...size,
      text: kind === 'text' ? '' : undefined,
    };
    setFields((current) => [...current, field]);
    setSelectedId(field.id);
    setPendingKind(null);
  }, []);

  const autoDetectFields = useCallback(async () => {
    if (!doc || !pages.length) return;
    setIsDetecting(true);
    setDetectionNotice(null);

    try {
      const detected: PlacedField[] = [];

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const info = pages[pIdx];
        const page = await doc.getPage(pIdx + 1);

        // 1. Check interactive form annotations
        try {
          const annotations = await page.getAnnotations();
          for (const annot of annotations) {
            if (annot.subtype === 'Widget' && annot.rect) {
              const [rx1, ry1, rx2, ry2] = annot.rect;
              const w = Math.abs(rx2 - rx1) / info.width;
              const h = Math.abs(ry2 - ry1) / info.height;
              const x = Math.min(rx1, rx2) / info.width;
              const y = (info.height - Math.max(ry1, ry2)) / info.height;

              let kind: FieldKind = 'text';
              if (annot.fieldType === 'Sig') kind = 'signature';
              else if (annot.fieldType === 'Btn') kind = 'checkmark';

              detected.push({
                id: crypto.randomUUID(),
                kind,
                pageIndex: pIdx,
                x: Math.max(0, Math.min(x, 1 - w)),
                y: Math.max(0, Math.min(y, 1 - h)),
                w: Math.max(0.04, Math.min(w, 0.4)),
                h: Math.max(0.03, Math.min(h, 0.15)),
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
            const tx = transform[4];
            const ty = transform[5];
            const itemW = item.width || 40;
            const itemH = item.height || 12;

            const nx = tx / info.width;
            const ny = (info.height - ty - itemH) / info.height;

            if (text.includes('signature') || text.includes('sign here')) {
              detected.push({
                id: crypto.randomUUID(),
                kind: 'signature',
                pageIndex: pIdx,
                x: Math.min(nx + itemW / info.width + 0.02, 0.72),
                y: Math.max(0, ny - 0.01),
                w: 0.24,
                h: 0.075,
              });
            } else if (text.includes('date:')) {
              detected.push({
                id: crypto.randomUUID(),
                kind: 'date',
                pageIndex: pIdx,
                x: Math.min(nx + itemW / info.width + 0.02, 0.76),
                y: Math.max(0, ny),
                w: 0.2,
                h: 0.045,
              });
            }
          }
        } catch {
          // ignore text check errors
        }
      }

      if (detected.length > 0) {
        setFields((prev) => [...prev, ...detected]);
        setDetectionNotice(`Auto-detected ${detected.length} form field & signature zone(s)!`);
      } else {
        // Fallback: place a default signature and date at the bottom of the last page
        const lastIdx = pages.length - 1;
        const fallbackFields: PlacedField[] = [
          {
            id: crypto.randomUUID(),
            kind: 'signature',
            pageIndex: lastIdx,
            x: 0.55,
            y: 0.82,
            w: 0.24,
            h: 0.075,
          },
          {
            id: crypto.randomUUID(),
            kind: 'date',
            pageIndex: lastIdx,
            x: 0.15,
            y: 0.84,
            w: 0.2,
            h: 0.045,
          },
        ];
        setFields((prev) => [...prev, ...fallbackFields]);
        setDetectionNotice('Placed standard signature & date fields on the document.');
      }
    } finally {
      setIsDetecting(false);
      setTimeout(() => setDetectionNotice(null), 5000);
    }
  }, [doc, pages]);

  const updateField = (id: string, patch: Partial<PlacedField>) =>
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  const removeField = (id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
    setSelectedId(null);
  };

  const exportPdf = async () => {
    if (!bytes || !fields.length) return;
    setExporting(true);
    try {
      const output = await exportSignedPdf({ bytes, pages, fields, signatures, dateText });
      const filename = sanitizeDownloadFilename(
        `${file?.name.replace(/\.pdf$/i, '') || 'document'}-signed.pdf`
      );
      try {
        recordDailyTask(user, 'sign_pdf');
      } catch {
        // Non-blocking
      }
      const blob = new Blob([output as unknown as BlobPart], { type: 'application/pdf' });
      await downloadBlob(blob, filename);
    } catch (err) {
      console.error('[v0] PDF export failed', err);
      setError(
        t('signPdf.errors.exportFailed', {
          defaultValue: 'The signed PDF could not be created. Please try again.',
        })
      );
    } finally {
      setExporting(false);
    }
  };

  const pageWidth = useMemo(
    () => Math.max(280, Math.min(850, viewerWidth)) * zoom,
    [viewerWidth, zoom]
  );

  if (!doc || !bytes) return <UploadScreen onFile={openFile} error={error} />;

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
