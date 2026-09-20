import type { PDFDocumentProxy } from 'pdfjs-dist';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { getPdfJs } from '../core/index';

import { DocumentPreview } from './DocumentPreview';

interface PdfPreviewProps {
  file: File;
  selectedPages?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  rotations?: Record<number, number>;
  scale?: number;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  file,
  selectedPages,
  onSelectionChange,
  rotations,
  scale,
}) => {
  const { t } = useTranslation('common');
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => { /* ignore */ });
        pdfDocRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdfjs = await getPdfJs();
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (!cancelled) {
          if (pdfDocRef.current) {
            try {
              await pdfDocRef.current.destroy();
            } catch {
              // ignore
            }
          }
          pdfDocRef.current = doc;
          setPdfDoc(doc);
          setPageCount(doc.numPages);
        } else {
          try {
            await doc.destroy();
          } catch {
            // ignore
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : t('preview.failedToLoad', { defaultValue: 'Failed to load PDF preview.' });
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [file, t]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2 animate-pulse">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-surface-container-low rounded-xl border border-border-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-rose-500 font-medium py-4 text-center">
        {t('preview.unavailable', { error, defaultValue: `Preview unavailable: ${error}` })}
      </div>
    );
  }

  if (!pdfDoc) return null;

  return (
    <DocumentPreview
      pdfDoc={pdfDoc}
      pageCount={pageCount}
      selectedPages={selectedPages}
      onSelectionChange={onSelectionChange}
      rotations={rotations}
      scale={scale}
    />
  );
};

export default PdfPreview;
