import type { SignatureAsset } from './types'

/**
 * Crop a canvas to the bounding box of its non-transparent pixels and return a PNG asset.
 */
export function trimCanvasToAsset(source: HTMLCanvasElement, padding = 8): SignatureAsset | null {
  const ctx = source.getContext('2d')
  if (!ctx) return null
  const { width, height } = source
  const { data } = ctx.getImageData(0, 0, width, height)

  let top = height
  let left = width
  let right = -1
  let bottom = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 8) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  if (right < 0 || bottom < 0) return null

  const x0 = Math.max(0, left - padding)
  const y0 = Math.max(0, top - padding)
  const x1 = Math.min(width, right + padding + 1)
  const y1 = Math.min(height, bottom + padding + 1)
  const w = x1 - x0
  const h = y1 - y0

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  if (!octx) return null
  octx.drawImage(source, x0, y0, w, h, 0, 0, w, h)

  return { dataUrl: out.toDataURL('image/png'), width: w, height: h }
}

/**
 * Render typed text in a script font onto a transparent canvas, high resolution.
 */
export async function typedTextToAsset(
  text: string,
  fontFamily: string,
  color: string,
): Promise<SignatureAsset | null> {
  const value = text.trim()
  if (!value) return null

  const fontSize = 160
  const fontSpec = `${fontSize}px ${fontFamily}`
  try {
    await document.fonts.load(fontSpec, value)
  } catch {
    // fall through and render with whatever is available
  }

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return null
  measure.font = fontSpec
  const metrics = measure.measureText(value)
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.3
  const pad = fontSize * 0.25

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(metrics.width + pad * 2)
  canvas.height = Math.ceil(ascent + descent + pad * 2)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.font = fontSpec
  ctx.fillStyle = color
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(value, pad, pad + ascent)

  return trimCanvasToAsset(canvas, 12)
}

/**
 * Load an uploaded image, optionally knock out a light background, and return a PNG asset.
 */
export function imageFileToAsset(file: File, removeBackground: boolean): Promise<SignatureAsset | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      if (removeBackground) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          // fade near-white pixels out smoothly so anti-aliased strokes stay intact
          if (luminance > 235) d[i + 3] = 0
          else if (luminance > 180) d[i + 3] = Math.round(d[i + 3] * (1 - (luminance - 180) / 55))
        }
        ctx.putImageData(imageData, 0, 0)
      }

      resolve(trimCanvasToAsset(canvas, 6))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
