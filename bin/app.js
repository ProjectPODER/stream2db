#!/usr/bin/env node
/* eslint no-console: ["error", { allow: ["time", "timeEnd"] }] */
const args = require('../lib/args');
const getSources = require('../lib/sources');
const getStdin = require('../lib/stdin');
const { ready, db } = require('../lib/db');
const JSONStream = require('JSONStream');

global.skippedRecords = 0;
global.processedRecords = 0;

const mainStream = require('../lib/parse');

// FIXME first try internet and error out if no connection
if (args.uris) {
  const sources = getSources(args.uris);

  ready.then(() => {
    const { backend, db: dbString, type } = args;
    const infoString = `contacted ${backend}, ${dbString}, ${type}\n`;

    process.stdout.write(infoString);
    // FIXME should we create a lock file first?

    sources.forEach(stream => {
      console.time('duration');
      mainStream(stream)
        .promise()
        .then(() => {
          db.close();
          process.stdout.write(' ');
          console.timeEnd('duration');
        }, e => process.stdout.write('error', e));
      stream.resume();
    });
  }).catch(error => {
    throw error;
    process.exit(1);
  });
}
else {
    const dataStream = getStdin();

    ready.then(() => {
        const { backend, db: dbString, type } = args;
        const infoString = `contacted: ${backend}, ${dbString}, ${type}\n`;

        process.stdout.write(infoString);
        console.time('duration');
        mainStream(dataStream)
          .promise()
          .then((e) => {
            if(e.length > 0) { e[0].map(item => { console.log(item) }) }
            db.close();
            // Log important information
            console.log('skipped:', skippedRecords);
            console.log('processed:', processedRecords);
            console.timeEnd('duration');
        }, e => {
            process.stdout.write('error in stdin ');
            if(backend == 'elastic') console.error("Error body", e.meta.body.error);
            else console.log(e);
            process.exit(1);
        });
        dataStream.resume();

    }).catch(error => {
        console.log('ERROR', error);
        process.exit(1);
    });
}
