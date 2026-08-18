export type LogLevel = 'bootstrap' | 'log' | 'info' | 'warn' | 'error' | 'debug' | 'screen';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class MobileLogger {
  private inMemoryLogs: LogEntry[] = [];
  private readonly maxLogs = 200;

  private formatTimestamp(): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Asia/Manila',
      }).format(new Date());
    } catch {
      return new Date().toISOString();
    }
  }

  private formatLog(level: LogLevel, message: unknown, context?: string): string {
    const time = this.formatTimestamp();
    const ctx = context ?? 'App';
    const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
    return `[${time}] [${ctx}] [${level.toUpperCase()}] ${msg}`;
  }

  private saveToBuffer(entry: LogEntry): void {
    this.inMemoryLogs.push(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.shift();
    }
  }

  bootstrap(message: unknown, context?: string): void {
    const formatted = this.formatLog('bootstrap', message, context ?? 'Bootstrap');
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'bootstrap',
      context: context ?? 'Bootstrap',
      message: String(message),
    });

    if (__DEV__) {
      console.log(`🚀 ${formatted}`);
    }
  }

  log(message: unknown, context?: string, data?: unknown): void {
    const formatted = this.formatLog('log', message, context);
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'log',
      context: context ?? 'App',
      message: String(message),
      data,
    });

    if (__DEV__) {
      if (data !== undefined) {
        console.log(`📝 ${formatted}`, data);
      } else {
        console.log(`📝 ${formatted}`);
      }
    }
  }

  info(message: unknown, context?: string, data?: unknown): void {
    const formatted = this.formatLog('info', message, context);
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'info',
      context: context ?? 'App',
      message: String(message),
      data,
    });

    if (__DEV__) {
      if (data !== undefined) {
        console.info(`ℹ️ ${formatted}`, data);
      } else {
        console.info(`ℹ️ ${formatted}`);
      }
    }
  }

  warn(message: unknown, context?: string, data?: unknown): void {
    const formatted = this.formatLog('warn', message, context);
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'warn',
      context: context ?? 'App',
      message: String(message),
      data,
    });

    if (data !== undefined) {
      console.warn(`⚠️ ${formatted}`, data);
    } else {
      console.warn(`⚠️ ${formatted}`);
    }
  }

  error(message: unknown, errorOrDetails?: unknown, context?: string): void {
    let detail = '';

    if (errorOrDetails instanceof Error) {
      detail = ` — ${errorOrDetails.message}`;
    } else if (typeof errorOrDetails === 'string' && errorOrDetails.trim()) {
      detail = ` — ${errorOrDetails}`;
    } else if (errorOrDetails && typeof errorOrDetails === 'object') {
      const maybeMsg =
        (errorOrDetails as any)?.message ||
        (errorOrDetails as any)?.errors?.[0]?.longMessage ||
        (errorOrDetails as any)?.errors?.[0]?.message;
      if (maybeMsg) {
        detail = ` — ${maybeMsg}`;
      }
    }

    const cleanMessage = `${typeof message === 'object' ? JSON.stringify(message) : String(message)}${detail}`;
    const formatted = this.formatLog('error', cleanMessage, context);

    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'error',
      context: context ?? 'App',
      message: cleanMessage,
    });

    console.error(`❌ ${formatted}`);
  }

  debug(message: unknown, context?: string, data?: unknown): void {
    if (!__DEV__) return;

    const formatted = this.formatLog('debug', message, context);
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'debug',
      context: context ?? 'Debug',
      message: String(message),
      data,
    });

    if (data !== undefined) {
      console.debug(`🔍 ${formatted}`, data);
    } else {
      console.debug(`🔍 ${formatted}`);
    }
  }

  screen(screenName: string, params?: Record<string, unknown>): void {
    const formatted = this.formatLog('screen', `Navigated to -> ${screenName}`, 'Navigation');
    this.saveToBuffer({
      timestamp: this.formatTimestamp(),
      level: 'screen',
      context: 'Navigation',
      message: `Navigated to -> ${screenName}`,
      data: params,
    });

    if (__DEV__) {
      console.log(`📱 ${formatted}`, params ?? '');
    }
  }

  getLogs(): LogEntry[] {
    return [...this.inMemoryLogs];
  }

  clearLogs(): void {
    this.inMemoryLogs = [];
  }
}

export const logger = new MobileLogger();
