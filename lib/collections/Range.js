var Immutable = require("immutable"),
    Vector = Immutable.Vector,
    Range = Immutable.Range;

var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    IAppend = protocols.IAppend,
    ISeq = protocols.ISeq;

var nil = require("../nil");

extend(Range, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.first(); },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return coll.length ? coll.unshift(el) : coll; }
});

extend(Range, IAppend, {
  empty: function(coll) { return Vector(); },
  apppend: function(coll, el) { return coll.length ? coll.unshift(el) : coll; }
});

module.exports = Range;
