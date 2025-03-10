import { Ydb } from 'ydb-sdk-proto';
import SchemeServiceAPI = Ydb.Scheme.V1.SchemeService;
export import ListDirectoryResult = Ydb.Scheme.ListDirectoryResult;
export import DescribePathResult = Ydb.Scheme.DescribePathResult;
export import IPermissionsAction = Ydb.Scheme.IPermissionsAction;
import IMakeDirectoryRequest = Ydb.Scheme.IMakeDirectoryRequest;
import { OperationParamsSettings } from "../table";
import { AuthenticatedService, ClientOptions } from "../utils";
import { Endpoint } from "../discovery";
import { IAuthService } from "../credentials/i-auth-service";
import { ISslCredentials } from "../utils/ssl-credentials";
import { Logger } from "../logger/simple-logger";
export declare class MakeDirectorySettings extends OperationParamsSettings {
}
export declare class RemoveDirectorySettings extends OperationParamsSettings {
}
export declare class ListDirectorySettings extends OperationParamsSettings {
}
export declare class DescribePathSettings extends OperationParamsSettings {
}
export declare class ModifyPermissionsSettings extends OperationParamsSettings {
}
export declare class SchemeService extends AuthenticatedService<SchemeServiceAPI> {
    private logger;
    private readonly database;
    endpoint: Endpoint;
    constructor(endpoint: Endpoint, database: string, authService: IAuthService, logger: Logger, sslCredentials?: ISslCredentials, clientOptions?: ClientOptions);
    prepareRequest(path: string, settings?: OperationParamsSettings): IMakeDirectoryRequest;
    makeDirectory(path: string, settings?: MakeDirectorySettings): Promise<void>;
    removeDirectory(path: string, settings?: RemoveDirectorySettings): Promise<void>;
    listDirectory(path: string, settings?: ListDirectorySettings): Promise<ListDirectoryResult>;
    describePath(path: string, settings?: DescribePathSettings): Promise<DescribePathResult>;
    modifyPermissions(path: string, permissionActions: IPermissionsAction[], clearPermissions?: boolean, settings?: ModifyPermissionsSettings): Promise<void>;
}
//# sourceMappingURL=scheme-service.d.ts.map