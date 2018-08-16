const mapValues = require('lodash.mapvalues');
const normalize = require('normalize-space');
const sizeOf = require('object-sizeof');
const readline = require('readline');

// Returns if a value is a string
function isString (value) {
    return typeof value === 'string' || value instanceof String;
}

// Returns if a value is an array
function isArray (value) {
    return value && typeof value === 'object' && value.constructor === Array;
}

// Returns if a value is an object
function isObject (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

function valueMap(data) {
    // console.log('x ', data);
  return mapValues(data, v => {
    const n = +v;

    if (n) {
        // console.log('n ', v);
      return n;
    }
    if (v) {
      if(isString(v)) {
          // console.log('string ', v);
          return normalize(v.trim());
      }
      if(isArray(v)) {
          // console.log('array ', v);
          var tempArray = [];
          for( var i = 0, len = v.length; i < len; i++ ) {
              tempArray.push( valueMap(v[i]) );
          }
          return tempArray;
      }
      if(isObject(v)) {
          // console.log('object ', v);
          return valueMap(v);
      }
      // console.log('v ', v);
      return normalize(v.trim());
    }
    // console.log('nada', v);
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
