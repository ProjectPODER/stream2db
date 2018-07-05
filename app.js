const getDB = require('./lib/db');
const mainStream = require('./lib/parse');
const getSources = require('../lib/sources');
// const database = getDB(args);

// FIXME as this script now lives in bin,
// we should just export needeed libraries here
// we should implement methods that fill the same functions
// as the cli args

module.exports = {
  getDB,
  mainStream,
  getSources,
};
