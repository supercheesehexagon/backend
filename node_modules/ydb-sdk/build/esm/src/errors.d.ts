import { StatusObject as GrpcStatusObject } from '@grpc/grpc-js';
import { Ydb } from 'ydb-sdk-proto';
import { RetryPolicySymbol } from "./retries/symbols";
export declare const enum Backoff {
    No = 0,
    Fast = 1,
    Slow = 2
}
export declare enum StatusCode {
    STATUS_CODE_UNSPECIFIED = 0,
    SUCCESS = 400000,
    BAD_REQUEST = 400010,
    UNAUTHORIZED = 400020,
    INTERNAL_ERROR = 400030,
    ABORTED = 400040,
    UNAVAILABLE = 400050,
    OVERLOADED = 400060,
    SCHEME_ERROR = 400070,
    GENERIC_ERROR = 400080,
    TIMEOUT = 400090,
    BAD_SESSION = 400100,
    PRECONDITION_FAILED = 400120,
    ALREADY_EXISTS = 400130,
    NOT_FOUND = 400140,
    SESSION_EXPIRED = 400150,
    CANCELLED = 400160,
    UNDETERMINED = 400170,
    UNSUPPORTED = 400180,
    SESSION_BUSY = 400190,
    EXTERNAL_ERROR = 400200,
    /** Cannot connect or unrecoverable network error. (map from gRPC UNAVAILABLE) */
    TRANSPORT_UNAVAILABLE = 401010,// grpc code: 14 (GrpcStatus.UNAVAILABLE)
    CLIENT_RESOURCE_EXHAUSTED = 401020,// grpc code: 8 (GrpcStatus.RESOURCE_EXHAUSTED)
    CLIENT_DEADLINE_EXCEEDED = 401030,// grpc code: 4 (GrpcStatus.DEADLINE_EXCEEDED)
    CLIENT_CANCELED = 401034,// SDK local
    UNAUTHENTICATED = 402030,// SDK local
    SESSION_POOL_EMPTY = 402040,// SDK local
    RETRIES_EXCEEDED = 402050
}
/**
 * Depending on the type of error, the retryer decides how to proceed and whether
 * the session can continue to be used or not.
 */
export type SpecificErrorRetryPolicy = {
    /**
     * Backoff.No - retry imminently if retry for the operation is true.
     * Backoff.Fast - retry accordingly to fast retry policy.
     * Backoff.Slow - retry accordingly to slow retry policy.
     * Note: current attempt count set to zero if the error is not with the same type as was on previous attempt.
     */
    backoff: Backoff;
    /**
     * true - delete session from pool, is case of the error.
     */
    deleteSession: boolean;
    /**
     * true - retry for idempotent operations.
     */
    idempotent: boolean;
    /**
     * true - retry for non-idempotent operations.
     */
    nonIdempotent: boolean;
};
export declare class YdbError extends Error {
    static [RetryPolicySymbol]: SpecificErrorRetryPolicy;
    static formatIssues(issues?: null | any[]): string;
    /**
     * If YDB returns an error YdbError is thrown.
     * @param operation
     */
    static checkStatus(operation: {
        status?: (Ydb.StatusIds.StatusCode | null);
        issues?: (Ydb.Issue.IIssueMessage[] | null);
    }): void;
    /**
     * Issues from Ydb are returned as a tree with nested issues.  Returns the list of issues as a flat array.
     * The nested issues follow their parents.
     */
    private static flatIssues;
    static status: StatusCode;
    issues: any[] | null;
    constructor(message: string, issues?: null | any[]);
}
export declare class StatusCodeUnspecified extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Unauthenticated extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class SessionPoolEmpty extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class BadRequest extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Unauthorized extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class InternalError extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Aborted extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Unavailable extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Overloaded extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class SchemeError extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class GenericError extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class BadSession extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Timeout extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class PreconditionFailed extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class NotFound extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class AlreadyExists extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class SessionExpired extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Cancelled extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Undetermined extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class Unsupported extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class SessionBusy extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class ExternalError extends YdbError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class TransportError extends YdbError {
    /** Check if error is member of GRPC error */
    static isMember(e: any): e is Error & GrpcStatusObject;
    static convertToYdbError(e: Error & GrpcStatusObject): Error;
}
export declare class TransportUnavailable extends TransportError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class ClientDeadlineExceeded extends TransportError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class ClientResourceExhausted extends TransportError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class ClientCancelled extends TransportError {
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
}
export declare class RetriesExceeded extends YdbError {
    readonly cause: Error;
    static status: StatusCode;
    readonly [RetryPolicySymbol]: SpecificErrorRetryPolicy;
    constructor(cause: Error);
}
export declare class MissingOperation extends YdbError {
}
export declare class MissingValue extends YdbError {
}
export declare class MissingStatus extends YdbError {
}
export declare class TimeoutExpired extends YdbError {
}
//# sourceMappingURL=errors.d.ts.map