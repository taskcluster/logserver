suite('routes/log', function() {
  var app = require('../web'),
      request = require('supertest'),
      db = require('../test/db')(),
      uuid = require('uuid');

  function create(opts) {
    var result = { id: uuid.v4() };

    setup(function() {
      return db.log.create(result.id, opts);
    });

    return result;
  }

  test('unknown log', function(done) {
    request(app).
      get('/log/' + uuid.v4() + '/content').
      expect(404).
      end(done);
  });

  suite('known log no content', function() {
    var record = create({ contentType: 'text/plain' });

    test('stream', function(done) {
      request(app).
        get('/log/' + record.id + '/content').
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.ok(!result.res.text, 'body is empty');
          done(err);
        });
    });
  });

  suite('incomplete stream of data', function() {
    var record = create({ contentType: 'text/plain' });

    var content = new Buffer('XWOOT');
    setup(function() {
      return db.log.addPart(record.id, 0, content.length, content);
    });

    test('should be marked as partial', function(done) {
      request(app).
        get('/log/' + record.id + '/content').
        expect(206).
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.equal(result.text, content.toString());
          done(err);
        });
    });
  });

  suite('complete log', function() {
    var record = create({ contentType: 'text/plain' });
    var content = new Buffer('XWOOT');

    setup(function() {
      return db.log.addPart(record.id, 0, content.length, content);
    });

    setup(function() {
      return db.log.update(record.id, { complete: true });
    });

    test('should be 200 and return full log', function(done) {
      request(app).
        get('/log/' + record.id + '/content').
        expect(200).
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.equal(result.text, content.toString());
          done(err);
        });
    });
  });
});
