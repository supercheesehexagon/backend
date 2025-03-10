"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryParameters = exports.BackoffSettings = void 0;
class BackoffSettings {
    backoffCeiling;
    backoffSlotDuration;
    uncertainRatio;
    /**
     * Create backoff settings - uses randomized exponential timeouts with a base of 2
     * Timeout formula: `2^min(retries, backoffCeiling) * backoffSlotDuration * (1 - random() * uncertainRatio)`
     * @param backoffCeiling - max power — (n) in `2^n`
     * @param backoffSlotDuration - multiplier for exponent
     * @param uncertainRatio - timeout fraction that is randomized
     */
    constructor(backoffCeiling, backoffSlotDuration, uncertainRatio = 0.5) {
        this.backoffCeiling = backoffCeiling;
        this.backoffSlotDuration = backoffSlotDuration;
        this.uncertainRatio = uncertainRatio;
    }
    calcBackoffTimeout(retries) {
        const slotsCount = 1 << Math.min(retries, this.backoffCeiling);
        const maxDuration = slotsCount * this.backoffSlotDuration;
        const duration = maxDuration * (1 - Math.random() * this.uncertainRatio);
        return duration;
    }
}
exports.BackoffSettings = BackoffSettings;
class RetryParameters {
    timeout = 0;
    /**
     * @deprecated Something from the past. Now the NotFound error processing is specified in the error description.
     */
    retryNotFound;
    /**
     * @deprecated Not supported in the new retryer - no useful life example
     */
    unknownErrorHandler; // TODO: Impl
    /**
     * @deprecated Now attempts are not limited by number of attempts, but may be limited by timeout.
     */
    maxRetries;
    /**
     * @deprecated Not supported in the new retryer - no useful life example
     */
    onYdbErrorCb; // TODO: Impl
    fastBackoff;
    slowBackoff;
    constructor(opts) {
        if (opts?.hasOwnProperty('timeout') && opts.timeout > 0)
            this.timeout = opts.timeout;
        this.maxRetries = opts?.maxRetries ?? 0;
        this.onYdbErrorCb = opts?.onYdbErrorCb ?? ((_error) => {
        });
        this.fastBackoff = new BackoffSettings(10, 5);
        this.slowBackoff = new BackoffSettings(opts?.backoffCeiling ?? 6, opts?.backoffSlotDuration ?? 1000);
        this.retryNotFound = true;
        this.unknownErrorHandler = () => { };
    }
}
exports.RetryParameters = RetryParameters;
