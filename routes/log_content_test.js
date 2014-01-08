suite('routes/log', function() {
  var app = require('../web'),
      request = require('supertest'),
      db = require('../test/db')();

  test('unknown log', function(done) {
    request(app).
      get('/log/9999/content').
      expect(404).
      end(done);
  });

  suite('known log no content', function() {
    var id;
    setup(function() {
      return db.log.create({ contentType: 'text/plain' }).then(
        function(value) {
          id = value;
        }
      );
    });

    test('stream', function(done) {
      request(app).
        get('/log/' + id + '/content').
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.ok(!result.res.text, 'body is empty');
          done(err);
        });
    });
  });

  suite('incomplete stream of data', function() {
    var id;
    setup(function() {
      return db.log.create({ contentType: 'text/plain' }).then(
        function(value) {
          id = value;
        }
      );
    });

    var content = new Buffer('XWOOT');
    setup(function() {
      return db.log.addPart(id, 0, content.length, content);
    });

    test('should be marked as partial', function(done) {
      request(app).
        get('/log/' + id + '/content').
        expect(206).
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.equal(result.text, content.toString());
          done(err);
        });
    });
  });

  suite('complete log', function() {
    var id;
    setup(function() {
      return db.log.create({ contentType: 'text/plain' }).then(
        function(value) {
          id = value;
        }
      );
    });

    var content = new Buffer('XWOOT');
    setup(function() {
      return db.log.addPart(id, 0, content.length, content);
    });

    setup(function() {
      return db.log.update(id, { complete: true });
    });

    test('should be 200 and return full log', function(done) {
      request(app).
        get('/log/' + id + '/content').
        expect(200).
        expect('Content-Type', 'text/plain').
        end(function(err, result) {
          assert.equal(result.text, content.toString());
          done(err);
        });
    });
  });
});

