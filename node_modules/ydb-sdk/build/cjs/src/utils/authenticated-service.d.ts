import * as $protobuf from "protobufjs";
import * as grpc from "@grpc/grpc-js";
import { ISslCredentials } from "./ssl-credentials";
import { IAuthService } from "../credentials/i-auth-service";
type ServiceFactory<T> = {
    create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): T;
};
export declare class StreamEnd extends Error {
}
export declare abstract class GrpcService<Api extends $protobuf.rpc.Service> {
    private name;
    private apiCtor;
    protected api: Api;
    protected constructor(host: string, name: string, apiCtor: ServiceFactory<Api>, sslCredentials?: ISslCredentials);
    protected getClient(host: string, sslCredentials?: ISslCredentials): Api;
}
export type MetadataHeaders = Map<string, string>;
export type ClientOptions = Record<string, any>;
export declare abstract class AuthenticatedService<Api extends $protobuf.rpc.Service> {
    private name;
    private apiCtor;
    protected authService: IAuthService;
    protected sslCredentials?: ISslCredentials | undefined;
    protected clientOptions?: ClientOptions | undefined;
    protected api: Api;
    metadata: grpc.Metadata;
    private responseMetadata;
    private lastRequest;
    private readonly headers;
    grpcServiceClient?: grpc.Client;
    static isServiceAsyncMethod(target: object, prop: string | number | symbol, receiver: any): boolean;
    getResponseMetadata(request: object): grpc.Metadata | undefined;
    protected constructor(hostOrGrpcClient: string | grpc.Client, database: string, name: string, apiCtor: ServiceFactory<Api>, authService: IAuthService, sslCredentials?: ISslCredentials | undefined, clientOptions?: ClientOptions | undefined);
    updateMetadata(): Promise<void>;
    protected getClient(hostOrGrpcClient: string | grpc.Client, sslCredentials?: ISslCredentials, clientOptions?: ClientOptions): Api;
}
export {};
//# sourceMappingURL=authenticated-service.d.ts.map