"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConnector = void 0;
const pg_1 = require("pg");
const base_1 = require("./base");
class PostgresConnector extends base_1.BaseConnector {
    constructor(config) {
        super(config);
        this.pool = new pg_1.Pool(config.postgres);
    }
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.pool.connect();
            try {
                return yield client.query(sql, params);
            }
            finally {
                client.release();
            }
        });
    }
}
exports.PostgresConnector = PostgresConnector;
