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
exports.TableSessionPool = exports.SessionEvent = exports.SessionBuilder = exports.TableService = void 0;
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
exports.TableService = ydb_sdk_proto_1.Ydb.Table.V1.TableService;
var CreateSessionRequest = ydb_sdk_proto_1.Ydb.Table.CreateSessionRequest;
var CreateSessionResult = ydb_sdk_proto_1.Ydb.Table.CreateSessionResult;
const retries_obsoleted_1 = require("../retries_obsoleted");
const events_1 = __importDefault(require("events"));
const constants_1 = require("../constants");
const lodash_1 = __importDefault(require("lodash"));
const errors_1 = require("../errors");
const table_session_1 = require("./table-session");
const utils_1 = require("../utils");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const utils_2 = require("../utils");
const context_1 = require("../context");
class SessionBuilder extends utils_2.AuthenticatedService {
    endpoint;
    logger;
    constructor(endpoint, database, authService, logger, sslCredentials, clientOptions) {
        const host = endpoint.toString();
        super(host, database, 'Ydb.Table.V1.TableService', exports.TableService, authService, sslCredentials, clientOptions);
        this.endpoint = endpoint;
        this.logger = logger;
    }
    async create() {
        const response = await this.api.createSession(CreateSessionRequest.create());
        const payload = (0, process_ydb_operation_result_1.getOperationPayload)(response);
        const { sessionId } = CreateSessionResult.decode(payload);
        return new table_session_1.TableSession(this.api, this.endpoint, sessionId, this.logger, this.getResponseMetadata.bind(this));
    }
}
exports.SessionBuilder = SessionBuilder;
__decorate([
    (0, retries_obsoleted_1.retryable)(),
    utils_1.pessimizable
], SessionBuilder.prototype, "create", null);
var SessionEvent;
(function (SessionEvent) {
    SessionEvent["SESSION_RELEASE"] = "SESSION_RELEASE";
    SessionEvent["SESSION_BROKEN"] = "SESSION_BROKEN";
})(SessionEvent || (exports.SessionEvent = SessionEvent = {}));
class TableSessionPool extends events_1.default {
    database;
    authService;
    sslCredentials;
    clientOptions;
    minLimit;
    maxLimit;
    sessions;
    sessionBuilders;
    discoveryService;
    newSessionsRequested;
    sessionsBeingDeleted;
    sessionKeepAliveId;
    logger;
    waiters = [];
    static SESSION_MIN_LIMIT = 1; // TODO: Return back to 5
    static SESSION_MAX_LIMIT = 20;
    constructor(settings) {
        super();
        this.database = settings.database;
        this.authService = settings.authService;
        this.sslCredentials = settings.sslCredentials;
        this.clientOptions = settings.clientOptions;
        this.logger = settings.logger;
        const poolSettings = settings.poolSettings;
        this.minLimit = poolSettings?.minLimit || TableSessionPool.SESSION_MIN_LIMIT;
        this.maxLimit = poolSettings?.maxLimit || TableSessionPool.SESSION_MAX_LIMIT;
        this.sessions = new Set();
        this.newSessionsRequested = 0;
        this.sessionsBeingDeleted = 0;
        this.sessionKeepAliveId = this.initListeners(poolSettings?.keepAlivePeriod || constants_1.SESSION_KEEPALIVE_PERIOD);
        this.sessionBuilders = new Map();
        this.discoveryService = settings.discoveryService;
        this.discoveryService.on(constants_1.Events.ENDPOINT_REMOVED, (endpoint) => {
            this.sessionBuilders.delete(endpoint);
        });
        this.prepopulateSessions();
    }
    async destroy(_ctx) {
        this.logger.debug('Destroying pool...');
        clearInterval(this.sessionKeepAliveId);
        await Promise.all(lodash_1.default.map([...this.sessions], (session) => this.deleteSession(session)));
        this.logger.debug('Pool has been destroyed.');
    }
    initListeners(keepAlivePeriod) {
        return setInterval(async () => Promise.all(lodash_1.default.map([...this.sessions], (session) => {
            return session.keepAlive()
                // delete session if error
                .catch(() => this.deleteSession(session))
                // ignore errors to avoid UnhandledPromiseRejectionWarning
                .catch(() => Promise.resolve());
        })), keepAlivePeriod);
    }
    prepopulateSessions() {
        lodash_1.default.forEach(lodash_1.default.range(this.minLimit), () => this.createSession());
    }
    async getSessionBuilder() {
        const endpoint = await this.discoveryService.getEndpoint();
        if (!this.sessionBuilders.has(endpoint)) {
            const sessionService = new SessionBuilder(endpoint, this.database, this.authService, this.logger, this.sslCredentials, this.clientOptions);
            this.sessionBuilders.set(endpoint, sessionService);
        }
        return this.sessionBuilders.get(endpoint);
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
        const session = await sessionCreator.create();
        session.on(SessionEvent.SESSION_RELEASE, async () => {
            if (session.isClosing()) {
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
        if (session.isDeleted()) {
            return Promise.resolve();
        }
        this.sessionsBeingDeleted++;
        // acquire new session as soon one of existing ones is deleted
        if (this.waiters.length > 0) {
            this.acquire().then((session) => {
                if (!this.maybeUseSession(session)) {
                    session.release();
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
            if (session.isFree()) {
                return Promise.resolve(session.acquire());
            }
        }
        if (this.sessions.size + this.newSessionsRequested - this.sessionsBeingDeleted <= this.maxLimit) {
            this.newSessionsRequested++;
            return this.createSession()
                .then((session) => {
                return session.acquire();
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
                    resolve(session.acquire());
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
    async _withSession(_ctx, session, callback, maxRetries = 0) {
        // TODO: set context to session
        try {
            const result = await callback(session);
            session.release();
            return result;
        }
        catch (error) {
            if (error instanceof errors_1.BadSession || error instanceof errors_1.SessionBusy) {
                this.logger.debug('Encountered bad or busy session, re-creating the session');
                session.emit(SessionEvent.SESSION_BROKEN);
                session = await this.createSession();
                if (maxRetries > 0) {
                    this.logger.debug(`Re-running operation in new session, ${maxRetries} left.`);
                    session.acquire();
                    return this._withSession(_ctx, session, callback, maxRetries - 1);
                }
            }
            else {
                session.release();
            }
            throw error;
        }
    }
    async withSession(ctx, callback, timeout = 0) {
        const session = await this.acquire(timeout);
        return this._withSession(ctx, session, callback);
    }
    async withSessionRetry(ctx, callback, timeout = 0, maxRetries = 10) {
        const session = await this.acquire(timeout);
        return this._withSession(ctx, session, callback, maxRetries);
    }
}
exports.TableSessionPool = TableSessionPool;
__decorate([
    (0, context_1.ensureContext)(true)
], TableSessionPool.prototype, "destroy", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TableSessionPool.prototype, "withSession", null);
__decorate([
    (0, context_1.ensureContext)(true)
], TableSessionPool.prototype, "withSessionRetry", null);
