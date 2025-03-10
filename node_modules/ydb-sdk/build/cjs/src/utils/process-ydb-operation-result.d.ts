import { Ydb } from "ydb-sdk-proto";
import { StatusCode } from "../errors";
export interface YdbOperationAsyncResponse {
    operation?: Ydb.Operations.IOperation | null;
}
export declare function getOperationPayload(response: YdbOperationAsyncResponse): Uint8Array;
export declare function ensureOperationSucceeded(response: YdbOperationAsyncResponse, suppressedErrors?: StatusCode[]): void;
export interface YdbCallAsyncResponse {
    status?: (Ydb.StatusIds.StatusCode | null);
    issues?: (Ydb.Issue.IIssueMessage[] | null);
}
export declare function ensureCallSucceeded<T extends YdbCallAsyncResponse>(response: T, suppressedErrors?: StatusCode[]): T;
//# sourceMappingURL=process-ydb-operation-result.d.ts.map