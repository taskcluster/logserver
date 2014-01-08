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

  return logdb.get(id).then(
    function log(entity) {
      if (!entity) {
        return res.send(404);
      }

      // if the entire log is not complete we return 206
      var status = (entity.complete) ? 200 : 206;
      res.status(status);
      res.type(entity.contentType || 'text/plain');
      return streamContent(logdb.content(id), res);
    },
    function error(err) {
      console.error(err);
      res.send(500, { error: 'database error' });
    }
  );
}

module.exports = log;
