interface DBConfig {
  type: 'postgres' | 'citus' | 'greenplum' | 'cockroach' | 'clickhouse' | 'ydb';
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
  citus: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    maxConnections?: number;
  };
  greenplum: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    connectionTimeout?: number;
  };
  cockroach: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    ssl?: boolean;
  };
  ydb: {
    endpoint: string;
    database: string;
    authToken?: string;
    serviceAccountKey?: string;
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
    host: 'host',
    port: 80,
    user: 'user',
    password: 'password',
  },
  citus: {
    host: 'host',
    user: 'user',
    password: 'password',
    database: 'database',
    port: 80,
  },
  greenplum: {
    host: 'host',
    user: 'user',
    password: 'password',
    database: 'database',
    port: 80,
  },
  cockroach: {
    host: 'host',
    user: 'user',
    password: 'password',
    database: 'database',
    port: 80,
  },
  ydb: {
    endpoint: 'endpoint',
    database: 'database',
  }
};

export default config;