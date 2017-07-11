const request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , reduce = require("stream-reduce")
  , mapValues = require('lodash.mapvalues')
  , keys = require('lodash.keys')
  , elasticsearch = require('elasticsearch')
  , client = new elasticsearch.Client({
   host: 'localhost:9200',
   log: 'trace',
 });

const docCount = 0;
const timestamp = new Date().getTime();

const URL = 'https://excel2json.herokuapp.com/https://compranetinfo.funcionpublica.gob.mx/descargas/cnet/Contratos2013.zip';

const ping = client.ping({
  requestTimeout: 30000,
});

const propertiesMapDefault = {
    "IMPORTE_CONTRATO": { "type": "float" },
}

function coerce(field, value) {
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

function updateMapping(propertiesMap, object) {
  return mapValues(object, (v, k, o) => {
    if (!(k in propertiesMap)) {
      const esType = coerce(k, v);
      propertiesMap[k] = esType;
    }
  });
}

function createIndex() {
  return client.indices.exists({
    index: 'poder-compranet',
  }).then((exists) => {
    if (!exists) {
      return client.indices.create({
        index: index,
      });
    }
  })
}

function addDocumentToIndex(doc) {
  return client.index({
    index: 'poder-compranet',
    type: 'compranet',
    body: doc,
  })
}

function getMapping() {
  return client.indices.getMapping({
    index: 'poder-compranet',
    type: 'compranet',
  });
}

function putMapping(mapping) {
  return client.indices.putMapping({
    index: 'poder-compranet',
    type: 'compranet',
    body: mapping
  });
}

function main(mapping) {
  request({ url: URL })
    .pipe(JSONStream.parse())
    .pipe(reduce((acc, data) => {
      addDocumentToIndex(data);
      if (keys(data).length > keys(acc).length) {
        return updateMapping(acc, data);
      }
    }, mapping)).on('data', (pMap) => {
      console.log(pMap);
      putMapping(pMap);
    });
}


process.stdin.pipe(reduce(function(acc, data) {
  return acc + data.length;
}, 0)).on("data", function(length) {
  console.log("stdin size:", length);
});

ping.then(() => {
  console.log('Contacted elasticsearch');
  getMapping().then((mapping) => {
    console.log(mapping)
    createIndex().then((result) =>{
      main(mapping);
    })
  })
}, (error) => {
  console.trace(error.message);
});
