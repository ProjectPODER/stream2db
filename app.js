const request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , reduce = require("stream-reduce")
  , mapValues = require('lodash.mapvalues')
  , keys = require('lodash.keys')
  , difference = require('lodash.difference')
  , assign = require('lodash.assign')
  , elasticsearch = require('elasticsearch')
  , hash = require('object-hash')
  , client = new elasticsearch.Client({
   host: 'localhost:9200',
   log: 'trace',
 });

const INDEX = 'poder-compranet';
const docCount = 0;
const timestamp = new Date().getTime();

const URL = 'https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip';

const ping = client.ping({
  requestTimeout: 30000,
});

const propertiesMapDefault = {
    "IMPORTE_CONTRATO": { "type": "float" },
}

function mapField(field) {
  if (/FECHA/.test(field)) {
    return {
      type: "date",
    }
  }
  if (/IMPORTE_CONTRATO/.test(field)) {
    return {
      type: "float",
    }
  }
  return {
    type: "string"
  }
}

function createIndex() {
  // if exists return mapping
  // else create index
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
            properties: {
              IMPORTE_CONTRATO: { type : "float" }
            }
          }
        }
      }
    });
  })
}

function addDocumentToIndex(doc) {
  return client.create({
    index: INDEX,
    type: 'compranet',
    id: hash(doc),
    body: doc,
  });
}

function updateMapping(pMap, array) {
  array.forEach((e) => {
    const o = {};
    o[e] = mapField(e);
    assign(pMap, o);
  })
  return pMap;
}

function putMapping(mapping) {
  return client.indices.putMapping({
    index: INDEX,
    type: 'compranet',
    body: mapping
  });
}

function main(mapping) {
  const count = 0;
  request
    .get({ url: URL })
    .on('error', (error) => {
      throw error
    })
    .pipe(JSONStream.parse())
    .pipe(reduce((acc, data) => {
      addDocumentToIndex(data);
      const diff = difference(keys(data), keys(acc));
      if (diff.length > 0) {
        updateMapping(acc, diff);
      }
    }, mapping)).on('data', (pMap) => {
      const diff = (difference(keys(mapping), keys(pMap)));
      if (diff > 1) {
        return putMapping(pMap);
      }
      return true;
    });
}

ping.then(() => {
  console.log('Contacted elasticsearch');
  createIndex().then((mapping) => {
    let properties = {};
    if (mapping['poder-compranet']) {
      // const index = mapping['poder-compranet'];
      // console.log(index);
      properties = mapping['poder-compranet'].mappings.compranet.properties;
    }
    // console.log(properties)
    main(properties);
  })
}, (error) => {
  console.trace(error.message);
});
