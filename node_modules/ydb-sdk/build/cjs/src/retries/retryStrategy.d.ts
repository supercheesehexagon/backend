import { HasLogger } from "../logger/has-logger";
import { Logger } from "../logger/simple-logger";
import { RetryParameters } from "./retryParameters";
import { Context } from "../context";
export interface RetryLambdaResult<T> {
    result?: T;
    err?: Error;
    idempotent?: boolean;
}
export interface RetryLambda<T> {
    (ctx: Context, logger: Logger, attemptsCount: number): Promise<RetryLambdaResult<T>>;
}
export declare class RetryStrategy implements HasLogger {
    retryParameters: RetryParameters;
    readonly logger: Logger;
    constructor(retryParameters: RetryParameters, logger: Logger);
    retry<T>(_ctx: Context, fn: RetryLambda<T>): Promise<T>;
}
export type RetryableResult = (target: HasLogger, propertyKey: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=retryStrategy.d.ts.map