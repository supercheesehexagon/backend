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
exports.QuerySessionPool = exports.SessionEvent = exports.QueryService = exports.GrpcQueryService = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
exports.GrpcQueryService = ydb_sdk_proto_1.Ydb.Query.V1.QueryService;
var CreateSessionRequest = ydb_sdk_proto_1.Ydb.Query.CreateSessionRequest;
const retries_obsoleted_1 = require("../retries_obsoleted");
const events_1 = __importDefault(require("events"));
const constants_1 = require("../constants");
const lodash_1 = __importDefault(require("lodash"));
const errors_1 = require("../errors");
const query_session_1 = require("./query-session");
const utils_1 = require("../utils");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const utils_2 = require("../utils");
const symbols_1 = require("./symbols");
class QueryService extends utils_2.AuthenticatedService {
    endpoint;
    logger;
    constructor(endpoint, database, authService, logger, sslCredentials, clientOptions) {
        const host = endpoint.toString();
        super(host, database, 'Ydb.Query.V1.QueryService', exports.GrpcQueryService, authService, sslCredentials, clientOptions);
        this.endpoint = endpoint;
        this.logger = logger;
    }
    async createSession() {
        const { sessionId } = (0, process_ydb_operation_result_1.ensureCallSucceeded)(await this.api.createSession(CreateSessionRequest.create()));
        const session = query_session_1.QuerySession[symbols_1.createSymbol](this.api, this, this.endpoint, sessionId, this.logger /*, this.getResponseMetadata.bind(this)*/);
        await session[symbols_1.sessionAttachSymbol](() => {
            session[symbols_1.sessionDeleteOnReleaseSymbol]();
        });
        return session;
    }
}
exports.QueryService = QueryService;
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], QueryService.prototype, "createSession", null);
var SessionEvent;
(function (SessionEvent) {
    SessionEvent["SESSION_RELEASE"] = "SESSION_RELEASE";
    SessionEvent["SESSION_BROKEN"] = "SESSION_BROKEN";
})(SessionEvent || (exports.SessionEvent = SessionEvent = {}));
class QuerySessionPool extends events_1.default {
    database;
    authService;
    sslCredentials;
    clientOptions;
    /*private readonly*/
    minLimit;
    maxLimit;
    sessions;
    queryServices;
    discoveryService;
    newSessionsRequested;
    sessionsBeingDeleted;
    logger;
    waiters = [];
    static SESSION_MIN_LIMIT = 5;
    static SESSION_MAX_LIMIT = 20;
    constructor(settings) {
        super();
        this.database = settings.database;
        this.authService = settings.authService;
        this.sslCredentials = settings.sslCredentials;
        this.clientOptions = settings.clientOptions;
        this.logger = settings.logger;
        const poolSettings = settings.poolSettings;
        this.minLimit = poolSettings?.minLimit || QuerySessionPool.SESSION_MIN_LIMIT;
        this.maxLimit = poolSettings?.maxLimit || QuerySessionPool.SESSION_MAX_LIMIT;
        this.sessions = new Set();
        this.newSessionsRequested = 0;
        this.sessionsBeingDeleted = 0;
        this.queryServices = new Map();
        this.discoveryService = settings.discoveryService;
        this.discoveryService.on(constants_1.Events.ENDPOINT_REMOVED, (endpoint) => {
            this.queryServices.delete(endpoint);
        });
        // this.prepopulateSessions();
    }
    async destroy() {
        this.logger.debug('Destroying query pool...');
        await Promise.all(lodash_1.default.map([...this.sessions], (session) => this.deleteSession(session)));
        this.logger.debug('Query pool has been destroyed');
    }
    // TODO: Uncomment after switch to TS 5.3
    // [Symbol.asyncDispose]() {
    //     return this.destroy();
    // }
    // TODO: Reconsider. Seems like bad idea for serverless functions and causes problems on quick dispose
    // private prepopulateSessions() {
    //     _.forEach(_.range(this.minLimit), () => this.createSession());
    // }
    async getSessionBuilder() {
        const endpoint = await this.discoveryService.getEndpoint();
        if (!this.queryServices.has(endpoint)) {
            const sessionService = new QueryService(endpoint, this.database, this.authService, this.logger, this.sslCredentials, this.clientOptions);
            this.queryServices.set(endpoint, sessionService);
        }
        return this.queryServices.get(endpoint);
    }
    maybeUseSession(session) {
        if (this.waiters.length > 0) {
            const waiter = this.waiters.shift();
            if (typeof waiter === "function") {
                waiter(session);
                return true;
            }
        }
        return false;
    }
    async createSession() {
        const sessionCreator = await this.getSessionBuilder();
        const session = await sessionCreator.createSession();
        session.on(SessionEvent.SESSION_RELEASE, async () => {
            if (session[symbols_1.sessionIsClosingSymbol]()) {
                await this.deleteSession(session);
            }
            else {
                this.maybeUseSession(session);
            }
        });
        session.on(SessionEvent.SESSION_BROKEN, async () => {
            await this.deleteSession(session);
        });
        this.sessions.add(session);
        return session;
    }
    deleteSession(session) {
        if (session[symbols_1.sessionIsDeletedSymbol]()) {
            return Promise.resolve();
        }
        this.sessionsBeingDeleted++;
        // acquire new session as soon one of existing ones is deleted
        if (this.waiters.length > 0) {
            this.acquire().then((session) => {
                if (!this.maybeUseSession(session)) {
                    session[symbols_1.sessionReleaseSymbol]();
                }
            });
        }
        return session.delete()
            // delete session in any case
            .finally(() => {
            this.sessions.delete(session);
            this.sessionsBeingDeleted--;
        });
    }
    acquire(timeout = 0) {
        for (const session of this.sessions) {
            if (session[symbols_1.sessionIsFreeSymbol]()) {
                return Promise.resolve(session[symbols_1.sessionAcquireSymbol]());
            }
        }
        if (this.sessions.size + this.newSessionsRequested - this.sessionsBeingDeleted <= this.maxLimit) {
            this.newSessionsRequested++;
            return this.createSession()
                .then((session) => {
                return session[symbols_1.sessionAcquireSymbol]();
            })
                .finally(() => {
                this.newSessionsRequested--;
            });
        }
        else {
            return new Promise((resolve, reject) => {
                let timeoutId;
                function waiter(session) {
                    clearTimeout(timeoutId);
                    resolve(session[symbols_1.sessionAcquireSymbol]());
                }
                if (timeout) {
                    timeoutId = setTimeout(() => {
                        this.waiters.splice(this.waiters.indexOf(waiter), 1);
                        reject(new errors_1.SessionPoolEmpty(`No session became available within timeout of ${timeout} ms`));
                    }, timeout);
                }
                this.waiters.push(waiter);
            });
        }
    }
}
exports.QuerySessionPool = QuerySessionPool;
