const request = require('request');
const JSONStream = require('JSONStream');
const keys = require('lodash.keys');
const hash = require('object-hash');
const etl = require('etl');
const through = require('through');
const args = require('./lib/args');
const db = require('./lib/db');
const valueMap = require('./lib/util').valueMap;

let cmd;
let count = 0;
let dissmissed = 0;
const seenHashes = [];
const insertOptions = {
  concurrency: 10,
  pushResults: true,
}
// cast ids if we don't have an id field
const castIds = (!args.id);

if (args.backend === 'mongo') {
  const collection = db.get('compranet', { castIds });
  cmd = etl.mongo.insert(collection, insertOptions)
} else {
  cmd = etl.elastic.index(db, args.db, 'compranet', insertOptions)
}

const throughStdFormat = through(function write(data) {
  // check for document corruption
  count += 1;
  const networkHash = data.hash;
  const idField = args.id;
  const body = data.body || data;
  const objectHash = hash(body);
  body.hash = objectHash;

  if (networkHash && networkHash !== objectHash) {
    throw new Error('currupted document')
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
      console.log(`we've seen ${seenHashes[i]} before`)
    }
  }

  function end () {
    this.emit('end');
  };

});

function web2es(stream) {
    stream.on('error', (error) => {
      throw error
    })
    .pipe(throughStdFormat)
    .on('error', (error) => {
      throw error
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
    .on('error', (error) => {
      throw error
    })
    .pipe(etl.collect(250))
    .pipe(cmd)
    .on('error', (error) => {
      console.log(error)
    })
    .promise()
    .then((results) => {
      console.log(`saw ${count} documents. Dissmissed ${dissmissed}`);
    }, e => console.log('error',e));
}

args.sources.forEach((stream) => {
  web2es(stream);
});
