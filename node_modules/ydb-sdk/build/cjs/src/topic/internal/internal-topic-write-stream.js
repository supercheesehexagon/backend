"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTopicWriteStream = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const events_1 = __importDefault(require("events"));
const errors_1 = require("../../errors");
const add_credentials_to_metadata_1 = require("../../credentials/add-credentials-to-metadata");
class InternalTopicWriteStream {
    constructor(ctx, topicService, 
    // @ts-ignore
    logger) {
        this.topicService = topicService;
        this.logger = logger;
        this.events = new events_1.default();
        this.logger.trace('%s: new TopicWriteStreamWithEvents()', ctx);
    }
    ;
    async init(ctx, args) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.init()', ctx);
        await this.topicService.updateMetadata();
        this.writeBidiStream = this.topicService.grpcServiceClient
            .makeBidiStreamRequest('/Ydb.Topic.V1.TopicService/StreamWrite', (v) => ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.FromClient.encode(v).finish(), ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.FromServer.decode, this.topicService.metadata);
        // debug: logs all events
        // const stream = this.writeBidiStream;
        // const oldEmit = stream.emit;
        // stream.emit = ((...args) => {
        //     this.logger.trace('write event: %o', args);
        //     return oldEmit.apply(stream, args as unknown as ['readable']);
        // }) as typeof oldEmit;
        this.writeBidiStream.on('data', (value) => {
            this.logger.trace('%s: TopicWriteStreamWithEvents.on "data"', ctx);
            try {
                errors_1.YdbError.checkStatus(value);
            }
            catch (err) {
                this.events.emit('error', err);
                return;
            }
            if (value.writeResponse)
                this.events.emit('writeResponse', value.writeResponse);
            else if (value.initResponse) {
                this.events.emit('initResponse', value.initResponse);
            }
            else if (value.updateTokenResponse)
                this.events.emit('updateTokenResponse', value.updateTokenResponse);
        });
        this.writeBidiStream.on('error', (err) => {
            this.logger.trace('%s: TopicWriteStreamWithEvents.on "error"', ctx);
            if (this.reasonForClose) {
                this.events.emit('end', this.reasonForClose);
            }
            else {
                err = errors_1.TransportError.convertToYdbError(err);
                this.events.emit('error', err);
            }
            this.writeBidiStream.end();
        });
        this.initRequest(ctx, args);
    }
    initRequest(ctx, args) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.initRequest()', ctx);
        // TODO: Consider zod.js
        this.writeBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.FromClient.create({
            initRequest: ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.InitRequest.create(Object.assign(Object.assign({}, args), { messageGroupId: args.producerId })),
        }));
    }
    async writeRequest(ctx, args) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.writeRequest()', ctx);
        if (this.reasonForClose)
            throw new Error('Stream is not open');
        await this.updateToken(ctx);
        this.writeBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.FromClient.create({
            writeRequest: ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.WriteRequest.create(args),
        }));
    }
    async updateTokenRequest(ctx, args) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.updateTokenRequest()', ctx);
        if (this.reasonForClose)
            throw new Error('Stream is not open');
        await this.updateToken(ctx);
        this.writeBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamWriteMessage.FromClient.create({
            updateTokenRequest: ydb_sdk_proto_1.Ydb.Topic.UpdateTokenRequest.create(args),
        }));
    }
    close(ctx, error) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.close()', ctx);
        if (this.reasonForClose)
            throw new Error('Stream is not open');
        this.reasonForClose = error;
        this.writeBidiStream.cancel();
        this.writeBidiStream.end();
    }
    // TODO: Add [dispose] that calls close()
    async updateToken(ctx) {
        this.logger.trace('%s: TopicWriteStreamWithEvents.updateToken()', ctx);
        const oldVal = (0, add_credentials_to_metadata_1.getTokenFromMetadata)(this.topicService.metadata);
        this.topicService.updateMetadata();
        const newVal = (0, add_credentials_to_metadata_1.getTokenFromMetadata)(this.topicService.metadata);
        if (newVal && oldVal !== newVal)
            await this.updateTokenRequest(ctx, {
                token: newVal
            });
    }
}
exports.InternalTopicWriteStream = InternalTopicWriteStream;
