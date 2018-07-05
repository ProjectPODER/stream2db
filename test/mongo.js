/* eslint-env mocha */
const should = require('should');
const DBURI = 'localhost/test';
const db = require('monk')(DBURI);
const collection = db.get('testCol', { castIds: false });
const fPath = `${__dirname}/Contratos.csv`;
const execFileSync = require('child_process').execFileSync;

describe('stream to mongodb', () => {
  before(() => {
    const cmdArgs = [
      '--backend',
      'mongo',
      '--db',
      'test',
      '--type',
      'testCol',
      fPath,
    ];

    return execFileSync('./bin/app.js', cmdArgs);

  });

  after(() => (collection.drop()));

  it('should insert 3 documents', done => {

    collection.find({}).then(docs => {
      const count = docs.length;
      const gobs = docs.map(o => (o.GOBIERNO));

      should(count).eql(3);
      should(gobs).eql(['APF', 'APF', 'APF']);
      done();
    });
  });
});
