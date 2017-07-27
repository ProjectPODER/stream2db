const args = require('./lib/args');
const main = require('./lib/parse');

args.sources.forEach(stream => {
  main(stream);
});
