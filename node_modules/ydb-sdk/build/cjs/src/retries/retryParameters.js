"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryParameters = exports.BackoffSettings = void 0;
class BackoffSettings {
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
    constructor(opts) {
        var _a, _b, _c, _d;
        this.timeout = 0;
        if ((opts === null || opts === void 0 ? void 0 : opts.hasOwnProperty('timeout')) && opts.timeout > 0)
            this.timeout = opts.timeout;
        this.maxRetries = (_a = opts === null || opts === void 0 ? void 0 : opts.maxRetries) !== null && _a !== void 0 ? _a : 0;
        this.onYdbErrorCb = (_b = opts === null || opts === void 0 ? void 0 : opts.onYdbErrorCb) !== null && _b !== void 0 ? _b : ((_error) => {
        });
        this.fastBackoff = new BackoffSettings(10, 5);
        this.slowBackoff = new BackoffSettings((_c = opts === null || opts === void 0 ? void 0 : opts.backoffCeiling) !== null && _c !== void 0 ? _c : 6, (_d = opts === null || opts === void 0 ? void 0 : opts.backoffSlotDuration) !== null && _d !== void 0 ? _d : 1000);
        this.retryNotFound = true;
        this.unknownErrorHandler = () => { };
    }
}
exports.RetryParameters = RetryParameters;
