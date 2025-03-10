const config = require('../config');
const connectors = {
  postgres: require('./connectors/postgres'),
  //cockroach: require('./connectors/cockroach'),
  //clickhouse: require('./connectors/clickhouse'),
  //ydb: require('./connectors/ydb')
};

class DB {
  constructor() {
    if (!connectors[config.db.type]) {
      throw new Error(`Unsupported DB type: ${config.db.type}`);
    }
    this.connector =  new connectors[config.db.type](config.db);
  }

  async query(sql, params) {
    return this.connector.query(sql, params);
  }
}

module.exports = new DB();