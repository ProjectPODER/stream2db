const hash = require('object-hash');
const filter = require('through2-filter').obj;
const etl = require('etl');
const valueMap = require('./util').valueMap;
const seenHashes = [];

// let count = 0;
// let dissmissed = 0;

function configureBackend(args, db) {
  const insertOptions = {
    concurrency: 10,
    pushResults: true,
  };

  if (args.backend === 'mongo') {
    const collection = db.get(args.type, { castIds: false });

    return etl.mongo.insert(collection, insertOptions);
  }
  return etl.elastic.index(db, args.db, args.type, insertOptions);
}

const skipSeen = filter(function(data) {
  const body = data.body || data;
  const objectHash = hash(body);
  const seenIndex = seenHashes.indexOf(objectHash);

  if (seenIndex < 0) {
    // new document: index it!
    seenHashes.push(objectHash);
    this.push(body);
  } else {
    // dissmissed += 1;
    process.stdout.write(`we've seen ${seenHashes[seenIndex]} before\n`);
  }
});

function mainStream(stream, args, db) {
  const cmd = configureBackend(args, db);

  return stream
    .on('error', error => {
      throw error;
    })
    .pipe(skipSeen)
    .on('error', error => {
      throw error;
    })
    .pipe(etl.map(data => {
      const doc = valueMap(data);

      // new Objects will be inserted
      // recurring Objectss will overwrite previous
      // with same _id
      if (args.hasOwnProperty('id') && args.id === 'hash') {
        return Object.assign(doc, {
          _id: data.hash,
        });
      }
      if (args.hasOwnProperty('id')) {
        return Object.assign(doc, {
          _id: data[args.id],
        });
      }
      return doc;
    }))
    .on('error', error => {
      throw error;
    })
    .pipe(etl.collect(250))
    .on('error', error => {
      throw error;
    })
    .pipe(cmd)
    .on('error', error => {
      throw error;
    });
}

module.exports = mainStream;
