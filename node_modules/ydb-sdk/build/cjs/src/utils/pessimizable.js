"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pessimizable = pessimizable;
const errors_1 = require("../errors");
/**
 * The jrpc session connection is pessimized in case of errors on keepALive for the table service and in case the alive connection is broken
 * in the query service.  The session remains in the pool.  Pessimization is removed after discovery serv information is updated.
 */
function pessimizable(_target, _propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            return await originalMethod.call(this, ...args);
        }
        catch (error) {
            if (!(error instanceof errors_1.NotFound)) {
                this.endpoint.pessimize();
            }
            throw error;
        }
    };
    return descriptor;
}
