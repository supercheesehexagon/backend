"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSACredentialsFromJson = getSACredentialsFromJson;
exports.getCredentialsFromEnv = getCredentialsFromEnv;
const fs_1 = __importDefault(require("fs"));
const iam_auth_service_1 = require("../credentials/iam-auth-service");
const metadata_auth_service_1 = require("../credentials/metadata-auth-service");
const token_auth_service_1 = require("../credentials/token-auth-service");
const anonymous_auth_service_1 = require("../credentials/anonymous-auth-service");
const get_default_logger_1 = require("../logger/get-default-logger");
function getSACredentialsFromJson(filename) {
    const buffer = fs_1.default.readFileSync(filename);
    const payload = JSON.parse(buffer.toString());
    return {
        iamEndpoint: process.env.IAM_ENDPOINT || 'iam.api.cloud.yandex.net:443',
        serviceAccountId: payload.service_account_id,
        accessKeyId: payload.id,
        privateKey: payload.private_key
    };
}
function getCredentialsFromEnv(logger) {
    logger = logger || (0, get_default_logger_1.getDefaultLogger)();
    if (process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS) {
        logger.debug('YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS env var found, using IamAuthService with params from that json file.');
        return new iam_auth_service_1.IamAuthService(getSACredentialsFromJson(process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS));
    }
    if (process.env.YDB_ANONYMOUS_CREDENTIALS === '1') {
        logger.debug('YDB_ANONYMOUS_CREDENTIALS env var found, using AnonymousAuthService.');
        return new anonymous_auth_service_1.AnonymousAuthService();
    }
    if (process.env.YDB_METADATA_CREDENTIALS === '1') {
        logger.debug('YDB_METADATA_CREDENTIALS env var found, using MetadataAuthService.');
        return new metadata_auth_service_1.MetadataAuthService();
    }
    if (process.env.YDB_ACCESS_TOKEN_CREDENTIALS) {
        logger.debug('YDB_ACCESS_TOKEN_CREDENTIALS env var found, using TokenAuthService.');
        return new token_auth_service_1.TokenAuthService(process.env.YDB_ACCESS_TOKEN_CREDENTIALS);
    }
    logger.debug('Neither known env variable is set, getting token from Metadata Service');
    return new metadata_auth_service_1.MetadataAuthService();
}
