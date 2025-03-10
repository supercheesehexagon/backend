import { Pool, QueryResult } from 'pg';
import { BaseConnector } from './base';

export class PostgresConnector extends BaseConnector {
  private pool: Pool;

  constructor(config: any) {
    super(config);
    this.pool = new Pool(config.postgres);
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
}