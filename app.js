const request = require('request')
  , JSONStream = require('JSONStream')
  , mapValues = require('lodash.mapvalues')
  , keys = require('lodash.keys')
  , assign = require('lodash.assign')
  , elasticsearch = require('elasticsearch')
  , hash = require('object-hash')
  , etl = require('etl')
  , client = new elasticsearch.Client({
      host: 'localhost:9200',
    //  log: 'trace',
 });

const INDEX = 'poder-compranet';
// const PROXY_URL = 'http://localhost:9000';
const PROXY_URL = 'https://excel2json.herokuapp.com';
const timestamp = new Date().getTime();
const SOURCES = process.argv.slice(2).map((e) => {
  return `${PROXY_URL}/${e}`;
});

const KNOWN_BOOLS = [
  'CONVENIO_MODIFICATORIO',
  'CONTRATO_MARCO',
  'COMPRA_CONSOLIDADA',
  'PLURIANUAL',
];

const ping = client.ping({
  requestTimeout: 30000,
});

const propertiesMap = {
  IMPORTE_CONTRATO: { type : "float" },
  CONVENIO_MODIFICATORIO: {type: 'boolean'},
  CONTRATO_MARCO: {type: 'boolean'},
  COMPRA_CONSOLIDADA: {type: 'boolean'},
  PLURIANUAL: {type: 'boolean'},
  FECHA_FIN: { type: 'date'},
  FECHA_INICIO: { type: 'date'},
  FECHA_APERTURA_PROPOSICIONES: { type: 'date'},
  FECHA_CELEBRACION: { type: 'date'},
  timestamp: { type : "date", format: "epoch_millis" },
}

function createIndex() {
  // if exists return mapping
  // else create
  return client.indices.exists({
    index: INDEX,
  }).then((exists) => {
    if (exists) {
      return client.indices.getMapping({
        index: INDEX,
        type: 'compranet',
      });
    }
    return client.indices.create({
      index: 'poder-compranet',
      body: {
        mappings: {
          compranet: {
            properties: propertiesMap,
          }
        }
      }
    });
  });
}

function valueMap(data) {
  return mapValues(data, (v,k,o) => {
   if (KNOWN_BOOLS.indexOf(k) > -1) {
     if (v == 0) {
       return false
     }
     if (v == 1) {
       return true
     }
   }
   return v;
 });
}

const seen = [];
function web2es(mapping, url) {
  request
    .get({ url })
    .on('error', (error) => {
      throw error
    })
    .pipe(JSONStream.parse())
    .pipe(etl.map(data => {
      // check for document corruption
      if (data.hash !== hash(data.body)) {
        throw new Error('currupted document')
      }
      if (data.body.CODIGO_CONTRATO) {
        // throw away contracts w/ no code
        if (seen.indexOf(data.body.CODIGO_CONTRATO) > -1) {
          console.log(seen);
          console.log(data.body);
          throw new Error('duplicate contract code');
        } else {
          seen.push(data.body.CODIGO_CONTRATO);
        }

        const doc = valueMap(data.body);
        // using CODIGO_CONTRATO as id
        // new CCs will be inserted
        // recurring CCs will overwrite previous
        return Object.assign(doc, {
          _id: data.body.CODIGO_CONTRATO,
          hash: data.hash,
        });
      }
    }))
    .on('error', (error) => {
      throw error
    })
    .pipe(etl.collect(100))
    .pipe(etl.elastic.index(client, INDEX, 'compranet', {
        pushResults: true,
    }))
    .pipe(process.stdout)
}

ping.then(() => {
  console.log('Contacted elasticsearch');
  createIndex().then((mapping) => {
    let properties = {};
    SOURCES.forEach((url) => {
      web2es(properties, url);
    });
  })
}, (error) => {
  console.trace(error.message);
});
