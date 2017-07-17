const commandLineArgs = require('command-line-args');
const timestamp = new Date().getTime();

const DEFAULT_INDEX = `poder-compranet-${timestamp}`;
// const PROXY_URL = 'http://localhost:9000';
const PROXY_URL = 'https://excel2json.herokuapp.com';

const optionDefinitions = [
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: "uris", type: String, multiple: true, defaultOption: true },
  { name: 'backend', alias: 'b', type: String, defaultValue: 'elastic' },
  { name: 'db', alias: 'd', type: String, defaultValue: DEFAULT_INDEX }
]

const args = commandLineArgs(optionDefinitions)
// const BACKEND_CMD = etl[args.backend];
console.log(args);
args.sources = args.uris.map((e) => (`${PROXY_URL}/${e}`))
module.exports = args;
