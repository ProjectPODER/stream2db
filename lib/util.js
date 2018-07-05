const mapValues = require('lodash.mapvalues');
const normalize = require('normalize-space');
const sizeOf = require('object-sizeof');
const readline = require('readline');

function valueMap(data) {
  return mapValues(data, v => {
    const n = +v;

    if (n) {
      return n;
    }
    if (v) {
      return normalize(v.trim());
    }
    return v;
  });
}

function formatBytes(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

function objectSize(object) {
  const size = sizeOf(object);

  return formatBytes(size);
}

function writeLine(p) {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(p);
}

module.exports = {
  valueMap,
  objectSize,
  writeLine,
};
