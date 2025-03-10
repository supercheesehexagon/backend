import { Ydb } from "ydb-sdk-proto";
import DiscoveryServiceAPI = Ydb.Discovery.V1.DiscoveryService;
import { Endpoint } from "./endpoint";
import { AuthenticatedService } from "../utils";
import { InternalTopicClient } from "../topic/internal/internal-topic-client";
import { IDiscoverySettings } from "../client/settings";
export default class DiscoveryService extends AuthenticatedService<DiscoveryServiceAPI> {
    private readonly database;
    private readonly discoveryPeriod;
    private readonly endpointsPromise;
    private resolveEndpoints;
    private rejectEndpoints;
    private readonly periodicDiscoveryId;
    private endpoints;
    private currentEndpointIndex;
    private events;
    private logger;
    constructor(settings: IDiscoverySettings);
    destroy(): void;
    private init;
    private updateEndpoints;
    private discoverEndpoints;
    emit(eventName: string, ...args: any[]): void;
    on(eventName: string, callback: (...args: any[]) => void): void;
    ready(timeout: number): Promise<void>;
    private getEndpointRR;
    getEndpoint(): Promise<Endpoint>;
    getTopicNodeClient(): Promise<InternalTopicClient>;
}
//# sourceMappingURL=discovery-service.d.ts.map