const { Pool } = require('pg');
const BaseConnector = require('./base');

class PostgresConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pool = new Pool(config.postgres);
  }

  async query(sql, params) {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
}

module.exports = PostgresConnector;