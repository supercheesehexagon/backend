import config from './config';
import { PostgresConnector } from './connectors/postgres';
import { ClickHouseConnector } from './connectors/clickhouse';
import { BaseConnector } from './connectors/base';

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
      default:
        throw new Error(`Unsupported DB type: ${config.type}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.connector.query(sql, params);
  }
}

export default new DB();