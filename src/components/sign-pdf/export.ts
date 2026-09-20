import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from '@cantoo/pdf-lib'

import type { PageInfo, PlacedField, SignatureSet } from './types'

export type ExportInput = {
  bytes: ArrayBuffer
  pages: PageInfo[]
  fields: PlacedField[]
  signatures: SignatureSet
  dateText: string
}

/** Horizontal padding (fraction of box width) used for text fields on screen and in the PDF. */
export const TEXT_FIELD_PAD_RATIO = 0.04

/**
 * Fit a font size so the text fits both the box height and width.
 */
export function fitTextSize(font: PDFFont, text: string, boxW: number, boxH: number): number {
  let size = boxH * 0.62
  const maxW = boxW * (1 - TEXT_FIELD_PAD_RATIO * 2)
  const w = font.widthOfTextAtSize(text, size)
  if (w > maxW) size = (size * maxW) / w
  return Math.max(size, 1)
}

type Mapper = {
  /** visual (rotated, y-down) → pdf user space (y-up) */
  toPdf: (vx: number, vy: number) => { x: number; y: number }
  rotate: number
}

function makeMapper(page: PDFPage, info: PageInfo): Mapper {
  const box = page.getCropBox()
  const W = box.width
  const H = box.height
  const ox = box.x
  const oy = box.y
  const rotation = ((page.getRotation().angle % 360) + 360) % 360

  switch (rotation) {
    case 90:
      return { rotate: 90, toPdf: (vx, vy) => ({ x: ox + vy, y: oy + vx }) }
    case 180:
      return { rotate: 180, toPdf: (vx, vy) => ({ x: ox + W - vx, y: oy + vy }) }
    case 270:
      return { rotate: 270, toPdf: (vx, vy) => ({ x: ox + W - vy, y: oy + H - vx }) }
    default:
      void info
      return { rotate: 0, toPdf: (vx, vy) => ({ x: ox + vx, y: oy + H - vy }) }
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export async function exportSignedPdf(input: ExportInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input.bytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pdfPages = pdf.getPages()
  const imageCache = new Map<string, PDFImage>()

  const embed = async (dataUrl: string) => {
    const cached = imageCache.get(dataUrl)
    if (cached) return cached
    const img = await pdf.embedPng(dataUrlToBytes(dataUrl))
    imageCache.set(dataUrl, img)
    return img
  }

  for (const field of input.fields) {
    const page = pdfPages[field.pageIndex]
    const info = input.pages[field.pageIndex]
    if (!page || !info) continue

    const { toPdf, rotate } = makeMapper(page, info)
    const Wv = info.width
    const Hv = info.height

    const vx0 = field.x * Wv
    const vy0 = field.y * Hv
    const vw = field.w * Wv
    const vh = field.h * Hv

    const fieldRot = field.rotation || 0
    const totalDeg = ((rotate - fieldRot) % 360 + 360) % 360
    const rad = (totalDeg * Math.PI) / 180

    // Center in visual screen coordinates
    const vcx = vx0 + vw / 2
    const vcy = vy0 + vh / 2
    const centerPdf = toPdf(vcx, vcy)

    // Compute anchor (bottom-left of unrotated rectangle) rotated around center in PDF space
    const anchorX = centerPdf.x - (vw / 2) * Math.cos(rad) + (vh / 2) * Math.sin(rad)
    const anchorY = centerPdf.y - (vw / 2) * Math.sin(rad) - (vh / 2) * Math.cos(rad)

    if (field.kind === 'signature' || field.kind === 'initials') {
      const asset = field.kind === 'signature' ? input.signatures.signature : input.signatures.initials
      if (!asset) continue
      const img = await embed(asset.dataUrl)
      page.drawImage(img, { x: anchorX, y: anchorY, width: vw, height: vh, rotate: degrees(totalDeg) })
      continue
    }

    const text =
      field.kind === 'name'
        ? input.signatures.fullName
        : field.kind === 'date'
          ? input.dateText
          : (field.text ?? '')
    if (!text.trim()) continue

    let drawn = false
    if (fieldRot === 0) {
      try {
        const size = fitTextSize(font, text, vw, vh)
        const textW = font.widthOfTextAtSize(text, size)
        const capH = font.heightAtSize(size, { descender: false })
        const baselineVx = vx0 + vw * TEXT_FIELD_PAD_RATIO + Math.max(0, (vw * (1 - TEXT_FIELD_PAD_RATIO * 2) - textW) / 2)
        const baselineVy = vy0 + vh / 2 + capH / 2 - size * 0.08
        const anchor = toPdf(baselineVx, baselineVy)
        page.drawText(text, {
          x: anchor.x,
          y: anchor.y,
          size,
          font,
          color: hexToRgb('#111111'),
          rotate: degrees(rotate),
        })
        drawn = true
      } catch {
        drawn = false
      }
    }

    if (!drawn) {
      // Characters outside WinAnsi or rotated text: rasterize as crisp image
      const asset = rasterizeText(text, vw / vh)
      if (!asset) continue
      const img = await embed(asset)
      page.drawImage(img, { x: anchorX, y: anchorY, width: vw, height: vh, rotate: degrees(totalDeg) })
    }
  }

  pdf.setModificationDate(new Date())
  return pdf.save({ useObjectStreams: true })
}

function rasterizeText(text: string, aspect: number): string | null {
  const h = 200
  const w = Math.max(1, Math.round(h * aspect))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let size = h * 0.62
  ctx.font = `${size}px Helvetica, Arial, sans-serif`
  const maxW = w * (1 - TEXT_FIELD_PAD_RATIO * 2)
  const tw = ctx.measureText(text).width
  if (tw > maxW) {
    size = (size * maxW) / tw
    ctx.font = `${size}px Helvetica, Arial, sans-serif`
  }
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, w / 2, h / 2)
  return canvas.toDataURL('image/png')
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function signedFilename(original: string) {
  const base = original.replace(/\.pdf$/i, '')
  return `${base}_signed.pdf`
}
