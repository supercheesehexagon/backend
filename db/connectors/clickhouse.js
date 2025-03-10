const { ClickHouse } = require('clickhouse');
const BaseConnector = require('./base');

class ClickHouseConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.client = new ClickHouse(config.clickhouse);
  }

  async query(sql) {
    return this.client.query(sql).toPromise();
  }
}

module.exports = ClickHouseConnector;