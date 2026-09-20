declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  }
}

if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e: ErrorEvent) => {
    if (e.message && typeof e.message === 'string' && e.message.toLowerCase().includes('resizeobserver')) {
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
    }
  });
}

export {};
