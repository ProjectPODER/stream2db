#!/usr/bin/env node
/* eslint no-console: ["error", { allow: ["time", "timeEnd"] }] */
const args = require('../lib/args');
const getSources = require('../lib/sources');
const { ready, db } = require('../lib/db');

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
