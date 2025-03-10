import { InternalWriteStreamInitArgs } from "./internal/internal-topic-write-stream";
import { Logger } from "../logger/simple-logger";
import { RetryStrategy } from "../retries/retryStrategy";
import { Context } from "../context";
import Long from "long";
import { google, Ydb } from "ydb-sdk-proto";
import DiscoveryService from "../discovery/discovery-service";
export type ISendArgs = {
    messages: ({
        data: Uint8Array;
        seqNo?: (number | Long | null);
        createdAt?: (google.protobuf.ITimestamp | null);
        uncompressedSize?: (number | Long | null);
        messageGroupId?: (string | null);
        partitionId?: (number | Long | null);
        metadataItems?: (Ydb.Topic.IMetadataItem[] | null);
    }[] | null);
    codec?: (number | null);
    tx?: (Ydb.Topic.ITransactionIdentity | null);
};
export type ISendResult = {};
export declare class TopicWriter {
    private writeStreamArgs;
    private retrier;
    private discovery;
    private logger;
    private messageQueue;
    private reasonForClose?;
    private closeResolve?;
    private firstInnerStreamInitResp?;
    private getLastSeqNo?;
    private lastSeqNo?;
    private attemptPromiseReject?;
    private innerWriteStream?;
    constructor(ctx: Context, writeStreamArgs: InternalWriteStreamInitArgs, retrier: RetryStrategy, discovery: DiscoveryService, logger: Logger);
    private initInnerStream;
    private closeInnerStream;
    close(force?: boolean): void;
    close(ctx: Context, force?: boolean): void;
    send(sendMessagesArgs: ISendArgs): Promise<ISendResult>;
    send(ctx: Context, sendMessagesArgs: ISendArgs): Promise<ISendResult>;
    /**
     * Notify all incomplete Promise that an error has occurred.
     */
    private spreadError;
}
//# sourceMappingURL=topic-writer.d.ts.map