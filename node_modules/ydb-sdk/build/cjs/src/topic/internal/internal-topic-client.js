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
exports.InternalTopicClient = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const utils_1 = require("../../utils");
const internal_topic_write_stream_1 = require("./internal-topic-write-stream");
const internal_topic_read_stream_1 = require("./internal-topic-read-stream");
const grpc = __importStar(require("@grpc/grpc-js"));
class InternalTopicClient extends utils_1.AuthenticatedService {
    constructor(endpoint, database, authService, logger, sslCredentials, clientOptions) {
        const host = endpoint.toString();
        const nodeClient = sslCredentials
            ? new grpc.Client(host, grpc.credentials.createSsl(sslCredentials.rootCertificates, sslCredentials.clientCertChain, sslCredentials.clientPrivateKey), clientOptions)
            : new grpc.Client(host, grpc.credentials.createInsecure(), clientOptions);
        super(nodeClient, database, 'Ydb.Topic.V1.TopicService', ydb_sdk_proto_1.Ydb.Topic.V1.TopicService, authService, sslCredentials, clientOptions);
        this.allStreams = [];
        this.endpoint = endpoint;
        this.logger = logger;
    }
    destroy(ctx) {
        this.logger.trace('%s: InternalTopicClient.destroy()', ctx);
        let destroyPromise;
        if (this.allStreams.length > 0) {
            destroyPromise = new Promise((resolve) => {
                this.destroyResolve = resolve;
            });
            this.allStreams.forEach(s => {
                s.close(ctx);
            });
            this.allStreams = [];
        }
        return destroyPromise;
    }
    async openWriteStreamWithEvents(ctx, args) {
        this.logger.trace('%s: InternalTopicClient.openWriteStreamWithEvents()', ctx);
        if (args.producerId === undefined || args.producerId === null) {
            const newGUID = crypto.randomUUID();
            args = Object.assign(Object.assign({}, args), { producerId: newGUID, messageGroupId: newGUID });
        }
        else if (args.messageGroupId === undefined || args.messageGroupId === null) {
            args = Object.assign(Object.assign({}, args), { messageGroupId: args.producerId });
        }
        const writerStream = new internal_topic_write_stream_1.InternalTopicWriteStream(ctx, this, this.logger);
        await writerStream.init(ctx, args);
        writerStream.events.once('end', () => {
            const index = this.allStreams.findIndex(v => v === writerStream);
            if (index >= 0)
                this.allStreams.splice(index, 1);
            if (this.destroyResolve && this.allStreams.length === 0)
                this.destroyResolve(undefined);
        });
        this.allStreams.push(writerStream);
        return writerStream;
    }
    async openReadStreamWithEvents(ctx, args) {
        this.logger.trace('%s: InternalTopicClient.openReadStreamWithEvents()', ctx);
        const readStream = new internal_topic_read_stream_1.InternalTopicReadStream(ctx, this, this.logger);
        await readStream.init(ctx, args);
        readStream.events.once('end', () => {
            const index = this.allStreams.findIndex(v => v === readStream);
            if (index >= 0)
                this.allStreams.splice(index, 1);
            if (this.destroyResolve && this.allStreams.length === 0)
                this.destroyResolve(undefined);
        });
        this.allStreams.push(readStream);
        return readStream;
    }
    async commitOffset(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.commitOffset()', ctx);
        return (await this.api.commitOffset(request));
    }
    async updateOffsetsInTransaction(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.updateOffsetsInTransaction()', ctx);
        return (await this.api.updateOffsetsInTransaction(request));
    }
    async createTopic(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.createTopic()', ctx);
        return (await this.api.createTopic(request));
    }
    async describeTopic(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.describeTopic()', ctx);
        return (await this.api.describeTopic(request));
    }
    async describeConsumer(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.describeConsumer()', ctx);
        return (await this.api.describeConsumer(request));
    }
    async alterTopic(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.alterTopic()', ctx);
        return (await this.api.alterTopic(request));
    }
    async dropTopic(ctx, request) {
        this.logger.trace('%s: InternalTopicClient.dropTopic()', ctx);
        return (await this.api.dropTopic(request));
    }
}
exports.InternalTopicClient = InternalTopicClient;
