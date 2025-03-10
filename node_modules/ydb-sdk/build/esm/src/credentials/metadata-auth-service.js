"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataAuthService = void 0;
const add_credentials_to_metadata_1 = require("./add-credentials-to-metadata");
const utils_1 = require("../utils");
class MetadataAuthService {
    tokenService;
    MetadataTokenServiceClass;
    /** Do not use this, use MetadataAuthService.create */
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    /**
     * Load @yandex-cloud/nodejs-sdk and create `MetadataTokenService` if tokenService is not set
     */
    async createMetadata() {
        if (!this.tokenService) {
            const { MetadataTokenService } = await Promise.resolve().then(() => __importStar(require('@yandex-cloud/nodejs-sdk/dist/token-service/metadata-token-service')));
            this.MetadataTokenServiceClass = MetadataTokenService;
            this.tokenService = new MetadataTokenService();
        }
    }
    async getAuthMetadata() {
        await this.createMetadata();
        if (this.MetadataTokenServiceClass &&
            this.tokenService instanceof this.MetadataTokenServiceClass) {
            const token = await this.tokenService.getToken();
            return (0, add_credentials_to_metadata_1.addCredentialsToMetadata)(token);
        }
        else {
            return this.getAuthMetadataCompat();
        }
    }
    // Compatibility method for working with TokenService defined in yandex-cloud@1.x
    async getAuthMetadataCompat() {
        const MAX_TRIES = 5;
        const tokenService = this.tokenService;
        let token = tokenService.getToken();
        if (!token && typeof tokenService.initialize === 'function') {
            await tokenService.initialize();
            token = tokenService.getToken();
        }
        let tries = 0;
        while (!token && tries < MAX_TRIES) {
            await (0, utils_1.sleep)(2000);
            tries++;
            token = tokenService.getToken();
        }
        if (token) {
            return (0, add_credentials_to_metadata_1.addCredentialsToMetadata)(token);
        }
        throw new Error(`Failed to fetch access token via metadata service in ${MAX_TRIES} tries!`);
    }
}
exports.MetadataAuthService = MetadataAuthService;
