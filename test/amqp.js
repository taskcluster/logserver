module.exports = function() {
  var amqplib = require('amqplib');
  var schema = require('../queue/schema');

  var Publisher = require('amqpworkers/publisher'),
      Message = require('amqpworkers/message');

  var result = {};

  setup(function() {
    return amqplib.connect(process.env.CLOUDAMQP_URL).then(
      function(con) {
        result.connection = con;
      }
    );
  });

  setup(function() {
    return schema.define(result.connection);
  });

  setup(function() {
    return schema.purge(result.connection);
  });

  setup(function() {
    result.publisher = new Publisher(result.connection);
  });

  teardown(function() {
    return result.publisher.close();
  });

  teardown(function() {
    return schema.destroy(result.connection);
  });

  teardown(function() {
    return result.connection.close();
  });

  return result;
};
