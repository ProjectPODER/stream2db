const fs = require('fs');
const JSONStream = require('JSONStream');

module.exports = function() {
    process.stdin.setEncoding('utf8');
    
    const dataStream = process.stdin
        .pipe(JSONStream.parse())

    dataStream.on('error', error => {
        process.stderr.write('streaming error: ');
        process.stderr.write(`${error.message}\n`);
    });
    dataStream.pause();
    return dataStream;
};
