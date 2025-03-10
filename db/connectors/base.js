class BaseConnector {
  constructor(config) {
    this.config = config;
  }
  
  async query() {
    throw new Error('Method not implemented');
  }
  
  async connect() {
    throw new Error('Method not implemented');
  }
}

module.exports = BaseConnector;