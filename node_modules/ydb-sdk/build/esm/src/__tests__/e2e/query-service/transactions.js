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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const anonymous_auth_service_1 = require("../../../credentials/anonymous-auth-service");
const discovery_service_1 = __importDefault(require("../../../discovery/discovery-service"));
const constants_1 = require("../../../constants");
const query_session_pool_1 = require("../../../query/query-session-pool");
const symbols = __importStar(require("../../../query/symbols"));
const get_default_logger_1 = require("../../../logger/get-default-logger");
const symbols_1 = require("../../../query/symbols");
const context_1 = require("../../../context");
const retryParameters_1 = require("../../../retries/retryParameters");
const retryStrategy_1 = require("../../../retries/retryStrategy");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const DATABASE = '/local';
const ENDPOINT = process.env.YDB_ENDPOINT || 'grpc://localhost:2136';
describe('Query service transactions', () => {
    let discoveryService;
    let session;
    beforeEach(async () => {
        await testOnOneSessionWithoutDriver();
    });
    afterEach(async () => {
        discoveryService.destroy();
        await session[symbols.sessionReleaseSymbol]();
        await session.delete();
    });
    it('implicit transactions', async () => {
        // open transaction
        expect(session.txId).toBeUndefined();
        await drainExecuteResult(await session.execute({
            txControl: { beginTx: { serializableReadWrite: {} } },
            text: 'SELECT 1;',
        }));
        expect(session.txId).toBeDefined();
        const newTxId = session.txId;
        await expect(async () => {
            await session.execute({
                txControl: { beginTx: { serializableReadWrite: {} } },
                text: 'SELECT 1;',
            });
        }).rejects.toThrow(); // transaction is already closed
        // continue transaction
        await drainExecuteResult(await session.execute({
            // txControl: ,
            text: 'SELECT 1;',
        }));
        expect(session.txId).toBe(newTxId);
        // close transaction
        await drainExecuteResult(await session.execute({
            txControl: { commitTx: true },
            text: 'SELECT 1;',
        }));
        expect(session.txId).toBeUndefined();
        await expect(async () => {
            await session.execute({
                txControl: { commitTx: true },
                text: 'SELECT 1;',
            });
        }).rejects.toThrow(); // transaction is already closed
    });
    it('explicit transactions', async () => {
        // open transaction
        expect(session.txId).toBeUndefined();
        await session.beginTransaction({ serializableReadWrite: {} });
        expect(session.txId).toBeDefined();
        await expect(async () => {
            await session.beginTransaction({ serializableReadWrite: {} });
        }).rejects.toThrow(); // transaction is already open
        // commit transaction
        await session.commitTransaction();
        expect(session.txId).toBeUndefined();
        await expect(async () => {
            await session.commitTransaction();
        }).rejects.toThrow(); // transaction is already closed
        // same about rallback
        await session.beginTransaction({ serializableReadWrite: {} });
        await session.rollbackTransaction();
        expect(session.txId).toBeUndefined();
        await expect(async () => {
            await session.rollbackTransaction();
        }).rejects.toThrow(); // transaction is already closed
    });
    async function drainExecuteResult(res) {
        for await (const rs of res.resultSets)
            for await (const _row of rs.rows) {
            }
    }
    async function testOnOneSessionWithoutDriver() {
        const logger = (0, get_default_logger_1.getDefaultLogger)();
        const authService = new anonymous_auth_service_1.AnonymousAuthService();
        discoveryService = new discovery_service_1.default({
            endpoint: ENDPOINT,
            database: DATABASE,
            authService,
            discoveryPeriod: constants_1.ENDPOINT_DISCOVERY_PERIOD,
            retrier: new retryStrategy_1.RetryStrategy(new retryParameters_1.RetryParameters(), logger),
            logger,
        });
        await discoveryService.ready(constants_1.ENDPOINT_DISCOVERY_PERIOD);
        const sessionBuilder = new query_session_pool_1.QueryService(await discoveryService.getEndpoint(), DATABASE, authService, logger);
        session = await sessionBuilder.createSession();
        session[symbols_1.ctxSymbol] = context_1.Context.createNew().ctx;
    }
});
