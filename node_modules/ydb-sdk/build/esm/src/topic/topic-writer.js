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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicWriter = void 0;
const context_1 = require("../context");
const long_1 = __importDefault(require("long"));
const symbols_1 = require("./symbols");
class TopicWriter {
    writeStreamArgs;
    retrier;
    discovery;
    logger;
    messageQueue = [];
    reasonForClose;
    closeResolve;
    firstInnerStreamInitResp = true;
    getLastSeqNo; // true if client to proceed sequence based on last known seqNo
    lastSeqNo;
    attemptPromiseReject;
    innerWriteStream;
    constructor(ctx, writeStreamArgs, retrier, discovery, logger) {
        this.writeStreamArgs = writeStreamArgs;
        this.retrier = retrier;
        this.discovery = discovery;
        this.logger = logger;
        this.getLastSeqNo = !!writeStreamArgs.getLastSeqNo;
        logger.trace('%s: new TopicWriter', ctx);
        let onCancelUnsub;
        if (ctx.onCancel)
            onCancelUnsub = ctx.onCancel((cause) => {
                if (this.reasonForClose)
                    return;
                this.reasonForClose = cause;
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
                if (this.messageQueue.length > 0) {
                    return {
                        err: err,
                        idempotent: true
                    };
                }
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
            this.spreadError(ctx, err);
            this.close();
        })
            .finally(() => {
            if (onCancelUnsub)
                onCancelUnsub();
        });
    }
    async initInnerStream(ctx) {
        this.logger.trace('%s: initInnerStream()', ctx);
        // fill lastSeqNo only when the first internal stream is opened
        if (!this.firstInnerStreamInitResp && this.writeStreamArgs.getLastSeqNo) {
            this.writeStreamArgs = Object.assign(this.writeStreamArgs);
            delete this.writeStreamArgs.getLastSeqNo;
        }
        delete this.firstInnerStreamInitResp;
        const stream = await (await this.discovery.getTopicNodeClient()).openWriteStreamWithEvents(ctx, this.writeStreamArgs);
        stream.events.on('initResponse', (resp) => {
            this.logger.trace('%s: TopicWriter.on "initResponse"', ctx);
            try {
                // if received lastSeqNo in mode this.getLastSeqNo === true
                if (resp.lastSeqNo || resp.lastSeqNo === 0) {
                    this.lastSeqNo = long_1.default.fromValue(resp.lastSeqNo);
                    // if there are messages that were queued before lastSeqNo was received
                    this.messageQueue.forEach((queueItem) => {
                        queueItem.args.messages.forEach((message) => {
                            message.seqNo = this.lastSeqNo = this.lastSeqNo.add(1);
                        });
                    });
                }
                // TODO: Send messages as one batch.  Add new messages to the batch if there are some
                this.messageQueue.forEach((queueItem) => {
                    stream.writeRequest(ctx, queueItem.args);
                });
                // this.innerWriteStream variable is defined only after the stream is initialized
                this.innerWriteStream = stream;
            }
            catch (err) {
                if (!this.attemptPromiseReject)
                    throw err;
                this.attemptPromiseReject(err);
            }
        });
        stream.events.on('writeResponse', (resp) => {
            this.logger.trace('%s: TopicWriter.on "writeResponse"', ctx);
            try {
                const { acks, ...shortResp } = resp;
                resp.acks.forEach((ack) => {
                    const queueItem = this.messageQueue.shift();
                    // TODO: Check seqNo is expected and queueItem is not an undefined
                    queueItem?.resolve({
                        ...shortResp,
                        ...ack,
                    });
                });
            }
            catch (err) {
                if (!this.attemptPromiseReject)
                    throw err;
                this.attemptPromiseReject(err);
            }
            finally {
                if (this.closeResolve)
                    this.closeResolve();
            }
        });
        stream.events.on('error', (err) => {
            this.logger.trace('%s: TopicWriter.on "error": %o', ctx, err);
            this.reasonForClose = err;
            this.spreadError(ctx, err);
            try {
                delete this.innerWriteStream;
                if (this.closeResolve)
                    this.closeResolve();
            }
            catch (err) {
                if (!this.attemptPromiseReject)
                    throw err;
                this.attemptPromiseReject(err);
            }
        });
        stream.events.on('end', (cause) => {
            this.logger.trace('%s: TopicWriter.on "end": %o', ctx, cause);
            try {
                delete this.innerWriteStream;
                if (this.closeResolve)
                    this.closeResolve();
            }
            catch (err) {
                if (!this.attemptPromiseReject)
                    throw err;
                this.attemptPromiseReject(err);
            }
        });
    }
    closeInnerStream(ctx) {
        this.logger.trace('%s: TopicWriter.closeInnerStream()', ctx);
        this.innerWriteStream?.close(ctx);
        delete this.innerWriteStream;
    }
    async close(ctx, force) {
        this.logger.trace('%s: TopicWriter.close(force: %o)', ctx, !!force);
        if (this.reasonForClose)
            return;
        this.reasonForClose = new Error('close invoked');
        this.reasonForClose.cause = symbols_1.closeSymbol;
        if (force || this.messageQueue.length === 0) {
            this.innerWriteStream?.close(ctx);
            this.spreadError(ctx, this.reasonForClose);
            this.messageQueue.length = 0; // drop queue
            return;
        }
        else {
            return new Promise((resolve) => {
                this.closeResolve = resolve;
            });
        }
    }
    send(ctx, sendMessagesArgs) {
        this.logger.trace('%s: TopicWriter.sendMessages()', ctx);
        if (this.reasonForClose)
            return Promise.reject(this.reasonForClose);
        sendMessagesArgs.messages?.forEach((msg) => {
            if (this.getLastSeqNo) {
                if (!(msg.seqNo === undefined || msg.seqNo === null))
                    throw new Error('Writer was created with getLastSeqNo = true, explicit seqNo not supported');
                if (this.lastSeqNo) { // else wait till initResponse will be received
                    msg.seqNo = this.lastSeqNo = this.lastSeqNo.add(1);
                }
            }
            else {
                if (msg.seqNo === undefined || msg.seqNo === null)
                    throw new Error('Writer was created without getLastSeqNo = true, explicit seqNo must be provided');
            }
        });
        return new Promise((resolve, reject) => {
            this.messageQueue.push({ args: sendMessagesArgs, resolve, reject });
            this.innerWriteStream?.writeRequest(ctx, sendMessagesArgs);
        });
    }
    /**
     * Notify all incomplete Promise that an error has occurred.
     */
    spreadError(ctx, err) {
        this.logger.trace('%s: TopicWriter.spreadError()', ctx);
        this.messageQueue.forEach((item) => {
            item.reject(err);
        });
        this.messageQueue.length = 0;
    }
}
exports.TopicWriter = TopicWriter;
__decorate([
    (0, context_1.ensureContext)(true)
], TopicWriter.prototype, "close", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TopicWriter.prototype, "send", null);
