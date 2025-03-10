export abstract class BaseConnector {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  abstract query(sql: string, params?: any[]): Promise<any>;
}