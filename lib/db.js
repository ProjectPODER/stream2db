const etl = require('etl');
const args = require('../lib/args');

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

function elasticReady(db) {
  return new Promise((resolve, reject) => {
    db.ping({
      requestTimeout: 30000,
    }).then(() => {
      resolve(db);
      return createIndex(db, args);
    }).catch(error => {
      reject(error);
    });
  });
}

function setMongo(options) {
  let { port } = options;
  const {
    db: dbString,
    host,
    verbose,
  } = options;

  if (!port) {
    port = 27017;
  }
  let DBURI = `${host}:${port}/${dbString}`;

  if (process.env.hasOwnProperty('MONGODB_URI')) {
    DBURI = process.env.MONGODB_URI;
  }

  if (args.verbose) {
    console.log("setMongo",DBURI)
  }

  const db = require('monk')(DBURI);

  if (verbose) {
    db.addMiddleware(require('monk-middleware-debug'));
  }

  return {
    client: db,
    ready: db,
  };
}

function setElastic(options) {
  let { port } = options;
  const {
    host,
    verbose,
  } = options;

  const elasticsearch = require('elasticsearch');

  if (!port) {
    port = 9200;
  }

  const config = {
    host: `${host}:${port}`,
  };

  if (verbose) {
    config.log = 'trace';
  }
  const db = new elasticsearch.Client(config);

  return {
    ready: elasticReady(db, options),
    client: db,
  };
}

function getDB(options) {
  const { backend } = options;

  switch (backend) {
    case 'mongo': {
      return setMongo(options);
    }
    default: {
      return setElastic(options);
    }
  }
}

class DB {
  constructor(options) {
    const { backend, type, db, href } = options;
    const { ready, client } = getDB(options);

    this.backend = backend;
    this.type = type;
    this.dbName = db;
    this.uri = href;
    this.ready = ready;
    this.db = client;
    if (backend === 'mongo') {
      this.collection = this.db.get(type, { castIds: false });
    }
  }

  get cmd() {
    const insertOptions = {
      concurrency: 20,
      pushResults: true
    };

    if (this.backend === 'mongo') {
      return etl.mongo.insert(this.collection, insertOptions);
    }

    Object.assign(insertOptions, { apiVersion: '5.6' });
    return etl.elastic.index(this.db, this.dbName, this.type, insertOptions);
  }
}

module.exports = new DB(args);
