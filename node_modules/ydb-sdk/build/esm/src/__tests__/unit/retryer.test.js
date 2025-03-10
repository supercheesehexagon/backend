"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_logger_1 = require("../../logger/tests/test-logger");
const fake_timers_fixture_1 = require("../../utils/test/fake-timers-fixture");
const retryStrategy_1 = require("../../retries/retryStrategy");
const retryParameters_1 = require("../../retries/retryParameters");
const context_1 = require("../../context");
const message_1 = require("../../retries/message");
const symbols_1 = require("../../retries/symbols");
const RANDOM = 0.7;
describe('retryer', () => {
    const fakeTimersFixture = new fake_timers_fixture_1.FakeTimersFixture();
    // @ts-ignore
    let testLogger;
    // @ts-ignore
    let testLoggerFn;
    let notFakeSetTimeout;
    beforeEach(async () => {
        ({ testLogger, testLoggerFn } = (0, test_logger_1.buildTestLogger)());
        notFakeSetTimeout = setTimeout;
        fakeTimersFixture.setup();
        jest.spyOn(Math, 'random');
        Math.random.mockReturnValue(RANDOM);
    });
    afterEach(async () => {
        await fakeTimersFixture.dispose();
        jest.restoreAllMocks();
    });
    it('ok', async () => {
        const { ctx } = context_1.Context.createNew();
        await expect(new retryStrategy_1.RetryStrategy(new retryParameters_1.RetryParameters(), testLogger)
            .retry(ctx, async () => {
            return { result: 12 };
        })).resolves.toBe(12);
        expect(testLoggerFn.mock.calls).toEqual([
            [
                'debug',
                message_1.successAfterNAttempts,
                1,
            ],
        ]);
        // gives up time in the event loop to perform a next retryer step
        await new Promise((resolve) => {
            notFakeSetTimeout(resolve, 0);
        });
    });
    for (const simpleError of [
        true /* throw error, like error in the code */,
        false /* error comes thru RetryLambdaResult */
    ])
        it(`simple error: simpleError: ${Number(simpleError)}`, async () => {
            const { ctx } = context_1.Context.createNew();
            await expect(new retryStrategy_1.RetryStrategy(new retryParameters_1.RetryParameters(), testLogger)
                .retry(ctx, async () => {
                if (simpleError)
                    throw new Error('test');
                else
                    return { err: new Error('test') };
            })).rejects.toThrow('test');
            expect(testLoggerFn.mock.calls).toEqual([
                [
                    'debug',
                    message_1.notRetryableErrorMessage,
                    new Error('test'),
                ],
            ]);
        });
    const ONLY_TEST = '';
    const MAX_TEST_ATTEMPTS = 4;
    const testRetryParameters = new retryParameters_1.RetryParameters({
        timeout: 1_000,
    });
    // assigned this way, since it's not possible thru constructor
    const FAST_BACKOFF = testRetryParameters.fastBackoff = new retryParameters_1.BackoffSettings(2, 5);
    const SLOW_BACKOFF = testRetryParameters.slowBackoff = new retryParameters_1.BackoffSettings(2, 100);
    for (const backoff of [null /* no retry policy at all */, 0 /* Backoff.No */, 1 /* Backoff.Fast */, 2 /* Backoff.Slow */])
        for (const nonIdempotent of [false, true])
            for (const idempotent of [false, true])
                for (const simpleError of [
                    undefined /* operation succeeded */,
                    true /* throw error, like error in the code */,
                    false /* error comes thru RetryLambdaResult */
                ])
                    for (const isIdempotentOp of [false, true]) {
                        // when backoff is not specified, nonIdempotent && idempotent do not affect the test
                        if (backoff === null && !(nonIdempotent && idempotent))
                            continue;
                        // makes no sense to retry non-idempotent operations, while do not retry idempotent one
                        if (nonIdempotent && !idempotent)
                            continue;
                        // with simply thrown error, the information that operation is idempotent or not is not available
                        if (simpleError && isIdempotentOp)
                            continue;
                        const testName = `retry: ` +
                            `backoff: ${backoff === null ? null : ['No', 'Fast', 'Slow'][backoff]}; ` +
                            `nonIdempotent: ${Number(nonIdempotent)}; idempotent: ${Number(idempotent)}; ` +
                            `simpleError: ${simpleError}; isIdempotentOp: ${Number(isIdempotentOp)}`;
                        // leave the only test, if specified
                        if (ONLY_TEST && testName !== ONLY_TEST)
                            continue;
                        it(testName, async () => {
                            const { ctx } = context_1.Context.createNew();
                            // @ts-ignore
                            let res, err;
                            /* Note: has .then() at the end */
                            const awaitRes = new retryStrategy_1.RetryStrategy(testRetryParameters, testLogger)
                                .retry(ctx, async (_ctx, _logger, attemptsCount) => {
                                const err = new Error('test');
                                if (backoff !== null)
                                    err[symbols_1.RetryPolicySymbol] = {
                                        backoff,
                                        nonIdempotent,
                                        idempotent,
                                    };
                                if (simpleError === undefined) { // success after errors
                                    if (attemptsCount + 1 === MAX_TEST_ATTEMPTS) {
                                        return { result: 12 };
                                    }
                                    else { // before success result should preceed few errors
                                        return { err, idempotent: isIdempotentOp };
                                    }
                                }
                                else { // only error
                                    if (simpleError) {
                                        throw err;
                                    }
                                    else {
                                        return { err, idempotent: isIdempotentOp };
                                    }
                                }
                            })
                                .catch((_err) => {
                                err = _err;
                            });
                            await runRetryerWithLogReading(MAX_TEST_ATTEMPTS);
                            let expectedLog = [];
                            if (backoff === null || (isIdempotentOp ? !idempotent : !nonIdempotent)) {
                                expectedLog.push([
                                    'debug',
                                    message_1.notRetryableErrorMessage,
                                    new Error('test'),
                                ]);
                            }
                            else {
                                switch (backoff) {
                                    case 0 /* Backoff.No */: {
                                        for (let i = 0; i < (simpleError === undefined ? (MAX_TEST_ATTEMPTS - 1) : MAX_TEST_ATTEMPTS); i++) {
                                            expectedLog.push([
                                                'debug',
                                                message_1.immediateBackoffRetryMessage,
                                                new Error('test'),
                                                1,
                                            ]);
                                        }
                                        break;
                                    }
                                    case 1 /* Backoff.Fast */: {
                                        for (let i = 0; i < (simpleError === undefined ? (MAX_TEST_ATTEMPTS - 1) : MAX_TEST_ATTEMPTS); i++) {
                                            expectedLog.push([
                                                'debug',
                                                message_1.fastBackoffRetryMessage,
                                                new Error('test'),
                                                FAST_BACKOFF.calcBackoffTimeout(i),
                                            ]);
                                        }
                                        break;
                                    }
                                    case 2 /* Backoff.Slow */: {
                                        for (let i = 0; i < (simpleError === undefined ? (MAX_TEST_ATTEMPTS - 1) : MAX_TEST_ATTEMPTS); i++) {
                                            expectedLog.push([
                                                'debug',
                                                message_1.slowBackoffRetryMessage,
                                                new Error('test'),
                                                SLOW_BACKOFF.calcBackoffTimeout(i),
                                            ]);
                                        }
                                        break;
                                    }
                                }
                            }
                            if (backoff !== null && simpleError === undefined && (isIdempotentOp ? idempotent : nonIdempotent)) {
                                expect(await awaitRes).toBe(12);
                                expectedLog.push([
                                    'debug',
                                    message_1.successAfterNAttempts,
                                    MAX_TEST_ATTEMPTS,
                                ]);
                            }
                            expect(testLoggerFn.mock.calls).toEqual(expectedLog);
                        });
                    }
    class Error1 extends Error {
        [symbols_1.RetryPolicySymbol] = { backoff: 2 /* Backoff.Slow */, nonIdempotent: true, idempotent: true };
    }
    class Error2 extends Error {
        [symbols_1.RetryPolicySymbol] = { backoff: 2 /* Backoff.Slow */, nonIdempotent: true, idempotent: true };
    }
    it('drop error counter on another error', async () => {
        const { ctx } = context_1.Context.createNew();
        const awaitRes = new retryStrategy_1.RetryStrategy(testRetryParameters, testLogger)
            .retry(ctx, async (_ctx, _logger, attemptsCount) => {
            if (attemptsCount <= 3)
                return { err: new Error1('test1'), idempotent: true };
            if (attemptsCount <= 5)
                return { err: new Error2('test2'), idempotent: true };
            return { result: 12 };
        })
            .catch((err) => {
            expect(err).not.toBeDefined();
        });
        await runRetryerWithLogReading();
        expect(await awaitRes).toBe(12);
        expect(testLoggerFn.mock.calls).toEqual([
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error1('test1'),
                65,
            ],
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error1('test1'),
                130,
            ],
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error1('test1'),
                260,
            ],
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error1('test1'),
                260,
            ],
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error2('test2'),
                65, // starts over - that is right
            ],
            [
                "debug",
                "Caught an error %s, retrying with slow backoff in %d ms",
                new Error2('test2'),
                130,
            ],
            [
                "debug",
                "The operation completed successfully after %d attempts",
                7,
            ],
        ]);
    });
    it('stop on parameters timeout', async () => {
        const { ctx } = context_1.Context.createNew();
        let err;
        const awaitRes = new retryStrategy_1.RetryStrategy(testRetryParameters, testLogger)
            .retry(ctx, async (_ctx, _logger, _attemptsCount) => {
            return { err: new Error1('test'), idempotent: true };
        })
            .catch((_err) => {
            err = _err;
        });
        await fakeTimersFixture.advanceTimer(1_000 + 1); // timeout from parameters
        await runRetryerWithLogReading();
        await awaitRes;
        expect(err).toEqual(new Error('Timeout: 1000 ms'));
    });
    it('stop on context timeout', async () => {
        const noTimeoutRetryParameters = new retryParameters_1.RetryParameters();
        // assigned this way, since it's not possible thru constructor
        testRetryParameters.fastBackoff = FAST_BACKOFF;
        testRetryParameters.slowBackoff = SLOW_BACKOFF;
        const { ctx } = context_1.Context.createNew({ timeout: 900 });
        let err;
        const awaitRes = new retryStrategy_1.RetryStrategy(noTimeoutRetryParameters, testLogger)
            .retry(ctx, async (_ctx, _logger, _attemptsCount) => {
            return { err: new Error1('test'), idempotent: true };
        })
            .catch((_err) => {
            err = _err;
        });
        await fakeTimersFixture.advanceTimer(1_000 + 1); // timeout from parameters
        await runRetryerWithLogReading();
        await awaitRes;
        expect(err).toEqual(new Error('Timeout: 900 ms'));
    });
    it('limit by count for legacy', async () => {
        const limitAttemptsRetryParameters = new retryParameters_1.RetryParameters({ maxRetries: 2 });
        // assigned this way, since it's not possible thru constructor
        testRetryParameters.fastBackoff = FAST_BACKOFF;
        testRetryParameters.slowBackoff = SLOW_BACKOFF;
        const { ctx } = context_1.Context.createNew();
        let err;
        const awaitRes = new retryStrategy_1.RetryStrategy(limitAttemptsRetryParameters, testLogger)
            .retry(ctx, async (_ctx, _logger, _attemptsCount) => {
            return { err: new Error1('test'), idempotent: true };
        })
            .catch((_err) => {
            err = _err;
        });
        await runRetryerWithLogReading();
        await awaitRes;
        expect(err).toEqual(new Error('Operation cancelled. Cause: Too many attempts: 2'));
    });
    async function runRetryerWithLogReading(maxTestAttempts) {
        // run retries with fake timer till the end successful or MAX_ATTEMPTS
        let logLineNumber = 0, testAttemptsCount = 1;
        main: while (true) {
            // gives up time in the event loop to perform a next retryer step
            await new Promise((resolve) => {
                notFakeSetTimeout(resolve, 0);
            });
            // read rest of the log
            readLog: for (; logLineNumber < testLoggerFn.mock.calls.length;) {
                const logLine = testLoggerFn.mock.calls[logLineNumber++];
                if (logLine?.[0] !== 'debug')
                    continue; // skip
                switch (logLine[1]) {
                    case message_1.immediateBackoffRetryMessage:
                    case message_1.fastBackoffRetryMessage:
                    case message_1.slowBackoffRetryMessage:
                        await fakeTimersFixture.advanceTimer(logLine[3]);
                        // stop reading the log by count of attempts
                        if (maxTestAttempts !== undefined
                            && ++testAttemptsCount === maxTestAttempts)
                            break main;
                        break readLog;
                    case message_1.notRetryableErrorMessage:
                    case message_1.successAfterNAttempts:
                    case message_1.tooManyAttempts:
                        break main;
                }
            }
        }
    }
});
