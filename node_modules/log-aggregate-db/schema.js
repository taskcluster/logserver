/**
Our logging is based on storing rows in Postgres so we need to build a schema.
*/
var Promise = require('promise'),
    PromiseProxy = require('proxied-promise-object'),
    Transaction = require('pg-transaction'),
    fs = require('fs');

var GET_VERSION =
  'SELECT version FROM log_aggregate_db.version ORDER BY version LIMIT 1';

var INSERT_VERSION =
  'INSERT INTO log_aggregate_db.version (version) VALUES ($1)';

var VERSION = 1;

/**
This is heavily inspired by what rails (active record) version does and it works
very well for indicating what state we are in... This should be moved into its
own lib (or find some other lightweight abstraction that is on npm).
*/
function getVersion(pgclient) {
  var query = Promise.denodeify(pgclient.query.bind(pgclient));

  // check the versions database
  return new Promise(function(accept, reject) {
    query(GET_VERSION).then(
      function(result) {
        if (result.rowCount === 0) return accept(0);
        accept(result.rows[0].version);
      },

      // even on error just pass 0 (the lowest possible version) let the next db
      // call catch the error
      function() {
        accept(0);
      }
    );
  });
}

function define(pgclient) {
  // update the schema is the db version is less then our constant.
  return getVersion(pgclient).then(
    function(version) {
      if (version < VERSION) return upgradeSchema(pgclient);
      // done
      return true;
    }
  );
}

function upgradeSchema(pgclient) {
  // like a require we use sync IO to load the sql file.
  var sql = fs.readFileSync(__dirname + '/sql/schema.sql', 'utf8');
  var txn = PromiseProxy(Promise, new Transaction(pgclient));

  return new Promise(function(accept, reject) {
    // begin by opening a new transaction
    return txn.begin().then(
      // push in the base schema
      function() {
        return txn.query(sql);
      }
    ).then(
      // update the version
      function() {
        return txn.query(INSERT_VERSION, [VERSION]);
      }
    ).then(
      function() {
        return txn.commit();
      }
    ).then(
      accept,
      // rollback transaction but pass the error along (reject the promise)
      function handleError(err) {
        var done = reject.bind(null, err);
        txn.rollback(null).then(done, done);
      }
    );
  });
}

module.exports.define = define;

function destroy(pgclient) {
  var sql = require('./sql/statements');

  var exec = Promise.denodeify(pgclient.query.bind(pgclient));
  return exec(sql.destroy);
}

module.exports.destroy = destroy;
