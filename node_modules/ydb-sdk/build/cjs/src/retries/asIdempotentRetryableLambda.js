"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asIdempotentRetryableLambda = asIdempotentRetryableLambda;
const errors_1 = require("../errors");
async function asIdempotentRetryableLambda(fn) {
    try {
        const result = await fn();
        return { result, idempotent: true };
    }
    catch (err) {
        if (errors_1.TransportError.isMember(err))
            err = errors_1.TransportError.convertToYdbError(err);
        return { err: err, idempotent: true };
    }
}
