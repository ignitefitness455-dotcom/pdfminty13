import { Lock, Plus, ShieldCheck, Zap } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

type Props = {
  onFile: (file: File) => void
  error?: string | null
}

export function UploadScreen({ onFile, error }: Props) {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-16 pt-12 md:pt-20 bg-slate-50 dark:bg-slate-950"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
          {t('signPdf.title', { defaultValue: 'Sign PDF' })}
        </h1>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          {t('signPdf.description', {
            defaultValue:
              'Your tool to eSign documents. Draw, type or upload your signature, place it anywhere on the page and download the signed PDF.',
          })}
        </p>
      </div>

      <div
        className={cn(
          'mt-10 flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border-2 border-dashed px-6 py-12 transition-colors',
          dragging
            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label={t('signPdf.selectPdf', { defaultValue: 'Select PDF file' })}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Button
          size="lg"
          className="h-14 rounded-xl px-10 text-lg font-semibold shadow-lg shadow-emerald-500/25 cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Plus className="size-5" aria-hidden="true" />
          {t('signPdf.selectPdf', { defaultValue: 'Select PDF file' })}
        </Button>
        <p className="text-sm text-slate-500">
          {t('signPdf.orDropPdf', { defaultValue: 'or drop a PDF here' })}
        </p>
        {error ? (
          <p role="alert" className="rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
      </div>

      <ul className="mt-12 grid w-full max-w-3xl gap-6 text-left sm:grid-cols-3">
        <Feature
          icon={<Lock className="size-5" aria-hidden="true" />}
          title={t('signPdf.featurePrivateTitle', { defaultValue: 'Private by design' })}
          body={t('signPdf.featurePrivateBody', {
            defaultValue: 'Your PDF never leaves your browser. Everything is processed on your device.',
          })}
        />
        <Feature
          icon={<Zap className="size-5" aria-hidden="true" />}
          title={t('signPdf.featureInstantTitle', { defaultValue: 'Instant' })}
          body={t('signPdf.featureInstantBody', {
            defaultValue: 'No upload, no waiting. Place your signature and download in seconds.',
          })}
        />
        <Feature
          icon={<ShieldCheck className="size-5" aria-hidden="true" />}
          title={t('signPdf.featureQualityTitle', { defaultValue: 'Vector quality' })}
          body={t('signPdf.featureQualityBody', {
            defaultValue: 'Signatures and text are embedded at full resolution into the original PDF.',
          })}
        />
      </ul>

      <section className="mt-16 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
        <div className="space-y-3 text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('signPdf.guideTitle', {
              defaultValue: 'Complete Guide to Electronically Signing PDF Documents',
            })}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t('signPdf.guideLead', {
              defaultValue:
                'Easily create legally compliant electronic signatures and place them on contract agreements, lease deeds, non-disclosure forms, or job applications directly in your web browser with zero server uploads.',
            })}
          </p>
        </div>

        <div className="space-y-4 text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('signPdf.methodsTitle', {
              defaultValue: '3 Convenient Ways to Add Your Signature',
            })}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                ✍️ {t('signPdf.methodDrawTitle', { defaultValue: 'Hand-Drawn Signature' })}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('signPdf.methodDrawDesc', {
                  defaultValue:
                    'Use your mouse, trackpad, or finger/stylus on touchscreens to draw a smooth, natural signature with customized ink thickness.',
                })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                ⌨️ {t('signPdf.methodTypeTitle', { defaultValue: 'Type to Cursive' })}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('signPdf.methodTypeDesc', {
                  defaultValue:
                    'Type your legal name and choose from beautiful signature calligraphies like Dancing Script, Great Vibes, and Pacifico with black, blue, or red ink.',
                })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                📷 {t('signPdf.methodUploadTitle', { defaultValue: 'Upload Image or Scanned Signature' })}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('signPdf.methodUploadDesc', {
                  defaultValue:
                    'Upload a signature photo or PNG image. PdfMinty provides smart background removal so only your signature ink appears transparently on your document.',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('signPdf.stepsTitle', {
              defaultValue: 'How to eSign Your PDF in 3 Simple Steps',
            })}
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <strong>{t('signPdf.step1Bold', { defaultValue: 'Upload PDF Document:' })}</strong>{' '}
              {t('signPdf.step1Text', {
                defaultValue:
                  'Drop your contract or form into the secure browser viewer. Files up to 50MB are supported.',
              })}
            </li>
            <li>
              <strong>{t('signPdf.step2Bold', { defaultValue: 'Create & Place Elements:' })}</strong>{' '}
              {t('signPdf.step2Text', {
                defaultValue:
                  'Create your signature or initials, then click or drag signature, signer name, date, and custom text fields directly onto the page.',
              })}
            </li>
            <li>
              <strong>{t('signPdf.step3Bold', { defaultValue: 'Adjust & Download:' })}</strong>{' '}
              {t('signPdf.step3Text', {
                defaultValue:
                  'Rotate, resize, or reposition any field with millimeter precision, then click "Sign & Download" to export your signed document instantly.',
              })}
            </li>
          </ol>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 text-left">
          <p className="font-bold">{t('signPdf.privacyTitle', { defaultValue: '🔒 100% Client-Side Privacy & Legal Security' })}</p>
          <p className="leading-normal text-slate-600 dark:text-slate-400">
            {t('signPdf.privacyText', {
              defaultValue:
                'Your documents and signatures remain strictly confidential on your local device. No files or signatures are ever sent to remote cloud servers, keeping your identity secure.',
            })}
          </p>
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">{icon}</span>
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
    </li>
  )
}
