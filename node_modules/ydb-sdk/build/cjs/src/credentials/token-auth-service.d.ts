import * as grpc from "@grpc/grpc-js";
import { IAuthService } from "./i-auth-service";
export declare class TokenAuthService implements IAuthService {
    private token;
    constructor(token: string);
    getAuthMetadata(): Promise<grpc.Metadata>;
}
//# sourceMappingURL=token-auth-service.d.ts.map