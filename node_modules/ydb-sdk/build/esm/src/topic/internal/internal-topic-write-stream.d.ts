import { Logger } from "../../logger/simple-logger";
import { Ydb } from "ydb-sdk-proto";
import { InternalTopicClient } from "./internal-topic-client";
import TypedEmitter from "typed-emitter/rxjs";
import { Context } from "../../context";
export type InternalWriteStreamInitArgs = Omit<Ydb.Topic.StreamWriteMessage.IInitRequest, 'messageGroupId'> & Required<Pick<Ydb.Topic.StreamWriteMessage.IInitRequest, 'path'>>;
export type InternalWriteStreamInitResult = Readonly<Ydb.Topic.StreamWriteMessage.IInitResponse>;
export type InternalWriteStreamWriteArgs = Ydb.Topic.StreamWriteMessage.IWriteRequest & Required<Pick<Ydb.Topic.StreamWriteMessage.IWriteRequest, 'messages'>>;
export type InternalWriteStreamWriteResult = Ydb.Topic.StreamWriteMessage.IWriteResponse;
export type InternalWriteStreamUpdateTokenArgs = Ydb.Topic.IUpdateTokenRequest & Required<Pick<Ydb.Topic.IUpdateTokenRequest, 'token'>>;
export type InternalWriteStreamUpdateTokenResult = Readonly<Ydb.Topic.IUpdateTokenResponse>;
export type WriteStreamEvents = {
    initResponse: (resp: InternalWriteStreamInitResult) => void;
    writeResponse: (resp: InternalWriteStreamWriteResult) => void;
    updateTokenResponse: (resp: InternalWriteStreamUpdateTokenResult) => void;
    error: (err: Error) => void;
    end: (cause: Error) => void;
};
export declare class InternalTopicWriteStream {
    private topicService;
    private logger;
    private reasonForClose?;
    private writeBidiStream?;
    readonly events: TypedEmitter<WriteStreamEvents>;
    constructor(ctx: Context, topicService: InternalTopicClient, logger: Logger);
    init(ctx: Context, args: InternalWriteStreamInitArgs): Promise<void>;
    private initRequest;
    writeRequest(ctx: Context, args: InternalWriteStreamWriteArgs): Promise<void>;
    updateTokenRequest(ctx: Context, args: InternalWriteStreamUpdateTokenArgs): Promise<void>;
    close(ctx: Context, error?: Error): void;
    private updateToken;
}
//# sourceMappingURL=internal-topic-write-stream.d.ts.map