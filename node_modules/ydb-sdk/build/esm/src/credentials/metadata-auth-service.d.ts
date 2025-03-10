import * as grpc from "@grpc/grpc-js";
import { ITokenService } from "./i-token-service";
import { IAuthService } from "./i-auth-service";
export declare class MetadataAuthService implements IAuthService {
    private tokenService?;
    private MetadataTokenServiceClass?;
    /** Do not use this, use MetadataAuthService.create */
    constructor(tokenService?: ITokenService);
    /**
     * Load @yandex-cloud/nodejs-sdk and create `MetadataTokenService` if tokenService is not set
     */
    private createMetadata;
    getAuthMetadata(): Promise<grpc.Metadata>;
    private getAuthMetadataCompat;
}
//# sourceMappingURL=metadata-auth-service.d.ts.map