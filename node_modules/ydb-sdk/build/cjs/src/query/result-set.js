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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultSet = void 0;
const symbols = __importStar(require("./symbols"));
const types_1 = require("../types");
class ResultSet {
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
        function typedRows(self) {
            return __asyncGenerator(this, arguments, function* typedRows_1() {
                const nativeColumns = columns.map(col => types_1.snakeToCamelCaseConversion.ydbToJs(col.name));
                const rows = self.rows;
                while (true) {
                    const { value: ydbRow, done } = yield __await(rows.next());
                    if (done)
                        return yield __await(void 0);
                    yield yield __await(ydbRow.items.reduce((acc, value, index) => {
                        acc[nativeColumns[index]] = (0, types_1.convertYdbValueToNative)(columns[index].type, value);
                        return acc;
                    }, Object.create(type.prototype)));
                }
            });
        }
        return typedRows(this);
    }
}
exports.ResultSet = ResultSet;
symbols.resultsetYdbColumnsSymbol;
