"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    type: 'postgres', // Перенесено на верхний уровень
    postgres: {
        host: 'localhost',
        user: 'postgres',
        password: '123',
        database: 'postgres',
        port: 5432,
    },
    clickhouse: {
        host: 'localhost',
        port: 8123,
        user: 'default',
        password: ''
    }
};
exports.default = config;
