interface DBConfig {
  type: 'postgres' | 'cockroach' | 'clickhouse' | 'ydb';
  postgres: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
  };
  clickhouse: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
}

const config: DBConfig = {
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

export default config;