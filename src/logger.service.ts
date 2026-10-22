import { Inject, Injectable, LoggerService as NestLoggerService, Optional } from '@nestjs/common';
import * as winston from 'winston';
import { OPEN_LOGGER_OPTIONS } from './logger.constants';
import { createWinstonLogger, resolveOptions } from './logger.factory';
import { LogCallOptions, LogLevel, OpenLoggerOptions } from './logger.interfaces';

// ─── ANSI colour helpers ────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  info: '\x1b[32m',    // green
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  debug: '\x1b[35m',   // magenta
  verbose: '\x1b[36m', // cyan
};

const LEVEL_LABELS: Record<string, string> = {
  info: 'LOG',
  error: 'ERROR',
  warn: 'WARN',
  debug: 'DEBUG',
  verbose: 'VERBOSE',
};

const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class OpenLoggerService implements NestLoggerService {
  private readonly opts: Required<OpenLoggerOptions>;
  private readonly fileLogger: winston.Logger;
  private readonly pid = process.pid;

  constructor(
    @Optional() @Inject(OPEN_LOGGER_OPTIONS) options?: OpenLoggerOptions,
    @Optional() private context?: string,
  ) {
    this.opts = resolveOptions(options);
    this.fileLogger = createWinstonLogger(this.opts);
  }

  // ── NestJS LoggerService interface ───────────────────────────────────────

  log(message: any, ...optionalParams: any[]): void;
  log(message: string, data?: any, options?: LogCallOptions): void;
  log(message: any, data?: any, options?: LogCallOptions): void {
    this.write('info', message, data, options);
  }

  error(message: any, ...optionalParams: any[]): void;
  error(message: string, data?: any, options?: LogCallOptions): void;
  error(message: any, data?: any, options?: LogCallOptions): void {
    this.write('error', message, data, options);
  }

  warn(message: any, ...optionalParams: any[]): void;
  warn(message: string, data?: any, options?: LogCallOptions): void;
  warn(message: any, data?: any, options?: LogCallOptions): void {
    this.write('warn', message, data, options);
  }

  debug(message: any, ...optionalParams: any[]): void;
  debug(message: string, data?: any, options?: LogCallOptions): void;
  debug(message: any, data?: any, options?: LogCallOptions): void {
    this.write('debug', message, data, options);
  }

  verbose(message: any, ...optionalParams: any[]): void;
  verbose(message: string, data?: any, options?: LogCallOptions): void;
  verbose(message: any, data?: any, options?: LogCallOptions): void {
    this.write('verbose', message, data, options);
  }

  fatal(message: any, ...optionalParams: any[]): void;
  fatal(message: string, data?: any, options?: LogCallOptions): void;
  fatal(message: any, data?: any, options?: LogCallOptions): void {
    // Map fatal → error for Winston compatibility
    this.write('error', message, data, options);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Returns a new service instance with the given context label.
   * Useful when you need a named logger without DI overhead.
   *
   * @example
   * const log = logger.withContext('MyService');
   * log.log('Hello');
   */
  withContext(context: string): OpenLoggerService {
    const child = new OpenLoggerService(this.opts, context);
    return child;
  }

  /**
   * Flush and close the underlying Winston file transports gracefully.
   * Call this during application shutdown to avoid losing buffered log entries.
   */
  async close(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.fileLogger.on('finish', resolve);
      this.fileLogger.end();
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private write(
    level: LogLevel,
    message: any,
    data?: any,
    { save, logData = false }: LogCallOptions = {},
  ): void {
    const shouldSave = save ?? (this.opts.saveToFile && this.opts.defaultSave);

    const msg =
      typeof message === 'string' ? message : JSON.stringify(message);

    const consoleText =
      logData && data !== undefined
        ? typeof data === 'string'
          ? data
          : JSON.stringify(data)
        : msg;

    this.printConsole(level, consoleText);

    if (shouldSave) {
      this.fileLogger.log(level, msg, {
        context: this.context,
        ...(data !== undefined ? { data } : {}),
      });
    }
  }

  private printConsole(level: string, message: string): void {
    const color = this.opts.colorize ? (LEVEL_COLORS[level] ?? '') : '';
    const reset = this.opts.colorize ? RESET : '';
    const yellow = this.opts.colorize ? YELLOW : '';
    const label = LEVEL_LABELS[level] ?? level.toUpperCase();
    const contextPart = this.context
      ? `${yellow}[${this.context}]${reset} `
      : '';

    const line =
      `${color}[Nest] ${this.pid}  - ${reset}` +
      `${this.formatTimestamp()}     ` +
      `${color}${label}${reset} ` +
      `${contextPart}` +
      `${color}${message}${reset}`;

    (level === 'error' ? console.error : console.log)(line);
  }

  private formatTimestamp(): string {
    const now = new Date();
    const locale = this.opts.timestampLocale;
    const datePart = now.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    const timePart = now.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !this.opts.hour24,
    });
    return `${datePart}, ${timePart}`;
  }
}
