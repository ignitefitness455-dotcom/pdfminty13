import { CalendarDays, GripVertical, Loader2, Pencil, PenLine, Type, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

import { FIELD_LABEL, type FieldKind, type SignatureSet } from './types'

type Props = {
  signatures: SignatureSet
  dateText: string
  onDateChange: (v: string) => void
  onEditSignature: () => void
  pendingKind: FieldKind | null
  onPickKind: (kind: FieldKind | null) => void
  fieldCount: number
  exporting: boolean
  onExport: () => void
  onReset: () => void
}

const KINDS: { kind: FieldKind; icon: React.ReactNode }[] = [
  { kind: 'signature', icon: <PenLine className="size-4" aria-hidden="true" /> },
  { kind: 'initials', icon: <Pencil className="size-4" aria-hidden="true" /> },
  { kind: 'name', icon: <UserRound className="size-4" aria-hidden="true" /> },
  { kind: 'date', icon: <CalendarDays className="size-4" aria-hidden="true" /> },
  { kind: 'text', icon: <Type className="size-4" aria-hidden="true" /> },
]

export function SignSidebar({
  signatures,
  dateText,
  onDateChange,
  onEditSignature,
  pendingKind,
  onPickKind,
  fieldCount,
  exporting,
  onExport,
  onReset,
}: Props) {
  const { t } = useTranslation('common')
  const hasSignature = Boolean(signatures.signature)

  return (
    <aside className="flex h-full flex-col bg-white dark:bg-slate-900 lg:border-l lg:border-slate-200 dark:lg:border-slate-800">
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('signPdf.sidebar.signingOptions', { defaultValue: 'Signing options' })}
          </h2>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('signPdf.sidebar.yourSignature', { defaultValue: 'Your signature' })}
            </span>
            <Button variant="ghost" size="xs" onClick={onEditSignature}>
              {hasSignature
                ? t('signPdf.sidebar.change', { defaultValue: 'Change' })
                : t('signPdf.sidebar.create', { defaultValue: 'Create' })}
            </Button>
          </div>
          <button
            type="button"
            onClick={onEditSignature}
            className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 transition-colors hover:border-emerald-600/60"
          >
            {signatures.signature ? (
              <img src={signatures.signature.dataUrl} alt={t('signPdf.sidebar.sigAlt', { defaultValue: 'Your signature preview' })} className="max-h-16 max-w-full object-contain" />
            ) : (
              <span className="text-sm text-slate-500">
                {t('signPdf.sidebar.clickToSet', { defaultValue: 'Click to set your signature' })}
              </span>
            )}
          </button>
          {signatures.fullName ? (
            <p className="truncate text-xs text-slate-500">
              {signatures.fullName}
              {signatures.initialsText ? ` · ${signatures.initialsText}` : ''}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 px-5 py-5">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('signPdf.sidebar.fields', { defaultValue: 'Fields' })}
            </span>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {t('signPdf.sidebar.fieldsHelp', {
                defaultValue:
                  'Click a field, then click on the document to place it. You can also drag it onto a page.',
              })}
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {KINDS.map(({ kind, icon }) => {
              const active = pendingKind === kind
              const needsSig = (kind === 'signature' || kind === 'initials' || kind === 'name') && !hasSignature
              return (
                <li key={kind}>
                  <button
                    type="button"
                    draggable={!needsSig}
                    aria-pressed={active}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-sign-field', kind)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => {
                      if (needsSig) {
                        onEditSignature()
                        return
                      }
                      onPickKind(active ? null : kind)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                      active
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-emerald-600/50 hover:bg-slate-50 dark:hover:bg-slate-800',
                      needsSig && 'cursor-pointer opacity-70',
                    )}
                  >
                    <span className={cn('flex size-8 items-center justify-center rounded-md', active ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100')}>
                      {icon}
                    </span>
                    <span className="flex-1 font-medium">
                      {t(`signPdf.fields.${kind}`, { defaultValue: FIELD_LABEL[kind] })}
                    </span>
                    <GripVertical className="size-4 text-slate-400" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 px-5 py-5">
          <Label htmlFor="sign-date" className="text-sm font-semibold">
            {t('signPdf.sidebar.dateFormat', { defaultValue: 'Date format' })}
          </Label>
          <Input id="sign-date" value={dateText} onChange={(e) => onDateChange(e.target.value)} />
          <p className="text-xs text-slate-500">
            {t('signPdf.sidebar.dateHelp', { defaultValue: 'Used for every Date field you place.' })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <Button
          size="lg"
          className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-emerald-500/25 cursor-pointer"
          disabled={fieldCount === 0 || exporting}
          onClick={onExport}
        >
          {exporting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
          {exporting
            ? t('signPdf.sidebar.signing', { defaultValue: 'Signing…' })
            : t('signPdf.sidebar.signButton', { defaultValue: 'Sign & Download' })}
        </Button>
        <p className="text-center text-xs text-slate-500">
          {fieldCount === 0
            ? t('signPdf.sidebar.placeFieldPrompt', { defaultValue: 'Place at least one field to continue' })
            : fieldCount === 1
            ? t('signPdf.sidebar.fieldsPlaced', { count: 1, defaultValue: '1 field placed' })
            : t('signPdf.sidebar.fieldsPlaced_plural', { count: fieldCount, defaultValue: `${fieldCount} fields placed` })}
        </p>
        <Button variant="ghost" size="sm" className="text-slate-500 cursor-pointer" onClick={onReset}>
          {t('signPdf.sidebar.chooseAnother', { defaultValue: 'Choose another file' })}
        </Button>
      </div>
    </aside>
  )
}
