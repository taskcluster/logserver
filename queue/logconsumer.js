var Consumer = require('amqpworkers/consumer');
var pg = require('pg');
var Promise = require('promise');
var LogDB = require('log-aggregate-db/client');

function LogConsumer(connection, credentials) {
  Consumer.call(this, connection);
  this.credentials = credentials;
}

LogConsumer.prototype = {
  __proto__: Consumer.prototype,

  addEntity: function(db, id, offset, buffer) {
    var logapi = new LogDB(db);
    return logapi.add(id, offset, buffer.length, buffer);
  },

  read: function(content, message) {
    return new Promise(function(accept, reject) {
      var headers = message.properties.headers;
      // open a connection to the db
      pg.connect(this.credentials, function(err, client, done) {
        if (err) {
          console.error('Cannot connect to the db');
          return reject(err);
        }

        console.log(
          'running',
          headers.type,
          message.properties.messageId
        );

        var operation = this.addEntity(
          client,
          message.properties.messageId,
          headers.offset,
          content
        );

        operation.then(
          function success(value) {
            done();
            accept(value);
          },
          function failure(err) {
            console.log('Failure handling operation', headers.type, err);
            done();
            reject(err);
          }
        );
      }.bind(this));
    }.bind(this));
  }
};

module.exports = LogConsumer;
