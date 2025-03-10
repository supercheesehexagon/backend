"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemeService = exports.ModifyPermissionsSettings = exports.DescribePathSettings = exports.ListDirectorySettings = exports.RemoveDirectorySettings = exports.MakeDirectorySettings = exports.DescribePathResult = exports.ListDirectoryResult = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
var SchemeServiceAPI = ydb_sdk_proto_1.Ydb.Scheme.V1.SchemeService;
exports.ListDirectoryResult = ydb_sdk_proto_1.Ydb.Scheme.ListDirectoryResult;
exports.DescribePathResult = ydb_sdk_proto_1.Ydb.Scheme.DescribePathResult;
const table_1 = require("../table");
const utils_1 = require("../utils");
const retries_obsoleted_1 = require("../retries_obsoleted");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
function preparePermissions(action) {
    if (action && action.permissionNames) {
        return {
            ...action,
            permissionNames: action.permissionNames.map((name) => name.startsWith('ydb.generic.') ? name : `ydb.generic.${name}`)
        };
    }
    return action;
}
function preparePermissionAction(action) {
    const { grant, revoke, set, ...rest } = action;
    return {
        ...rest,
        grant: preparePermissions(grant),
        revoke: preparePermissions(revoke),
        set: preparePermissions(set),
    };
}
class MakeDirectorySettings extends table_1.OperationParamsSettings {
}
exports.MakeDirectorySettings = MakeDirectorySettings;
class RemoveDirectorySettings extends table_1.OperationParamsSettings {
}
exports.RemoveDirectorySettings = RemoveDirectorySettings;
class ListDirectorySettings extends table_1.OperationParamsSettings {
}
exports.ListDirectorySettings = ListDirectorySettings;
class DescribePathSettings extends table_1.OperationParamsSettings {
}
exports.DescribePathSettings = DescribePathSettings;
class ModifyPermissionsSettings extends table_1.OperationParamsSettings {
}
exports.ModifyPermissionsSettings = ModifyPermissionsSettings;
class SchemeService extends utils_1.AuthenticatedService {
    logger;
    database;
    endpoint;
    constructor(endpoint, database, authService, logger, sslCredentials, clientOptions) {
        const host = endpoint.toString();
        super(host, database, 'Ydb.Scheme.V1.SchemeService', SchemeServiceAPI, authService, sslCredentials, clientOptions);
        this.endpoint = endpoint;
        this.database = database;
        this.logger = logger;
    }
    prepareRequest(path, settings) {
        return {
            path: `${this.database}/${path}`,
            operationParams: settings?.operationParams,
        };
    }
    async makeDirectory(path, settings) {
        const request = this.prepareRequest(path, settings);
        this.logger.debug(`Making directory ${request.path}`);
        (0, process_ydb_operation_result_1.ensureOperationSucceeded)(await this.api.makeDirectory(request));
    }
    async removeDirectory(path, settings) {
        const request = this.prepareRequest(path, settings);
        this.logger.debug(`Removing directory ${request.path}`);
        (0, process_ydb_operation_result_1.ensureOperationSucceeded)(await this.api.removeDirectory(request));
    }
    async listDirectory(path, settings) {
        const request = this.prepareRequest(path, settings);
        this.logger.debug(`Listing directory ${request.path} contents`);
        const response = await this.api.listDirectory(request);
        const payload = (0, process_ydb_operation_result_1.getOperationPayload)(response);
        return exports.ListDirectoryResult.decode(payload);
    }
    async describePath(path, settings) {
        const request = this.prepareRequest(path, settings);
        this.logger.debug(`Describing path ${request.path}`);
        const response = await this.api.describePath(request);
        const payload = (0, process_ydb_operation_result_1.getOperationPayload)(response);
        return exports.DescribePathResult.decode(payload);
    }
    async modifyPermissions(path, permissionActions, clearPermissions, settings) {
        const request = {
            ...this.prepareRequest(path, settings),
            actions: permissionActions.map(preparePermissionAction),
            clearPermissions
        };
        this.logger.debug(`Modifying permissions on path ${request.path} to ${JSON.stringify(permissionActions, null, 2)}`);
        (0, process_ydb_operation_result_1.ensureOperationSucceeded)(await this.api.modifyPermissions(request));
    }
}
exports.SchemeService = SchemeService;
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SchemeService.prototype, "makeDirectory", null);
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SchemeService.prototype, "removeDirectory", null);
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SchemeService.prototype, "listDirectory", null);
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SchemeService.prototype, "describePath", null);
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SchemeService.prototype, "modifyPermissions", null);
