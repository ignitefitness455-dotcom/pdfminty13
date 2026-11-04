import type { PDFFont, PDFImage, PDFPage } from '@cantoo/pdf-lib';

import { PDFSanitizer } from '../../core/PDFSanitizer';

import type { PageInfo, PlacedField, SignatureSet } from './types';

export type ExportInput = {
  bytes: ArrayBuffer;
  pages: PageInfo[];
  fields: PlacedField[];
  signatures: SignatureSet;
  dateText: string;
};

/** Horizontal padding (fraction of box width) used for text fields on screen and in the PDF. */
export const TEXT_FIELD_PAD_RATIO = 0.04;

/**
 * Fit a font size so the text fits both the box height and width.
 */
export function fitTextSize(font: PDFFont, text: string, boxW: number, boxH: number): number {
  let size = boxH * 0.62;
  const maxW = boxW * (1 - TEXT_FIELD_PAD_RATIO * 2);
  const w = font.widthOfTextAtSize(text, size);
  if (w > maxW) size = (size * maxW) / w;
  return Math.max(size, 1);
}

type Mapper = {
  /** visual (rotated, y-down) → pdf user space (y-up) */
  toPdf: (vx: number, vy: number) => { x: number; y: number };
  rotate: number;
};

function makeMapper(page: PDFPage, info: PageInfo): Mapper {
  const box = page.getCropBox();
  const W = box.width;
  const H = box.height;
  const ox = box.x;
  const oy = box.y;
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;

  switch (rotation) {
    case 90:
      return { rotate: 90, toPdf: (vx, vy) => ({ x: ox + vy, y: oy + vx }) };
    case 180:
      return { rotate: 180, toPdf: (vx, vy) => ({ x: ox + W - vx, y: oy + vy }) };
    case 270:
      return { rotate: 270, toPdf: (vx, vy) => ({ x: ox + W - vy, y: oy + H - vx }) };
    default:
      void info;
      return { rotate: 0, toPdf: (vx, vy) => ({ x: ox + vx, y: oy + H - vy }) };
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hexToRgbTuple(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  );
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

export async function exportSignedPdf(input: ExportInput): Promise<Uint8Array> {
  if (!input.fields || input.fields.length === 0) {
    throw new Error('At least one signature, stamp, or form field must be placed on the PDF.');
  }
  const inputUint8 = new Uint8Array(input.bytes);
  if (await PDFSanitizer.isEncrypted(inputUint8)) {
    throw new Error(
      'SECURED_LOCKED: This PDF is password-protected or encrypted. Please use the Unlock PDF tool first.'
    );
  }
  PDFSanitizer.sanitize(inputUint8);
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.load(inputUint8);
  if (pdf.getPageCount() === 0) {
    throw new Error('The PDF document has 0 pages and cannot be signed.');
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // Flatten interactive form fields into permanent content stream FIRST (skip dynamic XFA)
  // so that opaque form widget backgrounds never paint over user-placed signatures/stamps.
  try {
    const { PDFName, PDFDict } = await import('@cantoo/pdf-lib');
    const acroForm = pdf.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
    if (!acroForm || !acroForm.has(PDFName.of('XFA'))) {
      const form = pdf.getForm();
      form.flatten();
    }
  } catch {
    // PDF might not contain an interactive AcroForm
  }

  const pdfPages = pdf.getPages();
  const imageCache = new Map<string, PDFImage>();
  let appliedFieldCount = 0;

  const embed = async (dataUrl: string) => {
    const cached = imageCache.get(dataUrl);
    if (cached) return cached;
    const img = await pdf.embedPng(dataUrlToBytes(dataUrl));
    imageCache.set(dataUrl, img);
    return img;
  };

  for (const field of input.fields) {
    const page = pdfPages[field.pageIndex];
    const info = input.pages[field.pageIndex];
    if (!page || !info) continue;

    const { toPdf, rotate } = makeMapper(page, info);
    const Wv = info.width;
    const Hv = info.height;

    const vx0 = field.x * Wv;
    const vy0 = field.y * Hv;
    const vw = field.w * Wv;
    const vh = field.h * Hv;

    const fieldRot = field.rotation || 0;
    const totalDeg = (((rotate - fieldRot) % 360) + 360) % 360;
    const rad = (totalDeg * Math.PI) / 180;

    // Center in visual screen coordinates
    const vcx = vx0 + vw / 2;
    const vcy = vy0 + vh / 2;
    const centerPdf = toPdf(vcx, vcy);

    // Compute anchor (bottom-left of unrotated rectangle) rotated around center in PDF space
    const anchorX = centerPdf.x - (vw / 2) * Math.cos(rad) + (vh / 2) * Math.sin(rad);
    const anchorY = centerPdf.y - (vw / 2) * Math.sin(rad) - (vh / 2) * Math.cos(rad);

    if (field.kind === 'signature' || field.kind === 'initials') {
      const asset =
        field.kind === 'signature' ? input.signatures.signature : input.signatures.initials;
      if (!asset) continue;
      const img = await embed(asset.dataUrl);
      page.drawImage(img, {
        x: anchorX,
        y: anchorY,
        width: vw,
        height: vh,
        rotate: degrees(totalDeg),
      });
      appliedFieldCount++;
      continue;
    }

    if (field.kind === 'checkmark') {
      const asset = rasterizeCheckmark(vw / vh);
      if (asset) {
        const img = await embed(asset);
        page.drawImage(img, {
          x: anchorX,
          y: anchorY,
          width: vw,
          height: vh,
          rotate: degrees(totalDeg),
        });
      } else {
        const p1 = toPdf(vx0 + vw * 0.2, vy0 + vh * 0.52);
        const p2 = toPdf(vx0 + vw * 0.42, vy0 + vh * 0.76);
        const p3 = toPdf(vx0 + vw * 0.82, vy0 + vh * 0.24);
        const thickness = Math.max(1.5, Math.min(vw, vh) * 0.12);
        page.drawLine({ start: p1, end: p2, thickness, color: rgb(0.02, 0.59, 0.41) });
        page.drawLine({ start: p2, end: p3, thickness, color: rgb(0.02, 0.59, 0.41) });
      }
      appliedFieldCount++;
      continue;
    }

    if (field.kind === 'cross') {
      const asset = rasterizeCross(vw / vh);
      if (asset) {
        const img = await embed(asset);
        page.drawImage(img, {
          x: anchorX,
          y: anchorY,
          width: vw,
          height: vh,
          rotate: degrees(totalDeg),
        });
      } else {
        const a1 = toPdf(vx0 + vw * 0.25, vy0 + vh * 0.25);
        const a2 = toPdf(vx0 + vw * 0.75, vy0 + vh * 0.75);
        const b1 = toPdf(vx0 + vw * 0.75, vy0 + vh * 0.25);
        const b2 = toPdf(vx0 + vw * 0.25, vy0 + vh * 0.75);
        const thickness = Math.max(1.5, Math.min(vw, vh) * 0.12);
        page.drawLine({ start: a1, end: a2, thickness, color: rgb(0.86, 0.15, 0.15) });
        page.drawLine({ start: b1, end: b2, thickness, color: rgb(0.86, 0.15, 0.15) });
      }
      appliedFieldCount++;
      continue;
    }

    if (field.kind === 'stamp') {
      const asset = rasterizeStamp(input.signatures.fullName, input.dateText, vw / vh);
      if (asset) {
        const img = await embed(asset);
        page.drawImage(img, {
          x: anchorX,
          y: anchorY,
          width: vw,
          height: vh,
          rotate: degrees(totalDeg),
        });
      } else {
        page.drawRectangle({
          x: anchorX,
          y: anchorY,
          width: vw,
          height: vh,
          borderColor: rgb(0.02, 0.47, 0.34),
          borderWidth: 1.5,
          color: rgb(0.93, 0.99, 0.96),
          rotate: degrees(totalDeg),
        });
      }
      appliedFieldCount++;
      continue;
    }

    const text =
      field.kind === 'name'
        ? input.signatures.fullName
        : field.kind === 'date'
          ? input.dateText
          : (field.text ?? '');
    if (!text.trim()) continue;

    let drawn = false;
    if (fieldRot === 0) {
      try {
        const size = fitTextSize(font, text, vw, vh);
        const textW = font.widthOfTextAtSize(text, size);
        const capH = font.heightAtSize(size, { descender: false });
        const baselineVx =
          vx0 +
          vw * TEXT_FIELD_PAD_RATIO +
          Math.max(0, (vw * (1 - TEXT_FIELD_PAD_RATIO * 2) - textW) / 2);
        const baselineVy = vy0 + vh / 2 + capH / 2 - size * 0.08;
        const anchor = toPdf(baselineVx, baselineVy);
        const ink = hexToRgbTuple('#111111');
        page.drawText(text, {
          x: anchor.x,
          y: anchor.y,
          size,
          font,
          color: rgb(ink.r, ink.g, ink.b),
          rotate: degrees(rotate),
        });
        drawn = true;
        appliedFieldCount++;
      } catch {
        drawn = false;
      }
    }

    if (!drawn) {
      // Characters outside WinAnsi or rotated text: rasterize as crisp image
      const asset = rasterizeText(text, vw / vh);
      if (asset) {
        const img = await embed(asset);
        page.drawImage(img, {
          x: anchorX,
          y: anchorY,
          width: vw,
          height: vh,
          rotate: degrees(totalDeg),
        });
        appliedFieldCount++;
      } else {
        // Fallback when 2D canvas is unavailable (e.g. headless test environments)
        const asciiSafe = text.replace(/[^\x20-\x7E]/g, '?') || '?';
        const size = fitTextSize(font, asciiSafe, vw, vh);
        page.drawText(asciiSafe, {
          x: anchorX,
          y: anchorY,
          size,
          font,
          color: rgb(0.07, 0.07, 0.07),
          rotate: degrees(totalDeg),
        });
        appliedFieldCount++;
      }
    }
  }

  if (appliedFieldCount === 0) {
    throw new Error(
      'No visible signature, stamp, or text content was provided for the placed fields.'
    );
  }

  pdf.setModificationDate(new Date());
  return pdf.save({ useObjectStreams: true });
}

function rasterizeCheckmark(aspect: number): string | null {
  const h = 200;
  const w = Math.max(1, Math.round(h * aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.strokeStyle = '#059669'; // Emerald ink
  ctx.lineWidth = Math.min(w, h) * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.52);
  ctx.lineTo(w * 0.42, h * 0.76);
  ctx.lineTo(w * 0.82, h * 0.24);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function rasterizeCross(aspect: number): string | null {
  const h = 200;
  const w = Math.max(1, Math.round(h * aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.strokeStyle = '#dc2626'; // Rose red ink
  ctx.lineWidth = Math.min(w, h) * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(w * 0.25, h * 0.25);
  ctx.lineTo(w * 0.75, h * 0.75);
  ctx.moveTo(w * 0.75, h * 0.25);
  ctx.lineTo(w * 0.25, h * 0.75);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function rasterizeStamp(signerName: string, dateStr: string, aspect: number): string | null {
  const h = 240;
  const w = Math.max(1, Math.round(h * aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background pill / seal
  ctx.fillStyle = 'rgba(236, 253, 245, 0.9)'; // emerald tint
  ctx.strokeStyle = '#047857'; // emerald-700
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, 16);
  ctx.fill();
  ctx.stroke();

  // Inner dashed border
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.setLineDash([]);

  // Title text
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ELECTRONICALLY SIGNED', w / 2, 48);

  // Signer Name
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(signerName || 'VISUAL E-SIGNATURE', w / 2, 100);

  // Stamp metadata (visual representation, not PKCS#7 cryptographic certificate)
  ctx.fillStyle = '#047857';
  ctx.font = '16px monospace';
  ctx.fillText(`DATE: ${dateStr}`, w / 2, 145);
  ctx.fillText('PDFMINTY VISUAL E-SIGN STAMP', w / 2, 180);

  return canvas.toDataURL('image/png');
}

function rasterizeText(text: string, aspect: number): string | null {
  const h = 200;
  const w = Math.max(1, Math.round(h * aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let size = h * 0.62;
  ctx.font = `${size}px Helvetica, Arial, sans-serif`;
  const maxW = w * (1 - TEXT_FIELD_PAD_RATIO * 2);
  const tw = ctx.measureText(text).width;
  if (tw > maxW) {
    size = (size * maxW) / tw;
    ctx.font = `${size}px Helvetica, Arial, sans-serif`;
  }
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
  return canvas.toDataURL('image/png');
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function signedFilename(original: string) {
  const base = original.replace(/\.pdf$/i, '');
  return `${base}_signed.pdf`;
}
