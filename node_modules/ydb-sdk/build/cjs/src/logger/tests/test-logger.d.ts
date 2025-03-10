import { LogFn } from '../simple-logger';
export declare const buildTestLogger: () => {
    testLogger: {
        fatal: LogFn;
        error: LogFn;
        warn: LogFn;
        info: LogFn;
        debug: LogFn;
        trace: LogFn;
    };
    testLoggerFn: jest.Mock<any, any>;
};
//# sourceMappingURL=test-logger.d.ts.map