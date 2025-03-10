"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const test_1 = require("../../../utils/test");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
async function executeScanQuery(session) {
    const query = `SELECT * FROM ${test_1.TABLE};`;
    const rows = [];
    await session.streamExecuteScanQuery(query, (result) => {
        if (result.resultSet) {
            rows.push(...test_1.Row.createNativeObjects(result.resultSet));
        }
    });
    return rows;
}
describe('Scan query', () => {
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
            const rows = await executeScanQuery(session);
            expect(rows).toEqual(expectedRows);
        });
    });
});
