var Immutable = require("immutable"),
    Range = Immutable.Range;

var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    ICollection = protocols.ICollection;

extend(Range, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.first(); },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return coll.length ? coll.unshift(el) : coll; }
});

module.exports = Range;
