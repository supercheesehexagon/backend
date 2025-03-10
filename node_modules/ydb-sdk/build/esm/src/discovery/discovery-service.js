"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ydb_sdk_proto_1 = require("ydb-sdk-proto");
var DiscoveryServiceAPI = ydb_sdk_proto_1.Ydb.Discovery.V1.DiscoveryService;
const endpoint_1 = require("./endpoint");
const events_1 = __importDefault(require("events"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const retries_obsoleted_1 = require("../retries_obsoleted");
const process_ydb_operation_result_1 = require("../utils/process-ydb-operation-result");
const utils_1 = require("../utils");
const internal_topic_client_1 = require("../topic/internal/internal-topic-client");
const noOp = () => {
};
class DiscoveryService extends utils_1.AuthenticatedService {
    database;
    discoveryPeriod;
    endpointsPromise;
    resolveEndpoints = noOp;
    rejectEndpoints = noOp;
    periodicDiscoveryId;
    endpoints = [];
    currentEndpointIndex = 0;
    events = new events_1.default();
    logger;
    constructor(settings) {
        super(settings.endpoint, settings.database, 'Ydb.Discovery.V1.DiscoveryService', DiscoveryServiceAPI, settings.authService, settings.sslCredentials, settings.clientOptions);
        this.database = settings.database;
        this.discoveryPeriod = settings.discoveryPeriod;
        this.logger = settings.logger;
        this.endpointsPromise = new Promise((resolve, reject) => {
            this.resolveEndpoints = (endpoints) => {
                this.updateEndpoints(endpoints);
                resolve();
            };
            this.rejectEndpoints = reject;
        });
        this.periodicDiscoveryId = this.init();
    }
    destroy() {
        clearInterval(this.periodicDiscoveryId);
    }
    init() {
        this.discoverEndpoints(this.database)
            .then(this.resolveEndpoints)
            .catch(this.rejectEndpoints);
        return setInterval(async () => {
            await this.endpointsPromise;
            try {
                const endpoints = await this.discoverEndpoints(this.database);
                this.updateEndpoints(endpoints);
            }
            catch (error) {
                this.logger.error(error);
            }
        }, this.discoveryPeriod);
    }
    updateEndpoints(endpoints) {
        const getHost = (endpoint) => endpoint.toString();
        const endpointsToAdd = lodash_1.default.differenceBy(endpoints, this.endpoints, getHost);
        const endpointsToRemove = lodash_1.default.differenceBy(this.endpoints, endpoints, getHost);
        const endpointsToUpdate = lodash_1.default.intersectionBy(this.endpoints, endpoints, getHost);
        this.logger.trace('Current endpoints %o', this.endpoints);
        this.logger.trace('Incoming endpoints %o', endpoints);
        this.logger.trace('Endpoints to add %o', endpointsToAdd);
        this.logger.trace('Endpoints to remove %o', endpointsToRemove);
        this.logger.trace('Endpoints to update %o', endpointsToUpdate);
        lodash_1.default.forEach(endpointsToRemove, (endpoint) => {
            endpoint.closeGrpcClient();
            this.emit(constants_1.Events.ENDPOINT_REMOVED, endpoint);
        });
        for (const current of endpointsToUpdate) {
            const newEndpoint = lodash_1.default.find(endpoints, (incoming) => incoming.toString() === current.toString());
            current.update(newEndpoint);
        }
        // endpointsToUpdate ordering is the same as this.endpoints, according to _.intersectionBy docs
        this.endpoints = endpointsToUpdate.concat(endpointsToAdd);
        // reset round-robin index in case new endpoints have been discovered or existing ones have become stale
        if (endpointsToRemove.length + endpointsToAdd.length > 0) {
            this.endpoints = lodash_1.default.shuffle(this.endpoints);
            this.currentEndpointIndex = 0;
        }
    }
    async discoverEndpoints(database) {
        const response = await this.api.listEndpoints({ database });
        const payload = (0, process_ydb_operation_result_1.getOperationPayload)(response);
        const endpointsResult = ydb_sdk_proto_1.Ydb.Discovery.ListEndpointsResult.decode(payload);
        // this.selfLocation = endpointsResult.selfLocation;
        return lodash_1.default.map(endpointsResult.endpoints, (endpointInfo) => new endpoint_1.Endpoint(endpointInfo, database));
    }
    emit(eventName, ...args) {
        this.events.emit(eventName, ...args);
    }
    on(eventName, callback) {
        this.events.on(eventName, callback);
    }
    ready(timeout) {
        return (0, utils_1.withTimeout)(this.endpointsPromise, timeout);
    }
    // TODO: Add find by nodeid
    async getEndpointRR() {
        await this.endpointsPromise;
        // TODO: Consider taken a node with already opened grpc connection
        const endpoint = this.endpoints[this.currentEndpointIndex++ % this.endpoints.length];
        return endpoint;
    }
    async getEndpoint() {
        let endpoint = await this.getEndpointRR();
        let counter = 0;
        while (endpoint.pessimized && counter < this.endpoints.length) {
            endpoint = await this.getEndpointRR();
            counter++;
        }
        if (counter === this.endpoints.length) {
            this.logger.debug('All endpoints are pessimized, returning original endpoint');
        }
        return endpoint;
    }
    async getTopicNodeClient() {
        const endpoint = await this.getEndpoint();
        if (!endpoint.topicNodeClient) {
            endpoint.topicNodeClient = new internal_topic_client_1.InternalTopicClient(endpoint, this.database, this.authService, this.logger, this.sslCredentials, this.clientOptions);
        }
        return endpoint.topicNodeClient;
    }
}
exports.default = DiscoveryService;
__decorate([
    (0, retries_obsoleted_1.retryable)()
], DiscoveryService.prototype, "discoverEndpoints", null);
