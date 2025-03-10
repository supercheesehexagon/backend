"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleLogger = exports.setMockConsole = exports.LogLevel = exports.DEFAULT_LEVEL = exports.DEFAULT_ENV_KEY = void 0;
exports.DEFAULT_ENV_KEY = 'YDB_LOG_LEVEL';
exports.DEFAULT_LEVEL = 'info';
var LogLevel;
(function (LogLevel) {
    LogLevel["none"] = "none";
    LogLevel["fatal"] = "fatal";
    LogLevel["error"] = "error";
    LogLevel["warn"] = "warn";
    LogLevel["info"] = "info";
    LogLevel["debug"] = "debug";
    LogLevel["trace"] = "trace";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * For unit tests purposes.
 */
let consoleOrMock = console;
/**
 * **Only for unit tests purposes**.
 */
const setMockConsole = (mockConsole = console) => {
    consoleOrMock = mockConsole;
};
exports.setMockConsole = setMockConsole;
const silentLogFn = () => {
};
const simpleLogFnBuilder = (level, detailedStackTrace) => {
    const LEVEL = level.toUpperCase();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (level === LogLevel.fatal) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define,no-param-reassign
        level = LogLevel.error;
    }
    return function log(objOrMsg, ...args) {
        const prefix = [];
        if (this.showTimestamp) {
            prefix.push(new Date().toISOString());
        }
        if (this.showLevel) {
            prefix.push(LEVEL);
        }
        if (this.prefix) {
            prefix.push(this.prefix);
        }
        const prefixStr = prefix.length === 0 ? '' : `[${prefix.join(' ')}] `;
        if (typeof objOrMsg === 'object') {
            if (typeof args[0] === 'string') {
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                consoleOrMock[detailedStackTrace ? level : 'info'](`${prefixStr}%o ${args[0]}`, ...args.splice(1), objOrMsg);
            }
            else {
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                consoleOrMock[detailedStackTrace ? level : 'info'](prefix.length > 0 ? `${prefixStr}%o` : '%o', objOrMsg);
            }
        }
        else {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            consoleOrMock[detailedStackTrace ? level : 'info'](`${prefixStr}${objOrMsg}`, ...args);
        }
    };
};
/**
 * The simplest logger class, with a minimal set of logging methods and the most simple output to the console.
 */
class SimpleLogger {
    fatal = silentLogFn;
    error = silentLogFn;
    warn = silentLogFn;
    info = silentLogFn;
    debug = silentLogFn;
    trace = silentLogFn;
    prefix;
    showTimestamp;
    showLevel;
    constructor(options = {}) {
        let { level, 
        // eslint-disable-next-line prefer-const
        prefix, 
        // eslint-disable-next-line prefer-const
        showTimestamp, 
        // eslint-disable-next-line prefer-const
        showLevel, } = options;
        if (prefix)
            this.prefix = prefix;
        this.showTimestamp = showTimestamp ?? true;
        this.showLevel = showLevel ?? true;
        const envKey = options.envKey ?? exports.DEFAULT_ENV_KEY;
        const envLevel = process.env[envKey];
        // @ts-ignore
        level = envLevel === undefined ? level ?? LogLevel[exports.DEFAULT_LEVEL] : LogLevel[envLevel];
        const detailedTraceStack = ['1', 'true'].indexOf(typeof process.env.YDB_DETAILED_TRACE_STACK === 'string'
            ? process.env.YDB_DETAILED_TRACE_STACK.toLowerCase()
            : 'false') !== -1;
        for (const lvl of Object.values(LogLevel)) {
            if (lvl === LogLevel.none)
                continue;
            // @ts-ignore
            this[lvl] = simpleLogFnBuilder(lvl, detailedTraceStack);
            if (lvl === level)
                break;
        }
    }
}
exports.SimpleLogger = SimpleLogger;
