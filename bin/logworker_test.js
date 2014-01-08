suite('bin/logworker', function() {
  var uuid = require('uuid');
  var db = require('../test/db')();
  var amqp = require('../test/amqp')();
  var app = require('../web');
  var request = require('supertest');

  // start the worker
  require('../test/logworker')();

  var Promise = require('promise');
  var Consumer = require('amqpworkers/consumer');
  var Message = require('amqpworkers/message');

  function publish(message) {
    return amqp.publisher.publish(
      'log_v1',
      'log',
      message
    );
  }

  function append(id, offset, buffer) {
    amqp.publisher.publish(
      'log_v1',
      'log',
      new Message(
        buffer,
        {
          messageId: id,
          headers: {
            offset: offset
          }
        }
      )
    );
  }

  function getWithRetry(id, retries) {
    return new Promise(function(accept, reject) {
      if (!retries) retries = 0;
      if (retries === 5) reject();

      db.log.get(id).then(
        function(value) {
          if (value) {
            return accept(value);
          }
          getWithRetry(id).then(accept, reject);
        },
        function() {
          getWithRetry(id).then(accept, reject);
        }
      );
    });
  }

  function fetchUntil(id, content, status) {
    function fetch(callback) {
      request(app).
        get('/log/' + id + '/content').
        end(function(err, result) {
          var correctText = result && result.res.text === content;

          if (correctText) {
            return callback(null, result.res.text);
          }

          setTimeout(fetch, 200, callback);
        });
    }

    return Promise.denodeify(fetch)();
  }

  function sendBuffers(id, buffers) {
    var offset = 0;
    list = buffers.map(function(buffer) {
      var promise = append(id, offset, buffer);
      offset += buffer.length;
      return promise;
    });
    return Promise.all(list);
  }

  suite('send incomplete log', function() {
    var id = uuid.v4();

    var buffers = [
      new Buffer('a'),
      new Buffer('b'),
      new Buffer('c'),
      new Buffer('d'),
      new Buffer('e'),
      new Buffer('f'),
      new Buffer('g')
    ];

    var expected = Buffer.concat(buffers);

    setup(function() {
      return sendBuffers(id, buffers);
    });

    test('can fetch partial results', function(done) {
      return fetchUntil(id, expected.toString());
    });
  });

});
