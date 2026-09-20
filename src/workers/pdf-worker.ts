/// <reference lib="webworker" />
// Web Worker bridge for PDF client processing
import { editMetadataPDF } from '../core/metadata-operations';
import * as ops from '../core/pdf-operations';
import { PDFSanitizer } from '../core/PDFSanitizer';

self.onmessage = async (e: MessageEvent) => {
  const { id, operation, payload } = e.data;
  try {
    let result: unknown;
    let transferables: Transferable[] = [];

    switch (operation) {
      case 'mergePDFs':
        result = await ops.mergePDFs(payload.filesBytes);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'splitPDF':
        result = await ops.splitPDF(payload.bytes, payload.ranges);
        transferables = (result as Uint8Array[]).map((b) => b.buffer);
        break;
      case 'extractPages':
        result = await ops.extractPages(payload.bytes, payload.pageNumbers);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'rotatePDF':
        result = await ops.rotatePDF(payload.bytes, payload.degreesValue, payload.pageIndices);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'deletePagesPDF':
        result = await ops.deletePagesPDF(payload.bytes, payload.pageIndices);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'reorderPDF':
        result = await ops.reorderPDF(payload.bytes, payload.newOrder);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'watermarkPDF':
        result = await ops.watermarkPDF(payload.bytes, payload.text, payload.options);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'addPageNumbersPDF':
        result = await ops.addPageNumbersPDF(payload.bytes, payload.options);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'addBlankPagePDF':
        result = await ops.addBlankPagePDF(payload.bytes, payload.position, payload.pageSizeKey);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'imagesToPDF':
        result = await ops.imagesToPDF(payload.imageBlobs, payload.options);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'compressPDF':
        result = await ops.compressPDF(payload.bytes, payload.level);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'protectPDF':
        result = await ops.protectPDF(payload);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'unlockPDF':
        result = await ops.unlockPDF(payload);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'pdfToImage':
        result = await ops.pdfToImage(
          payload.bytes,
          payload.originalName,
          payload.scale,
          payload.maxPages,
          payload.format,
          payload.startPage
        );
        transferables = (result as { imageBytes: Uint8Array }[]).map((r) => r.imageBytes.buffer);
        break;
      case 'getPageCount':
        result = await ops.getPageCount(payload.bytes);
        break;
      case 'grayscalePDF':
        result = await ops.grayscalePDF(payload.bytes, payload.scale);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'flattenPDF':
        result = await ops.flattenPDF(payload.bytes);
        transferables = [(result as Uint8Array).buffer];
        break;
      case 'repairPDF': {
        const res = await ops.repairPDF(payload.bytes);
        result = { bytes: res.bytes, repairs: res.repairs };
        transferables = [res.bytes.buffer];
        break;
      }
      case 'editMetadataPDF': {
        result = await editMetadataPDF(payload.bytes, payload.metadata);
        transferables = [(result as Uint8Array).buffer];
        break;
      }
      case 'sanitizePDF': {
        const res = PDFSanitizer.sanitize(payload.bytes);
        result = res;
        transferables = [res.bytes.buffer];
        break;
      }
      case 'pdfToMarkdown': {
        const onProgress = (progress: { current: number; total: number }) => {
          (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, progress });
        };
        result = await ops.pdfToMarkdown(payload.bytes, payload.options, onProgress);
        const resObj = result as {
          markdown: string;
          images: { filename: string; dataBytes: Uint8Array }[];
          pageCount: number;
          isScannedOrImageOnly?: boolean;
        };
        transferables = resObj.images.map((img) => img.dataBytes.buffer);
        break;
      }
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, success: true, result }, transferables);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Worker processing failed';
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({
      id,
      success: false,
      error: message,
    });
  }
};
