export declare const DEFAULT_ENV_KEY = "YDB_LOG_LEVEL";
export declare const DEFAULT_LEVEL = "info";
export declare enum LogLevel {
    none = "none",
    fatal = "fatal",
    error = "error",
    warn = "warn",
    info = "info",
    debug = "debug",
    trace = "trace"
}
export interface Logger {
    fatal: LogFn;
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
    trace: LogFn;
}
/**
 * **Only for unit tests purposes**.
 */
export declare const setMockConsole: (mockConsole?: Console) => void;
/**
 * The simplest logger class, with a minimal set of logging methods and the most simple output to the console.
 */
export declare class SimpleLogger implements Logger {
    fatal: LogFn;
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
    trace: LogFn;
    readonly prefix?: string;
    readonly showTimestamp: boolean;
    readonly showLevel: boolean;
    constructor(options?: {
        /**
         * Level down to which to log messages. Default is *info*.
         */
        level?: LogLevel;
        /**
         * Prefix that gets added to a message, default undefined
         */
        prefix?: string;
        /**
         * Whether to add the date and time to the message. Default is true.
         */
        showTimestamp?: boolean;
        /**
         * Whether to add the message level. Default is true.
         */
        showLevel?: boolean;
        /**
         * Environment variable with logging level, which if specified contains the level of
         * logging - *error*, *warn*, *info*, *debug*, *trace*. If not specified, the value of
         * level parameter is used.  If a non-existing level value is specified, all levels are logged.
         */
        envKey?: string;
    });
}
export interface LogFn {
    (obj: unknown, msg?: string, ...args: unknown[]): void;
    (msg: string, ...args: unknown[]): void;
}
//# sourceMappingURL=simple-logger.d.ts.map