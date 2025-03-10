import * as grpc from "@grpc/grpc-js";
import { IAuthService } from "./i-auth-service";
import { ISslCredentials } from "../utils/ssl-credentials";
import { HasLogger } from "../logger/has-logger";
import { Logger } from "../logger/simple-logger";
export interface IIamCredentials {
    serviceAccountId: string;
    accessKeyId: string;
    privateKey: Buffer;
    iamEndpoint: string;
}
export declare class IamAuthService implements IAuthService, HasLogger {
    private jwtExpirationTimeout;
    private tokenExpirationTimeout;
    private tokenRequestTimeout;
    private token;
    private tokenTimestamp;
    private tokenUpdateInProgress;
    private readonly iamCredentials;
    private readonly sslCredentials;
    readonly logger: Logger;
    constructor(iamCredentials: IIamCredentials, logger?: Logger);
    constructor(iamCredentials: IIamCredentials, sslCredentials?: ISslCredentials, logger?: Logger);
    getJwtRequest(): string;
    private get expired();
    private sendTokenRequest;
    private updateToken;
    private waitUntilTokenUpdated;
    getAuthMetadata(): Promise<grpc.Metadata>;
}
//# sourceMappingURL=iam-auth-service.d.ts.map