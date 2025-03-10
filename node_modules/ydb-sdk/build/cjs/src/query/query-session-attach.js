"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = attach;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const errors_1 = require("../errors");
const query_session_1 = require("./query-session");
async function attach(onStreamClosed) {
    if (this[query_session_1.attachStreamSymbol])
        throw new Error('Already attached');
    let connected = false;
    await this[query_session_1.implSymbol].updateMetadata();
    return new Promise((resolve, reject) => {
        this[query_session_1.attachStreamSymbol] = this[query_session_1.implSymbol].grpcServiceClient.makeServerStreamRequest('/Ydb.Query.V1.QueryService/AttachSession', (v) => ydb_sdk_proto_1.Ydb.Query.AttachSessionRequest.encode(v).finish(), ydb_sdk_proto_1.Ydb.Query.SessionState.decode, ydb_sdk_proto_1.Ydb.Query.AttachSessionRequest.create({ sessionId: this.sessionId }), this[query_session_1.implSymbol].metadata);
        this[query_session_1.attachStreamSymbol].on('data', (partialResp) => {
            this.logger.debug('attach(): data: %o', partialResp);
            if (!connected) {
                connected = true;
                try {
                    (0, process_ydb_operation_result_1.ensureCallSucceeded)(partialResp);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }
        });
        this[query_session_1.attachStreamSymbol].on('metadata', (metadata) => {
            this.logger.trace('attach(): metadata: %o', metadata);
        });
        // TODO: Ensure that on-error always returns GrpcStatusObject
        this[query_session_1.attachStreamSymbol].on('error', (err) => {
            this.logger.trace('attach(): error: %o', err);
            if (connected) {
                // delete this[attachStream]; // uncomment when reattach policy will be implemented
                onStreamClosed();
            }
            else {
                reject(errors_1.TransportError.convertToYdbError(err));
            }
        });
        this[query_session_1.attachStreamSymbol].on('end', () => {
            this.logger.trace('attach(): end');
            // delete this[attachStream]; // uncomment when reattach policy will be implemented
            onStreamClosed();
        });
    });
}
