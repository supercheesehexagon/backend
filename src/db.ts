import config from './config';
import { BaseConnector } from './connectors/base';
import { PostgresConnector } from './connectors/postgres';
import { ClickHouseConnector } from './connectors/clickhouse'
import { CitusConnector } from './connectors/citus';
import { GreenplumConnector } from './connectors/greenplum';
import { CockroachConnector } from './connectors/cockroach';
import { YdbConnector } from './connectors/ydb';
class DB {
  private connector: BaseConnector;

  constructor() {
    switch (config.type) { // Используем config.type вместо config.db.type
      case 'postgres':
        this.connector = new PostgresConnector(config);
        break;
      case 'clickhouse':
        this.connector = new ClickHouseConnector(config);
        break;
      case 'citus':
        this.connector = new CitusConnector(config);
        break;
      case 'greenplum':
        this.connector = new GreenplumConnector(config);
        break;
      case 'cockroach':
        this.connector = new CockroachConnector(config);
        break;
      case 'ydb':
        this.connector = new YdbConnector(config);
        break;
      default:
        throw new Error(`Unsupported DB type: ${config.type}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.connector.query(sql, params);
  }
}

export default new DB();