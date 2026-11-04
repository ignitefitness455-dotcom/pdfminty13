import { PDFDocument, StandardFonts, degrees } from '@cantoo/pdf-lib';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { exportSignedPdf, fitTextSize } from '../components/sign-pdf/export';
import { PlacedFieldView } from '../components/sign-pdf/placed-field';
import { initialsFromName } from '../components/sign-pdf/signature-image';
import type { PageInfo, PlacedField, SignatureSet } from '../components/sign-pdf/types';
import { UploadScreen } from '../components/sign-pdf/upload-screen';

// Minimal valid 1x1 transparent PNG data URL
const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function createSamplePdf(options?: {
  rotation?: 0 | 90 | 180 | 270;
  withAcroForm?: boolean;
}): Promise<{ bytes: ArrayBuffer; pages: PageInfo[] }> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const rot = options?.rotation ?? 0;
  if (rot !== 0) {
    page.setRotation(degrees(rot));
  }

  if (options?.withAcroForm) {
    const form = pdf.getForm();
    const tf = form.createTextField('signer_name');
    tf.setText('Pre-filled Form Value');
    tf.addToPage(page, { x: 100, y: 600, width: 200, height: 30 });
  }

  const saved = await pdf.save();
  const ab = saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength) as ArrayBuffer;
  const isRotated90or270 = rot === 90 || rot === 270;
  return {
    bytes: ab,
    pages: [
      {
        index: 0,
        width: isRotated90or270 ? 792 : 612,
        height: isRotated90or270 ? 612 : 792,
        rotation: rot,
      },
    ],
  };
}

const SAMPLE_SIGNATURES: SignatureSet = {
  fullName: 'Jane Doe',
  initialsText: 'JD',
  signature: {
    dataUrl: ONE_PIXEL_PNG,
    width: 320,
    height: 100,
  },
  initials: {
    dataUrl: ONE_PIXEL_PNG,
    width: 120,
    height: 80,
  },
};

describe('Tool #22: Sign PDF — Unit & Regression Suite', () => {
  it('computes initialsFromName accurately and fits text within field bounds', async () => {
    expect(initialsFromName('Jane Marie Doe')).toBe('JMD');
    expect(initialsFromName('  alice   smith  ')).toBe('AS');
    expect(initialsFromName('')).toBe('');

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const shortSize = fitTextSize(font, 'JD', 150, 30);
    const longSize = fitTextSize(
      font,
      'A Very Long Signer Name That Must Shrink To Fit Inside Box',
      150,
      30
    );
    expect(shortSize).toBeCloseTo(30 * 0.62, 2);
    expect(longSize).toBeLessThan(shortSize);
    expect(longSize).toBeGreaterThanOrEqual(1);
  });

  it('exports signed PDF across 0°, 90°, 180°, and 270° rotated pages and flattens AcroForms first', async () => {
    for (const rotation of [0, 90, 180, 270] as const) {
      const { bytes, pages } = await createSamplePdf({ rotation, withAcroForm: true });
      const fields: PlacedField[] = [
        {
          id: 'sig-1',
          kind: 'signature',
          pageIndex: 0,
          x: 0.2,
          y: 0.2,
          w: 0.24,
          h: 0.075,
          rotation: 0,
        },
        {
          id: 'name-1',
          kind: 'name',
          pageIndex: 0,
          x: 0.2,
          y: 0.35,
          w: 0.25,
          h: 0.045,
        },
        {
          id: 'date-1',
          kind: 'date',
          pageIndex: 0,
          x: 0.5,
          y: 0.35,
          w: 0.2,
          h: 0.045,
        },
        {
          id: 'check-1',
          kind: 'checkmark',
          pageIndex: 0,
          x: 0.1,
          y: 0.5,
          w: 0.06,
          h: 0.045,
        },
        {
          id: 'cross-1',
          kind: 'cross',
          pageIndex: 0,
          x: 0.2,
          y: 0.5,
          w: 0.06,
          h: 0.045,
        },
        {
          id: 'stamp-1',
          kind: 'stamp',
          pageIndex: 0,
          x: 0.4,
          y: 0.5,
          w: 0.32,
          h: 0.12,
        },
      ];

      const output = await exportSignedPdf({
        bytes,
        pages,
        fields,
        signatures: SAMPLE_SIGNATURES,
        dateText: 'Nov 4, 2026',
      });

      expect(output.byteLength).toBeGreaterThan(100);
      const reloaded = await PDFDocument.load(output);
      expect(reloaded.getPageCount()).toBe(1);
      // Verify interactive AcroForm fields were flattened
      expect(reloaded.getForm().getFields().length).toBe(0);
    }
  });

  it('rejects export when no fields are placed or when PDF is encrypted', async () => {
    const { bytes, pages } = await createSamplePdf();

    await expect(
      exportSignedPdf({
        bytes,
        pages,
        fields: [],
        signatures: SAMPLE_SIGNATURES,
        dateText: '2026-11-04',
      })
    ).rejects.toThrow(/At least one signature/i);

    const encDoc = await PDFDocument.create();
    encDoc.addPage([100, 100]);
    encDoc.encrypt({ userPassword: 'secret', ownerPassword: 'secret' });
    const encryptedBytes = await encDoc.save();
    await expect(
      exportSignedPdf({
        bytes: encryptedBytes.buffer.slice(
          encryptedBytes.byteOffset,
          encryptedBytes.byteOffset + encryptedBytes.byteLength
        ) as ArrayBuffer,
        pages,
        fields: [
          {
            id: 'f1',
            kind: 'signature',
            pageIndex: 0,
            x: 0.1,
            y: 0.1,
            w: 0.24,
            h: 0.075,
          },
        ],
        signatures: SAMPLE_SIGNATURES,
        dateText: '2026-11-04',
      })
    ).rejects.toThrow(/SECURED_LOCKED/i);
  });

  it('preserves exact signature aspect ratio during resize without jumping on portrait pages', () => {
    const onChange = vi.fn();
    const initialField: PlacedField = {
      id: 'sig-resize',
      kind: 'signature',
      pageIndex: 0,
      x: 0.2,
      y: 0.2,
      w: 0.24,
      h: 0.075,
    };

    const { container } = render(
      <PlacedFieldView
        field={initialField}
        pageWidth={612}
        pageHeight={792}
        signatures={SAMPLE_SIGNATURES}
        dateText="2026-11-04"
        selected={true}
        onSelect={() => {}}
        onChange={onChange}
        onRemove={() => {}}
      />
    );

    const resizeHandle = container.querySelector('[aria-label="Resize"]') as HTMLElement;
    expect(resizeHandle).toBeTruthy();

    // Start resize at (100, 100) and drag horizontally by 0px — height must NOT jump by 612/792
    fireEvent.pointerDown(resizeHandle, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(resizeHandle, { clientX: 100, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenLastCalledWith({
      w: expect.closeTo(0.24, 5),
      h: expect.closeTo(0.075, 5),
    });

    // Drag horizontally by +61.2px (+0.10 normalized width): aspect w/h = 3.2 must remain constant
    fireEvent.pointerMove(resizeHandle, { clientX: 161.2, clientY: 100, pointerId: 1 });
    const callArg = onChange.mock.calls[onChange.mock.calls.length - 1][0] as {
      w: number;
      h: number;
    };
    expect(callArg.w).toBeCloseTo(0.34, 4);
    expect(callArg.w / callArg.h).toBeCloseTo(0.24 / 0.075, 4);
  });

  it('displays an accessible alert with Unlock PDF link when an encrypted PDF error is shown in UploadScreen', () => {
    render(
      <MemoryRouter>
        <UploadScreen
          onFile={() => {}}
          error="This PDF is password-protected or encrypted. Please use the Unlock PDF tool first."
          limitMB={20}
        />
      </MemoryRouter>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/password-protected or encrypted/i);
    const unlockLink = screen.getByRole('link', { name: /Unlock PDF/i });
    expect(unlockLink).toHaveAttribute('href', '/unlock-pdf/');
  });
});
