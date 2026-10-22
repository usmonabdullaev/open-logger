export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Options passed per individual log call.
 */
export interface LogCallOptions {
  /** Override whether this specific log entry is saved to file. */
  save?: boolean;
  /** Print `data` to console instead of `message`. */
  logData?: boolean;
}

/**
 * Module-level configuration for OpenLogger.
 * All fields are optional — sensible defaults are applied automatically.
 */
export interface OpenLoggerOptions {
  /**
   * Minimum log level to record.
   * @default 'info'
   */
  level?: LogLevel;

  /**
   * Whether to save logs to rotating files.
   * @default true
   */
  saveToFile?: boolean;

  /**
   * Absolute or relative (from `process.cwd()`) path to the directory where
   * log files will be written.
   * @default '<cwd>/logs'
   */
  logDir?: string;

  /**
   * Filename pattern for the combined log (supports `%DATE%` placeholder).
   * @default 'combined-%DATE%.log'
   */
  combinedFilename?: string;

  /**
   * Filename pattern for the error-only log.
   * @default 'error-%DATE%.log'
   */
  errorFilename?: string;

  /**
   * Date pattern used for rotating files (moment.js format).
   * @default 'YYYY-MM-DD'
   */
  datePattern?: string;

  /**
   * Maximum age of retained log files.  Accepts a number (days) or a string
   * with a unit suffix, e.g. `'14d'`, `'1m'`.
   * @default '14d'
   */
  maxFiles?: string | number;

  /**
   * Maximum size of a single log file before rotation.
   * Accepts a number (bytes) or a string like `'20m'`, `'1g'`.
   * @default undefined  (no size limit)
   */
  maxSize?: string | number;

  /**
   * Compress rotated log files using gzip.
   * @default true
   */
  zippedArchive?: boolean;

  /**
   * Whether to emit coloured output to the console.
   * @default true
   */
  colorize?: boolean;

  /**
   * Locale used when formatting the timestamp shown in the console.
   * @default 'en-US'
   */
  timestampLocale?: string;

  /**
   * Use 24-hour clock in the console timestamp.
   * @default false
   */
  hour24?: boolean;

  /**
   * Global default: save log entries to file unless overridden per call.
   * Overrides the module-level `saveToFile` on a per-call basis when set
   * via `LogCallOptions.save`.
   *
   * This option lets you enable file transport globally but disable saving
   * for specific (e.g. very chatty) log sites.
   */
  defaultSave?: boolean;
}

