suite('routes/log', function() {
  var app = require('../bin/web'),
      request = require('supertest'),
      db = require('../test/db')(),
      uuid = require('uuid');

  suite('known log no content', function() {
    test('stream', function(done) {
      request(app).
        get('/log/' + uuid.v4() + '/content').
        expect('Content-Type', /text\/plain/).
        end(function(err, result) {
          if (err) return done(err);
          assert.ok(!result.res.text, 'body is empty');
          done(err);
        });
    });
  });

  suite('stream of data', function() {
    var id = uuid.v4();
    var content = new Buffer('XWOOT');

    setup(function() {
      return db.log.add(id, 0, content.length, content);
    });

    test('should be marked as partial', function(done) {
      request(app).
        get('/log/' + id + '/content').
        expect(200).
        expect('Content-Type', /text\/plain/).
        end(function(err, result) {
          assert.equal(result.text, content.toString());
          done(err);
        });
    });
  });
});
