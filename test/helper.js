global.assert = require('assert');

// to keep things simple we always use DATABASE_URL but we actually want
// POSTGRES_TEST_URL in our tests so we just override it before tests start
process.env.DATABASE_URL = process.env.POSTGRES_TEST_URL;

require('mocha-as-promised')();
