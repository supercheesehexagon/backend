"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamAuthService = void 0;
const luxon_1 = require("luxon");
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const retries_obsoleted_1 = require("../retries_obsoleted");
var IamTokenService = ydb_sdk_proto_1.yandex.cloud.iam.v1.IamTokenService;
const add_credentials_to_metadata_1 = require("./add-credentials-to-metadata");
const ssl_credentials_1 = require("../utils/ssl-credentials");
const get_default_logger_1 = require("../logger/get-default-logger");
class IamTokenGrpcService extends utils_1.GrpcService {
    logger;
    constructor(iamCredentials, sslCredentialsOrLogger, logger) {
        const hasLogger = typeof sslCredentialsOrLogger === 'object' && sslCredentialsOrLogger !== null && 'error' in sslCredentialsOrLogger;
        super(iamCredentials.iamEndpoint, 'yandex.cloud.iam.v1.IamTokenService', IamTokenService, (sslCredentialsOrLogger && !hasLogger) ? sslCredentialsOrLogger : undefined);
        if (hasLogger) {
            this.logger = sslCredentialsOrLogger;
        }
        else {
            this.logger = logger ?? (0, get_default_logger_1.getDefaultLogger)();
        }
    }
    create(request) {
        return this.api.create(request);
    }
    destroy() {
        this.api.end();
    }
}
__decorate([
    (0, retries_obsoleted_1.retryable)()
], IamTokenGrpcService.prototype, "create", null);
class IamAuthService {
    jwtExpirationTimeout = 3600 * 1000;
    tokenExpirationTimeout = 120 * 1000;
    tokenRequestTimeout = 10 * 1000;
    token = '';
    tokenTimestamp;
    tokenUpdateInProgress = false;
    iamCredentials;
    sslCredentials;
    logger;
    constructor(iamCredentials, sslCredentialsOrLogger, logger) {
        this.iamCredentials = iamCredentials;
        this.tokenTimestamp = null;
        if (typeof sslCredentialsOrLogger === 'object' && sslCredentialsOrLogger !== null && 'error' in sslCredentialsOrLogger) {
            this.sslCredentials = (0, ssl_credentials_1.makeDefaultSslCredentials)();
            this.logger = sslCredentialsOrLogger;
        }
        else {
            this.sslCredentials = sslCredentialsOrLogger || (0, ssl_credentials_1.makeDefaultSslCredentials)();
            this.logger = logger ?? (0, get_default_logger_1.getDefaultLogger)();
        }
    }
    getJwtRequest() {
        const now = luxon_1.DateTime.utc();
        const expires = now.plus({ milliseconds: this.jwtExpirationTimeout });
        const payload = {
            "iss": this.iamCredentials.serviceAccountId,
            "aud": "https://iam.api.cloud.yandex.net/iam/v1/tokens",
            "iat": Math.round(now.toSeconds()),
            "exp": Math.round(expires.toSeconds())
        };
        const options = {
            algorithm: "PS256",
            keyid: this.iamCredentials.accessKeyId
        };
        return jsonwebtoken_1.default.sign(payload, this.iamCredentials.privateKey, options);
    }
    get expired() {
        return !this.tokenTimestamp || (luxon_1.DateTime.utc().diff(this.tokenTimestamp).valueOf() > this.tokenExpirationTimeout);
    }
    async sendTokenRequest() {
        let runtimeIamAuthService = new IamTokenGrpcService(this.iamCredentials, this.sslCredentials, this.logger);
        const tokenPromise = runtimeIamAuthService.create({ jwt: this.getJwtRequest() });
        const result = await (0, utils_1.withTimeout)(tokenPromise, this.tokenRequestTimeout);
        runtimeIamAuthService.destroy();
        return result;
    }
    async updateToken() {
        this.tokenUpdateInProgress = true;
        const { iamToken } = await this.sendTokenRequest();
        if (iamToken) {
            this.token = iamToken;
            this.tokenTimestamp = luxon_1.DateTime.utc();
            this.tokenUpdateInProgress = false;
        }
        else {
            this.tokenUpdateInProgress = false;
            throw new Error('Received empty token from IAM!');
        }
    }
    async waitUntilTokenUpdated() {
        while (this.tokenUpdateInProgress) {
            await (0, utils_1.sleep)(1);
        }
        return;
    }
    async getAuthMetadata() {
        if (this.expired) {
            // block updateToken calls while token updating
            if (this.tokenUpdateInProgress)
                await this.waitUntilTokenUpdated();
            else
                await this.updateToken();
        }
        return (0, add_credentials_to_metadata_1.addCredentialsToMetadata)(this.token);
    }
}
exports.IamAuthService = IamAuthService;
