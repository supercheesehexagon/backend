"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuerySession = exports.attachStreamSymbol = exports.implSymbol = exports.apiSymbol = void 0;
const events_1 = __importDefault(require("events"));
const query_session_pool_1 = require("./query-session-pool");
const retries_obsoleted_1 = require("../retries_obsoleted");
const utils_1 = require("../utils");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const symbols_1 = require("./symbols");
const query_session_attach_1 = require("./query-session-attach");
const query_session_execute_1 = require("./query-session-execute");
const query_session_transaction_1 = require("./query-session-transaction");
exports.apiSymbol = Symbol('api');
exports.implSymbol = Symbol('impl');
exports.attachStreamSymbol = Symbol('attachStream');
class QuerySession extends events_1.default {
    get ctx() {
        return this[symbols_1.ctxSymbol];
    }
    get sessionId() {
        return this[symbols_1.sessionIdSymbol];
    }
    get txId() {
        return this[symbols_1.sessionTxIdSymbol];
    }
    constructor(// TODO: Change to named parameters for consistency
    _api, _impl, endpoint, sessionId, logger) {
        super();
        this.endpoint = endpoint;
        this.logger = logger;
        // TODO: Move those fields to SessionBase
        this.beingDeleted = false;
        this.free = true;
        this.closing = false;
        // TODO: Uncomment after switch to TS 5.3
        // [Symbol.asyncDispose]() {
        //     return this.delete();
        // }
        this[_a] = query_session_attach_1.attach;
        this[_b] = query_session_transaction_1.beginTransaction;
        this[_c] = query_session_transaction_1.commitTransaction;
        this[_d] = query_session_transaction_1.rollbackTransaction;
        this.execute = query_session_execute_1.execute;
        this[exports.apiSymbol] = _api;
        this[exports.implSymbol] = _impl;
        this[symbols_1.sessionIdSymbol] = sessionId;
    }
    static [symbols_1.createSymbol](api, impl, endpoint, sessionId, logger) {
        return new QuerySession(api, impl, endpoint, sessionId, logger);
    }
    [symbols_1.sessionAcquireSymbol]() {
        this.free = false;
        this.logger.debug(`Acquired session ${this.sessionId} on endpoint ${this.endpoint.toString()}.`);
        return this;
    }
    [symbols_1.sessionReleaseSymbol]() {
        if (this[symbols_1.sessionCurrentOperationSymbol])
            throw new Error('There is an active operation');
        this.free = true;
        this.logger.debug(`Released session ${this.sessionId} on endpoint ${this.endpoint.toString()}.`);
        this.emit(query_session_pool_1.SessionEvent.SESSION_RELEASE, this);
    }
    [symbols_1.sessionIsFreeSymbol]() {
        return this.free && !this[symbols_1.sessionIsDeletedSymbol]();
    }
    [symbols_1.sessionIsClosingSymbol]() {
        return this.closing;
    }
    [symbols_1.sessionDeleteOnReleaseSymbol]() {
        this.closing = true;
    }
    [symbols_1.sessionIsDeletedSymbol]() {
        return this.beingDeleted;
    }
    async delete() {
        var _e;
        if (this[symbols_1.sessionIsDeletedSymbol]())
            return;
        this.beingDeleted = true;
        await ((_e = this[exports.attachStreamSymbol]) === null || _e === void 0 ? void 0 : _e.cancel());
        delete this[exports.attachStreamSymbol]; // only one stream cancel even when multi ple retries
        (0, process_ydb_operation_result_1.ensureCallSucceeded)(await this[exports.apiSymbol].deleteSession({ sessionId: this.sessionId }));
    }
    async beginTransaction(txSettings = null) {
        if (this[symbols_1.sessionTxSettingsSymbol])
            throw new Error(query_session_execute_1.CANNOT_MANAGE_TRASACTIONS_ERROR);
        return query_session_transaction_1.beginTransaction.call(this, txSettings);
    }
    async commitTransaction() {
        if (this[symbols_1.sessionTxSettingsSymbol])
            throw new Error(query_session_execute_1.CANNOT_MANAGE_TRASACTIONS_ERROR);
        return query_session_transaction_1.commitTransaction.call(this);
    }
    async rollbackTransaction() {
        if (this[symbols_1.sessionTxSettingsSymbol])
            throw new Error(query_session_execute_1.CANNOT_MANAGE_TRASACTIONS_ERROR);
        return query_session_transaction_1.rollbackTransaction.call(this);
    }
}
exports.QuerySession = QuerySession;
_a = symbols_1.sessionAttachSymbol, _b = symbols_1.sessionBeginTransactionSymbol, _c = symbols_1.sessionCommitTransactionSymbol, _d = symbols_1.sessionRollbackTransactionSymbol;
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], QuerySession.prototype, "delete", null);
