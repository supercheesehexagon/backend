"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const ssl_credentials_1 = require("./utils/ssl-credentials");
const discovery_service_1 = __importDefault(require("./discovery/discovery-service"));
const table_1 = require("./table");
const scheme_client_1 = __importDefault(require("./schema/scheme-client"));
const query_1 = require("./query");
const get_default_logger_1 = require("./logger/get-default-logger");
const topic_1 = require("./topic");
const retryStrategy_1 = require("./retries/retryStrategy");
const retryParameters_1 = require("./retries/retryParameters");
class Driver {
    logger;
    discoveryService;
    _topicClient;
    clientSettings;
    // TODO: Make lazy intialized
    tableClient;
    queryClient;
    schemeClient;
    get topic() {
        if (!this._topicClient)
            this._topicClient = new topic_1.TopicClient(this.clientSettings);
        return this._topicClient;
    }
    constructor(settings) {
        let secure = false, endpoint = '', database = '';
        this.logger = settings.logger || (0, get_default_logger_1.getDefaultLogger)();
        if (settings.endpoint && settings.database) {
            settings.logger?.warn('The "endpoint" and "database" fields are deprecated. Use "connectionString" instead');
            secure = settings.endpoint.startsWith('grpcs://') || endpoint.startsWith('https://');
            endpoint = settings.endpoint.replace(/^(grpcs?|https?):\/\//, '');
            database = settings.database;
        }
        if (settings.connectionString) {
            let cs = new URL(settings.connectionString);
            endpoint = cs.host;
            database = cs.pathname || cs.searchParams.get('database') || '';
            if (!database) {
                throw new Error('The "database" field is required in the connection string. It should be specified either in the path or as a `database` query parameter.');
            }
            secure = cs.protocol === 'grpcs:' || cs.protocol === 'https:';
        }
        if (!endpoint || !database) {
            throw new Error('Either "endpoint" and "database" or "connectionString" must be specified');
        }
        const sslCredentials = secure
            ? settings.sslCredentials ?? (0, ssl_credentials_1.makeDefaultSslCredentials)()
            : undefined;
        const retrier = settings.retrier || new retryStrategy_1.RetryStrategy(new retryParameters_1.RetryParameters(), this.logger);
        this.discoveryService = new discovery_service_1.default({
            endpoint,
            database,
            discoveryPeriod: constants_1.ENDPOINT_DISCOVERY_PERIOD,
            authService: settings.authService,
            sslCredentials: sslCredentials,
            clientOptions: settings.clientOptions,
            retrier,
            logger: this.logger,
        });
        this.clientSettings = {
            database,
            authService: settings.authService,
            sslCredentials,
            poolSettings: settings.poolSettings,
            clientOptions: settings.clientOptions,
            discoveryService: this.discoveryService,
            retrier,
            logger: this.logger,
        };
        this.tableClient = new table_1.TableClient(this.clientSettings);
        this.queryClient = new query_1.QueryClient(this.clientSettings);
        this.schemeClient = new scheme_client_1.default(this.clientSettings);
    }
    async ready(timeout) {
        try {
            await this.discoveryService.ready(timeout);
            this.logger.debug('Driver is ready!');
            return true;
        }
        catch (e) {
            if (e instanceof errors_1.TimeoutExpired) {
                return false;
            }
            else {
                throw e;
            }
        }
    }
    async destroy() {
        this.logger.debug('Destroying driver...');
        this.discoveryService.destroy();
        await Promise.all([
            this.tableClient.destroy(),
            this.queryClient.destroy(),
            this.schemeClient.destroy(),
            this._topicClient?.destroy(),
        ]);
        this.logger.debug('Driver has been destroyed.');
    }
}
exports.default = Driver;
