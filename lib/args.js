const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const timestamp = new Date().getTime();

const DEFAULT_INDEX = `poder-compranet-${timestamp}`;

const optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean },
  { name: "uris", type: String, multiple: true, defaultOption: true },
  { name: 'backend', alias: 'b', type: String, defaultValue: 'elastic' },
  { name: 'db', alias: 'd', type: String, defaultValue: DEFAULT_INDEX },
]

const args = commandLineArgs(optionDefinitions)
// const BACKEND_CMD = etl[args.backend];



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
const usage = getUsage(sections)

if (args.help) {
  console.log(usage);
  process.exit();
}

module.exports = args;
