"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicReader = exports.Message = void 0;
const context_1 = require("../context");
const symbols_1 = require("./symbols");
const long_1 = __importDefault(require("long"));
class Message {
    constructor(innerReader, partition, batch, message) {
        this.innerReader = innerReader;
        // TODO: Decode
        // TODO: Uint8Array to string ???
        Object.assign(this, partition, batch, message);
        delete this.batches;
        delete this.messageData;
    }
    isCommitPossible() {
        return !!this.innerReader.reasonForClose;
    }
    async commit(ctx) {
        this.innerReader.logger.trace('%s: TopicReader.commit()', ctx);
        await this.innerReader.commitOffsetRequest(ctx, {
            commitOffsets: [{
                    partitionSessionId: this.partitionSessionId,
                    offsets: [
                        {
                            start: this.offset || 0,
                            end: long_1.default.fromValue(this.offset || 0).add(1),
                        }
                    ]
                }],
        });
        // TODO: Wait for response
    }
}
exports.Message = Message;
__decorate([
    (0, context_1.ensureContext)(true)
], Message.prototype, "commit", null);
class TopicReader {
    get messages() {
        this.logger.trace('%s: TopicReader.messages', this.ctx);
        if (!this._messages) {
            const self = this;
            this._messages = {
                [Symbol.asyncIterator]() {
                    return __asyncGenerator(this, arguments, function* _a() {
                        while (true) {
                            if (self.reasonForClose) {
                                if (self.reasonForClose.cause !== symbols_1.closeSymbol)
                                    throw self.reasonForClose;
                                return yield __await(void 0);
                            }
                            while (self.queue.length > 0) {
                                const msg = self.queue.shift();
                                if (msg.bytesSize) { // end of single response block
                                    self.innerReadStream.readRequest(self.ctx, {
                                        bytesSize: msg.bytesSize,
                                    });
                                }
                                yield yield __await(msg);
                            }
                            yield __await(new Promise((resolve) => {
                                self.waitNextResolve = resolve;
                            }));
                            delete self.waitNextResolve;
                        }
                    });
                }
            };
        }
        return this._messages;
    }
    constructor(ctx, readStreamArgs, retrier, discovery, logger) {
        this.ctx = ctx;
        this.readStreamArgs = readStreamArgs;
        this.retrier = retrier;
        this.discovery = discovery;
        this.logger = logger;
        this.queue = [];
        logger.trace('%s: new TopicReader', ctx);
        if (!(readStreamArgs.receiveBufferSizeInBytes > 0))
            throw new Error('receivingBufferSize must be greater than 0');
        let onCancelUnsub;
        if (ctx.onCancel)
            onCancelUnsub = ctx.onCancel((_cause) => {
                if (this.reasonForClose)
                    return;
                this.close(ctx, true);
            });
        // background process of sending and retrying
        this.retrier.retry(ctx, async (ctx, logger, attemptsCount) => {
            logger.trace('%s: retry %d', ctx, attemptsCount);
            const attemptPromise = new Promise((_, reject) => {
                this.attemptPromiseReject = reject;
            });
            await this.initInnerStream(ctx);
            return attemptPromise
                .catch((err) => {
                logger.trace('%s: retrier error: %o', ctx, err);
                if (this.waitNextResolve)
                    this.waitNextResolve(undefined);
                return this.reasonForClose && this.reasonForClose.cause === symbols_1.closeSymbol
                    ? {} // stream is correctly closed
                    : {
                        err: err,
                        idempotent: true
                    };
            })
                .finally(() => {
                this.closeInnerStream(ctx);
            });
        })
            .then(() => {
            logger.debug('%s: closed successfully', ctx);
        })
            .catch((err) => {
            logger.debug('%s: failed: %o', ctx, err);
            this.reasonForClose = err;
            if (this.waitNextResolve)
                this.waitNextResolve(undefined);
        })
            .finally(() => {
            if (onCancelUnsub)
                onCancelUnsub();
        });
    }
    async initInnerStream(ctx) {
        this.logger.trace('%s: TopicReader.initInnerStream()', ctx);
        this.innerReadStream = await (await this.discovery.getTopicNodeClient()).openReadStreamWithEvents(ctx, this.readStreamArgs);
        // this.innerReadStream.events.on('initResponse', async (resp) => {
        //     try {
        //         // TODO: Impl
        //     } catch (err) {
        //         if (this.attemptPromiseReject) this.attemptPromiseReject(err);
        //         else throw err;
        //     }
        // });
        this.innerReadStream.events.on('readResponse', async (resp) => {
            this.logger.trace('%s: on "readResponse"', ctx);
            try {
                for (const data of resp.partitionData) {
                    for (const batch of data.batches) {
                        for (const msg of batch.messageData) {
                            this.queue.push(new Message(this.innerReadStream, data, batch, msg));
                            if (this.waitNextResolve)
                                this.waitNextResolve(undefined);
                        }
                    }
                }
                this.queue[this.queue.length - 1].bytesSize = resp.bytesSize; // end of one response messages block
                if (this.waitNextResolve)
                    this.waitNextResolve(undefined);
            }
            catch (err) {
                if (this.attemptPromiseReject)
                    this.attemptPromiseReject(err);
                else
                    throw err;
            }
        });
        // TODO:
        // this.innerReadStream.events.on('commitOffsetResponse', async (req) => {
        //     this.logger.trace('%s: on "commitOffsetResponse"', ctx);
        //     try {
        //         // TODO: Should I inform user if there is a gap
        //     } catch (err) {
        //         if (this.attemptPromiseReject) this.attemptPromiseReject(err);
        //         else throw err;
        //     }
        // });
        // this.innerReadStream.events.on('partitionSessionStatusResponse', async (req) => {
        //     this.logger.trace('%s: TopicReader.on "partitionSessionStatusResponse"', ctx);
        //
        //     try  {
        //         // TODO: Method in partition obj
        //     } catch (err) {
        //         if (this.attemptPromiseReject) this.attemptPromiseReject(err);
        //         else throw err;
        //     }
        // });
        this.innerReadStream.events.on('startPartitionSessionRequest', async (req) => {
            var _a, _b;
            this.logger.trace('%s: on "startPartitionSessionRequest"', ctx);
            try {
                // TODO: Add partition to the list, and call callbacks at the end
                // Hack: Just confirm
                (_a = this.innerReadStream) === null || _a === void 0 ? void 0 : _a.startPartitionSessionResponse(ctx, {
                    partitionSessionId: (_b = req.partitionSession) === null || _b === void 0 ? void 0 : _b.partitionSessionId,
                    // commitOffset ???
                    // readOffset ???
                });
            }
            catch (err) {
                if (this.attemptPromiseReject)
                    this.attemptPromiseReject(err);
                else
                    throw err;
            }
        });
        // this.innerReadStream.events.on('stopPartitionSessionRequest', async (req) => {
        //     this.logger.trace('%s: TopicReader.on "stopPartitionSessionRequest"', ctx);
        //     try  {
        //         // TODO: Remove from partions list
        //     } catch (err) {
        //         if (this.attemptPromiseReject) this.attemptPromiseReject(err);
        //         else throw err;
        //     }
        // });
        // this.innerReadStream.events.on('updateTokenResponse', () => {
        //     this.logger.trace('%s: TopicReader.on "updateTokenResponse"', ctx);
        //     try  {
        //         // TODO: Ensure its ok
        //     } catch (err) {
        //         if (this.attemptPromiseReject) this.attemptPromiseReject(err);
        //         else throw err;
        //     }
        // });
        this.innerReadStream.events.on('error', (error) => {
            this.logger.trace('%s: TopicReader.on "error"', ctx);
            if (this.attemptPromiseReject)
                this.attemptPromiseReject(error);
            else
                throw error;
        });
        this.innerReadStream.events.on('end', (reason) => {
            this.logger.trace('%s: TopicReader.on "end": %o', ctx, reason);
            try {
                this.queue.length = 0; // drp messages queue
                delete this.innerReadStream;
                if (this.closeResolve)
                    this.closeResolve();
            }
            catch (err) {
                if (this.attemptPromiseReject)
                    this.attemptPromiseReject(err);
                else
                    throw err;
            }
        });
        this.innerReadStream.readRequest(ctx, {
            bytesSize: this.readStreamArgs.receiveBufferSizeInBytes,
        });
    }
    /**
     * @param force true - stopprocessing immidiatly, without processing messages left in the queue.
     */
    async close(ctx, force) {
        this.logger.trace('%s: TopicReader.close()', ctx);
        if (!this.reasonForClose) {
            this.reasonForClose = new Error('close');
            this.reasonForClose.cause = symbols_1.closeSymbol;
            if (force) {
                this.queue.length = 0; // drop rest of messages
                if (this.waitNextResolve)
                    this.waitNextResolve(undefined);
            }
            else {
                this.closePromise = new Promise((resolve) => {
                    this.closeResolve = resolve;
                });
            }
            await this.innerReadStream.close(ctx);
        }
        return this.closePromise;
    }
    async closeInnerStream(ctx) {
        this.logger.trace('%s: TopicReader.closeInnerStream()', ctx);
        if (this.innerReadStream) {
            await this.innerReadStream.close(ctx);
            delete this.innerReadStream;
        }
    }
}
exports.TopicReader = TopicReader;
__decorate([
    (0, context_1.ensureContext)(true)
], TopicReader.prototype, "close", null);
