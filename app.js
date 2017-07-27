const args = require('./lib/args');

if (args.sources) {
  const main = require('./lib/parse');

  args.sources.forEach(stream => {
    main(stream);
  });
}
