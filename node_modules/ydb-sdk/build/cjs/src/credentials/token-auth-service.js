"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenAuthService = void 0;
const add_credentials_to_metadata_1 = require("./add-credentials-to-metadata");
class TokenAuthService {
    constructor(token) {
        this.token = token;
    }
    async getAuthMetadata() {
        return (0, add_credentials_to_metadata_1.addCredentialsToMetadata)(this.token);
    }
}
exports.TokenAuthService = TokenAuthService;
