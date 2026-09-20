import { FileText, Minus, Plus } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../ui/button'

import { exportSignedPdf } from './export'
import { PdfPage } from './pdf-page'
import { loadPdfDocument, readPageInfos } from './pdfjs'
import { SignSidebar } from './sign-sidebar'
import { SignatureDialog } from './signature-dialog'
import type { FieldKind, PageInfo, PlacedField, SignatureSet } from './types'
import { UploadScreen } from './upload-screen'

const EMPTY_SIGNATURES: SignatureSet = { fullName: '', initialsText: '', signature: null, initials: null }

export function SignPdfTool() {
  const { t } = useTranslation('common')
  const [file, setFile] = useState<File | null>(null)
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [signatures, setSignatures] = useState<SignatureSet>(EMPTY_SIGNATURES)
  const [fields, setFields] = useState<PlacedField[]>([])
  const [pendingKind, setPendingKind] = useState<FieldKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dateText, setDateText] = useState(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date()))
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [zoom, setZoom] = useState(1)
  const viewerRef = useRef<HTMLDivElement>(null)
  const [viewerWidth, setViewerWidth] = useState(720)

  useEffect(() => {
    const el = viewerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setViewerWidth(Math.max(280, entry.contentRect.width - 48)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [doc])

  const reset = useCallback(() => {
    doc?.destroy()
    setFile(null); setBytes(null); setDoc(null); setPages([]); setFields([]); setSelectedId(null); setPendingKind(null); setError(null); setZoom(1)
  }, [doc])

  const openFile = useCallback(async (nextFile: File) => {
    if (nextFile.type !== 'application/pdf' && !nextFile.name.toLowerCase().endsWith('.pdf')) {
      setError(t('signPdf.errors.choosePdf', { defaultValue: 'Please choose a PDF file.' }))
      return
    }
    if (nextFile.size > 50 * 1024 * 1024) {
      setError(t('signPdf.errors.fileTooLarge', { defaultValue: 'This PDF is larger than 50 MB.' }))
      return
    }
    setError(null)
    try {
      const nextBytes = await nextFile.arrayBuffer()
      const nextDoc = await loadPdfDocument(nextBytes)
      const nextPages = await readPageInfos(nextDoc)
      setFile(nextFile); setBytes(nextBytes); setDoc(nextDoc); setPages(nextPages); setFields([]); setSelectedId(null)
    } catch (err) {
      console.error('[v0] PDF load failed', err)
      setError(t('signPdf.errors.cannotOpen', { defaultValue: 'This file could not be opened. Please try another PDF.' }))
    }
  }, [t])

  const addField = useCallback((pageIndex: number, kind: FieldKind, nx: number, ny: number) => {
    const defaults: Record<FieldKind, { w: number; h: number }> = {
      signature: { w: 0.24, h: 0.075 }, initials: { w: 0.12, h: 0.065 }, name: { w: 0.25, h: 0.045 }, date: { w: 0.2, h: 0.045 }, text: { w: 0.28, h: 0.05 },
    }
    const size = defaults[kind]
    const field: PlacedField = { id: crypto.randomUUID(), kind, pageIndex, x: Math.min(Math.max(nx - size.w / 2, 0), 1 - size.w), y: Math.min(Math.max(ny - size.h / 2, 0), 1 - size.h), ...size, text: kind === 'text' ? '' : undefined }
    setFields((current) => [...current, field]); setSelectedId(field.id); setPendingKind(null)
  }, [])

  const updateField = (id: string, patch: Partial<PlacedField>) => setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field))
  const removeField = (id: string) => { setFields((current) => current.filter((field) => field.id !== id)); setSelectedId(null) }

  const exportPdf = async () => {
    if (!bytes || !fields.length) return
    setExporting(true)
    try {
      const output = await exportSignedPdf({ bytes, pages, fields, signatures, dateText })
      const url = URL.createObjectURL(new Blob([output], { type: 'application/pdf' }))
      const link = document.createElement('a'); link.href = url; link.download = `${file?.name.replace(/\.pdf$/i, '') || 'document'}-signed.pdf`; link.click(); URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[v0] PDF export failed', err)
      setError(t('signPdf.errors.exportFailed', { defaultValue: 'The signed PDF could not be created. Please try again.' }))
    } finally { setExporting(false) }
  }

  const pageWidth = useMemo(() => Math.max(280, Math.min(850, viewerWidth)) * zoom, [viewerWidth, zoom])

  if (!doc || !bytes) return <UploadScreen onFile={openFile} error={error} />

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <main ref={viewerRef} className="min-w-0 flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 px-6 py-8">
        <div className="mx-auto flex max-w-[980px] flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{file?.name}</span>
              <span>
                ·{' '}
                {pages.length === 1
                  ? t('signPdf.header.pageCount', { count: 1, defaultValue: '1 page' })
                  : t('signPdf.header.pagesCount', { count: pages.length, defaultValue: `${pages.length} pages` })}
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
              <span className="w-12 text-center text-xs font-medium text-slate-900 dark:text-slate-100">{Math.round(zoom * 100)}%</span>
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
          {error ? <p role="alert" className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
          <div className="flex flex-col items-center gap-8">
            {pages.map((info) => <PdfPage key={info.index} doc={doc} info={info} cssWidth={pageWidth} fields={fields.filter((field) => field.pageIndex === info.index)} signatures={signatures} dateText={dateText} selectedId={selectedId} pendingKind={pendingKind} onSelect={setSelectedId} onChangeField={updateField} onRemoveField={removeField} onDropField={addField} />)}
          </div>
        </div>
      </main>
      <div className="w-full shrink-0 lg:w-[340px] xl:w-[380px]"><SignSidebar signatures={signatures} dateText={dateText} onDateChange={setDateText} onEditSignature={() => setSignatureOpen(true)} pendingKind={pendingKind} onPickKind={setPendingKind} fieldCount={fields.length} exporting={exporting} onExport={exportPdf} onReset={reset} /></div>
      <SignatureDialog open={signatureOpen} onOpenChange={setSignatureOpen} initial={signatures} onApply={setSignatures} />
    </div>
  )
}
