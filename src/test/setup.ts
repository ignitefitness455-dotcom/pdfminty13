import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver
class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// URL.createObjectURL / revokeObjectURL
let urlCounter = 0;
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockImplementation(() => `blob:test:${++urlCounter}`),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      installing: null,
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    controller: null,
  },
});

// OffscreenCanvas
Object.defineProperty(global, 'OffscreenCanvas', {
  writable: true,
  value: class MockOffscreenCanvas {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        scale: vi.fn(),
        fillStyle: '',
      };
    }
    convertToBlob = vi.fn().mockResolvedValue(new Blob([], { type: 'image/png' }));
  },
});

// Override crypto.randomUUID directly — jsdom provides crypto but we want
// deterministic UUIDs in tests.
Object.defineProperty(global.crypto, 'randomUUID', {
  writable: true,
  value: vi.fn().mockReturnValue('test-uuid-mock'),
});

// Global fetch mock — components like FeedbackModal/ContactModal call /api/*
// endpoints. Default to a failed response; individual tests can override.
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 500,
  headers: new Headers(),
  json: vi.fn().mockResolvedValue({ error: 'Mock fetch default' }),
  text: vi.fn().mockResolvedValue(''),
}) as unknown as typeof global.fetch;

// Mock HTMLAnchorElement.click for download tests.
HTMLAnchorElement.prototype.click = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  try {
    window.localStorage.clear();
  } catch {
    // Ignore.
  }
});

beforeEach(() => {
  document.body.innerHTML = '';
});
