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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatedService = exports.GrpcService = exports.StreamEnd = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const version_1 = require("../version");
const lodash_1 = __importDefault(require("lodash"));
function getDatabaseHeader(database) {
    return ['x-ydb-database', database];
}
function removeProtocol(endpoint) {
    return endpoint.replace(/^(grpcs?|https?):\/\//, '');
    ;
}
class StreamEnd extends Error {
}
exports.StreamEnd = StreamEnd;
class GrpcService {
    name;
    apiCtor;
    api;
    constructor(host, name, apiCtor, sslCredentials) {
        this.name = name;
        this.apiCtor = apiCtor;
        this.api = this.getClient(removeProtocol(host), sslCredentials);
    }
    getClient(host, sslCredentials) {
        // TODO: Change to one grpc connect all services per endpoint.  Ensure that improves SLO
        const client = sslCredentials ?
            new grpc.Client(host, grpc.credentials.createSsl(sslCredentials.rootCertificates, sslCredentials.clientPrivateKey, sslCredentials.clientCertChain)) :
            new grpc.Client(host, grpc.credentials.createInsecure());
        const rpcImpl = (method, requestData, callback) => {
            if (null === method && requestData === null && callback === null) {
                // signal `end` from protobuf service
                client.close();
                return;
            }
            const path = `/${this.name}/${method.name}`;
            client.makeUnaryRequest(path, lodash_1.default.identity, lodash_1.default.identity, requestData, callback);
        };
        return this.apiCtor.create(rpcImpl);
    }
}
exports.GrpcService = GrpcService;
class AuthenticatedService {
    name;
    apiCtor;
    authService;
    sslCredentials;
    clientOptions;
    api;
    metadata;
    responseMetadata;
    lastRequest;
    headers;
    // TODO: Take from endpoint and from createSession response
    grpcServiceClient;
    static isServiceAsyncMethod(target, prop, receiver) {
        return (Reflect.has(target, prop) &&
            typeof Reflect.get(target, prop, receiver) === 'function' &&
            prop !== 'create');
    }
    getResponseMetadata(request) {
        return this.responseMetadata.get(request);
    }
    constructor(hostOrGrpcClient, database, name, apiCtor, authService, sslCredentials, clientOptions) {
        this.name = name;
        this.apiCtor = apiCtor;
        this.authService = authService;
        this.sslCredentials = sslCredentials;
        this.clientOptions = clientOptions;
        this.headers = new Map([(0, version_1.getVersionHeader)(), getDatabaseHeader(database)]);
        this.metadata = new grpc.Metadata();
        this.responseMetadata = new WeakMap();
        this.api = new Proxy(this.getClient(typeof hostOrGrpcClient === 'string' ? removeProtocol(hostOrGrpcClient) : hostOrGrpcClient, this.sslCredentials, clientOptions), {
            get: (target, prop, receiver) => {
                const property = Reflect.get(target, prop, receiver);
                return AuthenticatedService.isServiceAsyncMethod(target, prop, receiver) ?
                    async (...args) => {
                        if (!['emit', 'rpcCall', 'rpcImpl'].includes(String(prop))) {
                            if (args.length) {
                                this.lastRequest = args[0];
                            }
                        }
                        await this.updateMetadata();
                        return property.call(receiver, ...args);
                    } :
                    property;
            }
        });
    }
    async updateMetadata() {
        this.metadata = await this.authService.getAuthMetadata();
        for (const [name, value] of this.headers) {
            if (value) {
                this.metadata.add(name, value);
            }
        }
    }
    getClient(hostOrGrpcClient, sslCredentials, clientOptions) {
        const client = this.grpcServiceClient =
            typeof hostOrGrpcClient !== 'string'
                ? hostOrGrpcClient
                : sslCredentials
                    ? new grpc.Client(hostOrGrpcClient, grpc.credentials.createSsl(sslCredentials.rootCertificates, sslCredentials.clientCertChain, sslCredentials.clientPrivateKey), clientOptions)
                    : new grpc.Client(hostOrGrpcClient, grpc.credentials.createInsecure(), clientOptions);
        const rpcImpl = (method, requestData, callback) => {
            const path = `/${this.name}/${method.name}`;
            if (method.name.startsWith('Stream')) {
                client.makeServerStreamRequest(path, lodash_1.default.identity, lodash_1.default.identity, requestData, this.metadata)
                    .on('data', (data) => callback(null, data))
                    .on('end', () => callback(new StreamEnd(), null))
                    .on('error', (error) => callback(error, null));
            }
            else {
                const req = client.makeUnaryRequest(path, lodash_1.default.identity, lodash_1.default.identity, requestData, this.metadata, callback);
                const lastRequest = this.lastRequest;
                req.on('status', ({ metadata }) => {
                    if (lastRequest) {
                        this.responseMetadata.set(lastRequest, metadata);
                    }
                });
            }
        };
        return this.apiCtor.create(rpcImpl);
    }
}
exports.AuthenticatedService = AuthenticatedService;
