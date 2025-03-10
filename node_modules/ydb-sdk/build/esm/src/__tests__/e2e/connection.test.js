"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const test_1 = require("../../utils/test");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
describe('Connection', () => {
    it('Test GRPC connection', async () => {
        let driver = await (0, test_1.initDriver)({ endpoint: process.env.YDB_ENDPOINT || 'grpc://localhost:2136' });
        await driver.tableClient.withSession(async (session) => {
            await session.executeQuery('SELECT 1');
        });
        await (0, test_1.destroyDriver)(driver);
    });
    it('Test GRPCS connection', async () => {
        let driver = await (0, test_1.initDriver)({ endpoint: process.env.YDB_ENDPOINT || 'grpcs://localhost:2135' });
        await driver.tableClient.withSession(async (session) => {
            await session.executeQuery('SELECT 1');
        });
        await (0, test_1.destroyDriver)(driver);
    });
});
