import { Ydb } from "ydb-sdk-proto";
import { QuerySession } from "./query-session";
export declare function beginTransaction(this: QuerySession, txSettings?: Ydb.Query.ITransactionSettings | null): Promise<void>;
export declare function commitTransaction(this: QuerySession): Promise<Ydb.Query.CommitTransactionResponse>;
export declare function rollbackTransaction(this: QuerySession): Promise<Ydb.Query.RollbackTransactionResponse>;
//# sourceMappingURL=query-session-transaction.d.ts.map