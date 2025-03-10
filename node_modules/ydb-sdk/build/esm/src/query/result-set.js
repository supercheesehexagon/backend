"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultSet = void 0;
const symbols = __importStar(require("./symbols"));
const types_1 = require("../types");
class ResultSet {
    index;
    rowMode;
    [symbols.resultsetYdbColumnsSymbol];
    columns;
    rows;
    constructor(index, columns, rowMode, rowsIterator // IValue when rowMode === RowType.Ydb otherwise an object where columns become properties
    ) {
        this.index = index;
        this.rowMode = rowMode;
        this.columns = columns;
        this.rows = rowsIterator[Symbol.asyncIterator]();
    }
    typedRows(type) {
        if (this.rowMode !== 1 /* RowType.Ydb */)
            throw new Error('Typed strings can only be retrieved in rowMode == RowType.Ydb');
        const columns = this.columns;
        // TODO: Check correspondence of required and received columns and their types
        async function* typedRows(self) {
            const nativeColumns = columns.map(col => types_1.snakeToCamelCaseConversion.ydbToJs(col.name));
            const rows = self.rows;
            while (true) {
                const { value: ydbRow, done } = await rows.next();
                if (done)
                    return;
                yield ydbRow.items.reduce((acc, value, index) => {
                    acc[nativeColumns[index]] = (0, types_1.convertYdbValueToNative)(columns[index].type, value);
                    return acc;
                }, Object.create(type.prototype));
            }
        }
        return typedRows(this);
    }
}
exports.ResultSet = ResultSet;
