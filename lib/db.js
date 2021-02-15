const etl = require('etl');
const args = require('../lib/args');

const propertiesMap = {};

async function createIndex(client) {
    const INDEX = args.db;

    // if exists return mapping
    // else create
    return client.indices.exists({
        index: INDEX,
    }).then(exists => {
        if (exists.body !== false) {
            return client.indices.getMapping({
                index: INDEX
            });
        }

        return client.indices.create({
            "index": INDEX,
            "body": {
                "mappings": {
                    "dynamic_templates": [{
                        "strings_template": {
                            "match_mapping_type": "string",
                            "mapping": {
                                "type": "text",
                                "fields": { "keyword": { "type":  "keyword", "ignore_above": 512 } }
                            }
                        }
                    }]
                }
            }
        });
    });
}

function elasticReady(db) {
    return new Promise((resolve, reject) => {
        db.ping().then(() => {
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
    let {
        host,
        port,
        verbose,
        user,
        pass
    } = options;

    const { Client } = require('@elastic/elasticsearch');

    if(!host) {
        host = 'localhost';
    }
    if (!port) {
        port = 9200;
    }

    let auth = {};
    let protocol = 'http';
    if(user != '' && pass != '') {
        auth = {
            username: user,
            password: pass
        }
        protocol = 'https';
    }

    const config = {
        // node: `http://${host}:${port}`,
        node: protocol + '://' + host + ':' + port,
        ssl: { rejectUnauthorized: false },
        auth: auth
    }
    // if (verbose) {
    //     config.log = 'trace';
    // }
    const db = new Client(config);

    return {
        ready: elasticReady(db, options),
        client: db,
    };
}

function getDB(options) {
    const { backend } = options;

    switch (backend) {
        case 'mongo':
            return setMongo(options);
        case 'elastic':
            return setElastic(options);
        default:
            console.log('ERROR: unsupported backend ' + backend);
            process.exit(1);
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

        // Object.assign(insertOptions, { apiVersion: '7.8' });
        return etl.elastic.bulk('upsert', this.db, this.dbName, this.type, insertOptions);
    }
}

module.exports = new DB(args);
