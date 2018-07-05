#!/usr/bin/env node
/* eslint no-console: ["error", { allow: ["time", "timeEnd"] }] */
/* eslint no-process-exit: 0*/
const DBURI = process.env.MONGODB_URI;
const db = require('monk')(DBURI);
const Release = require('cnet2ocds');
const compranet = db.get('compranet', {
  castIds: false,
});
const ocds = db.get('ocds', {
  castIds: false,
});
const ProgressBar = require('progress');

const indexes = Promise.all([
  compranet.createIndex('NUMERO_PROCEDIMIENTO'),
  ocds.createIndex('ocid'),
]);

function nP2Ocid(string) {
  // NUMERO_PROCEDIMIENTO to OCID
  return `OCDS-0UD2Q6-${string}`;
}

function ocdsUpdater(first, last) {
  // FIXME other info may be available in some docs but
  // not others. for example `buyer` object
  return {
    $addToSet: {
      source: { $each: last.source },
      parties: { $each: last.parties },
      awards: { $each: last.awards },
      contracts: { $each: last.contracts },
    },
  };
}

function removeDataFromCnetDocument(doc) {
  // remove all data execept the _id/hash
  // forcing future updates to skip duplicates
  return compranet.update({
    _id: doc._id,
    // filter buy NUMERO_PROCEDIMIENTO so that if the document
    // is already just a hash we don't dont touch it anymore
    NUMERO_PROCEDIMIENTO: doc.NUMERO_PROCEDIMIENTO,
  }, { _id: doc._id });
}

db.then(() => (indexes)).then(() => {
  process.stdout.write('indexes built\n');
  return compranet.count({
    NUMERO_PROCEDIMIENTO: { $exists: true, $ne: null },
  });
}).then(docCount => {
  process.stdout.write(`${docCount} Documents\n`);
  if (docCount < 1) {
    process.stdout.write('Nothing to do. Exiting...\n');
    db.close();
    process.exit(0);
  }
  const bar = new ProgressBar('[:bar] :percent :etas', {
    total: docCount,
  });

  console.time('duration');

  return compranet.find({
    NUMERO_PROCEDIMIENTO: { $exists: true, $ne: null },
  }).each(doc => {
    const release = new Release({ cnetDocument: doc }).release;
    const OCID = nP2Ocid(doc.NUMERO_PROCEDIMIENTO);

    ocds.findOne({ ocid: OCID })
      .then(ocdsDoc => {
        bar.tick();
        if (ocdsDoc && ocdsDoc.ocid) {
          // if PROCESS already exists, modify it
          const modifier = ocdsUpdater(ocdsDoc, release);

          return ocds.update({ ocid: OCID }, modifier)
            .then(() => {
              removeDataFromCnetDocument(doc)
                .then(() => {
                  --docCount;
                  if (docCount === 0) {
                    console.timeEnd('duration');
                    db.close();
                  }
                });

            });
        }
        // if new process, insert
        return ocds.insert(release).then(() => {
          // remove all data execept the _id/hash
          // forcing future updates to skip duplicates
          removeDataFromCnetDocument(doc)
            .then(() => {
              --docCount;
              if (docCount === 0) {
                console.timeEnd('duration');
                db.close();
              }
            });
        });
      });
  });
});
