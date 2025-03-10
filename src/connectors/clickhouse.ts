import { ClickHouse } from 'clickhouse';
import { BaseConnector } from './base';

export class ClickHouseConnector extends BaseConnector {
  private client: ClickHouse;

  constructor(config: any) {
    super(config);
    this.client = new ClickHouse(config.clickhouse);
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.client.query(sql).toPromise();
  }
}