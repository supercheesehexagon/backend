import { TopicWriter } from "./topic-writer";
import { Context } from "../context";
import { IClientSettings } from "../client/settings";
import { TopicReader } from "./topic-reader";
import { google, Ydb } from "ydb-sdk-proto";
import Long from "long";
export type ICreateWriterArgs = {
    path: string;
    producerId?: (string | null);
    writeSessionMeta?: ({
        [k: string]: string;
    } | null);
    messageGroupId?: (string | null);
    partitionId?: (number | Long | null);
    getLastSeqNo?: (boolean | null);
};
export type ICreateReaderArgs = {
    receiveBufferSizeInBytes: number;
    topicsReadSettings: {
        path: string;
        partitionIds?: ((number | Long)[] | null);
        maxLag?: (google.protobuf.IDuration | null);
        readFrom?: (google.protobuf.ITimestamp | null);
    }[];
    consumer?: (string | null);
    readerName?: (string | null);
};
export type ICommitOffsetArgs = {
    path: (string | null);
    partitionId?: (number | Long | null);
    consumer: (string | null);
    offset: (number | Long | null);
};
export type IUpdateOffsetsInTransactionArgs = {
    operationParams?: (Ydb.Operations.IOperationParams | null);
    tx?: (Ydb.Topic.ITransactionIdentity | null);
    topics: Ydb.Topic.UpdateOffsetsInTransactionRequest.ITopicOffsets[];
    consumer: string;
};
export type ICreateTopicArgs = {
    path: (string | null);
    partitioningSettings?: ({
        minActivePartitions?: (number | Long | null);
        partitionCountLimit?: (number | Long | null);
    } | null);
    retentionPeriod?: (google.protobuf.ITimestamp | null);
    retentionStorageMb?: (number | Long | null);
    supportedCodecs?: ({
        codecs?: (number[] | null);
    } | null);
    partitionWriteSpeedBytesPerSecond?: (number | Long | null);
    partitionWriteBurstBytes?: (number | Long | null);
    attributes?: ({
        [k: string]: string;
    } | null);
    consumers?: ({
        name?: (string | null);
        important?: (boolean | null);
        readFrom?: (google.protobuf.ITimestamp | null);
        supportedCodecs?: ({
            codecs?: (number[] | null);
        } | null);
        attributes?: ({
            [k: string]: string;
        } | null);
        consumerStats?: ({
            minPartitionsLastReadTime?: (google.protobuf.ITimestamp | null);
            maxReadTimeLag?: (google.protobuf.IDuration | null);
            maxWriteTimeLag?: (google.protobuf.IDuration | null);
            bytesRead?: ({
                perMinute?: (number | Long | null);
                perHour?: (number | Long | null);
                perDay?: (number | Long | null);
            } | null);
        } | null);
    }[] | null);
    meteringMode?: (Ydb.Topic.MeteringMode | null);
};
export type IDescribeTopicArgs = {
    path: string;
    includeStats?: (boolean | null);
};
export type IDescribeConsumerArgs = {
    path: string;
    consumer: string;
};
export type IAlterTopicArgs = {
    path: string;
    alterPartitioningSettings?: ({
        setMinActivePartitions?: (number | Long | null);
        setPartitionCountLimit?: (number | Long | null);
    } | null);
    setRetentionPeriod?: (google.protobuf.IDuration | null);
    setRetentionStorageMb?: (number | Long | null);
    setSupportedCodecs?: ({
        codecs?: (number[] | null);
    } | null);
    setPartitionWriteSpeedBytesPerSecond?: (number | Long | null);
    setPartitionWriteBurstBytes?: (number | Long | null);
    alterAttributes?: ({
        [k: string]: string;
    } | null);
    addConsumers?: ({
        name?: (string | null);
        important?: (boolean | null);
        readFrom?: (google.protobuf.ITimestamp | null);
        supportedCodecs?: ({
            codecs?: (number[] | null);
        } | null);
        attributes?: ({
            [k: string]: string;
        } | null);
        consumerStats?: ({
            minPartitionsLastReadTime?: (google.protobuf.ITimestamp | null);
            maxReadTimeLag?: (google.protobuf.IDuration | null);
            maxWriteTimeLag?: (google.protobuf.IDuration | null);
            bytesRead?: ({
                perMinute?: (number | Long | null);
                perHour?: (number | Long | null);
                perDay?: (number | Long | null);
            } | null);
        } | null);
    }[] | null);
    dropConsumers?: (string[] | null);
    alterConsumers?: ({
        name: string;
        setImportant?: (boolean | null);
        setReadFrom?: (google.protobuf.ITimestamp | null);
        setSupportedCodecs?: ({
            codecs?: (number[] | null);
        } | null);
        alterAttributes?: ({
            [k: string]: string;
        } | null);
    }[] | null);
    setMeteringMode?: (Ydb.Topic.MeteringMode | null);
};
export type IDropTopicArgs = {
    path: string;
};
export type IOperationResult = {
    readonly operation?: ({
        readonly id?: (string | null);
        readonly ready?: (boolean | null);
        readonly status?: (Ydb.StatusIds.StatusCode | null);
        readonly issues?: (Ydb.Issue.IIssueMessage[] | null);
        readonly result?: (google.protobuf.IAny | null);
        readonly metadata?: (google.protobuf.IAny | null);
        readonly costInfo?: (Ydb.ICostInfo | null);
    } | null);
};
export declare class TopicClient {
    private settings;
    private service?;
    constructor(settings: IClientSettings);
    /**
     * A temporary solution while a retrier is not in the place. That whould be a pool of services on different endpoins.
     */
    private nextNodeService;
    destroy(): void;
    destroy(_ctx: Context): void;
    createWriter(args: ICreateWriterArgs): TopicWriter;
    createWriter(ctx: Context, args: ICreateWriterArgs): TopicWriter;
    createReader(args: ICreateReaderArgs): TopicReader;
    createReader(ctx: Context, args: ICreateReaderArgs): TopicReader;
    commitOffset(request: ICommitOffsetArgs): Promise<IOperationResult>;
    commitOffset(ctx: Context, request: ICommitOffsetArgs): Promise<IOperationResult>;
    updateOffsetsInTransaction(request: IUpdateOffsetsInTransactionArgs): Promise<IOperationResult>;
    updateOffsetsInTransaction(ctx: Context, request: IUpdateOffsetsInTransactionArgs): Promise<IOperationResult>;
    createTopic(request: ICreateTopicArgs): Promise<IOperationResult>;
    createTopic(ctx: Context, request: ICreateTopicArgs): Promise<IOperationResult>;
    describeTopic(request: IDescribeTopicArgs): Promise<IOperationResult>;
    describeTopic(ctx: Context, request: IDescribeTopicArgs): Promise<IOperationResult>;
    describeConsumer(request: IDescribeConsumerArgs): Promise<IOperationResult>;
    describeConsumer(ctx: Context, request: IDescribeConsumerArgs): Promise<IOperationResult>;
    alterTopic(request: IAlterTopicArgs): Promise<IOperationResult>;
    alterTopic(ctx: Context, request: IAlterTopicArgs): Promise<IOperationResult>;
    dropTopic(request: IDropTopicArgs): Promise<IOperationResult>;
    dropTopic(ctx: Context, request: IDropTopicArgs): Promise<IOperationResult>;
}
//# sourceMappingURL=topic-client.d.ts.map