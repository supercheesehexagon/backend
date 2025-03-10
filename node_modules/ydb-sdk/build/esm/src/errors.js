"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutExpired = exports.MissingStatus = exports.MissingValue = exports.MissingOperation = exports.RetriesExceeded = exports.ClientCancelled = exports.ClientResourceExhausted = exports.ClientDeadlineExceeded = exports.TransportUnavailable = exports.TransportError = exports.ExternalError = exports.SessionBusy = exports.Unsupported = exports.Undetermined = exports.Cancelled = exports.SessionExpired = exports.AlreadyExists = exports.NotFound = exports.PreconditionFailed = exports.Timeout = exports.BadSession = exports.GenericError = exports.SchemeError = exports.Overloaded = exports.Unavailable = exports.Aborted = exports.InternalError = exports.Unauthorized = exports.BadRequest = exports.SessionPoolEmpty = exports.Unauthenticated = exports.StatusCodeUnspecified = exports.YdbError = exports.StatusCode = void 0;
const constants_1 = require("@grpc/grpc-js/build/src/constants");
const symbols_1 = require("./retries/symbols");
const TRANSPORT_STATUSES_FIRST = 401000;
const CLIENT_STATUSES_FIRST = 402000;
var StatusCode;
(function (StatusCode) {
    StatusCode[StatusCode["STATUS_CODE_UNSPECIFIED"] = 0] = "STATUS_CODE_UNSPECIFIED";
    StatusCode[StatusCode["SUCCESS"] = 400000] = "SUCCESS";
    StatusCode[StatusCode["BAD_REQUEST"] = 400010] = "BAD_REQUEST";
    StatusCode[StatusCode["UNAUTHORIZED"] = 400020] = "UNAUTHORIZED";
    StatusCode[StatusCode["INTERNAL_ERROR"] = 400030] = "INTERNAL_ERROR";
    StatusCode[StatusCode["ABORTED"] = 400040] = "ABORTED";
    StatusCode[StatusCode["UNAVAILABLE"] = 400050] = "UNAVAILABLE";
    StatusCode[StatusCode["OVERLOADED"] = 400060] = "OVERLOADED";
    StatusCode[StatusCode["SCHEME_ERROR"] = 400070] = "SCHEME_ERROR";
    StatusCode[StatusCode["GENERIC_ERROR"] = 400080] = "GENERIC_ERROR";
    StatusCode[StatusCode["TIMEOUT"] = 400090] = "TIMEOUT";
    StatusCode[StatusCode["BAD_SESSION"] = 400100] = "BAD_SESSION";
    StatusCode[StatusCode["PRECONDITION_FAILED"] = 400120] = "PRECONDITION_FAILED";
    StatusCode[StatusCode["ALREADY_EXISTS"] = 400130] = "ALREADY_EXISTS";
    StatusCode[StatusCode["NOT_FOUND"] = 400140] = "NOT_FOUND";
    StatusCode[StatusCode["SESSION_EXPIRED"] = 400150] = "SESSION_EXPIRED";
    StatusCode[StatusCode["CANCELLED"] = 400160] = "CANCELLED";
    StatusCode[StatusCode["UNDETERMINED"] = 400170] = "UNDETERMINED";
    StatusCode[StatusCode["UNSUPPORTED"] = 400180] = "UNSUPPORTED";
    StatusCode[StatusCode["SESSION_BUSY"] = 400190] = "SESSION_BUSY";
    StatusCode[StatusCode["EXTERNAL_ERROR"] = 400200] = "EXTERNAL_ERROR";
    // Client statuses
    /** Cannot connect or unrecoverable network error. (map from gRPC UNAVAILABLE) */
    StatusCode[StatusCode["TRANSPORT_UNAVAILABLE"] = 401010] = "TRANSPORT_UNAVAILABLE";
    // Theoritically should begin with `TRANSPORT_`, but renamed due to compatibility
    StatusCode[StatusCode["CLIENT_RESOURCE_EXHAUSTED"] = 401020] = "CLIENT_RESOURCE_EXHAUSTED";
    StatusCode[StatusCode["CLIENT_DEADLINE_EXCEEDED"] = 401030] = "CLIENT_DEADLINE_EXCEEDED";
    StatusCode[StatusCode["CLIENT_CANCELED"] = 401034] = "CLIENT_CANCELED";
    StatusCode[StatusCode["UNAUTHENTICATED"] = 402030] = "UNAUTHENTICATED";
    StatusCode[StatusCode["SESSION_POOL_EMPTY"] = 402040] = "SESSION_POOL_EMPTY";
    StatusCode[StatusCode["RETRIES_EXCEEDED"] = 402050] = "RETRIES_EXCEEDED";
})(StatusCode || (exports.StatusCode = StatusCode = {}));
function retryPolicy(backoff, deleteSession, idempotent, nonIdempotent) {
    if (nonIdempotent && !idempotent)
        throw new Error('Senseless');
    return { backoff, deleteSession, idempotent, nonIdempotent };
}
class YdbError extends Error {
    static [symbols_1.RetryPolicySymbol];
    static formatIssues(issues) {
        return issues ? JSON.stringify(issues, null, 2) : '';
    }
    /**
     * If YDB returns an error YdbError is thrown.
     * @param operation
     */
    static checkStatus(operation) {
        if (!operation.status) {
            throw new MissingStatus('Missing status!');
        }
        if (operation.issues)
            operation.issues = YdbError.flatIssues(operation.issues);
        const status = operation.status;
        if (operation.status && !SUCCESS_CODES.has(status)) {
            const ErrCls = SERVER_SIDE_ERROR_CODES.get(status);
            if (!ErrCls) {
                throw new Error(`Unexpected status code ${status}!`);
            }
            else {
                throw new ErrCls(`${ErrCls.name} (code ${status}): ${YdbError.formatIssues(operation.issues)}`, operation.issues);
            }
        }
    }
    /**
     * Issues from Ydb are returned as a tree with nested issues.  Returns the list of issues as a flat array.
     * The nested issues follow their parents.
     */
    static flatIssues(issues) {
        const res = [];
        processLevel(issues);
        return res;
        function processLevel(issues) {
            for (const issue of issues) {
                res.push(issue);
                if (issue.issues)
                    processLevel(issue.issues);
                delete issue.issues;
            }
        }
    }
    static status = StatusCode.STATUS_CODE_UNSPECIFIED;
    issues;
    constructor(message, issues = []) {
        super(message);
        this.issues = issues;
    }
}
exports.YdbError = YdbError;
class StatusCodeUnspecified extends YdbError {
    static status = StatusCode.STATUS_CODE_UNSPECIFIED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.StatusCodeUnspecified = StatusCodeUnspecified;
class Unauthenticated extends YdbError {
    static status = StatusCode.UNAUTHENTICATED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, true, false, false);
}
exports.Unauthenticated = Unauthenticated;
class SessionPoolEmpty extends YdbError {
    static status = StatusCode.SESSION_POOL_EMPTY;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, true, true); // TODO: not found go impl yet
}
exports.SessionPoolEmpty = SessionPoolEmpty;
class BadRequest extends YdbError {
    static status = StatusCode.BAD_REQUEST;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.BadRequest = BadRequest;
class Unauthorized extends YdbError {
    static status = StatusCode.UNAUTHORIZED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.Unauthorized = Unauthorized;
class InternalError extends YdbError {
    static status = StatusCode.INTERNAL_ERROR;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.InternalError = InternalError;
class Aborted extends YdbError {
    static status = StatusCode.ABORTED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, true, true);
}
exports.Aborted = Aborted;
class Unavailable extends YdbError {
    static status = StatusCode.UNAVAILABLE;
    // TODO: Requires extra logic - see https://github.com/ydb-platform/ydb-go-sdk/blob/e1ba79620427a66c1564a52abe7e1ff10787d442/retry/errors_data_test.go#L197
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, true, false);
}
exports.Unavailable = Unavailable;
class Overloaded extends YdbError {
    static status = StatusCode.OVERLOADED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(2 /* Backoff.Slow */, false, true, true);
}
exports.Overloaded = Overloaded;
class SchemeError extends YdbError {
    static status = StatusCode.SCHEME_ERROR;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.SchemeError = SchemeError;
class GenericError extends YdbError {
    static status = StatusCode.GENERIC_ERROR;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.GenericError = GenericError;
class BadSession extends YdbError {
    static status = StatusCode.BAD_SESSION;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, true, true, true);
}
exports.BadSession = BadSession;
class Timeout extends YdbError {
    static status = StatusCode.TIMEOUT;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.Timeout = Timeout;
class PreconditionFailed extends YdbError {
    static status = StatusCode.PRECONDITION_FAILED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.PreconditionFailed = PreconditionFailed;
class NotFound extends YdbError {
    static status = StatusCode.NOT_FOUND;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.NotFound = NotFound;
class AlreadyExists extends YdbError {
    static status = StatusCode.ALREADY_EXISTS;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.AlreadyExists = AlreadyExists;
class SessionExpired extends YdbError {
    static status = StatusCode.SESSION_EXPIRED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, true, false, false);
}
exports.SessionExpired = SessionExpired;
class Cancelled extends YdbError {
    static status = StatusCode.CANCELLED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, false, false);
}
exports.Cancelled = Cancelled;
class Undetermined extends YdbError {
    static status = StatusCode.UNDETERMINED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, true, false);
}
exports.Undetermined = Undetermined;
class Unsupported extends YdbError {
    static status = StatusCode.UNSUPPORTED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, true, true, true);
}
exports.Unsupported = Unsupported;
class SessionBusy extends YdbError {
    static status = StatusCode.SESSION_BUSY;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, true, true, true);
}
exports.SessionBusy = SessionBusy;
class ExternalError extends YdbError {
    static status = StatusCode.EXTERNAL_ERROR;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, true);
}
exports.ExternalError = ExternalError;
const SUCCESS_CODES = new Set([
    StatusCode.STATUS_CODE_UNSPECIFIED,
    StatusCode.SUCCESS
]);
const SERVER_SIDE_ERROR_CODES = new Map([
    [StatusCode.BAD_REQUEST, BadRequest],
    [StatusCode.UNAUTHORIZED, Unauthorized],
    [StatusCode.INTERNAL_ERROR, InternalError],
    [StatusCode.ABORTED, Aborted],
    [StatusCode.UNAVAILABLE, Unavailable],
    [StatusCode.OVERLOADED, Overloaded],
    [StatusCode.SCHEME_ERROR, SchemeError],
    [StatusCode.GENERIC_ERROR, GenericError],
    [StatusCode.TIMEOUT, Timeout],
    [StatusCode.BAD_SESSION, BadSession],
    [StatusCode.PRECONDITION_FAILED, PreconditionFailed],
    [StatusCode.ALREADY_EXISTS, AlreadyExists],
    [StatusCode.NOT_FOUND, NotFound],
    [StatusCode.SESSION_EXPIRED, SessionExpired],
    [StatusCode.CANCELLED, Cancelled],
    [StatusCode.UNDETERMINED, Undetermined],
    [StatusCode.UNSUPPORTED, Unsupported],
    [StatusCode.SESSION_BUSY, SessionBusy],
    [StatusCode.EXTERNAL_ERROR, ExternalError],
]);
class TransportError extends YdbError {
    /** Check if error is member of GRPC error */
    static isMember(e) {
        return e instanceof Error && 'code' in e && 'details' in e && 'metadata' in e;
    }
    static convertToYdbError(e) {
        const ErrCls = TRANSPORT_ERROR_CODES.get(e.code);
        if (!ErrCls) {
            let errStr = `Can't convert grpc error to string`;
            try {
                errStr = JSON.stringify(e);
            }
            catch (error) { }
            return new Error(`Unexpected transport error code ${e.code}! Error itself: ${errStr}`);
        }
        else {
            const ydbErr = new ErrCls(`${ErrCls.name} (code ${ErrCls.status}): ${e.name}: ${e.message}. ${e.details}`);
            ydbErr.stack = e.stack;
            return ydbErr;
        }
    }
}
exports.TransportError = TransportError;
class TransportUnavailable extends TransportError {
    static status = StatusCode.TRANSPORT_UNAVAILABLE;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, true, true, false);
}
exports.TransportUnavailable = TransportUnavailable;
class ClientDeadlineExceeded extends TransportError {
    static status = StatusCode.CLIENT_DEADLINE_EXCEEDED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
}
exports.ClientDeadlineExceeded = ClientDeadlineExceeded;
class ClientResourceExhausted extends TransportError {
    static status = StatusCode.CLIENT_RESOURCE_EXHAUSTED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(2 /* Backoff.Slow */, false, true, true);
}
exports.ClientResourceExhausted = ClientResourceExhausted;
class ClientCancelled extends TransportError {
    static status = StatusCode.CLIENT_CANCELED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(1 /* Backoff.Fast */, false, true, false);
}
exports.ClientCancelled = ClientCancelled;
const TRANSPORT_ERROR_CODES = new Map([
    [constants_1.Status.CANCELLED, ClientCancelled],
    [constants_1.Status.UNAVAILABLE, TransportUnavailable],
    [constants_1.Status.DEADLINE_EXCEEDED, ClientDeadlineExceeded],
    [constants_1.Status.RESOURCE_EXHAUSTED, ClientResourceExhausted]
]);
class RetriesExceeded extends YdbError {
    cause;
    static status = StatusCode.RETRIES_EXCEEDED;
    [symbols_1.RetryPolicySymbol] = retryPolicy(0 /* Backoff.No */, false, false, false);
    constructor(cause) {
        super(`Operation cancelled. Cause: ${cause.message}`);
        this.cause = cause;
    }
}
exports.RetriesExceeded = RetriesExceeded;
class MissingOperation extends YdbError {
}
exports.MissingOperation = MissingOperation;
class MissingValue extends YdbError {
}
exports.MissingValue = MissingValue;
class MissingStatus extends YdbError {
}
exports.MissingStatus = MissingStatus;
class TimeoutExpired extends YdbError {
} // TODO: What's the diff with ClientCancelled
exports.TimeoutExpired = TimeoutExpired;
