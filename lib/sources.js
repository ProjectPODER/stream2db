const fs = require('fs');
const request = require('requestretry');
const isUri = require('valid-url').isUri;
const JSONStream = require('JSONStream');
const etl = require('etl');

module.exports = function(uris) {
  const sources = uris.filter(uri => {
    if (isUri(uri)) {
      return true;
    }
    if (fs.existsSync(uri)) {
      return true;
    }
    return false;
  });

  return sources.map(uri => {
    if (isUri(uri)) {
      const webStream = request.get({
        uri,
      }).pipe(JSONStream.parse());

      webStream.on('error', error => {
        process.stderr.write('request error: ');
        process.stderr.write(`${error.message}\n`);
      });
      webStream.pause();
      return webStream;
    }
    if (fs.existsSync(uri) && /csv/i.test(uri.split('.').pop())) {
      const fileStream = etl.file(uri).pipe(etl.csv());

      fileStream.on('error', error => {
        throw error;
      });
      fileStream.pause();
      return fileStream;
    }
    return false;
  });
};
