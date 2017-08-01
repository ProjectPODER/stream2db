/* eslint-env mocha */
const should = require('should');
const shortid = require('shortid');
const etl = require('etl');
const mainStream = require('../lib/parse');
const args = require('../lib/args');
const DBString = `TEST${shortid.generate()}`;
const db = require('monk')(`localhost:27017/${DBString}`);
const fPath = `${__dirname}/Contratos.csv`;
const getDB = require('../lib/db');
const fileStream = etl.file(fPath).pipe(etl.csv());

Object.assign(args, {
  backend: 'mongo',
  uris: [fPath],
  db: DBString,
  type: 'test',
});

const collection = db.get(args.type, { castIds: false });

fileStream.on('error', error => {
  throw error;
});
fileStream.pause();

describe('stream from file to DB', () => {

  before(done => {
    const database = getDB(args);

    database.then(x => {
      mainStream(fileStream, args, x)
        .promise()
        .then(() => {
          done();
        }, e => process.stdout.write('error', e));
    });

  });

  after(done => {
    collection.drop(() => (done()));
  });

  it('should parse and instert 3 documents', done => {
    collection.find({}).then(docs => {
      const count = docs.length;
      const gobs = docs.map(o => (o.GOBIERNO));

      should(count).eql(3);
      should(gobs).eql(['APF', 'APF', 'APF']);
      done();
    });
  });
});
