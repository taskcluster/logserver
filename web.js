var server = require('express')(),
    pg = require('pg'),
    Promise = require('Promise');

function dbPromise(promiseFn) {
  return function(req, res, next) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      if (err) {
        console.error('Failed to connect to database');
        return res.send(500, { error: 'database failure' });
      }

      Promise.from(promiseFn(client, req, res, next)).then(
        done,
        done
      );
    });
  }
}

server.get(
  '/log/:id/content',
  dbPromise(require('./routes/log_content'))
);

if (require.main === module) {
  server.listen(process.env.PORT || 8080);
}

module.exports = server;
