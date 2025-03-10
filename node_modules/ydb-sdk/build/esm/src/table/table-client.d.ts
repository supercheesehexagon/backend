import EventEmitter from "events";
import { TableSession } from "./table-session";
import { Context } from "../context";
import { IClientSettings } from "../client/settings";
/**
 * Version settings for service clients that are created by the discovery service method - one per endpoint. Like Topic client.
 */
export declare class TableClient extends EventEmitter {
    private pool;
    constructor(settings: IClientSettings);
    withSession<T>(callback: (session: TableSession) => Promise<T>, timeout?: number): Promise<T>;
    withSession<T>(ctx: Context, callback: (session: TableSession) => Promise<T>, timeout?: number): Promise<T>;
    withSessionRetry<T>(callback: (session: TableSession) => Promise<T>, timeout?: number, maxRetries?: number): Promise<T>;
    withSessionRetry<T>(ctx: Context, callback: (session: TableSession) => Promise<T>, timeout?: number, maxRetries?: number): Promise<T>;
    destroy(): Promise<void>;
    destroy(ctx: Context): Promise<void>;
}
//# sourceMappingURL=table-client.d.ts.map