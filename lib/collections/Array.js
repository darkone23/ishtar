var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable;

var nil = require("../nil");

extend(Array, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) {
    if (coll.length) {
      return coll[0];
    } else {
      throw new Error("Cannot take first of empty list");
    }
  },
  rest: function(coll) { return coll.slice(1); },
  cons: function(el, coll) { return [el].concat(coll); }
});

extend(Array, ICountable, {
  count: function(coll) { return coll.length; }
});

extend(Array, IAppend, {
  append: function(coll, el) { return coll.concat([el]); },
  empty: function(coll) { return []; }
});

module.exports = Array;
