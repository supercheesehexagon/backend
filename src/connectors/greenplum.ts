import { PostgresConnector, QueryResult } from './postgres';

export class GreenplumConnector extends PostgresConnector {
  constructor(config: any) {
    super({ postgres: config.greenplum }); // Передаем greenplum-конфиг
    
    // Увеличиваем время ожидания для распределенных запросов
    this.pool.options.connectionTimeoutMillis = 60000;
    this.pool.options.query_timeout = 60000;
  }

  /**
   * Специфичный метод для Greenplum
   * Анализ распределенных данных
   */
  async analyzeDistributedStats(): Promise<QueryResult> {
    return this.query('ANALYZE ROOTPARTITION ALL');
  }

  /**
   * Проверка статуса сегментов кластера
   */
  async checkClusterStatus(): Promise<QueryResult> {
    return this.query(`
      SELECT * FROM gp_segment_configuration 
      WHERE status != 'u' OR mode != 's'
    `);
  }
}