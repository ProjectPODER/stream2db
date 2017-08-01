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

function createIndex(client, args) {
  const INDEX = args.db;

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

function elasticReady(db, args) {
  return new Promise((resolve, reject) => {
    db.ping({
      requestTimeout: 30000,
    }).then(() => {
      resolve(db);
      process.stdout.write('contacted elasticsearch\n');
      return createIndex(db, args);
    }).catch(error => {
      reject(error);
    });

    // do something asynchronous which eventually calls either:
    //
    //   resolve(someValue); // fulfilled
    // or
    //   reject("failure reason"); // rejected
  });
}


function getDB(args) {
  let db;

  switch (args.backend) {
    case 'mongo': {
      if (!args.hasOwnProperty('port')) {
        args.port = 27017;
      }
      db = require('monk')(`${args.host}:${args.port}/${args.db}`);
      if (args.hasOwnProperty('verbose')) {
        db.addMiddleware(require('monk-middleware-debug'));
      }

      db.then(() => {
        process.stdout.write('contacted mongodb\n');
      }).catch(error => {
        throw error;
      });
      break;
    }
    default: {
      const elasticsearch = require('elasticsearch');

      if (!args.hasOwnProperty('port')) {
        args.port = 9200;
      }

      const config = {
        host: `${args.host}:${args.port}`,
      };

      if (args.hasOwnProperty('verbose')) {
        config.log = 'trace';
      }
      const tdb = new elasticsearch.Client(config);

      db = elasticReady(tdb, args);

      break;
    }
  }
  return db;
}

module.exports = getDB;
