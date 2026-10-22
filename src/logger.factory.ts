import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { OpenLoggerOptions } from './logger.interfaces';

const DEFAULT_OPTIONS: Required<OpenLoggerOptions> = {
  level: 'info',
  saveToFile: true,
  logDir: path.join(process.cwd(), 'logs'),
  combinedFilename: 'combined-%DATE%.log',
  errorFilename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: undefined as any,
  zippedArchive: true,
  colorize: true,
  timestampLocale: 'en-US',
  hour24: false,
  defaultSave: true,
};

/**
 * Merges caller-supplied options with defaults and returns a fully resolved
 * `OpenLoggerOptions` object.
 */
export function resolveOptions(
  options?: OpenLoggerOptions,
): Required<OpenLoggerOptions> {
  return { ...DEFAULT_OPTIONS, ...(options ?? {}) };
}

/**
 * Creates a Winston logger instance configured according to the supplied
 * (already-resolved) options.
 */
export function createWinstonLogger(
  opts: Required<OpenLoggerOptions>,
): winston.Logger {
  const transports: winston.transport[] = [];

  if (opts.saveToFile) {
    const logDir = path.isAbsolute(opts.logDir)
      ? opts.logDir
      : path.join(process.cwd(), opts.logDir);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const rotateBase = {
      dirname: logDir,
      datePattern: opts.datePattern,
      maxFiles: opts.maxFiles,
      ...(opts.maxSize !== undefined ? { maxSize: opts.maxSize } : {}),
      zippedArchive: opts.zippedArchive,
      format: fileFormat,
    };

    transports.push(
      new DailyRotateFile({
        ...rotateBase,
        filename: opts.combinedFilename,
      } as DailyRotateFile.DailyRotateFileTransportOptions),
      new DailyRotateFile({
        ...rotateBase,
        filename: opts.errorFilename,
        level: 'error',
      } as DailyRotateFile.DailyRotateFileTransportOptions),
    );
  }

  return winston.createLogger({
    level: opts.level,
    transports,
    // Suppress Winston's "no transports" warning when file saving is disabled.
    silent: transports.length === 0,
  });
}
