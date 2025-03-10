import { Ydb } from "ydb-sdk-proto";
export import GrpcQueryService = Ydb.Query.V1.QueryService;
import { Endpoint } from "../discovery";
import { ISslCredentials } from "../utils/ssl-credentials";
import EventEmitter from "events";
import { QuerySession } from "./query-session";
import { AuthenticatedService, ClientOptions } from "../utils";
import { IAuthService } from "../credentials/i-auth-service";
import { Logger } from "../logger/simple-logger";
import { IClientSettings } from "../client/settings";
export declare class QueryService extends AuthenticatedService<GrpcQueryService> {
    endpoint: Endpoint;
    private readonly logger;
    constructor(endpoint: Endpoint, database: string, authService: IAuthService, logger: Logger, sslCredentials?: ISslCredentials, clientOptions?: ClientOptions);
    createSession(): Promise<QuerySession>;
}
export declare enum SessionEvent {
    SESSION_RELEASE = "SESSION_RELEASE",
    SESSION_BROKEN = "SESSION_BROKEN"
}
export type SessionCallback<T> = (session: QuerySession) => Promise<T>;
export declare class QuerySessionPool extends EventEmitter {
    private readonly database;
    private readonly authService;
    private readonly sslCredentials?;
    private readonly clientOptions?;
    minLimit: number;
    private readonly maxLimit;
    private readonly sessions;
    private readonly queryServices;
    private readonly discoveryService;
    private newSessionsRequested;
    private sessionsBeingDeleted;
    private readonly logger;
    private readonly waiters;
    private static SESSION_MIN_LIMIT;
    private static SESSION_MAX_LIMIT;
    constructor(settings: IClientSettings);
    destroy(): Promise<void>;
    private getSessionBuilder;
    private maybeUseSession;
    private createSession;
    private deleteSession;
    acquire(timeout?: number): Promise<QuerySession>;
}
//# sourceMappingURL=query-session-pool.d.ts.map