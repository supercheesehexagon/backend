"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const scheme_service_1 = require("./scheme-service");
class SchemeClient extends events_1.EventEmitter {
    constructor(settings) {
        super();
        this.settings = settings;
        this.schemeServices = new Map();
    }
    async getSchemeService() {
        const endpoint = await this.settings.discoveryService.getEndpoint();
        if (!this.schemeServices.has(endpoint)) {
            const { database, authService, sslCredentials, clientOptions, logger } = this.settings;
            const service = new scheme_service_1.SchemeService(endpoint, database, authService, logger, sslCredentials, clientOptions);
            this.schemeServices.set(endpoint, service);
        }
        return this.schemeServices.get(endpoint);
    }
    async makeDirectory(path, settings) {
        const service = await this.getSchemeService();
        return await service.makeDirectory(path, settings);
    }
    async removeDirectory(path, settings) {
        const service = await this.getSchemeService();
        return await service.removeDirectory(path, settings);
    }
    async listDirectory(path, settings) {
        const service = await this.getSchemeService();
        return await service.listDirectory(path, settings);
    }
    async describePath(path, settings) {
        const service = await this.getSchemeService();
        return await service.describePath(path, settings);
    }
    async modifyPermissions(path, permissionActions, clearPermissions, settings) {
        const service = await this.getSchemeService();
        return await service.modifyPermissions(path, permissionActions, clearPermissions, settings);
    }
    async destroy() {
        return;
    }
}
exports.default = SchemeClient;
