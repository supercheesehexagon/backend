import { Ydb } from "ydb-sdk-proto";
import { ResultSet } from "./result-set";
import { QuerySession } from "./query-session";
export type IExecuteArgs = {
    /**
     * SQL query / DDL etc.
     *
     */
    text: string;
    /**
     * Default value is SYNTAX_YQL_V1.
     */
    syntax?: Ydb.Query.Syntax;
    /**
     * SQL query parameters.
     */
    parameters?: {
        [k: string]: Ydb.ITypedValue;
    };
    txControl?: Ydb.Query.ITransactionControl;
    execMode?: Ydb.Query.ExecMode;
    statsMode?: Ydb.Query.StatsMode;
    concurrentResultSets?: boolean;
    /**
     * Operation timeout in ms
     */
    /**
     * Default Native.
     */
    rowMode?: RowType;
    idempotent?: boolean;
    /**
     * Resource Pool
     *
     * @deprecated Use resourcePool.
     */
    poolId?: string;
    /**
     * Resource Pool
     *
     * CREATE RESOURCE POOL pool_name WITH (...)
     */
    resourcePool?: string;
};
export type IExecuteResult = {
    resultSets: AsyncGenerator<ResultSet>;
    execStats?: Ydb.TableStats.IQueryStats;
    /**
     * Gets resolved when all data is received from stream and execute() operation become completed. At that moment
     * is allowed to start next operation within session.
     *
     * Wait for this promise is equivalent to get read all data from all result sets.
     */
    opFinished: Promise<void>;
    idempotent?: boolean;
};
export declare const CANNOT_MANAGE_TRASACTIONS_ERROR = "Cannot manage transactions at the session level if do() has the txSettings parameter or doTx() is used";
export declare const enum RowType {
    /**
     * Received rows get converted to js native format according to rules from src/types.ts.
     */
    Native = 0,
    /**
     * As it is received from GRPC buffer.  Required to use TypedData<T> in ResultSet.
     */
    Ydb = 1
}
/**
 * Finishes when the first data block is received or when the end of the stream is received. So if you are sure
 * that the operation does not return any data, you may not process resultSets.
 */
export declare function execute(this: QuerySession, args: IExecuteArgs): Promise<IExecuteResult>;
//# sourceMappingURL=query-session-execute.d.ts.map