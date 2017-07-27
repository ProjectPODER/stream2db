const args = require('./args');
const INDEX = args.db;
let db;

const propertiesMap = {
  IMPORTE_CONTRATO: { type: 'float' },
  CONVENIO_MODIFICATORIO: { type: 'boolean' },
  CONTRATO_MARCO: { type: 'boolean' },
  COMPRA_CONSOLIDADA: { type: 'boolean' },
  PLURIANUAL: { type: 'boolean' },
  FECHA_FIN: { type: 'date' },
  FECHA_INICIO: { type: 'date' },
  // FECHA_APERTURA_PROPOSICIONES: { type: 'date', format: 'yyyy-MM-dd HH:mm[:ss]' },
  // FECHA_APERTURA_PROPOSICIONES: { type: 'date' },
  // FECHA_CELEBRACION: { type: 'date', format: 'yyyy-MM-dd HH:mm[:ss]' },
  timestamp: { type: 'date', format: 'epoch_millis' },
};

function createIndex(client) {
  // if exists return mapping
  // else create
  return client.indices.exists({
    index: INDEX,
  }).then(exists => {
    if (exists) {
      return client.indices.getMapping({
        index: INDEX,
        type: args.type,
      });
    }
    return client.indices.create({
      index: INDEX,
      body: {
        mappings: {
          compranet: {
            dynamic_date_formats: ['date_optional_time', 'yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z'],
            properties: propertiesMap,
          },
        },
      },
    });
  });
}

switch (args.backend) {
  case 'mongo': {
    if (!args.port) {
      args.port = 27017;
    }
    db = require('monk')(`${args.host}:${args.port}/${args.db}`);
    db.then(() => {
      process.stdout.write('contacted mongodb');
    });
    break;
  }
  default: {
    const elasticsearch = require('elasticsearch');

    if (!args.port) {
      args.port = 9500;
    }
    db = new elasticsearch.Client({
      host: `${args.host}:${args.port}`,
      //  log: 'trace',
    });
    db.ping({
      requestTimeout: 30000,
    }).then(() => {
      process.stdout.write('contacted elasticsearch');
      return createIndex(db);
    });
    break;
  }
}

module.exports = db;
