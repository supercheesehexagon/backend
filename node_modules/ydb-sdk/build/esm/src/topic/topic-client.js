"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicClient = void 0;
const topic_writer_1 = require("./topic-writer");
const context_1 = require("../context");
const topic_reader_1 = require("./topic-reader");
const asIdempotentRetryableLambda_1 = require("../retries/asIdempotentRetryableLambda");
class TopicClient {
    settings;
    service;
    constructor(settings) {
        this.settings = settings;
    }
    /**
     * A temporary solution while a retrier is not in the place. That whould be a pool of services on different endpoins.
     */
    async nextNodeService() {
        if (!this.service)
            this.service = await this.settings.discoveryService.getTopicNodeClient();
        await this.service.updateMetadata();
        return this.service;
    }
    async destroy(_ctx) {
        // TODO: Close opened readers and writers
    }
    async createWriter(ctx, args) {
        if (args.getLastSeqNo === undefined)
            args = { ...args, getLastSeqNo: true };
        return new topic_writer_1.TopicWriter(ctx, args, this.settings.retrier, this.settings.discoveryService, this.settings.logger);
    }
    async createReader(ctx, args) {
        return new topic_reader_1.TopicReader(ctx, args, this.settings.retrier, this.settings.discoveryService, this.settings.logger);
    }
    async commitOffset(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).commitOffset(ctx, request);
            });
        });
    }
    async updateOffsetsInTransaction(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).updateOffsetsInTransaction(ctx, request);
            });
        });
    }
    async createTopic(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).createTopic(ctx, request);
            });
        });
    }
    async describeTopic(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).describeTopic(ctx, request);
            });
        });
    }
    async describeConsumer(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).describeConsumer(ctx, request);
            });
        });
    }
    async alterTopic(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return /*await*/ (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).alterTopic(ctx, request);
            });
        });
    }
    async dropTopic(ctx, request) {
        return this.settings.retrier.retry(ctx, /*async*/ () => {
            return (0, asIdempotentRetryableLambda_1.asIdempotentRetryableLambda)(async () => {
                return /*await*/ (await this.nextNodeService()).dropTopic(ctx, request);
            });
        });
    }
}
exports.TopicClient = TopicClient;
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "destroy", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "createWriter", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "createReader", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "commitOffset", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "updateOffsetsInTransaction", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "createTopic", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "describeTopic", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "describeConsumer", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "alterTopic", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicClient.prototype, "dropTopic", null);
