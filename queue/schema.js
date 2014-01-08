var Schema = require('amqpworkers/schema');

module.exports = new Schema({
  exchanges: [
    ['log_v1', 'direct']
  ],

  queues: [
    ['logconsumer_v1', { durable: true }]
  ],

  binds: [
    ['logconsumer_v1', 'log_v1', 'log']
  ]
});
