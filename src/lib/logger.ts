export type LogLevel =
  | 'debug'
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'verbose'
  | 'bootstrap'
  | 'screen';

export interface LoggerOptions {
  context?: string;
  enabled?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  stack?: string;
  data?: unknown;
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// Global in-memory ring buffer holding recent entries across all logger instances
const inMemoryLogs: LogEntry[] = [];
const MAX_LOGS = 200;

function saveToBuffer(entry: LogEntry): void {
  inMemoryLogs.push(entry);
  if (inMemoryLogs.length > MAX_LOGS) {
    inMemoryLogs.shift();
  }
}

// Extracts and filters out node_modules and framework noise from stack traces
function cleanStack(stackOrError?: unknown): string {
  const rawStack =
    stackOrError instanceof Error
      ? stackOrError.stack
      : typeof stackOrError === 'string'
        ? stackOrError
        : '';

  if (!rawStack) return '';

  const frames = rawStack
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith('at ') &&
        !line.includes('node_modules') &&
        !line.includes('expo/build') &&
        !line.includes('react-native/Libraries') &&
        !line.includes('logger.ts') &&
        !line.includes('node:internal')
    )
    .slice(0, 3)
    .map((line) => line.replace(/^at\s+/, ''));

  if (frames.length === 0) return '';
  return `\n   ↳ ${frames.join('\n   ↳ ')}`;
}

class Logger {
  private context: string;
  private enabled: boolean;

  constructor(contextOrOptions?: string | LoggerOptions) {
    if (typeof contextOrOptions === 'string') {
      this.context = contextOrOptions || 'App';
      this.enabled = __DEV__;
    } else if (contextOrOptions && typeof contextOrOptions === 'object') {
      this.context = contextOrOptions.context || 'App';
      this.enabled = contextOrOptions.enabled ?? __DEV__;
    } else {
      this.context = 'App';
      this.enabled = __DEV__;
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    try {
      return now.toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: 'Asia/Manila',
      });
    } catch {
      return now.toLocaleTimeString('en-US', { hour12: false });
    }
  }

  private resolveParams(
    arg1?: unknown,
    arg2?: unknown
  ): { contextOverride?: string; data?: unknown } {
    if (this.context === 'App' && typeof arg1 === 'string') {
      return { contextOverride: arg1, data: arg2 };
    }
    return { data: arg1 };
  }

  private formatMessage(
    level: string,
    message: string,
    color: string,
    data?: unknown,
    contextOverride?: string
  ): void {
    if (!this.enabled) return;

    const timestamp = this.getTimestamp();
    const pid = 'RN';
    const ctx = contextOverride || this.context;

    console.log(
      `${color}[${pid}] ${timestamp}  ${level.padEnd(5)} ${COLORS.yellow}[${ctx}]${COLORS.reset} ${color}${message}${COLORS.reset}`
    );

    if (data !== undefined) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      console.log(`${COLORS.gray}${dataStr}${COLORS.reset}`);
    }
  }

  log(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'log',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('LOG', msgStr, COLORS.green, data, ctx);
  }

  info(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'info',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('INFO', msgStr, COLORS.cyan, data, ctx);
  }

  warn(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'warn',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('WARN', msgStr, COLORS.yellow, data, ctx);
  }

  debug(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'debug',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('DEBUG', msgStr, COLORS.magenta, data, ctx);
  }

  verbose(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'verbose',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('VERB', msgStr, COLORS.cyan, data, ctx);
  }

  error(message: unknown, trace?: unknown, contextOverride?: string): void {
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'error',
      context: ctx,
      message: msgStr,
      stack: trace instanceof Error ? trace.stack : typeof trace === 'string' ? trace : undefined,
    });

    if (!this.enabled) return;

    this.formatMessage('ERROR', msgStr, COLORS.red, undefined, ctx);

    if (trace !== undefined) {
      if (trace instanceof Error) {
        const stack = cleanStack(trace);
        const errorText = stack ? `${trace.message}${stack}` : trace.stack || trace.message;
        console.log(`${COLORS.red}${errorText}${COLORS.reset}`);
      } else {
        const traceStr = typeof trace === 'object' ? JSON.stringify(trace, null, 2) : String(trace);
        console.log(`${COLORS.red}${traceStr}${COLORS.reset}`);
      }
    }
  }

  bootstrap(message: unknown, dataOrContext?: unknown, maybeData?: unknown): void {
    const { contextOverride, data } = this.resolveParams(dataOrContext, maybeData);
    const ctx = contextOverride || this.context;
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'bootstrap',
      context: ctx,
      message: msgStr,
      data,
    });

    this.formatMessage('BOOT', msgStr, COLORS.magenta, data, ctx);
  }

  screen(screenName: string, params?: Record<string, unknown>): void {
    const msgStr = `Navigated to -> ${screenName}`;
    const ctx = this.context === 'App' ? 'Navigation' : this.context;

    saveToBuffer({
      timestamp: this.getTimestamp(),
      level: 'screen',
      context: ctx,
      message: msgStr,
      data: params,
    });

    this.formatMessage('NAV', msgStr, COLORS.cyan, params, ctx);
  }

  setContext(context: string): void {
    this.context = context;
  }

  getContext(): string {
    return this.context;
  }

  getLogs(): LogEntry[] {
    return [...inMemoryLogs];
  }

  clearLogs(): void {
    inMemoryLogs.length = 0;
  }
}

export function createLogger(contextOrOptions?: string | LoggerOptions): Logger {
  return new Logger(contextOrOptions);
}

export const logger = new Logger();
export { Logger };
