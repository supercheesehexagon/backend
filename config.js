module.exports = {
  db: {
    type: 'postgres', // postgres/cockroach/clickhouse/ydb
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
    // ... другие конфигурации
  }
};