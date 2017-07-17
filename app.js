const request = require('request')
  , JSONStream = require('JSONStream')
  , mapValues = require('lodash.mapvalues')
  , keys = require('lodash.keys')
  , hash = require('object-hash')
  , etl = require('etl');

const args = require('./lib/args');
const db = require('./lib/db');
const SOURCES = args.sources;

let cmd;

if (args.db === 'mongo') {
  const collection = db.get('compranet', {castIds: false});
  cmd = etl.mongo.insert(collection)
} else {
  cmd = etl.elastic.index(db, args.db, 'compranet')
}

const KNOWN_BOOLS = [
  'CONVENIO_MODIFICATORIO',
  'CONTRATO_MARCO',
  'COMPRA_CONSOLIDADA',
  'PLURIANUAL',
];

function valueMap(data) {
  return mapValues(data, (v,k,o) => {
    if (/FECHA/.test(k)) {
     return v.replace("GMT", "").trim();
    }
    if (KNOWN_BOOLS.indexOf(k) > -1) {
      if (v == 0) {
        return false;
      }
      if (v == 1) {
        return true;
      }
    }
    return v;
  });
}

const seenContractCodes = [];
const seenHashes = [];
let countAll = 0;
let countIndexed = 0;
function web2es(url) {
  request
    .get({ url })
    .on('error', (error) => {
      throw error
    })
    .pipe(JSONStream.parse())
    .pipe(etl.map(data => {
      console.log(countIndexed);
      countAll += 1;
      // check for document corruption
      if (data.hash !== hash(data.body)) {
        throw new Error('currupted document')
      }
      if (data.body.CODIGO_CONTRATO) {
        countIndexed += 1;
        // throw away contracts w/ no code

        const ci = seenContractCodes.indexOf(data.body.CODIGO_CONTRATO);
        const hi = seenHashes.indexOf(data.hash);
        const isIdenticalRow = (ci === hi);
        if (ci > -1) {
          console.log(`we've seen this code before`)
          console.log(seenContractCodes[ci]);
          console.log(seenHashes[hi]);
          console.log(data.hash);
          if (!isIdenticalRow) {
            throw new Error('duplicate contract code');
          }
        }

        const doc = valueMap(data.body);
        // using CODIGO_CONTRATO as id
        // new CCs will be inserted
        // recurring CCs will overwrite previous
        return Object.assign(doc, {
          _id: data.body.CODIGO_CONTRATO,
          hash: data.hash,
        });

        seenContractCodes[countAll] = data.body.CODIGO_CONTRATO;
        // seenContractCodes.push(data.body.CODIGO_CONTRATO);
        seenHashes[countAll] = data.hash;
        // seenHashes.push(data.hash);
      }
    }))
    .on('error', (error) => {
      throw error
    })
    .pipe(etl.collect(100))
    .pipe(cmd)
    .on('error', (error) => {
      throw error
    })
    .promise()
    .then((results) => {
      console.log(results);
      console.log(`indexed ${countIndexed} documents of ${countAll}`);
    }, e => console.log('error',e));
    // .pipe(process.stdout)
}

//createIndex().then((mapping) => {
//  let properties = {};
  SOURCES.forEach((url) => {
    web2es(url)// ;
  });
// })
