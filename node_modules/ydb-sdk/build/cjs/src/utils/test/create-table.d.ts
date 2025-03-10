import { TableSession } from "../../table";
import { Row } from "./row";
export declare const TABLE: string;
export declare function createTable(session: TableSession): Promise<void>;
export declare function fillTableWithData(session: TableSession, rows: Row[]): Promise<void>;
//# sourceMappingURL=create-table.d.ts.map