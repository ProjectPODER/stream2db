const omit = require('lodash.omit');
const args = require('./lib/args');

if (args.sources) {
  const getDB = require('./lib/db');
  const mainStream = require('./lib/parse');
  const database = getDB(args);

  database.then(db => {
    args.sources.forEach(stream => {
      mainStream(stream, omit(args, 'sources'), db)
        .promise()
        .then(() => {
        // process.stdout.write(`saw ${count} documents. Dissmissed ${dissmissed}\n`);
          db.close();
        }, e => process.stdout.write('error', e));
      stream.resume();
    });
  });
}
