import { RotateCw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '../../lib/utils'

import { TEXT_FIELD_PAD_RATIO } from './export'
import { FIELD_LABEL, type PlacedField, type SignatureSet } from './types'

type Props = {
  field: PlacedField
  pageWidth: number
  pageHeight: number
  signatures: SignatureSet
  dateText: string
  selected: boolean
  onSelect: () => void
  onChange: (patch: Partial<PlacedField>) => void
  onRemove: () => void
}

const MIN_SIZE_PX = 24

export function PlacedFieldView({
  field,
  pageWidth,
  pageHeight,
  signatures,
  dateText,
  selected,
  onSelect,
  onChange,
  onRemove,
}: Props) {
  const { t } = useTranslation('common')
  const [editing, setEditing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    type: 'move' | 'resize' | 'rotate'
    startX: number
    startY: number
    orig: PlacedField
    pointerId: number
    centerX: number
    centerY: number
    hasMoved: boolean
  } | null>(null)

  const px = {
    left: field.x * pageWidth,
    top: field.y * pageHeight,
    width: field.w * pageWidth,
    height: field.h * pageHeight,
  }

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

  const startGesture = (type: 'move' | 'resize' | 'rotate', e: React.PointerEvent) => {
    if (editing) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    const rect = containerRef.current?.getBoundingClientRect()
    const centerX = rect ? rect.left + rect.width / 2 : 0
    const centerY = rect ? rect.top + rect.height / 2 : 0

    if (type === 'rotate') {
      setIsRotating(true)
    }

    gesture.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...field },
      pointerId: e.pointerId,
      centerX,
      centerY,
      hasMoved: false,
    }

    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return

    const dist = Math.hypot(e.clientX - g.startX, e.clientY - g.startY)
    if (dist > 3) {
      g.hasMoved = true
    }

    if (g.type === 'move') {
      const dx = (e.clientX - g.startX) / pageWidth
      const dy = (e.clientY - g.startY) / pageHeight
      onChange({
        x: clamp(g.orig.x + dx, 0, 1 - g.orig.w),
        y: clamp(g.orig.y + dy, 0, 1 - g.orig.h),
      })
    } else if (g.type === 'rotate') {
      const dx = e.clientX - g.centerX
      const dy = e.clientY - g.centerY
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
      deg = ((deg % 360) + 360) % 360
      // Snap to 0, 90, 180, 270 if close
      if (deg < 5 || deg > 355) deg = 0
      else if (Math.abs(deg - 90) < 5) deg = 90
      else if (Math.abs(deg - 180) < 5) deg = 180
      else if (Math.abs(deg - 270) < 5) deg = 270
      onChange({ rotation: Math.round(deg) })
    } else {
      const dx = (e.clientX - g.startX) / pageWidth
      const dy = (e.clientY - g.startY) / pageHeight
      const aspect = g.orig.w / g.orig.h
      const keepAspect = field.kind === 'signature' || field.kind === 'initials'
      let w = clamp(g.orig.w + dx, MIN_SIZE_PX / pageWidth, 1 - g.orig.x)
      let h = clamp(g.orig.h + dy, MIN_SIZE_PX / pageHeight, 1 - g.orig.y)
      if (keepAspect) {
        // follow the dominant axis of the drag
        const byW = w / aspect
        const byH = h * aspect
        if (Math.abs(dx) >= Math.abs(dy) * (pageWidth / pageHeight)) {
          h = clamp(byW * (pageWidth / pageHeight), MIN_SIZE_PX / pageHeight, 1 - g.orig.y)
          w = (h * pageHeight * aspect) / pageWidth
        } else {
          w = clamp((byH * pageHeight) / pageWidth, MIN_SIZE_PX / pageWidth, 1 - g.orig.x)
          h = (w * pageWidth) / aspect / pageHeight
        }
      }
      onChange({ w, h })
    }
  }

  const endGesture = (e: React.PointerEvent) => {
    const g = gesture.current
    if (g && g.pointerId === e.pointerId) {
      if (g.type === 'rotate') {
        setIsRotating(false)
        // If simply tapped without dragging, rotate by +90 degrees
        if (!g.hasMoved) {
          const next = (((g.orig.rotation || 0) + 90) % 360)
          onChange({ rotation: next })
        }
      }
      try {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
        }
      } catch {
        // ignore
      }
      gesture.current = null
    }
  }

  const isImage = field.kind === 'signature' || field.kind === 'initials'
  const asset = field.kind === 'signature' ? signatures.signature : signatures.initials
  const text =
    field.kind === 'name' ? signatures.fullName : field.kind === 'date' ? dateText : (field.text ?? '')

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return
    const step = e.shiftKey ? 10 : 1
    const dxn = step / pageWidth
    const dyn = step / pageHeight
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        onRemove()
        break
      case 'ArrowLeft':
        e.preventDefault()
        onChange({ x: clamp(field.x - dxn, 0, 1 - field.w) })
        break
      case 'ArrowRight':
        e.preventDefault()
        onChange({ x: clamp(field.x + dxn, 0, 1 - field.w) })
        break
      case 'ArrowUp':
        e.preventDefault()
        onChange({ y: clamp(field.y - dyn, 0, 1 - field.h) })
        break
      case 'ArrowDown':
        e.preventDefault()
        onChange({ y: clamp(field.y + dyn, 0, 1 - field.h) })
        break
      case 'r':
      case 'R':
        e.preventDefault()
        onChange({ rotation: (((field.rotation || 0) + 90) % 360) })
        break
      case 'Enter':
        if (field.kind === 'text') {
          e.preventDefault()
          setEditing(true)
        }
        break
    }
  }

  const rotation = field.rotation || 0

  const kindLabel = t(`signPdf.fields.${field.kind}`, { defaultValue: FIELD_LABEL[field.kind] })

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label={t('signPdf.fieldView.fieldAria', {
        kind: kindLabel,
        defaultValue: `${kindLabel} field. Drag to move, rotate, use arrow keys to nudge, Delete to remove.`,
      })}
      data-field="true"
      className={cn(
        'absolute touch-none select-none outline-none',
        selected ? 'z-20' : 'z-10',
        editing ? 'cursor-text' : 'cursor-move',
      )}
      style={{
        ...px,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onPointerDown={(e) => startGesture('move', e)}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onKeyDown={onKeyDown}
      onDoubleClick={() => field.kind === 'text' && setEditing(true)}
      onFocus={onSelect}
    >
      <div
        className={cn(
          'relative size-full rounded-[2px] transition-shadow',
          selected
            ? 'shadow-[0_0_0_1.5px_#059669] bg-emerald-600/5'
            : 'shadow-[0_0_0_1px_rgba(5,150,105,0.45)] hover:shadow-[0_0_0_1.5px_#059669]',
        )}
      >
        {isImage ? (
          asset ? (
            <img
              src={asset.dataUrl}
              alt=""
              draggable={false}
              className="pointer-events-none size-full object-fill"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[10px] text-slate-500">
              {kindLabel}
            </span>
          )
        ) : editing ? (
          <input
            value={field.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) setEditing(false)
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="size-full bg-transparent text-center text-slate-900 outline-none"
            style={{ fontSize: px.height * 0.62, fontFamily: 'Helvetica, Arial, sans-serif', padding: `0 ${TEXT_FIELD_PAD_RATIO * 100}%` }}
            aria-label={kindLabel}
          />
        ) : (
          <TextPreview
            text={
              text ||
              (field.kind === 'text'
                ? t('signPdf.fieldView.doubleClickToEdit', { defaultValue: 'Double-click to edit' })
                : '')
            }
            height={px.height}
            muted={!text}
          />
        )}

        {selected && !editing ? (
          <>
            {/* Rotation stem and circular touch handle */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto"
            >
              <button
                type="button"
                aria-label={t('signPdf.fieldView.rotateAria', {
                  defaultValue: 'Rotate signature. Drag to rotate or tap to turn 90 degrees.',
                })}
                onPointerDown={(e) => startGesture('rotate', e)}
                onPointerMove={onPointerMove}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
                className="flex size-7 items-center justify-center rounded-full border-2 border-emerald-600 bg-white text-emerald-700 shadow-md transition-transform hover:scale-110 active:scale-95 touch-none cursor-grab active:cursor-grabbing"
              >
                <RotateCw className="size-3.5" aria-hidden="true" />
              </button>
              <div className="w-[1.5px] h-2 bg-emerald-600" />
            </div>

            {/* Active rotation degree indicator */}
            {(isRotating || rotation !== 0) ? (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-mono text-white pointer-events-none shadow">
                {rotation}°
              </span>
            ) : null}

            {/* Delete button */}
            <button
              type="button"
              aria-label={t('signPdf.fieldView.removeAria', { defaultValue: 'Remove field' })}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="absolute -right-3 -top-3 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>

            {/* Resize handle */}
            <div
              role="presentation"
              aria-label={t('signPdf.fieldView.resizeAria', { defaultValue: 'Resize' })}
              onPointerDown={(e) => startGesture('resize', e)}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
              className="absolute -bottom-1.5 -right-1.5 size-4 cursor-se-resize rounded-sm border-2 border-emerald-600 bg-white touch-none"
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

function TextPreview({ text, height, muted }: { text: string; height: number; muted: boolean }) {
  return (
    <span
      className={cn(
        'flex size-full items-center justify-center overflow-hidden whitespace-nowrap leading-none',
        muted ? 'text-slate-500' : 'text-slate-900',
      )}
      style={{
        fontSize: height * 0.62,
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: `0 ${TEXT_FIELD_PAD_RATIO * 100}%`,
      }}
    >
      <FitText text={text} />
    </span>
  )
}

/** Shrinks text horizontally so long strings still fit the box, mirroring the export logic. */
function FitText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)
  const measure = (node: HTMLSpanElement | null) => {
    ref.current = node
    if (!node?.parentElement) return
    const available = node.parentElement.clientWidth * (1 - TEXT_FIELD_PAD_RATIO * 2)
    // offsetWidth ignores CSS transforms, so it is the unscaled natural width
    const natural = node.offsetWidth
    const next = natural > available && natural > 0 ? available / natural : 1
    if (Math.abs(next - scale) > 0.01) setScale(next)
  }
  return (
    <span ref={measure} style={{ display: 'inline-block', transform: `scale(${scale})`, transformOrigin: 'center' }}>
      {text}
    </span>
  )
}
