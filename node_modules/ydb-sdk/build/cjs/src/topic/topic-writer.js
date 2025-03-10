"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
    constructor(ctx, writeStreamArgs, retrier, discovery, logger) {
        this.writeStreamArgs = writeStreamArgs;
        this.retrier = retrier;
        this.discovery = discovery;
        this.logger = logger;
        this.messageQueue = [];
        this.firstInnerStreamInitResp = true;
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
                const { acks } = resp, shortResp = __rest(resp, ["acks"]);
                resp.acks.forEach((ack) => {
                    const queueItem = this.messageQueue.shift();
                    // TODO: Check seqNo is expected and queueItem is not an undefined
                    queueItem === null || queueItem === void 0 ? void 0 : queueItem.resolve(Object.assign(Object.assign({}, shortResp), ack));
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
        var _a;
        this.logger.trace('%s: TopicWriter.closeInnerStream()', ctx);
        (_a = this.innerWriteStream) === null || _a === void 0 ? void 0 : _a.close(ctx);
        delete this.innerWriteStream;
    }
    async close(ctx, force) {
        var _a;
        this.logger.trace('%s: TopicWriter.close(force: %o)', ctx, !!force);
        if (this.reasonForClose)
            return;
        this.reasonForClose = new Error('close invoked');
        this.reasonForClose.cause = symbols_1.closeSymbol;
        if (force || this.messageQueue.length === 0) {
            (_a = this.innerWriteStream) === null || _a === void 0 ? void 0 : _a.close(ctx);
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
        var _a;
        this.logger.trace('%s: TopicWriter.sendMessages()', ctx);
        if (this.reasonForClose)
            return Promise.reject(this.reasonForClose);
        (_a = sendMessagesArgs.messages) === null || _a === void 0 ? void 0 : _a.forEach((msg) => {
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
            var _a;
            this.messageQueue.push({ args: sendMessagesArgs, resolve, reject });
            (_a = this.innerWriteStream) === null || _a === void 0 ? void 0 : _a.writeRequest(ctx, sendMessagesArgs);
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
