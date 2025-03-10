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
const constants_1 = require("../../../constants");
const anonymous_auth_service_1 = require("../../../credentials/anonymous-auth-service");
const query_session_pool_1 = require("../../../query/query-session-pool");
const types_1 = require("../../../types");
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
const get_default_logger_1 = require("../../../logger/get-default-logger");
const context_1 = require("../../../context");
const symbols_1 = require("../../../query/symbols");
var StatsMode = ydb_sdk_proto_1.Ydb.Query.StatsMode;
var ExecMode = ydb_sdk_proto_1.Ydb.Query.ExecMode;
const retryParameters_1 = require("../../../retries/retryParameters");
const retryStrategy_1 = require("../../../retries/retryStrategy");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const DATABASE = '/local';
const ENDPOINT = process.env.YDB_ENDPOINT || 'grpc://localhost:2136';
const TABLE_NAME = 'test_table_1';
describe('Query.execute()', () => {
    let discoveryService;
    let session;
    beforeEach(async () => {
        await testOnOneSessionWithoutDriver();
    });
    afterEach(async () => {
        discoveryService.destroy();
        await session.delete();
    });
    it('create table', async () => {
        await createTestTable();
    });
    it('simple insert', async () => {
        await createTestTable();
        await insertCupleLinesInTestTable();
    });
    it('simple select', async () => {
        var _a, e_1, _b, _c, _d, e_2, _e, _f;
        await createTestTable();
        const linesInserted = await insertCupleLinesInTestTable();
        const res = await simpleSelect();
        expect(async () => await simpleSelect()).rejects
            .toThrowError(new Error('There\'s another active operation in the session'));
        let linesCount = 0;
        try {
            for (var _g = true, _h = __asyncValues(res.resultSets), _j; _j = await _h.next(), _a = _j.done, !_a; _g = true) {
                _c = _j.value;
                _g = false;
                const resultSet = _c;
                try {
                    for (var _k = true, _l = (e_2 = void 0, __asyncValues(resultSet.rows)), _m; _m = await _l.next(), _d = _m.done, !_d; _k = true) {
                        _f = _m.value;
                        _k = false;
                        const _row = _f;
                        linesCount++;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_k && !_d && (_e = _l.return)) await _e.call(_l);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = _h.return)) await _b.call(_h);
            }
            finally { if (e_1) throw e_1.error; }
        }
        await res.opFinished;
        expect(linesCount).toBe(2 * linesInserted);
    });
    it('ExecMode: EXEC_MODE_UNSPECIFIED', async () => {
        await expect(async () => await session.execute({
            execMode: ExecMode.EXEC_MODE_UNSPECIFIED,
            text: 'SELECT 1;',
        })).rejects.toThrowError(new Error('BadRequest (code 400010): [\n' + // TODO: Find out why
            '  {\n' +
            '    "message": "Unexpected query mode",\n' +
            '    "severity": 1\n' +
            '  }\n' +
            ']'));
    });
    it('ExecMode: EXEC_MODE_PARSE', async () => {
        await expect(async () => await session.execute({
            execMode: ExecMode.EXEC_MODE_PARSE,
            text: 'SELECT 1;',
        })).rejects.toThrowError(new Error('BadRequest (code 400010): [\n' + // TODO: Figure out why
            '  {\n' +
            '    "message": "Unexpected query mode",\n' +
            '    "severity": 1\n' +
            '  }\n' +
            ']'));
    });
    it('ExecMode: EXEC_MODE_VALIDATE', async () => {
        await expect(async () => await session.execute({
            execMode: ExecMode.EXEC_MODE_VALIDATE,
            text: 'SELECT 1;',
        })).rejects.toThrowError(new Error('BadRequest (code 400010): [\n' + // TODO: Figure out why
            '  {\n' +
            '    "message": "Unexpected query type.",\n' +
            '    "severity": 1\n' +
            '  }\n' +
            ']'));
    });
    it('ExecMode: EXEC_MODE_EXPLAIN', async () => {
        var _a, _b;
        const res = await session.execute({
            execMode: ExecMode.EXEC_MODE_EXPLAIN,
            text: 'SELECT 1;',
        });
        await drainExecuteResult(res);
        expect((_a = res.execStats) === null || _a === void 0 ? void 0 : _a.queryPlan).toBeDefined();
        expect((_b = res.execStats) === null || _b === void 0 ? void 0 : _b.queryAst).toBeDefined();
    });
    it('ExecMode: EXEC_MODE_EXECUTE | undefined', async () => {
        for (const execMode of [ExecMode.EXEC_MODE_EXECUTE, undefined])
            await drainExecuteResult(await session.execute({
                execMode,
                text: 'SELECT 1;',
            }));
    });
    for (const { mode, isExpected } of [
        { mode: StatsMode.STATS_MODE_UNSPECIFIED, isExpected: false },
        { mode: StatsMode.STATS_MODE_NONE, isExpected: false },
        { mode: StatsMode.STATS_MODE_BASIC, isExpected: true },
        { mode: StatsMode.STATS_MODE_FULL, isExpected: true },
        { mode: StatsMode.STATS_MODE_PROFILE, isExpected: true },
    ]) {
        it(`statsMode: ${StatsMode[mode]}`, async () => {
            var _a, e_3, _b, _c, _d, e_4, _e, _f;
            await createTestTable();
            await insertCupleLinesInTestTable();
            const res = await simpleSelect(mode);
            try {
                for (var _g = true, _h = __asyncValues(res.resultSets), _j; _j = await _h.next(), _a = _j.done, !_a; _g = true) {
                    _c = _j.value;
                    _g = false;
                    const resultSet = _c;
                    try {
                        for (var _k = true, _l = (e_4 = void 0, __asyncValues(resultSet.rows)), _m; _m = await _l.next(), _d = _m.done, !_d; _k = true) {
                            _f = _m.value;
                            _k = false;
                            const _row = _f;
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (!_k && !_d && (_e = _l.return)) await _e.call(_l);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) await _b.call(_h);
                }
                finally { if (e_3) throw e_3.error; }
            }
            if (isExpected)
                expect(res.execStats).not.toBeUndefined();
            else
                expect(res.execStats).toBeUndefined();
        });
    }
    it('check iterator on multi parts stream', async () => {
        var _a, e_5, _b, _c, _d, e_6, _e, _f;
        await createTestTable();
        const generatedRowsCount = 5000;
        function* dataGenerator(rowsCount) {
            for (let id = 1; id <= rowsCount; id++)
                yield new Row({
                    id,
                    title: `title_${id}`,
                    time: new Date(),
                });
        }
        await session.execute({
            text: `
                DECLARE $table AS List<Struct<id: Uint64, title: Utf8, time: Datetime,>>;
                UPSERT INTO ${TABLE_NAME} (id, title, time)
                SELECT id, title, time FROM AS_TABLE($table);
            `,
            parameters: {
                '$table': Row.asTypedCollection([...dataGenerator(generatedRowsCount)]),
            }
        });
        const res = await simpleSelect();
        let linesCount = 0;
        try {
            for (var _g = true, _h = __asyncValues(res.resultSets), _j; _j = await _h.next(), _a = _j.done, !_a; _g = true) {
                _c = _j.value;
                _g = false;
                const resultSet = _c;
                try {
                    for (var _k = true, _l = (e_6 = void 0, __asyncValues(resultSet.rows)), _m; _m = await _l.next(), _d = _m.done, !_d; _k = true) {
                        _f = _m.value;
                        _k = false;
                        const _row = _f;
                        linesCount++;
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (!_k && !_d && (_e = _l.return)) await _e.call(_l);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = _h.return)) await _b.call(_h);
            }
            finally { if (e_5) throw e_5.error; }
        }
        expect(linesCount).toBe(2 * generatedRowsCount);
    });
    async function createTestTable() {
        await session.execute({
            text: `
                DROP TABLE IF EXISTS ${TABLE_NAME};

                CREATE TABLE ${TABLE_NAME}
                (
                    id    UInt64,
                    title Utf8, -- NOT NULL,
                    time  Timestamp,
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

                INSERT INTO ${TABLE_NAME} (id, title, time)
                VALUES ($id1, $title1, $timestamp);
                INSERT INTO ${TABLE_NAME} (id, title, time)
                VALUES ($id2, $title2, $timestamp);
            `,
        });
        return 2;
    }
    async function simpleSelect(statsMode) {
        return await session.execute({
            statsMode,
            text: `
                SELECT *
                FROM ${TABLE_NAME};
                SELECT * -- double
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
    async function drainExecuteResult(res) {
        var _a, e_7, _b, _c, _d, e_8, _e, _f;
        try {
            // TODO: cancel result stream
            for (var _g = true, _h = __asyncValues(res.resultSets), _j; _j = await _h.next(), _a = _j.done, !_a; _g = true) {
                _c = _j.value;
                _g = false;
                const rs = _c;
                try {
                    for (var _k = true, _l = (e_8 = void 0, __asyncValues(rs.rows)), _m; _m = await _l.next(), _d = _m.done, !_d; _k = true) {
                        _f = _m.value;
                        _k = false;
                        const _row = _f;
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (!_k && !_d && (_e = _l.return)) await _e.call(_l);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = _h.return)) await _b.call(_h);
            }
            finally { if (e_7) throw e_7.error; }
        }
    }
});
class Row extends types_1.TypedData {
    constructor(data) {
        super(data);
        this.id = data.id;
        this.title = data.title;
        this.time = data.time;
    }
}
__decorate([
    (0, types_1.declareType)(types_1.Types.UINT64)
], Row.prototype, "id", void 0);
__decorate([
    (0, types_1.declareType)(types_1.Types.UTF8)
], Row.prototype, "title", void 0);
__decorate([
    (0, types_1.declareType)(types_1.Types.DATETIME)
], Row.prototype, "time", void 0);
