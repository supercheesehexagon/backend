"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDriver = initDriver;
const driver_1 = __importDefault(require("../../driver"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const anonymous_auth_service_1 = require("../../credentials/anonymous-auth-service");
const DATABASE = '/local';
async function initDriver(settings) {
    const certFile = process.env.YDB_SSL_ROOT_CERTIFICATES_FILE || path_1.default.join(process.cwd(), 'ydb_certs/ca.pem');
    if (!fs_1.default.existsSync(certFile)) {
        throw new Error(`Certificate file ${certFile} doesn't exist! Please use YDB_SSL_ROOT_CERTIFICATES_FILE env variable or run Docker container https://cloud.yandex.ru/docs/ydb/getting_started/ydb_docker inside working directory`);
    }
    const sslCredentials = { rootCertificates: fs_1.default.readFileSync(certFile) };
    const driver = new driver_1.default({
        endpoint: process.env.YDB_ENDPOINT || `grpc://localhost:2136`,
        database: DATABASE,
        authService: new anonymous_auth_service_1.AnonymousAuthService(),
        sslCredentials,
        ...settings
    });
    const ready = await driver.ready(3000);
    if (!ready) {
        throw new Error('Driver is not ready!');
    }
    return driver;
}
