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

if (args.db === 'mongo') {
  const collection = db.get('compranet', {castIds: false});
  cmd = etl.mongo.insert(collection)
} else {
  cmd = etl.elastic.index(db, args.db, 'compranet')
}

const seenContractCodes = [];
const seenHashes = [];
let countAll = 0;
let countIndexed = 0;

const ts = through(function write(data) {
  // check for document corruption
  if (data.hash !== hash(data.body)) {
    throw new Error('currupted document')
  }

  // throw away contracts w/ out code
  if (data.body.CODIGO_CONTRATO) {
    countIndexed += 1;

    const ci = seenContractCodes.indexOf(data.body.CODIGO_CONTRATO);
    const hi = seenHashes.indexOf(data.hash);
    const isIdenticalRow = (ci === hi);
    if (ci > -1) {
      console.log(`we've seen ${seenContractCodes[ci]} before`)
      if (!isIdenticalRow) {
        throw new Error('duplicate contract code');
      }
    } else {

      seenContractCodes.push(data.body.CODIGO_CONTRATO);
      seenHashes.push(data.hash);
      // seenHashes.push(data.hash);
      this.queue(data);
    }
  }
      //this.pause()
  },
  function end () { //optional
    this.emit('end')
});

function web2es(url) {
  request
    .get({ url })
    .on('error', (error) => {
      throw error
    })
    .pipe(JSONStream.parse())
    .pipe(ts)
    .pipe(etl.map(data => {
      countAll += 1;

        const doc = valueMap(data.body);
        // using CODIGO_CONTRATO as id
        // new CCs will be inserted
        // recurring CCs will overwrite previous
        return Object.assign(doc, {
          _id: data.body.CODIGO_CONTRATO,
          hash: data.hash,
        });

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
      console.log(results);
      console.log(`indexed ${countIndexed} documents of ${countAll}`);
    }, e => console.log('error',e));
}

args.uris.forEach((url) => {
  web2es(url)// ;
});
