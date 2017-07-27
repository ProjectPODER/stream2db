const hash = require('object-hash');
const through = require('through');
const etl = require('etl');
const args = require('./args');
const db = require('./db');
const valueMap = require('./util').valueMap;
const seenHashes = [];

let count = 0;
let dissmissed = 0;
let cmd;

const insertOptions = {
  concurrency: 10,
  pushResults: true,
};
// cast ids if we don't have an id field
const castIds = (!args.id);

if (args.backend === 'mongo') {
  const collection = db.get('compranet', { castIds });

  cmd = etl.mongo.insert(collection, insertOptions);
} else {
  cmd = etl.elastic.index(db, args.db, 'compranet', insertOptions);
}
const throughStdFormat = through(function write(data) {
  // check for document corruption
  count += 1;
  const networkHash = data.hash;
  const body = data.body || data;
  const objectHash = hash(body);

  body.hash = objectHash;

  if (networkHash && networkHash !== objectHash) {
    throw new Error('currupted document');
  }
  // filter out empty documents and
  if (body) {
    const i = seenHashes.indexOf(objectHash);

    if (i < 0) {
      // new document: index it!
      seenHashes.push(objectHash);
      this.queue(body);
    } else {
      dissmissed += 1;
      process.stdout.write(`we've seen ${seenHashes[i]} before`);
    }
  }

  function end() {
    this.emit('end');
  }

});

function main(stream) {
  stream.on('error', error => {
    throw error;
  })
    .pipe(throughStdFormat)
    .on('error', error => {
      throw error;
    })
    .pipe(etl.map(data => {
      const doc = valueMap(data);

      // new Objects will be inserted
      // recurring Objectss will overwrite previous
      // with same _id
      if (args.id) {
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
    .pipe(cmd)
    .on('error', error => {
      process.stdout.write(error);
    })
    .promise()
    .then(() => {
      process.stdout.write(`saw ${count} documents. Dissmissed ${dissmissed}`);
    }, e => process.stdout.write('error', e));
}

module.exports = main;
