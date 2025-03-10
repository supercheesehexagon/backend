import { YdbError } from "../errors";
export declare class BackoffSettings {
    backoffCeiling: number;
    backoffSlotDuration: number;
    uncertainRatio: number;
    /**
     * Create backoff settings - uses randomized exponential timeouts with a base of 2
     * Timeout formula: `2^min(retries, backoffCeiling) * backoffSlotDuration * (1 - random() * uncertainRatio)`
     * @param backoffCeiling - max power — (n) in `2^n`
     * @param backoffSlotDuration - multiplier for exponent
     * @param uncertainRatio - timeout fraction that is randomized
     */
    constructor(backoffCeiling: number, backoffSlotDuration: number, uncertainRatio?: number);
    calcBackoffTimeout(retries: number): number;
}
export declare class RetryParameters {
    timeout: number;
    /**
     * @deprecated Something from the past. Now the NotFound error processing is specified in the error description.
     */
    retryNotFound: boolean;
    /**
     * @deprecated Not supported in the new retryer - no useful life example
     */
    unknownErrorHandler: (_error: unknown) => void;
    /**
     * @deprecated Now attempts are not limited by number of attempts, but may be limited by timeout.
     */
    maxRetries: number;
    /**
     * @deprecated Not supported in the new retryer - no useful life example
     */
    onYdbErrorCb: (_error: YdbError) => void;
    fastBackoff: BackoffSettings;
    slowBackoff: BackoffSettings;
    constructor(opts?: {
        /**
         * @deprecated to be consistent with other YDB SDKes, the retryer is now NOT limited by the number of attempts, but
         * by the time to attempt the operation. Use timeout parameter
         */
        maxRetries?: number;
        onYdbErrorCb?: (_error: YdbError) => void;
        backoffCeiling?: number;
        backoffSlotDuration?: number;
        timeout?: number;
    });
}
//# sourceMappingURL=retryParameters.d.ts.map