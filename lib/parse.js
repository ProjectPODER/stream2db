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
  const cnetHash = (data.hash) ? data.hash : hash(body);

  collection.count().then(count => {
    writeLine(`Collection Size: ${count}, Skipped this run: ${skipped}`);
    collection.findOne({ _id: cnetHash }).then(doc => {
      if (isNull(doc)) {
        self.push(data);
      } else {
        skipped++;
      }
      return callback();
    }).catch(err => {
      throw err;
    });
  });
  return null;
});

function mainStream(stream) {
  const cmd = DB.cmd;

  // be kind to compute units
  // wait 50ms bettween data events
  stream.on('data', () => {
    stream.pause();
    setTimeout(() => {
      stream.resume();
    }, 50);
  });

  return stream
    .pipe(skipSeen)
    .pipe(
      etl.map(data => {
        const body = data.body ? valueMap(data.body) : valueMap(data);

        if (args.hasOwnProperty('id') && args.id === 'hash') {
          const cnetHash = data.hash;

          return Object.assign(body, {
            _id: cnetHash,
          });
        }
        if (args.hasOwnProperty('id')) {
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
    .pipe(cmd);
}

module.exports = mainStream;
