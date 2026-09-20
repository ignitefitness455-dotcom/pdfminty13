type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = (() => {
    try {
      const meta = import.meta as unknown as { env?: { DEV: boolean } };
      return meta && meta.env ? meta.env.DEV : process.env.NODE_ENV !== 'production';
    } catch {
      return typeof process !== 'undefined' && process.env ? process.env.NODE_ENV !== 'production' : true;
    }
  })();

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[PDFMinty][${level.toUpperCase()}][${timestamp}]`;
    if (level === 'error') console.error(prefix, message, ...args);
    else if (level === 'warn') console.warn(prefix, message, ...args);
    else if (this.isDev) console.log(prefix, message, ...args);
  }
  debug(message: string, ...args: unknown[]) { this.log('debug', message, ...args); }
  info(message: string, ...args: unknown[]) { this.log('info', message, ...args); }
  warn(message: string, ...args: unknown[]) { this.log('warn', message, ...args); }
  error(message: string, ...args: unknown[]) { this.log('error', message, ...args); }
}

export const logger = new Logger();
