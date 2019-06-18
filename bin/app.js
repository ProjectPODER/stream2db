#!/usr/bin/env node
/* eslint no-console: ["error", { allow: ["time", "timeEnd"] }] */
const args = require('../lib/args');
const getSources = require('../lib/sources');
const getStdin = require('../lib/stdin');
const { ready, db } = require('../lib/db');
const JSONStream = require('JSONStream');

// FIXME first try internet and error out if no connection

if (args.uris) {
  const mainStream = require('../lib/parse');
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
  });
}
else {
    // console.log('tratando de procesar stdin');
    const mainStream = require('../lib/parse');
    const dataStream = getStdin();

    ready.then(() => {
        const { backend, db: dbString, type } = args;
        const infoString = `contacted ${backend}, ${dbString}, ${type}\n`;

        process.stdout.write(infoString);
        console.time('duration');
        mainStream(dataStream)
          .promise()
          .then(() => {
            db.close();
            // process.stdout.write(' ');
            console.timeEnd('duration');
        }, e => { process.stdout.write('error in stdin '); console.log(e); });
        dataStream.resume();

    }).catch(error => {
        throw error;
    });
}
