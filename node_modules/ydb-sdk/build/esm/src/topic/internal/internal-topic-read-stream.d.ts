import { Logger } from "../../logger/simple-logger";
import { Ydb } from "ydb-sdk-proto";
import TypedEmitter from "typed-emitter/rxjs";
import { InternalTopicClient } from "./internal-topic-client";
import { Context } from "../../context";
export type InternalReadStreamInitArgs = Ydb.Topic.StreamReadMessage.IInitRequest & Required<Pick<Ydb.Topic.StreamReadMessage.IInitRequest, 'topicsReadSettings'>> & {
    receiveBufferSizeInBytes: number;
};
export type InternalReadStreamInitResult = Readonly<Ydb.Topic.StreamReadMessage.IInitResponse>;
export type InternalReadStreamReadArgs = Ydb.Topic.StreamReadMessage.IReadRequest;
export type InternalReadStreamReadResult = Readonly<Ydb.Topic.StreamReadMessage.IReadResponse>;
export type InternalReadStreamCommitOffsetArgs = Ydb.Topic.StreamReadMessage.ICommitOffsetRequest;
export type InternalReadStreamCommitOffsetResult = Readonly<Ydb.Topic.StreamReadMessage.ICommitOffsetResponse>;
export type InternalReadStreamPartitionSessionStatusArgs = Ydb.Topic.StreamReadMessage.IPartitionSessionStatusRequest;
export type InternalReadStreamPartitionSessionStatusResult = Readonly<Ydb.Topic.StreamReadMessage.IPartitionSessionStatusResponse>;
export type InternalReadStreamUpdateTokenArgs = Ydb.Topic.IUpdateTokenRequest;
export type InternalReadStreamUpdateTokenResult = Readonly<Ydb.Topic.IUpdateTokenResponse>;
export type InternalReadStreamStartPartitionSessionArgs = Ydb.Topic.StreamReadMessage.IStartPartitionSessionRequest;
export type InternalReadStreamStartPartitionSessionResult = Readonly<Ydb.Topic.StreamReadMessage.IStartPartitionSessionResponse>;
export type InternalReadStreamStopPartitionSessionArgs = Ydb.Topic.StreamReadMessage.IStopPartitionSessionRequest;
export type InternalReadStreamStopPartitionSessionResult = Readonly<Ydb.Topic.StreamReadMessage.IStopPartitionSessionResponse>;
export type ReadStreamEvents = {
    initResponse: (resp: InternalReadStreamInitResult) => void;
    readResponse: (resp: InternalReadStreamReadResult) => void;
    commitOffsetResponse: (resp: InternalReadStreamCommitOffsetResult) => void;
    partitionSessionStatusResponse: (resp: InternalReadStreamPartitionSessionStatusResult) => void;
    startPartitionSessionRequest: (resp: InternalReadStreamStartPartitionSessionArgs) => void;
    stopPartitionSessionRequest: (resp: InternalReadStreamStopPartitionSessionArgs) => void;
    updateTokenResponse: (resp: InternalReadStreamUpdateTokenResult) => void;
    error: (err: Error) => void;
    end: (cause: Error) => void;
};
export declare class InternalTopicReadStream {
    private topicService;
    readonly logger: Logger;
    events: TypedEmitter<ReadStreamEvents>;
    private reasonForClose?;
    private readBidiStream?;
    constructor(ctx: Context, topicService: InternalTopicClient, logger: Logger);
    init(ctx: Context, args: InternalReadStreamInitArgs): Promise<void>;
    initRequest(ctx: Context, args: InternalReadStreamInitArgs): void;
    readRequest(ctx: Context, args: InternalReadStreamReadArgs): Promise<void>;
    commitOffsetRequest(ctx: Context, args: InternalReadStreamCommitOffsetArgs): Promise<void>;
    partitionSessionStatusRequest(ctx: Context, args: InternalReadStreamPartitionSessionStatusArgs): Promise<void>;
    updateTokenRequest(ctx: Context, args: InternalReadStreamUpdateTokenArgs): Promise<void>;
    startPartitionSessionResponse(ctx: Context, args: InternalReadStreamStartPartitionSessionResult): Promise<void>;
    stopPartitionSessionResponse(ctx: Context, args: InternalReadStreamStopPartitionSessionResult): Promise<void>;
    close(ctx: Context, error?: Error): void;
    private updateToken;
}
//# sourceMappingURL=internal-topic-read-stream.d.ts.map