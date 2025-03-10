"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
const constants_1 = require("@grpc/grpc-js/build/src/constants");
const static_credentials_auth_service_1 = require("../../credentials/static-credentials-auth-service");
const iam_auth_service_1 = require("../../credentials/iam-auth-service");
const test_logger_1 = require("../../logger/tests/test-logger");
describe('Retries on errors in auth services', () => {
    const mockIamCounter = { retries: 0 };
    const mockStaticCredCounter = { retries: 0 };
    // @ts-ignore
    let testLogger;
    // @ts-ignore
    let testLoggerFn;
    function mockCallErrorFromStatus(status) {
        const message = `${status.code} ${constants_1.Status[status.code]}: ${status.details}`;
        return Object.assign(new Error(message), status);
    }
    beforeEach(() => {
        ({ testLogger: testLogger, testLoggerFn: testLoggerFn } = (0, test_logger_1.buildTestLogger)());
    });
    beforeAll(() => {
        jest.mock('ydb-sdk-proto', () => {
            const actual = jest.requireActual('ydb-sdk-proto');
            actual.yandex.cloud.iam.v1.IamTokenService.create = function test_create(rpcImpl, requestDelimited, responseDelimited) {
                const service = new this(rpcImpl, requestDelimited, responseDelimited);
                service.create = (function myCustomCreate() {
                    mockIamCounter.retries++;
                    // @ts-ignore
                    throw mockCallErrorFromStatus({ code: 14, details: 'My custom unavailable error', metadata: {} });
                });
                return service;
            };
            actual.Ydb.Auth.V1.AuthService.create = function test_create(rpcImpl, requestDelimited, responseDelimited) {
                const service = new this(rpcImpl, requestDelimited, responseDelimited);
                service.login = (function myCustomLogin() {
                    mockStaticCredCounter.retries++;
                    // @ts-ignore
                    throw mockCallErrorFromStatus({ code: 14, details: 'My custom unavailable error', metadata: {} });
                });
                return service;
            };
            return actual;
        });
        require('ydb-sdk-proto');
    });
    it('IAM auth service - UNAVAILABLE', async () => {
        const iamAuth = new iam_auth_service_1.IamAuthService({
            accessKeyId: '1',
            iamEndpoint: '2',
            privateKey: Buffer.from('3'),
            serviceAccountId: '4',
        }, testLogger);
        // mock jwt request return
        iamAuth['getJwtRequest'] = () => '';
        await expect(async () => {
            await iamAuth.getAuthMetadata();
        }).rejects.toThrow(errors_1.TransportUnavailable);
        await expect(mockIamCounter.retries).toBe(10);
    });
    it('Static creds auth service - UNAVAILABLE', async () => {
        const staticAuth = new static_credentials_auth_service_1.StaticCredentialsAuthService('usr', 'pwd', 'endpoint', testLogger);
        await expect(async () => {
            await staticAuth.getAuthMetadata();
        }).rejects.toThrow(errors_1.TransportUnavailable);
        await expect(mockStaticCredCounter.retries).toBe(10);
    });
});
