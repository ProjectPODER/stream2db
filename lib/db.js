const args = require('./args');
const INDEX = args.db;
let db;

const propertiesMap = {
  IMPORTE_CONTRATO: { type : "float" },
  CONVENIO_MODIFICATORIO: {type: 'boolean'},
  CONTRATO_MARCO: {type: 'boolean'},
  COMPRA_CONSOLIDADA: {type: 'boolean'},
  PLURIANUAL: {type: 'boolean'},
  FECHA_FIN: { type: 'date' },
  FECHA_INICIO: { type: 'date'},
  // FECHA_APERTURA_PROPOSICIONES: { type: 'date', format: 'yyyy-MM-dd HH:mm[:ss]' },
  // FECHA_APERTURA_PROPOSICIONES: { type: 'date' },
  // FECHA_CELEBRACION: { type: 'date', format: 'yyyy-MM-dd HH:mm[:ss]' },
  timestamp: { type : "date", format: "epoch_millis" },
}

function createIndex(client) {
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
      index: INDEX,
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

switch (args.db) {
  case 'mongo':
    db = require('monk')(`localhost/compranet`);
    db.then(function(db) {
      console.log('contacted mongodb');
    });

    break;
  default:
    const elasticsearch = require('elasticsearch');
    db = new elasticsearch.Client({
        host: 'localhost:9200',
        //  log: 'trace',
      });
    db.ping({
        requestTimeout: 30000,
    }).then(() => {
      console.log('contacted elasticsearch');
      return createIndex(db)
    });
    break;
}

module.exports = db;
