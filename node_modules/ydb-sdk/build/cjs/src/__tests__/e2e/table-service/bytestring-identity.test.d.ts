import { TypedData } from '../../../types';
import { TableSession } from "../../../table";
export interface IRow {
    id: number;
    field1: string;
    field2: Buffer;
    field3: Buffer;
}
declare class Row extends TypedData {
    id: number;
    field1: string;
    field2: Buffer;
    field3: Buffer;
    constructor(data: IRow);
}
export declare function fillTableWithData(session: TableSession, rows: Row[]): Promise<void>;
export {};
//# sourceMappingURL=bytestring-identity.test.d.ts.map