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
const driver_1 = __importDefault(require("../../../driver"));
const anonymous_auth_service_1 = require("../../../credentials/anonymous-auth-service");
const errors = __importStar(require("../../../errors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const table_1 = require("../../../table");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const DATABASE = '/local';
const ENDPOINT = process.env.YDB_ENDPOINT || 'grpc://localhost:2136';
describe('Query client', () => {
    let driver;
    beforeEach(async () => {
        const certFile = process.env.YDB_SSL_ROOT_CERTIFICATES_FILE || path_1.default.join(process.cwd(), 'ydb_certs/ca.pem');
        if (!fs_1.default.existsSync(certFile)) {
            throw new Error(`Certificate file ${certFile} doesn't exist! Please use YDB_SSL_ROOT_CERTIFICATES_FILE env variable or run Docker container https://cloud.yandex.ru/docs/ydb/getting_started/ydb_docker inside working directory`);
        }
        const sslCredentials = { rootCertificates: fs_1.default.readFileSync(certFile) };
        // TODO: Figure out why Driver fails become ready without sslCredentials
        driver = new driver_1.default({
            endpoint: ENDPOINT,
            database: DATABASE,
            authService: new anonymous_auth_service_1.AnonymousAuthService(),
            sslCredentials,
        });
        if (!(await driver.ready(3000)))
            throw new Error('Driver is not ready!');
    });
    afterEach(async () => await driver.destroy());
    it('Query client do()', async () => {
        let count = 0;
        let prevSession;
        const res = await driver.queryClient.do({
            fn: async (session) => {
                count++;
                if (prevSession)
                    expect(prevSession).toBe(session); // session gets reused
                expect(session.txId).not.toBeDefined();
                // test operation on DB with explicite transaction
                let res = await session.execute({
                    txControl: { beginTx: table_1.AUTO_TX.beginTx },
                    text: 'SELECT 1',
                });
                await drainExecuteResult(res);
                expect(session.txId).toBeDefined();
                res = await session.execute({
                    text: 'SELECT 1',
                });
                await drainExecuteResult(res);
                expect(session.txId).toBeDefined();
                // force new attempt
                if (count < 3)
                    throw new errors.Aborted('test'); // an fast backoff error
                res = await session.execute({
                    txControl: { commitTx: true },
                    text: 'SELECT 1',
                });
                await drainExecuteResult(res);
                expect(session.txId).not.toBeDefined();
                // result
                return 12;
            }
        });
        expect(res).toBe(12);
        expect(count).toBe(3);
    });
    // it('Auto commit', async () => {
    // it('Auto rollback', async () => {
    // it('Broken session', async () => {
    it('Query client doTx()', async () => {
        let prevSession;
        let count = 0;
        const res = await driver.queryClient.doTx({
            fn: async (session) => {
                count++;
                expect(session.txId).not.toBeDefined(); // actual transaction will be created on first session.execute
                if (prevSession)
                    expect(prevSession).toBe(session); // session gets reused
                prevSession = session;
                await expect(async () => await session.execute({
                    txControl: { beginTx: table_1.AUTO_TX.beginTx },
                    text: 'SELECT 1',
                })).rejects.toThrowError(new Error('Cannot manage transactions at the session level if do() has the txSettings parameter or doTx() is used'));
                let res = await session.execute({
                    text: 'SELECT 1',
                });
                await drainExecuteResult(res);
                expect(session.txId).toBeDefined();
                res = await session.execute({
                    text: 'SELECT 1',
                });
                await drainExecuteResult(res);
                expect(session.txId).toBeDefined();
                // force new attempt
                if (count < 2)
                    throw new errors.Aborted('test'); // an fast backoff error
                await expect(async () => await session.commitTransaction()).rejects.toThrowError(new Error('Cannot manage transactions at the session level if do() has the txSettings parameter or doTx() is used'));
                await expect(async () => session.rollbackTransaction()).rejects.toThrowError(new Error('Cannot manage transactions at the session level if do() has the txSettings parameter or doTx() is used'));
                expect(session.txId).toBeDefined();
                // result
                return 12;
            }
        });
        expect(res).toBe(12);
        expect(count).toBe(2);
    });
    // it('Auto commit or rollback', async () => {
    //
    // });
    // @ts-ignore
    async function drainExecuteResult(res) {
        for await (const rs of res.resultSets)
            for await (const _row of rs.rows) {
            }
    }
});
