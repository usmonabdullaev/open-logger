# open-logger

> A universal, fully configurable **NestJS** logger built on top of [Winston](https://github.com/winstonjs/winston) with daily log rotation.

[![npm version](https://img.shields.io/npm/v/open-logger)](https://www.npmjs.com/package/open-logger)
[![license](https://img.shields.io/npm/l/open-logger)](LICENSE)

## Features

- ✅ Drop-in replacement for NestJS's built-in `LoggerService`
- ✅ Coloured console output matching the native NestJS style
- ✅ Rotating file logs (combined + error-only) via `winston-daily-rotate-file`
- ✅ Fully configurable: log level, file paths, rotation rules, colours, timezone, …
- ✅ `forRoot()` / `forRootAsync()` pattern for static or async (e.g. `ConfigService`) setup
- ✅ `withContext()` helper to create named child loggers
- ✅ Graceful shutdown (`close()`)
- ✅ TypeScript-first with full type declarations

---

## Installation

```bash
npm install open-logger
# peer dependencies (already installed in a standard NestJS project)
npm install @nestjs/common reflect-metadata rxjs
```

---

## Quick Start

### 1 — Static configuration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { OpenLoggerModule } from 'open-logger';

@Module({
  imports: [
    OpenLoggerModule.forRoot({
      level: 'info',
      saveToFile: true,
      logDir: './logs',
    }),
  ],
})
export class AppModule {}
```

### 2 — Async configuration (e.g. with `ConfigService`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenLoggerModule } from 'open-logger';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OpenLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        level: config.get<string>('LOG_LEVEL', 'info') as any,
        saveToFile: config.get<boolean>('LOG_SAVE', true),
        logDir: config.get<string>('LOG_DIR', './logs'),
      }),
    }),
  ],
})
export class AppModule {}
```

### 3 — Using the logger

```typescript
import { Injectable } from '@nestjs/common';
import { OpenLoggerService } from 'open-logger';

@Injectable()
export class AppService {
  constructor(private readonly logger: OpenLoggerService) {}

  doSomething() {
    this.logger.log('Application started');
    this.logger.warn('Low memory', { free: '128MB' });
    this.logger.error('Something went wrong', new Error('Oops'));
    this.logger.debug('Query result', { rows: 42 });
    this.logger.verbose('Detailed trace', { trace: '...' });
  }
}
```

### 4 — Use as NestJS app-wide logger

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OpenLoggerService } from 'open-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(OpenLoggerService));
  await app.listen(3000);
}
bootstrap();
```

### 5 — Named child logger

```typescript
const childLog = this.logger.withContext('PaymentService');
childLog.log('Payment processed', { orderId: 42 });
```

---

## Configuration Options (`OpenLoggerOptions`)

| Option | Type | Default | Description |
|---|---|---|---|
| `level` | `LogLevel` | `'info'` | Minimum log level (`error`, `warn`, `info`, `debug`, `verbose`) |
| `saveToFile` | `boolean` | `true` | Enable/disable file transport entirely |
| `logDir` | `string` | `'<cwd>/logs'` | Directory for log files (absolute or relative to `cwd`) |
| `combinedFilename` | `string` | `'combined-%DATE%.log'` | Filename pattern for all-levels log |
| `errorFilename` | `string` | `'error-%DATE%.log'` | Filename pattern for error-only log |
| `datePattern` | `string` | `'YYYY-MM-DD'` | Rotation date pattern (moment.js format) |
| `maxFiles` | `string \| number` | `'14d'` | Max age of retained files (e.g. `'7d'`, `'1m'`, `30`) |
| `maxSize` | `string \| number` | `undefined` | Max file size before rotation (e.g. `'20m'`, `'1g'`) |
| `zippedArchive` | `boolean` | `true` | Gzip-compress rotated files |
| `colorize` | `boolean` | `true` | Coloured console output |
| `timestampLocale` | `string` | `'en-US'` | Locale for console timestamp formatting |
| `hour24` | `boolean` | `false` | Use 24-hour clock in console timestamps |
| `defaultSave` | `boolean` | `true` | Global default for per-call `save` option |

### Per-call options (`LogCallOptions`)

Pass as the third argument to any log method:

| Option | Type | Default | Description |
|---|---|---|---|
| `save` | `boolean` | `defaultSave` | Override file-save for this specific call |
| `logData` | `boolean` | `false` | Print `data` instead of `message` to console |

```typescript
// Skip file-saving for this noisy trace
logger.verbose('Cache hit', { key }, { save: false });

// Print the payload object to console, not the message string
logger.log('User created', { id: 1, name: 'Alice' }, { logData: true });
```

---

## Graceful Shutdown

```typescript
// main.ts
app.enableShutdownHooks();

// Or manually:
const logger = app.get(OpenLoggerService);
await logger.close();
```

---

## License

MIT © Abdulloev Usmon

