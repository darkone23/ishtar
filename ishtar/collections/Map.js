var Immutable = require("immutable"),
    Map = Immutable.Map;

var dispatch = require("../dispatch"),
    satisfies = dispatch.satisfies,
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAssociative = protocols.IAssociative,
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable;

var nil = require("../nil");

extend(Map, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) {
    if (coll.length) {
      var next = coll.entries().next();
      if (! next.done) {
        var key = next.value[0], val = next.value[1];
        return MapEntry(key, val);
      }
    }
    return nil;
  },
  rest: function(coll) {
    if (coll.rest().length) return coll.rest().toMap();
    return Map();
  },
  cons: function(el, coll) {
    if (satisfies(ICountable, el) && ICountable.count(el) === 2) {
      return coll.set(ISeq.first(el), ISeq.first(ISeq.rest(el)));
    } else {
      throw new Error("Can only cons a [ k : v ] pair onto a Map, not " + el);
    }
  }
});

extend(Map, ICountable, {
  count: function(coll) { return coll.length; }
});

extend(Map, IAppend, {
  append: function(coll, el) { return cons(el, coll); },
  empty: function(coll) { return Map(); }
});

extend(Map, IAssociative, {
  has: function(coll, key) { return coll.get(key, nil) !== nil; },
  get: function(coll, key, notFound) { return coll.get(key, notFound); },
  set: function(coll, key, val) { return coll.set(key, val); }
});

module.exports = Map;
