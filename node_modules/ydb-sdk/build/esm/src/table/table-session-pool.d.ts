import { Ydb } from "ydb-sdk-proto";
export import TableService = Ydb.Table.V1.TableService;
export import ICreateSessionResult = Ydb.Table.ICreateSessionResult;
import { Endpoint } from "../discovery";
import { ISslCredentials } from "../utils/ssl-credentials";
import EventEmitter from "events";
import { TableSession } from "./table-session";
import { AuthenticatedService, ClientOptions } from "../utils";
import { IAuthService } from "../credentials/i-auth-service";
import { Context } from "../context";
import { Logger } from "../logger/simple-logger";
import { IClientSettings } from "../client/settings";
export declare class SessionBuilder extends AuthenticatedService<TableService> {
    endpoint: Endpoint;
    private readonly logger;
    constructor(endpoint: Endpoint, database: string, authService: IAuthService, logger: Logger, sslCredentials?: ISslCredentials, clientOptions?: ClientOptions);
    create(): Promise<TableSession>;
}
export declare enum SessionEvent {
    SESSION_RELEASE = "SESSION_RELEASE",
    SESSION_BROKEN = "SESSION_BROKEN"
}
type SessionCallback<T> = (session: TableSession) => Promise<T>;
export declare class TableSessionPool extends EventEmitter {
    private readonly database;
    private readonly authService;
    private readonly sslCredentials?;
    private readonly clientOptions?;
    private readonly minLimit;
    private readonly maxLimit;
    private readonly sessions;
    private readonly sessionBuilders;
    private readonly discoveryService;
    private newSessionsRequested;
    private sessionsBeingDeleted;
    private readonly sessionKeepAliveId;
    private readonly logger;
    private readonly waiters;
    private static SESSION_MIN_LIMIT;
    private static SESSION_MAX_LIMIT;
    constructor(settings: IClientSettings);
    destroy(): Promise<void>;
    destroy(ctx: Context): Promise<void>;
    private initListeners;
    private prepopulateSessions;
    private getSessionBuilder;
    private maybeUseSession;
    private createSession;
    private deleteSession;
    private acquire;
    private _withSession;
    withSession<T>(callback: SessionCallback<T>, timeout: number): Promise<T>;
    withSession<T>(ctx: Context, callback: SessionCallback<T>, timeout: number): Promise<T>;
    withSessionRetry<T>(callback: SessionCallback<T>, timeout: number | undefined, maxRetries: number): Promise<T>;
    withSessionRetry<T>(ctx: Context, callback: SessionCallback<T>, timeout: number, maxRetries: number): Promise<T>;
}
export {};
//# sourceMappingURL=table-session-pool.d.ts.map