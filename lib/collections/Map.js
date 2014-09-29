var Immutable = require("immutable"),
    Map = Immutable.Map;

var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    ICollection = protocols.ICollection;

extend(Map, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) {
    if (coll.length) {
      var next = coll.entries().next();
      if (! next.done) {
	var key = next.value[0], val = next.value[1];
	return [key, val];
      }
    }
    return nil;
  },
  rest: function(coll) {
    if (coll.rest().length) return coll.rest().toMap();
    return Map();
  },
  cons: function(el, coll) {
    return coll.set(el[0], el[1]);
  }
});

extend(Map, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return Map(); }
});

module.exports = Map;
