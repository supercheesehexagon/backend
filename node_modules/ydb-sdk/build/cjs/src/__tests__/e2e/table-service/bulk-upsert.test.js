"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const test_1 = require("../../../utils/test");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
async function readTable(session) {
    const rows = [];
    await session.streamReadTable(test_1.TABLE, (result) => {
        if (result.resultSet) {
            rows.push(...test_1.Row.createNativeObjects(result.resultSet));
        }
    });
    return rows;
}
describe('Bulk upsert', () => {
    let driver;
    beforeAll(async () => {
        driver = await (0, test_1.initDriver)();
    });
    afterAll(async () => await (0, test_1.destroyDriver)(driver));
    it('Test', async () => {
        await driver.tableClient.withSession(async (session) => {
            const initialRows = [
                new test_1.Row({ id: 0, title: 'zero' }),
                new test_1.Row({ id: 1, title: 'no rowTitle' }),
            ];
            const rowsToUpsert = test_1.Row.asTypedCollection([
                new test_1.Row({ id: 1, title: 'one' }),
                new test_1.Row({ id: 2, title: 'two' }),
            ]);
            const expectedRows = [
                new test_1.Row({ id: 0, title: 'zero' }),
                new test_1.Row({ id: 1, title: 'one' }),
                new test_1.Row({ id: 2, title: 'two' }),
            ];
            await (0, test_1.createTable)(session);
            await (0, test_1.fillTableWithData)(session, initialRows);
            await session.bulkUpsert(test_1.TABLE, rowsToUpsert);
            const actualRows = await readTable(session);
            expect(expectedRows).toEqual(actualRows);
        });
    });
});
