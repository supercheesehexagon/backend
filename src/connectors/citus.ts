import { PostgresConnector, QueryResult } from './postgres';

export class CitusConnector extends PostgresConnector {
  constructor(config: any) {
    super({ postgres: config.citus }); // Передаем citus-конфиг в postgres-коннектор
  }

  /**
   * Специфичный метод для Citus
   * Выполняет запрос на всех узлах кластера
   */
  async executeDistributedQuery(sql: string): Promise<QueryResult> {
    return this.query(`SELECT run_command_on_workers($$ ${sql} $$)`);
  }

  /**
   * Получение метаданных распределенных таблиц
   */
  async getDistributedTables(): Promise<QueryResult> {
    return this.query(`
      SELECT logicalrelid::regclass AS table_name, 
             nodename, 
             nodeport 
      FROM pg_dist_shard_placement
    `);
  }
}