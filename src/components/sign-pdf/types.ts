export type FieldKind = 'signature' | 'initials' | 'name' | 'date' | 'text'

export type SignatureAsset = {
  /** PNG data URL, transparent background */
  dataUrl: string
  /** natural pixel size of the PNG */
  width: number
  height: number
}

export type SignatureSet = {
  fullName: string
  initialsText: string
  signature: SignatureAsset | null
  initials: SignatureAsset | null
}

export type PlacedField = {
  id: string
  kind: FieldKind
  pageIndex: number
  /** normalised (0..1) position of the top-left corner, relative to the page */
  x: number
  y: number
  /** normalised (0..1) size, relative to the page */
  w: number
  h: number
  /** rotation in degrees (0..360) */
  rotation?: number
  /** for text fields */
  text?: string
}

export type PageInfo = {
  index: number
  /** PDF user-space size in points */
  width: number
  height: number
  rotation: number
}

export const FIELD_LABEL: Record<FieldKind, string> = {
  signature: 'Signature',
  initials: 'Initials',
  name: 'Name',
  date: 'Date',
  text: 'Text',
}

export const SIGNATURE_FONTS = [
  { id: 'dancing', label: 'Dancing Script', css: 'var(--font-sig-dancing)' },
  { id: 'great-vibes', label: 'Great Vibes', css: 'var(--font-sig-great-vibes)' },
  { id: 'pacifico', label: 'Pacifico', css: 'var(--font-sig-pacifico)' },
  { id: 'caveat', label: 'Caveat', css: 'var(--font-sig-caveat)' },
  { id: 'satisfy', label: 'Satisfy', css: 'var(--font-sig-satisfy)' },
  { id: 'homemade', label: 'Homemade Apple', css: 'var(--font-sig-homemade)' },
] as const

export const INK_COLORS = [
  { id: 'black', label: 'Black', value: '#111111' },
  { id: 'blue', label: 'Blue', value: '#1d4ed8' },
  { id: 'red', label: 'Red', value: '#dc2626' },
] as const

export type InkColor = (typeof INK_COLORS)[number]['value']
