const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const timestamp = new Date().getTime();
const url = require('url');

const DEFAULT_INDEX = `poder-compranet-${timestamp}`;
const DEFAULT_TYPE = '_doc';

const optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'uris', type: String, multiple: true, defaultOption: true },
  { name: 'bools', type: String, multiple: true },
  { name: 'backend', alias: 'b', type: String, defaultValue: 'elastic' },
  { name: 'db', alias: 'd', type: String, defaultValue: DEFAULT_INDEX },
  { name: 'type', alias: 't', type: String, defaultValue: DEFAULT_TYPE },
  { name: 'host', alias: 'H', type: String, defaultValue: 'localhost' },
  { name: 'port', alias: 'p', type: String },
  { name: 'id', alias: 'i', type: String }
];

const args = commandLineArgs(optionDefinitions);

if (process.env.hasOwnProperty('MONGODB_URI')) {
  const p = url.parse(process.env.MONGODB_URI);

  Object.assign(args, p);
}

const sections = [
  {
    header: 'stream2db',
    content: 'Redirect a data source to database',
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'backend',
        typeLabel: '[underline]{DATA BACKEND}',
        description: 'Backend to save data to. [mongo|elastic]',
      },
      {
        name: 'db',
        typeLabel: '[underline]{INDEX|DB}',
        description: 'Name of the index (elastic) or database (mongo) where data is written.',
      },
      {
        name: 'type',
        typeLabel: '[underline]{TYPE|COLLECTION}',
        description: 'Mapping type (elastic) or collection (mongo).',
      },
      {
        name: 'id',
        typeLabel: '[underline]{ID}',
        description: 'Specify a field to be used as _id. If [underline]{hash} is specified the [underline]{object hash} will be used',
      },
      {
        name: 'uris',
        typeLabel: '[underline]{URIS}',
        description: 'Space seperated list of urls to stream',
      },
      {
        name: 'host',
        typeLabel: '[underline]{HOST}',
        description: 'Host to stream to. Default is [underline]{localhost}',
      },
      {
        name: 'port',
        typeLabel: '[underline]{PORT}',
        description: 'Port to stream to. Defaults to [underline]{9500} (elastic) or [underline]{27017} (mongo)',
      },
      {
        name: 'help',
        description: 'Print this usage guide.',
      },
    ],
  },
];

if (args.help) {
  process.stdout.write(getUsage(sections));
}

module.exports = args;
