var pg = require('pg'),
    ClientLog = require('log-aggregate-db/client'),
    Promise = require('promise');

function streamContent(stream, res) {
  // wrapped as a promise to ensure we are holding on the db
  return new Promise(function(accept, reject) {
    var out = stream.pipe(res);
    out.once('error', reject);
    out.once('finish', accept);
  });
}

function log(client, req, res) {
  var logdb = new ClientLog(client);
  var id = req.params.id;

  if (!id) {
    return res.send(500, { error: 'log id missing' });
  }

  // everything is 200 right now
  res.status(200);
  res.type('text/plain');

  streamContent(logdb.content(id), res).then(
    null,
    function error() {
      res.send(500, { error: 'database error' });
    }
  );
}

module.exports = log;
