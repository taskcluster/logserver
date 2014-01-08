module.exports = function() {
  var pg = require('pg');
  var schema = require('log-aggregate-db/schema');
  var LogClient = require('log-aggregate-db/client');
  var result = {};

  setup(function(done) {
    result.pg = new pg.Client(process.env.DATABASE_URL);
    result.log = new LogClient(result.pg);
    result.pg.connect(done);
  });

  setup(function(done) {
    return schema.define(result.pg);
  });

  teardown(function(done) {
    return schema.destroy(result.pg);
  });

  teardown(function() {
    result.pg.end();
  });

  return result;
};
