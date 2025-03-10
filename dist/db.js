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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const postgres_1 = require("./connectors/postgres");
const clickhouse_1 = require("./connectors/clickhouse");
class DB {
    constructor() {
        switch (config_1.default.type) { // Используем config.type вместо config.db.type
            case 'postgres':
                this.connector = new postgres_1.PostgresConnector(config_1.default);
                break;
            case 'clickhouse':
                this.connector = new clickhouse_1.ClickHouseConnector(config_1.default);
                break;
            default:
                throw new Error(`Unsupported DB type: ${config_1.default.type}`);
        }
    }
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connector.query(sql, params);
        });
    }
}
exports.default = new DB();
