import { InternalReadStreamInitArgs, InternalTopicReadStream } from "./internal/internal-topic-read-stream";
import DiscoveryService from "../discovery/discovery-service";
import { RetryStrategy } from "../retries/retryStrategy";
import { Context } from "../context";
import { Logger } from "../logger/simple-logger";
import { google, Ydb } from "ydb-sdk-proto";
import Long from "long";
export declare class Message {
    private innerReader;
    bytesSize?: number | Long | null;
    partitionSessionId?: number | Long | null;
    codec?: number | null;
    producerId?: string | null;
    writeSessionMeta?: {
        [p: string]: string;
    } | null;
    writtenAt?: google.protobuf.ITimestamp | null;
    createdAt?: google.protobuf.ITimestamp | null;
    data?: Uint8Array | null;
    messageGroupId?: string | null;
    metadataItems?: Ydb.Topic.IMetadataItem[] | null;
    offset?: number | Long | null;
    seqNo?: number | Long | null;
    uncompressedSize?: number | Long | null;
    constructor(innerReader: InternalTopicReadStream, partition: Ydb.Topic.StreamReadMessage.ReadResponse.IPartitionData, batch: Ydb.Topic.StreamReadMessage.ReadResponse.IBatch, message: Ydb.Topic.StreamReadMessage.ReadResponse.IMessageData);
    isCommitPossible(): boolean;
    commit(): Promise<void>;
    commit(ctx: Context): Promise<void>;
}
export declare class TopicReader {
    private ctx;
    private readStreamArgs;
    private retrier;
    private discovery;
    private logger;
    private closeResolve?;
    private reasonForClose?;
    private attemptPromiseReject?;
    private queue;
    private waitNextResolve?;
    private innerReadStream?;
    private closePromise?;
    private _messages?;
    get messages(): {
        [Symbol.asyncIterator]: () => AsyncGenerator<Message, void>;
    };
    constructor(ctx: Context, readStreamArgs: InternalReadStreamInitArgs, retrier: RetryStrategy, discovery: DiscoveryService, logger: Logger);
    private initInnerStream;
    close(force?: boolean): void;
    close(ctx: Context, force?: boolean): void;
    private closeInnerStream;
}
//# sourceMappingURL=topic-reader.d.ts.map