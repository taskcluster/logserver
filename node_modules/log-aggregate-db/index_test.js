suite('index', function() {
  test('has exports', function() {
    var index = require('./');
    assert.ok(index.Schema);
    assert.ok(index.Client);
  });
});
