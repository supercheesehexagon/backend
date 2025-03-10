"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
const errors_1 = require("../errors");
function withTimeout(promise, timeoutMs) {
    let timeoutId;
    const timedRejection = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new errors_1.TimeoutExpired(`Timeout of ${timeoutMs}ms has expired`));
        }, timeoutMs);
    });
    return Promise.race([promise.finally(() => {
            clearTimeout(timeoutId);
        }), timedRejection]);
}
