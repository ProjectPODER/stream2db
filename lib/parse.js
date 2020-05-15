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
let hashCache = [];
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
  const bodyHash = data.hash ? data.hash : hash(body, { excludeKeys: function(key) {
        if ( key === 'sourceRun' || key === 'date' ) {
          return true;
        }
        return false;
      }
    });

  // if we don't find this hash in the db
  // push the data down the wire
  // otherwise increment skipped and continue
  // collection.count().then(count => {
    // writeLine(`Collection Size: ${count}, Skipped this run: ${skipped}`);
    collection
      .findOne({ "_id": bodyHash })
      .then(doc => {
        // console.log(isNull(doc), cnetHash);
        if (isNull(doc) && hashCache[bodyHash] === undefined) {
            hashCache[bodyHash] = 1;
          self.push(data);
          processedRecords++;
        } else {
          skipped++;
          skippedRecords++;
        }
        return callback();
      })
      .catch(err => {
        throw err;
      });
  // });
  return null;
});

function mainStream(stream) {
  const cmd = DB.cmd;

  return stream
    .pipe(skipSeen)
    .pipe(
      etl.map(data => {
        const oldbody = data.body || data;
        const bodyHash = data.hash ? data.hash : hash(oldbody, { excludeKeys: function(key) {
              if ( key === 'sourceRun' || key === 'date' ) {
                return true;
              }
              return false;
            }
          });

        const body = data.body ? valueMap(data.body) : valueMap(data);

        if (args.hasOwnProperty('id') && args.id === 'hash') {
          return Object.assign(body, {
            _id: bodyHash,
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
