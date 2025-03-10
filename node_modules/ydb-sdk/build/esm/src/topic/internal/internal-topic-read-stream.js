"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTopicReadStream = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const events_1 = __importDefault(require("events"));
const errors_1 = require("../../errors");
const symbols_1 = require("../symbols");
const add_credentials_to_metadata_1 = require("../../credentials/add-credentials-to-metadata");
class InternalTopicReadStream {
    topicService;
    logger;
    events = new events_1.default();
    reasonForClose;
    readBidiStream;
    constructor(ctx, topicService, 
    // @ts-ignore
    logger) {
        this.topicService = topicService;
        this.logger = logger;
        this.logger.trace('%s: new TopicReadStreamWithEvents()', ctx);
    }
    ;
    async init(ctx, args) {
        this.logger.trace('%s: InternalTopicReadStream.init()', ctx);
        await this.topicService.updateMetadata();
        this.readBidiStream = this.topicService.grpcServiceClient
            .makeBidiStreamRequest('/Ydb.Topic.V1.TopicService/StreamRead', (v) => ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.encode(v).finish(), ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromServer.decode, this.topicService.metadata);
        //// Uncomment to see all events
        // const oldEmit = stream.emit;
        // stream.emit = ((...args) => {
        //     console.info('read event:', args);
        //     return oldEmit.apply(stream, args as unknown as ['readable']);
        // }) as typeof oldEmit;
        this.readBidiStream.on('data', (value) => {
            this.logger.trace('%s: TopicReadStreamWithEvents.on "data"', ctx);
            try {
                try {
                    errors_1.YdbError.checkStatus(value);
                }
                catch (err) {
                    this.events.emit('error', err);
                    return;
                }
                if (value.readResponse)
                    this.events.emit('readResponse', value.readResponse);
                else if (value.initResponse) {
                    this.events.emit('initResponse', value.initResponse);
                }
                else if (value.commitOffsetResponse)
                    this.events.emit('commitOffsetResponse', value.commitOffsetResponse);
                else if (value.partitionSessionStatusResponse)
                    this.events.emit('partitionSessionStatusResponse', value.partitionSessionStatusResponse);
                else if (value.startPartitionSessionRequest)
                    this.events.emit('startPartitionSessionRequest', value.startPartitionSessionRequest);
                else if (value.stopPartitionSessionRequest)
                    this.events.emit('stopPartitionSessionRequest', value.stopPartitionSessionRequest);
                else if (value.updateTokenResponse)
                    this.events.emit('updateTokenResponse', value.updateTokenResponse);
            }
            catch (err) {
                this.events.emit('error', err);
            }
        });
        this.readBidiStream.on('error', (err) => {
            this.logger.trace('%s: TopicReadStreamWithEvents.on "error"', ctx);
            if (this.reasonForClose) {
                this.events.emit('end', err);
            }
            else {
                this.events.emit('error', errors_1.TransportError.convertToYdbError(err));
            }
        });
        this.initRequest(ctx, args);
    }
    initRequest(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.initRequest()', ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.create({
            initRequest: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.InitRequest.create(args),
        }));
    }
    async readRequest(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.readRequest()', ctx);
        if (!this.readBidiStream)
            throw new Error('Stream is closed');
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            readRequest: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.ReadRequest.create(args),
        }));
    }
    async commitOffsetRequest(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.commitOffsetRequest()', ctx);
        if (!this.readBidiStream) {
            const err = new Error('Inner stream where from the message was received is closed. The message needs to be re-processed.');
            err.cause = symbols_1.innerStreamClosedSymbol;
            throw err;
        }
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            commitOffsetRequest: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.CommitOffsetRequest.create(args),
        }));
    }
    async partitionSessionStatusRequest(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.partitionSessionStatusRequest()', ctx);
        if (!this.readBidiStream)
            throw new Error('Stream is closed');
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            partitionSessionStatusRequest: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.PartitionSessionStatusRequest.create(args),
        }));
    }
    async updateTokenRequest(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.updateTokenRequest()', ctx);
        if (!this.readBidiStream)
            throw new Error('Stream is closed');
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            updateTokenRequest: ydb_sdk_proto_1.Ydb.Topic.UpdateTokenRequest.create(args),
        }));
        // TODO: process response
    }
    async startPartitionSessionResponse(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.startPartitionSessionResponse()', ctx);
        if (!this.readBidiStream)
            throw new Error('Stream is closed');
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            startPartitionSessionResponse: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.StartPartitionSessionResponse.create(args),
        }));
    }
    async stopPartitionSessionResponse(ctx, args) {
        this.logger.trace('%s: TopicReadStreamWithEvents.stopPartitionSessionResponse()', ctx);
        if (this.reasonForClose)
            throw new Error('Stream is not open');
        await this.updateToken(ctx);
        this.readBidiStream.write(ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.FromClient.create({
            stopPartitionSessionResponse: ydb_sdk_proto_1.Ydb.Topic.StreamReadMessage.StopPartitionSessionResponse.create(args),
        }));
    }
    close(ctx, error) {
        this.logger.trace('%s: TopicReadStreamWithEvents.close()', ctx);
        if (this.reasonForClose)
            throw new Error('Stream is not open');
        this.reasonForClose = error;
        this.readBidiStream.cancel();
    }
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
exports.InternalTopicReadStream = InternalTopicReadStream;
