import { Eraser, ImageUp, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SignaturePad from 'signature_pad'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

import { imageFileToAsset, initialsFromName, trimCanvasToAsset, typedTextToAsset } from './signature-image'
import { INK_COLORS, SIGNATURE_FONTS, type SignatureAsset, type SignatureSet } from './types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: SignatureSet
  onApply: (set: SignatureSet) => void
}

type Mode = 'type' | 'draw' | 'upload'

export function SignatureDialog({ open, onOpenChange, initial, onApply }: Props) {
  const { t } = useTranslation('common')
  const [mode, setMode] = useState<Mode>('type')
  const [fullName, setFullName] = useState(initial.fullName)
  const [initialsText, setInitialsText] = useState(initial.initialsText)
  const [initialsTouched, setInitialsTouched] = useState(Boolean(initial.initialsText))
  const [fontId, setFontId] = useState<(typeof SIGNATURE_FONTS)[number]['id']>('dancing')
  const [color, setColor] = useState<string>(INK_COLORS[0].value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [drawnSignature, setDrawnSignature] = useState<SignatureAsset | null>(null)
  const [drawnInitials, setDrawnInitials] = useState<SignatureAsset | null>(null)
  const [uploadedSignature, setUploadedSignature] = useState<SignatureAsset | null>(null)
  const [uploadedInitials, setUploadedInitials] = useState<SignatureAsset | null>(null)
  const [removeBg, setRemoveBg] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<{ signature?: File; initials?: File }>({})

  useEffect(() => {
    if (open) {
      setFullName(initial.fullName)
      setInitialsText(initial.initialsText)
      setInitialsTouched(Boolean(initial.initialsText))
      setError(null)
    }
  }, [open, initial.fullName, initial.initialsText])

  const handleNameChange = (value: string) => {
    setFullName(value)
    if (!initialsTouched) setInitialsText(initialsFromName(value))
  }

  const reprocessUpload = useCallback(
    async (which: 'signature' | 'initials', file: File | undefined, remove: boolean) => {
      if (!file) return
      try {
        const asset = await imageFileToAsset(file, remove)
        if (which === 'signature') setUploadedSignature(asset)
        else setUploadedInitials(asset)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('signPdf.dialog.imageReadError', { defaultValue: 'Could not read the image.' }))
      }
    },
    [t],
  )

  useEffect(() => {
    void reprocessUpload('signature', pendingFiles.signature, removeBg)
    void reprocessUpload('initials', pendingFiles.initials, removeBg)
  }, [removeBg, pendingFiles, reprocessUpload])

  const canApply =
    fullName.trim().length > 0 &&
    (mode === 'type' ? true : mode === 'draw' ? drawnSignature !== null : uploadedSignature !== null)

  const apply = async () => {
    setError(null)
    if (!fullName.trim()) {
      setError(t('signPdf.dialog.enterNameError', { defaultValue: 'Please enter your full name.' }))
      return
    }
    setBusy(true)
    try {
      const font = SIGNATURE_FONTS.find((f) => f.id === fontId) ?? SIGNATURE_FONTS[0]
      let signature: SignatureAsset | null = null
      let initials: SignatureAsset | null = null

      if (mode === 'type') {
        signature = await typedTextToAsset(fullName, font.css, color)
        initials = initialsText.trim() ? await typedTextToAsset(initialsText, font.css, color) : null
      } else if (mode === 'draw') {
        signature = drawnSignature
        initials = drawnInitials ?? (initialsText.trim() ? await typedTextToAsset(initialsText, font.css, color) : null)
      } else {
        signature = uploadedSignature
        initials =
          uploadedInitials ?? (initialsText.trim() ? await typedTextToAsset(initialsText, font.css, color) : null)
      }

      if (!signature) {
        setError(
          mode === 'draw'
            ? t('signPdf.dialog.drawSigError', { defaultValue: 'Please draw your signature.' })
            : t('signPdf.dialog.uploadSigError', { defaultValue: 'Please upload a signature image.' }),
        )
        return
      }

      onApply({ fullName: fullName.trim(), initialsText: initialsText.trim(), signature, initials })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">
            {t('signPdf.dialog.title', { defaultValue: 'Set your signature details' })}
          </DialogTitle>
          <DialogDescription>
            {t('signPdf.dialog.desc', {
              defaultValue: "Create the signature and initials you'll place on the document.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sig-full-name">
                {t('signPdf.dialog.fullName', { defaultValue: 'Full name' })}
              </Label>
              <Input
                id="sig-full-name"
                value={fullName}
                autoComplete="name"
                placeholder={t('signPdf.dialog.namePlaceholder', { defaultValue: 'e.g. Jane Doe' })}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sig-initials">
                {t('signPdf.dialog.initials', { defaultValue: 'Initials' })}
              </Label>
              <Input
                id="sig-initials"
                value={initialsText}
                maxLength={4}
                placeholder="JD"
                onChange={(e) => {
                  setInitialsTouched(true)
                  setInitialsText(e.target.value.toUpperCase())
                }}
              />
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="type" className="flex-1">
                {t('signPdf.dialog.tabType', { defaultValue: 'Type' })}
              </TabsTrigger>
              <TabsTrigger value="draw" className="flex-1">
                {t('signPdf.dialog.tabDraw', { defaultValue: 'Draw' })}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">
                {t('signPdf.dialog.tabUpload', { defaultValue: 'Upload' })}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="flex flex-col gap-4 pt-2">
              <ColorPicker value={color} onChange={setColor} />
              <div role="radiogroup" aria-label="Signature style" className="grid gap-2 sm:grid-cols-2">
                {SIGNATURE_FONTS.map((font) => {
                  const selected = font.id === fontId
                  return (
                    <button
                      key={font.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setFontId(font.id)}
                      className={cn(
                        'flex h-20 items-center justify-between gap-3 rounded-lg border bg-white dark:bg-slate-900 px-4 text-left transition-colors hover:border-emerald-600/60',
                        selected ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-slate-200 dark:border-slate-700',
                      )}
                    >
                      <span
                        className="truncate text-3xl leading-none"
                        style={{ fontFamily: font.css, color }}
                        aria-hidden="true"
                      >
                        {fullName.trim() || t('signPdf.dialog.yourName', { defaultValue: 'Your name' })}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">{font.label}</span>
                    </button>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="draw" className="flex flex-col gap-4 pt-2">
              <ColorPicker value={color} onChange={setColor} />
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <DrawPad
                  label={t('signPdf.dialog.signature', { defaultValue: 'Signature' })}
                  color={color}
                  height={200}
                  onChange={setDrawnSignature}
                />
                <DrawPad
                  label={t('signPdf.dialog.initials', { defaultValue: 'Initials' })}
                  color={color}
                  height={200}
                  onChange={setDrawnInitials}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col gap-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <UploadBox
                  label={t('signPdf.dialog.signature', { defaultValue: 'Signature' })}
                  asset={uploadedSignature}
                  onFile={(f) => setPendingFiles((p) => ({ ...p, signature: f }))}
                />
                <UploadBox
                  label={t('signPdf.dialog.initials', { defaultValue: 'Initials' })}
                  asset={uploadedInitials}
                  onFile={(f) => setPendingFiles((p) => ({ ...p, initials: f }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                <Label htmlFor="remove-bg" className="text-sm">
                  {t('signPdf.dialog.removeBg', { defaultValue: 'Remove white background' })}
                </Label>
                <Switch id="remove-bg" checked={removeBg} onCheckedChange={setRemoveBg} />
              </div>
            </TabsContent>
          </Tabs>

          {error ? (
            <p role="alert" className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t('signPdf.dialog.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={apply} disabled={!canApply || busy} className="min-w-28">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {t('signPdf.dialog.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation('common')
  return (
    <div
      role="radiogroup"
      aria-label={t('signPdf.dialog.color', { defaultValue: 'Ink color' })}
      className="flex items-center gap-2"
    >
      <span className="text-xs font-medium text-slate-500">
        {t('signPdf.dialog.color', { defaultValue: 'Color' })}
      </span>
      {INK_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.label}
          onClick={() => onChange(c.value)}
          className={cn(
            'size-6 rounded-full border-2 transition-transform hover:scale-105',
            value === c.value ? 'border-slate-900 dark:border-slate-100' : 'border-transparent',
          )}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  )
}

function DrawPad({
  label,
  color,
  height,
  onChange,
}: {
  label: string
  color: string
  height: number
  onChange: (asset: SignatureAsset | null) => void
}) {
  const { t } = useTranslation('common')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const padRef = useRef<SignaturePad | null>(null)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const pad = new SignaturePad(canvas, {
      penColor: color,
      minWidth: 1.2,
      maxWidth: 3.2,
      throttle: 8,
      velocityFilterWeight: 0.6,
    })
    padRef.current = pad

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const data = pad.toData()
      canvas.width = wrap.clientWidth * ratio
      canvas.height = height * ratio
      canvas.style.width = `${wrap.clientWidth}px`
      canvas.style.height = `${height}px`
      canvas.getContext('2d')?.scale(ratio, ratio)
      pad.clear()
      if (data.length) pad.fromData(data)
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(wrap)

    const commit = () => {
      const isEmpty = pad.isEmpty()
      setEmpty(isEmpty)
      onChange(isEmpty ? null : trimCanvasToAsset(canvas, 10))
    }
    pad.addEventListener('endStroke', commit)

    return () => {
      observer.disconnect()
      pad.removeEventListener('endStroke', commit)
      pad.off()
      padRef.current = null
    }
    // color is applied separately so re-init doesn't wipe strokes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  useEffect(() => {
    const pad = padRef.current
    const canvas = canvasRef.current
    if (!pad || !canvas) return
    pad.penColor = color
    const data = pad.toData()
    if (!data.length) return
    for (const group of data) group.penColor = color
    pad.fromData(data)
    onChange(trimCanvasToAsset(canvas, 10))
  }, [color, onChange])

  const clear = () => {
    padRef.current?.clear()
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <Button variant="ghost" size="xs" onClick={clear} disabled={empty}>
          <Eraser aria-hidden="true" />
          {t('signPdf.dialog.clear', { defaultValue: 'Clear' })}
        </Button>
      </div>
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none"
          aria-label={t('signPdf.dialog.drawAria', { label: label.toLowerCase(), defaultValue: `Draw your ${label.toLowerCase()}` })}
          role="img"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-slate-200 dark:border-slate-700"
        />
        {empty ? (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-slate-500">
            {t('signPdf.dialog.drawHere', { defaultValue: 'Draw here' })}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function UploadBox({
  label,
  asset,
  onFile,
}: {
  label: string
  asset: SignatureAsset | null
  onFile: (file: File) => void
}) {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-[200px] flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-500 transition-colors hover:border-emerald-600/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) onFile(f)
        }}
      >
        {asset ? (
          <img
            src={asset.dataUrl}
            alt={t('signPdf.dialog.previewAlt', { label, defaultValue: `${label} preview` })}
            className="max-h-full max-w-full object-contain"
            style={{
              backgroundImage:
                'linear-gradient(45deg, var(--color-muted) 25%, transparent 25%), linear-gradient(-45deg, var(--color-muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-muted) 75%), linear-gradient(-45deg, transparent 75%, var(--color-muted) 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            }}
          />
        ) : (
          <>
            <ImageUp className="size-6" aria-hidden="true" />
            <span>{t('signPdf.dialog.clickOrDrop', { defaultValue: 'Click or drop an image' })}</span>
            <span className="text-xs">PNG, JPG</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
