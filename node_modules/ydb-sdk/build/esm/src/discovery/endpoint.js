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
exports.Endpoint = void 0;
const luxon_1 = require("luxon");
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const grpc = __importStar(require("@grpc/grpc-js"));
// TODO: Keep node ID
// TODO: Keep lazy GRPC connection
// TODO: ? drop grpc connection on end
class Endpoint extends ydb_sdk_proto_1.Ydb.Discovery.EndpointInfo {
    database;
    static HOST_RE = /^([^:]+):?(\d)*$/;
    static PESSIMIZATION_WEAR_OFF_PERIOD = 60 * 1000; //  TODO: wher off once new list of nodes was received
    pessimizedAt;
    topicNodeClient;
    static fromString(host) {
        const match = Endpoint.HOST_RE.exec(host);
        if (match) {
            const info = {
                address: match[1]
            };
            if (match[2]) {
                info.port = Number(match[2]);
            }
            return this.create(info);
        }
        throw new Error(`Provided incorrect host "${host}"`);
    }
    constructor(properties, database) {
        super(properties);
        this.database = database;
        this.pessimizedAt = null;
    }
    /*
     Update current endpoint with the attributes taken from another endpoint.
     */
    update(_endpoint) {
        // do nothing for now
        return this;
    }
    get pessimized() {
        if (this.pessimizedAt) {
            return luxon_1.DateTime.utc().diff(this.pessimizedAt).valueOf() < Endpoint.PESSIMIZATION_WEAR_OFF_PERIOD;
        }
        return false;
    }
    pessimize() {
        this.pessimizedAt = luxon_1.DateTime.utc();
    }
    toString() {
        // TODO: Find out how to specify a host ip/name for local development
        if (process.env.YDB_ENDPOINT) {
            const str = process.env.YDB_ENDPOINT;
            const n = str.indexOf('://'); // remove grpc(s)?://
            return n > 0 ? str.substr(n + 3) : str;
        } // for development only
        let result = this.address;
        if (this.port) {
            result += ':' + this.port;
        }
        return result;
    }
    grpcClient;
    // TODO: Close the client if it was not used for a time
    getGrpcClient(sslCredentials, clientOptions) {
        if (!this.grpcClient) {
            this.grpcClient = sslCredentials ?
                new grpc.Client(this.toString(), grpc.credentials.createSsl(sslCredentials.rootCertificates, sslCredentials.clientCertChain, sslCredentials.clientPrivateKey), clientOptions) :
                new grpc.Client(this.toString(), grpc.credentials.createInsecure(), clientOptions);
        }
        return this.grpcClient;
    }
    closeGrpcClient() {
        if (this.grpcClient) {
            this.grpcClient.close();
            delete this.grpcClient;
        }
    }
}
exports.Endpoint = Endpoint;
