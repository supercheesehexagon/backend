import { RetryLambdaResult } from "./retryStrategy";
export declare function asIdempotentRetryableLambda<T>(fn: () => Promise<T>): Promise<RetryLambdaResult<T>>;
//# sourceMappingURL=asIdempotentRetryableLambda.d.ts.map