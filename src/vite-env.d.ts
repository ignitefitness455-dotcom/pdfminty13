/// <reference types="vite/client" />

declare module '*.ttf?arraybuffer' {
  const buffer: ArrayBuffer;
  export default buffer;
}

declare module '*?worker' {
  const WorkerFactory: { new (): Worker };
  export default WorkerFactory;
}

declare module 'pdfjs-dist/image_decoders/pdf.image_decoders.mjs' {
  export class JpegImage {
    width: number;
    height: number;
    parse(data: Uint8Array): void;
    getData(params: {
      width: number;
      height: number;
      forceRGBA?: boolean;
      isSourcePDF?: boolean;
    }): Uint8Array | Uint8ClampedArray;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
