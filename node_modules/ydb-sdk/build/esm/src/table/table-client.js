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
exports.TableClient = void 0;
const events_1 = __importDefault(require("events"));
const table_session_pool_1 = require("./table-session-pool");
const context_1 = require("../context");
/**
 * Version settings for service clients that are created by the discovery service method - one per endpoint. Like Topic client.
 */
class TableClient extends events_1.default {
    pool;
    constructor(settings) {
        super();
        this.pool = new table_session_pool_1.TableSessionPool(settings);
    }
    async withSession(ctx, callback, timeout = 0) {
        return this.pool.withSession(ctx, callback, timeout);
    }
    async withSessionRetry(ctx, callback, timeout = 0, maxRetries = 10) {
        return this.pool.withSessionRetry(ctx, callback, timeout, maxRetries);
    }
    async destroy(ctx) {
        await this.pool.destroy(ctx);
    }
}
exports.TableClient = TableClient;
__decorate([
    (0, context_1.ensureContext)(true)
], TableClient.prototype, "withSession", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TableClient.prototype, "withSessionRetry", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TableClient.prototype, "destroy", null);
