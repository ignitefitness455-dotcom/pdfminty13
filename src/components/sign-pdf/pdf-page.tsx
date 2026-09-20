import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { renderPageToCanvas } from './pdfjs'
import { PlacedFieldView } from './placed-field'
import type { FieldKind, PageInfo, PlacedField, SignatureSet } from './types'

type Props = {
  doc: PDFDocumentProxy
  info: PageInfo
  cssWidth: number
  fields: PlacedField[]
  signatures: SignatureSet
  dateText: string
  selectedId: string | null
  pendingKind: FieldKind | null
  onSelect: (id: string | null) => void
  onChangeField: (id: string, patch: Partial<PlacedField>) => void
  onRemoveField: (id: string) => void
  onDropField: (pageIndex: number, kind: FieldKind, nx: number, ny: number) => void
  onVisible?: (pageIndex: number) => void
}

export function PdfPage({
  doc,
  info,
  cssWidth,
  fields,
  signatures,
  dateText,
  selectedId,
  pendingKind,
  onSelect,
  onChangeField,
  onRemoveField,
  onDropField,
  onVisible,
}: Props) {
  const { t } = useTranslation('common')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const cssHeight = (cssWidth * info.height) / info.width

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (entry.intersectionRatio > 0.5) onVisible?.(info.index)
          }
        }
      },
      { rootMargin: '600px 0px', threshold: [0, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [info.index, onVisible])

  useEffect(() => {
    if (!inView || !canvasRef.current) return
    const signal = { cancelled: false }
    setRendered(false)
    renderPageToCanvas(doc, info.index, canvasRef.current, cssWidth, signal)
      .then(() => {
        if (!signal.cancelled) setRendered(true)
      })
      .catch((err) => console.error('[v0] page render failed', err))
    return () => {
      signal.cancelled = true
    }
  }, [doc, info.index, cssWidth, inView])

  const relativePoint = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    return { nx: (clientX - rect.left) / rect.width, ny: (clientY - rect.top) / rect.height }
  }

  return (
    <section
      aria-label={t('signPdf.fieldView.pageAria', { page: info.index + 1, defaultValue: `Page ${info.index + 1}` })}
      className="flex flex-col items-center gap-2"
      data-page-index={info.index}
    >
      <div
        ref={wrapRef}
        className="relative bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_-8px_rgba(0,0,0,0.18)] ring-1 ring-slate-900/10"
        style={{ width: cssWidth, height: cssHeight, cursor: pendingKind ? 'copy' : undefined }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[data-field]')) return
          if (pendingKind) {
            const { nx, ny } = relativePoint(e.clientX, e.clientY)
            onDropField(info.index, pendingKind, nx, ny)
          } else {
            onSelect(null)
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-sign-field')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          const kind = e.dataTransfer.getData('application/x-sign-field') as FieldKind
          if (!kind) return
          e.preventDefault()
          setDragOver(false)
          const { nx, ny } = relativePoint(e.clientX, e.clientY)
          onDropField(info.index, kind, nx, ny)
        }}
      >
        <canvas ref={canvasRef} className="block" aria-hidden="true" />
        {!rendered ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          </div>
        ) : null}
        {dragOver ? <div className="pointer-events-none absolute inset-0 bg-emerald-600/5 ring-2 ring-inset ring-emerald-600" /> : null}

        {fields.map((f) => (
          <PlacedFieldView
            key={f.id}
            field={f}
            pageWidth={cssWidth}
            pageHeight={cssHeight}
            signatures={signatures}
            dateText={dateText}
            selected={selectedId === f.id}
            onSelect={() => onSelect(f.id)}
            onChange={(patch) => onChangeField(f.id, patch)}
            onRemove={() => onRemoveField(f.id)}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">{info.index + 1}</span>
    </section>
  )
}
