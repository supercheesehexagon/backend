"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const types_1 = require("../../../types");
const table_1 = require("../../../table");
const test_1 = require("../../../utils/test");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
async function readTable(session, settings) {
    const rows = [];
    await session.streamReadTable(test_1.TABLE, (result) => {
        if (result.resultSet) {
            rows.push(...test_1.Row.createNativeObjects(result.resultSet));
        }
    }, settings);
    return rows;
}
describe('Read table', () => {
    let driver;
    beforeAll(async () => {
        driver = await (0, test_1.initDriver)();
    });
    afterAll(async () => await (0, test_1.destroyDriver)(driver));
    it('Test', async () => {
        await driver.tableClient.withSession(async (session) => {
            const expectedRows = [
                new test_1.Row({ id: 1, title: 'one' }),
                new test_1.Row({ id: 2, title: 'two' }),
            ];
            await (0, test_1.createTable)(session);
            await (0, test_1.fillTableWithData)(session, expectedRows);
            {
                const rows = await readTable(session, new table_1.ReadTableSettings());
                expect(rows).toEqual(expectedRows);
            }
            {
                const rows = await readTable(session, new table_1.ReadTableSettings().withKeyRange({
                    greaterOrEqual: types_1.TypedValues.tuple(types_1.TypedValues.optional(types_1.TypedValues.uint64(1))),
                    lessOrEqual: types_1.TypedValues.tuple(types_1.TypedValues.optional(types_1.TypedValues.uint64(2))),
                }));
                expect(rows).toEqual(expectedRows);
            }
            {
                const rows = await readTable(session, new table_1.ReadTableSettings().withKeyRange({
                    greater: types_1.TypedValues.tuple(types_1.TypedValues.optional(types_1.TypedValues.uint64(1))),
                    lessOrEqual: types_1.TypedValues.tuple(types_1.TypedValues.optional(types_1.TypedValues.uint64(2))),
                }));
                expect(rows).toEqual(expectedRows.slice(1));
            }
        });
    });
});
