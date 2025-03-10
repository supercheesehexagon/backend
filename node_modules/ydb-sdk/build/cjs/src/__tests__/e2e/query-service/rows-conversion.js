"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const discovery_service_1 = __importDefault(require("../../../discovery/discovery-service"));
const anonymous_auth_service_1 = require("../../../credentials/anonymous-auth-service");
const constants_1 = require("../../../constants");
const query_session_pool_1 = require("../../../query/query-session-pool");
const types_1 = require("../../../types");
const get_default_logger_1 = require("../../../logger/get-default-logger");
const symbols_1 = require("../../../query/symbols");
const context_1 = require("../../../context");
const retryParameters_1 = require("../../../retries/retryParameters");
const retryStrategy_1 = require("../../../retries/retryStrategy");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const DATABASE = '/local';
const ENDPOINT = process.env.YDB_ENDPOINT || 'grpc://localhost:2136';
const TABLE_NAME = 'test_table_3';
class Row extends types_1.TypedData {
    constructor(data) {
        super(data);
        this.id = data.id;
        this.rowTitle = data.rowTitle;
        this.time = data.time;
    }
}
__decorate([
    (0, types_1.declareType)(types_1.Types.UINT64)
], Row.prototype, "id", void 0);
__decorate([
    (0, types_1.declareType)(types_1.Types.UTF8)
], Row.prototype, "rowTitle", void 0);
__decorate([
    (0, types_1.declareType)(types_1.Types.DATETIME)
], Row.prototype, "time", void 0);
describe('Rows conversion', () => {
    let discoveryService;
    let session;
    beforeAll(async () => {
        await testOnOneSessionWithoutDriver();
    });
    afterAll(async () => {
        discoveryService.destroy();
        await session.delete();
    });
    it('Ydb to native', async () => {
        var _a, e_1, _b, _c;
        await createTestTable();
        await insertCupleLinesInTestTable();
        const res = await simpleSelect(0 /* RowType.Native */);
        try {
            for (var _d = true, _e = __asyncValues(res.resultSets), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const rs = _c;
                expect(rs.index).toBe(0);
                expect(rs.columns[0]).toBe('id');
                expect(rs.columns[1]).toBe('rowTitle'); // as camel case
                const { value: row1 } = await rs.rows.next();
                expect(row1.id).toBe(1);
                expect(row1.rowTitle).toBe('Some title1');
                const { value: row2 } = await rs.rows.next();
                expect(row2.id).toBe(2);
                expect(row2.rowTitle).toBe('Some title2');
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    it('Ydb to typed structure', async () => {
        var _a, e_2, _b, _c;
        await createTestTable();
        await insertCupleLinesInTestTable();
        const res = await simpleSelect(1 /* RowType.Ydb */);
        try {
            for (var _d = true, _e = __asyncValues(res.resultSets), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const rs = _c;
                expect(rs.columns[0].name).toBe('id');
                expect(rs.columns[1].name).toBe('row_title'); // snake case as in YDB
                expect(rs.index).toBe(0);
                const typedRows = rs.typedRows(Row);
                const { value: row1 } = await typedRows.next();
                expect(row1.id).toBe(1);
                expect(row1.rowTitle).toBe('Some title1');
                const { value: row2 } = await typedRows.next();
                expect(row2.id).toBe(2);
                expect(row2.rowTitle).toBe('Some title2');
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
    async function createTestTable() {
        await session.execute({
            text: `
                DROP TABLE IF EXISTS ${TABLE_NAME};

                CREATE TABLE ${TABLE_NAME}
                (
                    id        UInt64,
                    row_title Utf8, -- NOT NULL,
                    time      Timestamp,
                    PRIMARY KEY (id)
                );`,
        });
    }
    async function insertCupleLinesInTestTable() {
        await session.execute({
            parameters: {
                '$id1': types_1.TypedValues.uint64(1),
                '$title1': types_1.TypedValues.text('Some title1'),
                '$id2': types_1.TypedValues.uint64(2),
                '$title2': types_1.TypedValues.text('Some title2'),
                '$timestamp': types_1.TypedValues.datetime(new Date()),
            },
            text: `
                DECLARE $id1 AS Uint64;
                DECLARE $title1 AS Utf8;
                DECLARE $id2 AS Uint64;
                DECLARE $title2 AS Utf8;
                DECLARE $timestamp AS Datetime;

                INSERT INTO ${TABLE_NAME} (id, row_title, time)
                VALUES ($id1, $title1, $timestamp);
                INSERT INTO ${TABLE_NAME} (id, row_title, time)
                VALUES ($id2, $title2, $timestamp);
            `,
        });
        return 2;
    }
    async function simpleSelect(rowMode) {
        return await session.execute({
            rowMode,
            text: `
                SELECT *
                FROM ${TABLE_NAME};
            `,
            // concurrentResultSets: false,
        });
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
