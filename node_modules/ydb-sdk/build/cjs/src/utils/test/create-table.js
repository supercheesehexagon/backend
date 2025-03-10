"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE = void 0;
exports.createTable = createTable;
exports.fillTableWithData = fillTableWithData;
const table_1 = require("../../table");
// import {withRetries} from "../../retries_obsoleted";
const types_1 = require("../../types");
const row_1 = require("./row");
exports.TABLE = `table_${Math.trunc(100 * Math.random())}`;
async function createTable(session) {
    await session.dropTable(exports.TABLE);
    await session.createTable(exports.TABLE, new table_1.TableDescription()
        .withColumn(new table_1.Column('id', types_1.Types.optional(types_1.Types.UINT64)))
        .withColumn(new table_1.Column('title', types_1.Types.optional(types_1.Types.UTF8)))
        .withPrimaryKey('id'));
}
async function fillTableWithData(session, rows) {
    const query = `
DECLARE $data AS List<Struct<id: Uint64, title: Utf8>>;

REPLACE INTO ${exports.TABLE}
SELECT * FROM AS_TABLE($data);`;
    // Now we can specify that the operation should be repeated in case of an error by specifying that it is idempotent
    // Old code:
    // await withRetries(async () => {
    //     const preparedQuery = await session.prepareQuery(query);
    //     await session.executeQuery(preparedQuery, {
    //         '$data': Row.asTypedCollection(rows),
    //     });
    // });
    // New code variant:
    const preparedQuery = await session.prepareQuery(query);
    await session.executeQuery(preparedQuery, {
        '$data': row_1.Row.asTypedCollection(rows),
    }, table_1.AUTO_TX, new table_1.ExecuteQuerySettings().withIdempotent(true));
}
