"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginTransaction = beginTransaction;
exports.commitTransaction = commitTransaction;
exports.rollbackTransaction = rollbackTransaction;
const symbols = __importStar(require("./symbols"));
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const query_session_1 = require("./query-session");
async function beginTransaction(txSettings = null) {
    if (this[symbols.sessionTxIdSymbol])
        throw new Error('There is already opened transaction');
    const { txMeta } = (0, process_ydb_operation_result_1.ensureCallSucceeded)(await this[query_session_1.apiSymbol].beginTransaction({
        sessionId: this.sessionId,
        txSettings,
    }));
    if (this[symbols.sessionTxIdSymbol])
        throw new Error('Simultaneous beginTransaction() occurred');
    if (txMeta.id)
        this[symbols.sessionTxIdSymbol] = txMeta.id;
}
async function commitTransaction() {
    if (!this[symbols.sessionTxIdSymbol])
        throw new Error('There is no an open transaction');
    try {
        return (0, process_ydb_operation_result_1.ensureCallSucceeded)(await this[query_session_1.apiSymbol].commitTransaction({
            sessionId: this.sessionId,
            txId: this[symbols.sessionTxIdSymbol],
        }));
    }
    finally {
        delete this[symbols.sessionTxIdSymbol];
    }
}
async function rollbackTransaction() {
    if (!this[symbols.sessionTxIdSymbol])
        throw new Error('There is no an open transaction');
    try {
        return (0, process_ydb_operation_result_1.ensureCallSucceeded)(await this[query_session_1.apiSymbol].rollbackTransaction({
            sessionId: this.sessionId,
            txId: this[symbols.sessionTxIdSymbol],
        }));
    }
    finally {
        delete this[symbols.sessionTxIdSymbol];
    }
}
