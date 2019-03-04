const hash = require('object-hash');
const through2 = require('through2');
const etl = require('etl');
const isNull = require('lodash.isnull');
const valueMap = require('./util').valueMap;
const writeLine = require('./util').writeLine;
const DB = require('./db');
const args = require('./args');
const collection = DB.collection;

let skipped = 0;
const skipSeen = through2.obj(function(data, enc, callback) {
  const self = this;

  if (!collection) {
    // short ciruit if collection is not defined
    self.push(data);
    return callback();
  }

  if (args.id !== 'hash') {
    // short circuit if hash is not the id
    self.push(data);
    return callback();
  }

  const body = data.body || data;
  const cnetHash = data.hash ? data.hash : hash(body);

  // if we don't find this hash in the db
  // push the data down the wire
  // otherwise increment skipped and continue

  collection.count().then(count => {
    writeLine(`Collection Size: ${count}, Skipped this run: ${skipped}`);
    collection
      .findOne({ "_id": cnetHash })
      .then(doc => {
          console.log(doc, isNull(doc), typeof cnetHash);
        if (isNull(doc)) {
          self.push(data);
        } else {
          skipped++;
        }
        return callback();
      })
      .catch(err => {
        throw err;
      });
  });
  return null;
});

function mainStream(stream) {
  const cmd = DB.cmd;

  return stream
    .pipe(skipSeen)
    .pipe(
      etl.map(data => {
        const body = data.body ? valueMap(data.body) : valueMap(data);

        if (args.hasOwnProperty('id') && args.id === 'hash') {
          const cnetHash = data.hash ? data.hash : hash(body);

          return Object.assign(body, {
            _id: cnetHash,
          });
        }
        else if (args.hasOwnProperty('id')) {
          return Object.assign(body, {
            _id: data[args.id],
          });
        }
        return body;
      })
    )
    .pipe(
      etl.map(data => {
        if (args.converter) {
          const converter = require(`../converters/${args.converter}`);
          const release = converter(data);

          return release;
        }
        return data;
      })
    )
    .pipe(etl.collect(100))
    .pipe(cmd);
}

module.exports = mainStream;
