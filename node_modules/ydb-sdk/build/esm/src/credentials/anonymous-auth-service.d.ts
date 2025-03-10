import * as grpc from "@grpc/grpc-js";
import { IAuthService } from "./i-auth-service";
export declare class AnonymousAuthService implements IAuthService {
    constructor();
    getAuthMetadata(): Promise<grpc.Metadata>;
}
//# sourceMappingURL=anonymous-auth-service.d.ts.map