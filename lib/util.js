const mapValues = require('lodash.mapvalues');
const normalize = require('normalize-space');

const KNOWN_BOOLS = [
  'CONVENIO_MODIFICATORIO',
  'CONTRATO_MARCO',
  'COMPRA_CONSOLIDADA',
  'PLURIANUAL',
];

function valueMap(data) {
  return mapValues(data, (v,k,o) => {
    const n = +v;
    if (n) {
      return n;
    }
    if (KNOWN_BOOLS.indexOf(k) > -1) {
      // FIXME get the list of known_bools
      // from the comandline
      if (v == 0) {
        return false;
      }
      if (v == 1) {
        return true;
      }
    }
    return normalize(v.trim());
  });
}

module.exports = {
  valueMap,
}
