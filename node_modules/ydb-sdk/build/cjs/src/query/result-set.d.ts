import { Ydb } from "ydb-sdk-proto";
import { IAsyncQueueIterator } from "../utils/build-async-queue-iterator";
import { RowType } from "./query-session-execute";
import * as symbols from './symbols';
import { TypedData } from "../types";
export declare class ResultSet {
    readonly index: number;
    readonly rowMode: RowType;
    [symbols.resultsetYdbColumnsSymbol]?: Ydb.IColumn[];
    readonly columns: Ydb.IColumn[] | string[];
    readonly rows: AsyncGenerator<{
        [key: string]: any;
    }, void>;
    constructor(index: number, columns: Ydb.IColumn[] | string[], rowMode: RowType, rowsIterator: IAsyncQueueIterator<{
        [key: string]: any;
    }>);
    typedRows<T extends TypedData>(type: {
        new (...args: any[]): T;
    }): AsyncGenerator<T, void>;
}
//# sourceMappingURL=result-set.d.ts.map