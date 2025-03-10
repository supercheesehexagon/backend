"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationPayload = getOperationPayload;
exports.ensureOperationSucceeded = ensureOperationSucceeded;
exports.ensureCallSucceeded = ensureCallSucceeded;
const errors_1 = require("../errors");
function getOperationPayload(response) {
    var _a;
    const { operation } = response;
    if (operation) {
        errors_1.YdbError.checkStatus(operation);
        const value = (_a = operation === null || operation === void 0 ? void 0 : operation.result) === null || _a === void 0 ? void 0 : _a.value;
        if (!value) {
            throw new errors_1.MissingValue('Missing operation result value!');
        }
        return value;
    }
    else {
        throw new errors_1.MissingOperation('No operation in response!');
    }
}
function ensureOperationSucceeded(response, suppressedErrors = []) {
    try {
        getOperationPayload(response);
    }
    catch (error) {
        const e = error;
        if (suppressedErrors.indexOf(e.constructor.status) > -1) {
            return;
        }
        if (!(e instanceof errors_1.MissingValue)) {
            throw e;
        }
    }
}
function ensureCallSucceeded(response, suppressedErrors = []) {
    try {
        errors_1.YdbError.checkStatus(response);
    }
    catch (error) {
        const e = error;
        if (!(suppressedErrors.indexOf(e.constructor.status) > -1 || e instanceof errors_1.MissingValue)) {
            throw e;
        }
    }
    return response;
}
