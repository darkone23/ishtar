var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    ICollection = protocols.ICollection;

extend(Array, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll[0] : nil; },
  rest: function(coll) { return coll.slice(1); },
  cons: function(el, coll) { return [el].concat(coll); }
});

extend(Array, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return []; }
});

extend(Array, IAppend, {
  conj: function(coll, el) { return coll.concat([el]); }
});

module.exports = Array;
