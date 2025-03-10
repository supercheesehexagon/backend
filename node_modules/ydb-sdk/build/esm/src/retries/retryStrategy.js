"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryStrategy = void 0;
const errors_1 = require("../errors");
const symbols_1 = require("./symbols");
const utils = __importStar(require("../utils"));
const message_1 = require("./message");
;
class RetryStrategy {
    retryParameters;
    logger;
    constructor(
    // public methodName = 'UnknownClass::UnknownMethod',
    retryParameters, logger) {
        this.retryParameters = retryParameters;
        this.logger = logger;
    }
    async retry(_ctx, fn) {
        return _ctx.wrap({ timeout: this.retryParameters.timeout }, async (ctx) => {
            let attemptsCounter = 0;
            let prevError;
            let sameErrorCount = 0;
            let maxRetries = this.retryParameters.maxRetries;
            while (true) {
                if (maxRetries !== 0 && attemptsCounter >= maxRetries) { // to support the old logic for a while
                    this.logger.debug(message_1.tooManyAttempts, attemptsCounter);
                    throw new errors_1.RetriesExceeded(new Error(`Too many attempts: ${attemptsCounter}`));
                }
                let r;
                try {
                    r = await fn(ctx, this.logger, attemptsCounter++);
                }
                catch (err) { // catch any error and process as errors with default policy = non-idempotent, not-retryable
                    r = { err };
                }
                if (r.err) {
                    // Note: deleteSession suppose to be processed in the lambda function
                    const retryPolicy = r.err[symbols_1.RetryPolicySymbol];
                    if (retryPolicy && (r.idempotent ? retryPolicy.idempotent : retryPolicy.nonIdempotent)) {
                        if (retryPolicy.backoff === 0 /* Backoff.No */) { // immediate retry
                            this.logger.debug(message_1.immediateBackoffRetryMessage, r.err, 1); // delay for 1 ms so fake timer can control process
                            await utils.sleep(1);
                            continue;
                        }
                        if (r.err.constructor === prevError?.constructor) { // same repeating Error slows down retries exponentially
                            sameErrorCount++;
                        }
                        else {
                            prevError = r.err;
                            sameErrorCount = 0;
                        }
                        const backoff = retryPolicy.backoff === 1 /* Backoff.Fast */
                            ? this.retryParameters.fastBackoff
                            : this.retryParameters.slowBackoff;
                        const waitFor = backoff.calcBackoffTimeout(sameErrorCount);
                        this.logger.debug(retryPolicy.backoff === 1 /* Backoff.Fast */
                            ? message_1.fastBackoffRetryMessage
                            : message_1.slowBackoffRetryMessage, r.err, waitFor);
                        await utils.sleep(waitFor);
                        if (ctx.err) { // make sure that operation was not cancelled while awaiting retry time
                            this.logger.debug(message_1.notRetryableErrorMessage, ctx.err);
                            throw ctx.err;
                        }
                        continue;
                    }
                    else {
                        this.logger.debug(message_1.notRetryableErrorMessage, r.err);
                    }
                    throw r.err;
                }
                this.logger.debug(message_1.successAfterNAttempts, attemptsCounter);
                return r.result;
            }
        });
    }
}
exports.RetryStrategy = RetryStrategy;
