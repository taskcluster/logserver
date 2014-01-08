suite('client', function() {
  var db = require('./test/db')();
  var Client = require('./client');
  var Promise = require('promise');

  var subject;
  setup(function() {
    subject = new Client(db.client);
  });

  suite('#create', function() {
    test('no options', function() {
      return subject.create().then(
        function(id) {
          assert.ok(id, 'passes id');
          assert(typeof id === 'number', 'is a number');
        }
      );
    });

    test('contentType + owner', function() {
      var opts = {
        contentType: 'application/json',
        owner: 'owna'
      };

      return subject.create(opts).then(
        function(id) {
          return db.client.query(
            'SELECT * FROM log_aggregate_db.entities WHERE id = $1',
            [id]
          );
        }
      ).then(
        function(results) {
          var row = results.rows[0];
          assert.equal(row.owner, opts.owner);
          assert.equal(row.contentType, opts.contentType);
        }
      );
    });
  });

  suite('#get', function() {
    var opts = { owner: 'xfoo', contentType: 'woot' };
    var id;
    setup(function() {
      return subject.create(opts).then(function(result) {
        id = result;
      });
    });

    test('cannot find an id', function() {
      return subject.get(id + 1000).then(
        function(value) {
          assert.ok(!value);
        }
      );
    });

    test('finds entity by id', function() {
      return subject.get(id).then(
        function(value) {
          assert.equal(value.id, id);
          assert.equal(value.owner, opts.owner);
          assert.equal(value.contentType, opts.contentType);
        }
      );
    });
  });

  suite('#delete', function() {
    var id;
    setup(function() {
      return subject.create({ owner: 'foo' }).then(function(result) {
        id = result;
      });
    });

    setup(function() {
      return subject.addPart(id, 0, 1, new Buffer('x'));
    });

    setup(function() {
      return subject.delete(id);
    });

    test('get should return falsy', function() {
      return subject.get(id).then(
        function(value) {
          assert.ok(!value);
        }
      );
    });

    test('has no content', function(done) {
      var stream = subject.content(id);
      stream.on('data', function(data) {
        done(new Error('should not have data'));
      });
      stream.on('end', done);
    });
  });

  suite('#update', function() {
    var id;
    setup(function() {
      return subject.create({ owner: 'foo' }).then(function(result) {
        id = result;
      });
    });

    setup(function() {
      return subject.update(id, {
        complete: true
      });
    });

    test('updates complete but not foo', function() {
      var query = 'SELECT * FROM log_aggregate_db.entities ' +
                    'WHERE id = $1';

      return db.client.query(query, [id]).then(
        function(result) {
          var row = result.rows[0];
          assert.ok(row, 'has record');
          assert.ok(row.complete);
          assert.equal(row.owner, 'foo');
        }
      );
    });
  });

  suite('#addPart', function() {
    var buffer = new Buffer('woot!');

    var id;
    setup(function() {
      return subject.create().then(function(result) {
        id = result;
      });
    });

    setup(function() {
      return subject.addPart(id, 0, buffer.length, buffer);
    });

    test('part is added', function() {
      var query =
        'SELECT * FROM log_aggregate_db.parts WHERE "entitiesId" = $1';

      return db.client.query(query, [id]).then(
        function(result) {
          assert.ok(result);
          assert.equal(result.rowCount, 1);

          var row = result.rows[0];
          assert.equal(row.offset, 0);
          assert.equal(row.length, buffer.length);
          assert.equal(buffer.toString(), row.content.toString());
        }
      );
    });

    test('part integrity', function(done) {
      subject.addPart(6666666, 0, 1, buffer).then(
        null,
        function(err) {
          assert.ok(err.message.indexOf('violates foreign key constraint'));
          done();
        }
      );
    });
  });

  suite('#content', function() {
    var parts = [
      new Buffer('i am the first.\n'),
      new Buffer('i am the second.\n'),
      new Buffer('i am the third.\n')
    ];

    var expectedFinalBuffer = Buffer.concat(parts);

    // entity id
    var id;
    setup(function() {
      return subject.create().then(function(result) {
        id = result;
      });
    });

    // we need to add some parts to the entity
    setup(function() {
      var promises = [];
      var offset = 0;
      parts.forEach(function(part) {
        var length = part.length;
        promises.push(subject.addPart(
          id,
          offset,
          length,
          part
        ));
        offset += length;
      });

      return Promise.all(promises);
    });

    test('stream from the middle of a chunk to the end', function(done) {
      // Everything fits into a single byte so we can slice randomly
      // like this.. The expectation is the actual rendering will be
      // done by something that can buffer incomplete utf8.
      var offset = Math.floor(expectedFinalBuffer.length / 2);
      var expected = expectedFinalBuffer.slice(offset);

      var stream = subject.content(id, offset);
      var buffers = [];
      stream.on('data', function(buffer) {
        buffers.push(buffer);
      });

      stream.on('end', function() {
        var joined = Buffer.concat(buffers);
        assert.equal(
          joined.toString(),
          expected.toString()
        );
        done();
      });
    });

    test('stream from begining', function(done) {
      var stream = subject.content(id);
      var buffers = [];
      stream.on('data', function(buffer) {
        buffers.push(buffer);
      });

      stream.on('end', function() {
        var joined = Buffer.concat(buffers);

        assert.equal(joined.length, expectedFinalBuffer.length);
        assert.equal(
          joined.toString(),
          expectedFinalBuffer.toString()
        );
        done();
      });
    });
  });
});
