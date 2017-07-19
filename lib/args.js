const fs = require('fs');
const request = require('request');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const isUri = require('valid-url').isUri;
const timestamp = new Date().getTime();
const JSONStream = require('JSONStream');
const etl = require('etl');

const DEFAULT_INDEX = `poder-compranet-${timestamp}`;

const optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'uris', type: String, multiple: true, defaultOption: true },
  { name: 'bools', type: String, multiple: true },
  { name: 'backend', alias: 'b', type: String, defaultValue: 'elastic' },
  { name: 'db', alias: 'd', type: String, defaultValue: DEFAULT_INDEX },
  { name: 'id', alias: 'i', type: String },
]

const args = commandLineArgs(optionDefinitions);
let sources;
if (args.uris) {
  sources = args.uris.filter((uri) => {
    if (isUri(uri)) {
      return uri
    }
    if (fs.existsSync(uri)) {
      return uri
    }
  });
  args.sources = sources.map((uri) => {
    if (isUri(uri)) {
      return request.get({ uri })
        .pipe(JSONStream.parse())
    }
    if (fs.existsSync(uri) && /csv/i.test(uri.split('.').pop())) {
      return etl.file(uri)
      .pipe(etl.csv())
      // return csv.fromPath(uri, {
      //   headers: true,
      //   trim: true,
      // });
    }
  })
}


const sections = [
  {
    header: 'stream2db',
    content: 'Redirect a data source to database'
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'backend',
        typeLabel: '[underline]{DB}',
        description: 'Backend to save data to. [mongo|elastic]'
      },
      {
        name: 'db',
        typeLabel: '[underline]{INDEX}',
        description: 'Name of the database where data is written.'
      },
      {
        name: 'id',
        typeLabel: '[underline]{ID}',
        description: 'Supply a field to be used as _id field.'
      },
      {
        name: 'uris',
        typeLabel: '[underline]{URIS}',
        description: 'Space seperated list of urls to stream'
      },
      {
        name: 'help',
        description: 'Print this usage guide.'
      }
    ]
  }
]

if (args.help) {
  console.log(getUsage(sections));
  process.exit();
}

module.exports = args;
