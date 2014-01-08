suite('postgres', function() {
  var sql = require('./sql/statements');
  var subject = require('./schema');
  var pg = require('pg');

  var Promise = require('promise'),
      PromiseProxy = require('proxied-promise-object');

  // connect
  var client;
  setup(function() {
    client = new PromiseProxy(
      Promise,
      new pg.Client(process.env.POSTGRES_URI)
    );

    return client.connect();
  });

  teardown(function() {
    client.end();
  });

  suite('#define', function() {
    setup(function() {
      return client.query(sql.destroy);
    });

    setup(function() {
      return subject.define(client.subject);
    });

    function fetchVersions() {
      return client.query(
        'SELECT version FROM log_aggregate_db.version'
      );
    }

    test('sets version', function() {
      fetchVersions().then(
        function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].version, 1);
        }
      );
    });

    test('can be run multiple times', function() {
      // unwrapped version of the client gets passed
      return subject.define(client.subject).then(
        fetchVersions
      ).then(
        function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].version, 1);
        }
      );
    });

    teardown(function() {
      return client.query(sql.destroy);
    });
  });

  suite('#destroy', function() {
    setup(function() {
      return subject.define(client.subject);
    });

    setup(function() {
      return subject.destroy(client.subject);
    });

    test('removal of tables and data', function() {
      var sql = 'SELECT * FROM log_aggregate_db.entities';
      return client.query(sql).then(
        null,
        function(err) {
          assert.ok(err);
          var msg = err.message;
          assert.ok(
            msg.indexOf('"log_aggregate_db.entities" does not exist') !== -1,
            'removes table'
          );
        }
      );
    });
  });
});
