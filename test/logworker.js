module.exports = function () {
  function earlyExit(code) {
    throw new Error('early exit in worker: ' + code);
  }

  var spawn = require('child_process').spawn;
  var child;

  setup(function() {
    var cmd = [__dirname + '/../bin/logworker'];
    var envs = {};

    for (var key in process.env) {
      envs[key] = process.env[key];
    }


    child = spawn(cmd.join(' '), [], {
      env: envs,
      stdio: 'inherit'
    });

    child.once('exit', earlyExit);
  });

  teardown(function(done) {
    child.removeListener('exit', earlyExit);
    child.once('exit', function(code) {
      done();
    });
    child.kill();
  });
};
