"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
const retries_obsoleted_1 = require("../../retries_obsoleted");
const discovery_1 = require("../../discovery");
const utils_1 = require("../../utils");
const test_1 = require("../../utils/test");
const simple_logger_1 = require("../../logger/simple-logger");
if (process.env.TEST_ENVIRONMENT === 'dev')
    require('dotenv').config();
const MAX_RETRIES = 3;
const logger = new simple_logger_1.SimpleLogger({ level: simple_logger_1.LogLevel.error });
class ErrorThrower {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }
    errorThrower(callback) {
        return callback();
    }
}
__decorate([
    (0, retries_obsoleted_1.retryable)(new retries_obsoleted_1.RetryParameters({ maxRetries: MAX_RETRIES, backoffCeiling: 3, backoffSlotDuration: 5 }), logger),
    utils_1.pessimizable
], ErrorThrower.prototype, "errorThrower", null);
// TODO: Remake for new retry policy - no attempts limit, only optional timeout
describe('Retries on errors', () => {
    let driver;
    beforeAll(async () => {
        driver = await (0, test_1.initDriver)({ logger });
    });
    afterAll(async () => await (0, test_1.destroyDriver)(driver));
    /** Run session with error. retries_need can be  omitted if retries must not occur */
    function createError(error, retries_need = 1) {
        it(`${error.name}`, async () => {
            // here must be retries
            let retries = 0;
            const et = new ErrorThrower(new discovery_1.Endpoint({}, ''));
            await expect(
            // TODO: Turn to unit test
            driver.tableClient.withSession(async () => {
                await et.errorThrower(() => {
                    retries++;
                    throw new error('');
                });
            })).rejects.toThrow(error);
            expect(retries).toBe(retries_need);
        });
    }
    createError(errors_1.BadRequest);
    createError(errors_1.InternalError);
    createError(errors_1.Aborted, MAX_RETRIES); // have retries
    createError(errors_1.Unauthenticated);
    createError(errors_1.Unauthorized);
    createError(errors_1.Unavailable, MAX_RETRIES); // have retries
    createError(errors_1.Undetermined); // TODO: have retries for idempotent queries
    // createError(ExternalError); // TODO: have retries for idempotent queries
    createError(errors_1.Overloaded, MAX_RETRIES); // have retries
    createError(errors_1.SchemeError);
    createError(errors_1.GenericError);
    createError(errors_1.Timeout); // TODO: have retries for idempotent queries
    createError(errors_1.BadSession); // WHY?
    createError(errors_1.PreconditionFailed);
    // Transport/Client errors
    createError(errors_1.TransportUnavailable, MAX_RETRIES); // TODO: have retries for idempotent queries, BUT now always have retries
    createError(errors_1.ClientResourceExhausted, MAX_RETRIES);
    createError(errors_1.ClientDeadlineExceeded, MAX_RETRIES);
    // TODO: Add EXTERNAL ERROR
});
