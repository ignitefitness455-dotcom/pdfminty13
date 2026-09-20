import { logger } from '../utils/logger';

import { editMetadataPDF, type MetadataPayload } from './metadata-operations';
import { PDFSanitizer } from './PDFSanitizer';

interface WorkerPromise {
  resolve: (val: unknown) => void;
  reject: (err: Error) => void;
  onProgress?: (progress: { current: number; total: number }) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;
  private promises: Map<string, WorkerPromise> = new Map();
  private isSupported: boolean;

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  private initWorker() {
    if (!this.worker && this.isSupported) {
      this.worker = new Worker(new URL('../workers/pdf-worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (err) => {
        logger.error('Worker error:', err);
        // Reject ALL pending promises so callers don't hang until the 120s timeout.
        // Then null out the worker so the next operation re-initializes a fresh one.
        for (const [id, promise] of this.promises.entries()) {
          clearTimeout(promise.timer);
          promise.reject(new Error('Worker crashed during processing. Please try again.'));
          this.promises.delete(id);
        }
        // Mark worker as dead so next runOperation re-creates it.
        try {
          this.worker?.terminate();
        } catch {
          // Ignore — may already be terminated.
        }
        this.worker = null;
      };
    }
    return this.worker;
  }

  private handleMessage(e: MessageEvent) {
    const { id, success, progress, result, error } = e.data;
    const promise = this.promises.get(id);
    if (promise) {
      if (progress) {
        promise.onProgress?.(progress);
        return;
      }
      clearTimeout(promise.timer);
      if (success) {
        promise.resolve(result);
      } else {
        promise.reject(new Error(error));
      }
      this.promises.delete(id);
    }
  }

  public async runOperation<T>(
    operation: string,
    payload: unknown,
    transferables: Transferable[] = [],
    onProgress?: (progress: { current: number; total: number }) => void
  ): Promise<T> {
    if (!this.isSupported) {
      logger.warn('Web Workers not supported, running on main thread.');
      return (await this.runOnMainThread(operation, payload, onProgress)) as T;
    }

    const worker = this.initWorker();
    if (!worker) {
      return (await this.runOnMainThread(operation, payload, onProgress)) as T;
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2);

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.promises.has(id)) {
          this.promises.delete(id);
          reject(new Error('Processing timed out — try a smaller file.'));
        }
      }, 120 * 1000); // 120 seconds timeout

      this.promises.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
        onProgress,
        timer,
      });

      try {
        worker.postMessage({ id, operation, payload }, transferables);
      } catch (err: unknown) {
        clearTimeout(timer);
        this.promises.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const promise of this.promises.values()) {
      clearTimeout(promise.timer);
      promise.reject(new Error('Worker was terminated.'));
    }
    this.promises.clear();
  }

  private async runOnMainThread(
    operation: string,
    payload: unknown,
    onProgress?: (progress: { current: number; total: number }) => void
  ): Promise<unknown> {
    const ops = await import('../core/pdf-operations');
    // Narrow payload per-operation. We trust the caller to pass the right shape
    // (same as the worker does), but TypeScript can't verify it at the boundary.
    const p = payload as Record<string, unknown>;
    switch (operation) {
      case 'mergePDFs':
        return await ops.mergePDFs(p.filesBytes as Uint8Array[]);
      case 'splitPDF':
        return await ops.splitPDF(p.bytes as Uint8Array, p.ranges as string);
      case 'extractPages':
        return await ops.extractPages(p.bytes as Uint8Array, p.pageNumbers as number[]);
      case 'rotatePDF':
        return await ops.rotatePDF(p.bytes as Uint8Array, p.degreesValue as number, p.pageIndices as number[] | undefined);
      case 'deletePagesPDF':
        return await ops.deletePagesPDF(p.bytes as Uint8Array, p.pageIndices as number[]);
      case 'reorderPDF':
        return await ops.reorderPDF(p.bytes as Uint8Array, p.newOrder as number[]);
      case 'watermarkPDF':
        return await ops.watermarkPDF(p.bytes as Uint8Array, p.text as string, p.options as { opacity?: number; size?: number; rotationDegrees?: number; colorHex?: string } | undefined);
      case 'addPageNumbersPDF':
        return await ops.addPageNumbersPDF(p.bytes as Uint8Array, p.options as { format?: string; position?: string; startFrom?: number; skipFirstPage?: boolean } | undefined);
      case 'addBlankPagePDF':
        return await ops.addBlankPagePDF(p.bytes as Uint8Array, p.position as 'start' | 'end' | number, p.pageSizeKey as keyof typeof import('../config/constants').PDF_PAGE_SIZES | undefined);
      case 'imagesToPDF':
        return await ops.imagesToPDF(p.imageBlobs as { buf: Uint8Array; type: string; name?: string }[], p.options as { pageSize?: keyof typeof import('../config/constants').PDF_PAGE_SIZES } | undefined);
      case 'compressPDF':
        return await ops.compressPDF(p.bytes as Uint8Array, p.level as 'basic' | 'medium' | 'maximum' | undefined);
      case 'protectPDF':
        return await ops.protectPDF(p as { fileBytes: Uint8Array; userPassword: string });
      case 'unlockPDF':
        return await ops.unlockPDF(p as { fileBytes: Uint8Array; password: string });
      case 'pdfToImage':
        return await ops.pdfToImage(
          p.bytes as Uint8Array,
          p.originalName as string,
          p.scale as number | undefined,
          p.maxPages as number | undefined,
          p.format as 'image/png' | 'image/jpeg' | undefined,
          p.startPage as number | undefined
        );
      case 'getPageCount':
        return await ops.getPageCount(p.bytes as Uint8Array);
      case 'grayscalePDF':
        return await ops.grayscalePDF(p.bytes as Uint8Array, p.scale as number | undefined);
      case 'flattenPDF':
        return await ops.flattenPDF(p.bytes as Uint8Array);
      case 'repairPDF':
        return await ops.repairPDF(p.bytes as Uint8Array);
      case 'editMetadataPDF': {
        return await editMetadataPDF(p.bytes as Uint8Array, p.metadata as MetadataPayload);
      }
      case 'sanitizePDF': {
        return PDFSanitizer.sanitize(p.bytes as Uint8Array);
      }
      case 'pdfToMarkdown': {
        return await ops.pdfToMarkdown(
          p.bytes as Uint8Array,
          p.options as { extractImages?: boolean } | undefined,
          onProgress
        );
      }
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}
