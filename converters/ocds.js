const Release = require('cnet2ocds');

// export a function that will transform your document

module.exports = function(doc) {
  return new Release({ cnetDocument: doc.body }).release;
};
