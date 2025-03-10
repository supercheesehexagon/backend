"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTestLogger = void 0;
const buildTestLogger = () => {
    const testLoggerFn = jest.fn();
    const testLogger = {
        fatal: testLoggerFn.bind(undefined, 'fatal'),
        error: testLoggerFn.bind(undefined, 'error'),
        warn: testLoggerFn.bind(undefined, 'warn'),
        info: testLoggerFn.bind(undefined, 'info'),
        debug: testLoggerFn.bind(undefined, 'debug'),
        trace: testLoggerFn.bind(undefined, 'trace'),
    };
    return { testLogger, testLoggerFn };
};
exports.buildTestLogger = buildTestLogger;
