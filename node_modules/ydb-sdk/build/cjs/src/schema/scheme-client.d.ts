import { EventEmitter } from "events";
import { DescribePathResult, DescribePathSettings, IPermissionsAction, ListDirectoryResult, ListDirectorySettings, MakeDirectorySettings, ModifyPermissionsSettings, RemoveDirectorySettings } from "./scheme-service";
import { IClientSettings } from "../client/settings";
export default class SchemeClient extends EventEmitter {
    private settings;
    private schemeServices;
    constructor(settings: IClientSettings);
    private getSchemeService;
    makeDirectory(path: string, settings?: MakeDirectorySettings): Promise<void>;
    removeDirectory(path: string, settings?: RemoveDirectorySettings): Promise<void>;
    listDirectory(path: string, settings?: ListDirectorySettings): Promise<ListDirectoryResult>;
    describePath(path: string, settings?: DescribePathSettings): Promise<DescribePathResult>;
    modifyPermissions(path: string, permissionActions: IPermissionsAction[], clearPermissions?: boolean, settings?: ModifyPermissionsSettings): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=scheme-client.d.ts.map