import { Ydb } from "ydb-sdk-proto";
import IEndpointInfo = Ydb.Discovery.IEndpointInfo;
import * as grpc from "@grpc/grpc-js";
import { ISslCredentials } from "../utils/ssl-credentials";
import { ClientOptions } from "../utils";
import { InternalTopicClient } from "../topic/internal/internal-topic-client";
export type SuccessDiscoveryHandler = (result: Endpoint[]) => void;
export declare class Endpoint extends Ydb.Discovery.EndpointInfo {
    readonly database: string;
    static HOST_RE: RegExp;
    static PESSIMIZATION_WEAR_OFF_PERIOD: number;
    private pessimizedAt;
    topicNodeClient?: InternalTopicClient;
    static fromString(host: string): Ydb.Discovery.EndpointInfo;
    constructor(properties: IEndpointInfo, database: string);
    update(_endpoint: Endpoint): this;
    get pessimized(): boolean;
    pessimize(): void;
    toString(): string;
    private grpcClient?;
    getGrpcClient(sslCredentials?: ISslCredentials, clientOptions?: ClientOptions): grpc.Client;
    closeGrpcClient(): void;
}
//# sourceMappingURL=endpoint.d.ts.map