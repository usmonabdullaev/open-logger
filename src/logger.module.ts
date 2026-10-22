import { DynamicModule, Global, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { OPEN_LOGGER_OPTIONS } from './logger.constants';
import { OpenLoggerOptions } from './logger.interfaces';
import { OpenLoggerService } from './logger.service';

// ─── Async options helpers ───────────────────────────────────────────────────

export interface OpenLoggerOptionsFactory {
  createLoggerOptions(): Promise<OpenLoggerOptions> | OpenLoggerOptions;
}

export interface OpenLoggerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<OpenLoggerOptionsFactory>;
  useClass?: Type<OpenLoggerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<OpenLoggerOptions> | OpenLoggerOptions;
  inject?: any[];
}

// ─── Module ──────────────────────────────────────────────────────────────────

@Global()
@Module({})
export class OpenLoggerModule {
  /**
   * Register the logger with a static options object.
   *
   * @example
   * OpenLoggerModule.forRoot({ level: 'debug', saveToFile: false })
   */
  static forRoot(options?: OpenLoggerOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: OPEN_LOGGER_OPTIONS,
      useValue: options ?? {},
    };

    return {
      module: OpenLoggerModule,
      global: true,
      providers: [optionsProvider, OpenLoggerService],
      exports: [OpenLoggerService],
    };
  }

  /**
   * Register the logger asynchronously (e.g. pulling settings from a
   * `ConfigService`).
   *
   * @example
   * OpenLoggerModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     level: config.get('LOG_LEVEL'),
   *     logDir: config.get('LOG_DIR'),
   *   }),
   * })
   */
  static forRootAsync(asyncOptions: OpenLoggerAsyncOptions): DynamicModule {
    const asyncProviders = OpenLoggerModule.createAsyncProviders(asyncOptions);

    return {
      module: OpenLoggerModule,
      global: true,
      imports: asyncOptions.imports ?? [],
      providers: [...asyncProviders, OpenLoggerService],
      exports: [OpenLoggerService],
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private static createAsyncProviders(
    asyncOptions: OpenLoggerAsyncOptions,
  ): Provider[] {
    if (asyncOptions.useExisting || asyncOptions.useFactory) {
      return [OpenLoggerModule.createAsyncOptionsProvider(asyncOptions)];
    }

    if (asyncOptions.useClass) {
      return [
        OpenLoggerModule.createAsyncOptionsProvider(asyncOptions),
        { provide: asyncOptions.useClass, useClass: asyncOptions.useClass },
      ];
    }

    throw new Error(
      'OpenLoggerModule.forRootAsync() requires one of: useFactory, useClass, or useExisting.',
    );
  }

  private static createAsyncOptionsProvider(
    asyncOptions: OpenLoggerAsyncOptions,
  ): Provider {
    if (asyncOptions.useFactory) {
      return {
        provide: OPEN_LOGGER_OPTIONS,
        useFactory: asyncOptions.useFactory,
        inject: asyncOptions.inject ?? [],
      };
    }

    const inject = asyncOptions.useExisting ?? asyncOptions.useClass;
    return {
      provide: OPEN_LOGGER_OPTIONS,
      useFactory: async (factory: OpenLoggerOptionsFactory) =>
        factory.createLoggerOptions(),
      inject: inject ? [inject] : [],
    };
  }
}
