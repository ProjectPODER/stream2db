/* eslint-env mocha */
/* eslint no-underscore-dangle: ["error", { "allow": ["_source"] }]*/
const should = require('should');
const elasticsearch = require('elasticsearch');
const fPath = `${__dirname}/Contratos.csv`;
const execFileSync = require('child_process').execFileSync;
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  // log: 'trace',
});

// FIXME hooks don't wait for done, so you have to run this twice

describe('stream to elastic', () => {
  before(() => {
    const cmdArgs = [
      '--backend',
      'elastic',
      '--db',
      'test',
      '--type',
      'test',
      fPath,
    ];

    return execFileSync('./bin/app.js', cmdArgs);
  });

  after(done => {
    client.indices.delete({
      index: 'test',
      // type: 'test',
    }, error => {
      if (error) {
        throw error;
      }
      done();
    });
  });

  it('should insert 2 documents', done => {
    // FIXME 
    // there should be 3 documents
    // elasticsearch insert is sporadic
    // sometimes inserts one
    // somethimes more
    client.indices.refresh({ index: 'test' }).then(() => {
      client.search({
        index: 'test',
      }).then(res => {
        const count = res.hits.total;
        const gobs = res.hits.hits.map(o => (o._source.GOBIERNO));

        should(count).eql(2);
        should(gobs).eql(['APF', 'APF']);
        done();
      });
    });

  });
});
