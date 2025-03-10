import { Driver, getCredentialsFromEnv } from 'ydb-sdk';
import { BaseConnector } from './base';

export class YdbConnector extends BaseConnector {
  private driver: Driver;

  constructor(config: any) {
    super(config);
    this.driver = new Driver({
      endpoint: config.ydb.endpoint,
      database: config.ydb.database,
      authService: config.ydb.authToken 
        ? getCredentialsFromEnv() 
        : getCredentialsFromServiceAccountKey(config.ydb.serviceAccountKey)
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    await this.driver.ready;
    const { resultSets } = await this.driver.tableClient.withSession(async (session) => {
      return session.executeQuery(sql);
    });
    return resultSets;
  }
}