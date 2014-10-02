var dispatch = require("../dispatch"),
    satisfies = dispatch.satisfies,
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    IAssociative = protocols.IAssociative,
    ICountable = protocols.ICountable;

var nil = require("../nil");

function clone(coll, shift) {
  shift = shift || 0;
  var obj = Object.create(coll.prototype || Object.prototype);
  Object.keys(coll).slice(shift).forEach(function(key) {
    obj[key] = coll[key];
  });
  return obj;
}

extend(Object, ISeq, {
  seq: function(coll) { return Object.keys(coll).length ? coll : nil; },
  first: function(coll) {
    var keys = Object.keys(coll);
    return (keys.length) ? MapEntry( keys[0], coll[keys[0]] ) : nil;
  },
  rest: function(coll) {
    return clone(coll, 1);
  },
  cons: function(el, coll) {
    if (satisfies(ICountable, el) && ICountable.count(el) === 2) {
      var key = ISeq.first(el), val = ISeq.first(ISeq.rest(el));
      return IAssociative.set(coll, key, val);
    } else {
      throw new Error("Can only cons a [ k : v ] pair onto an Object, not: " + el);
    }
  }
});

extend(Object, ICountable, {
  count: function(coll) { return Object.keys(coll).length; }
});

extend(Object, IAppend, {
  append: function(coll, el) { return ISeq.cons(el, coll); },
  empty: function(coll) { return {}; }
});

extend(Object, IAssociative, {
  has: function(coll, key) { return Object.hasOwnProperty.call(coll, key); },
  get: function(coll, key, notFound) {
    return IAssociative.has(coll, key) ? coll[key] : notFound;
  },
  set: function(coll, key, val) {
    var obj = clone(coll);
    obj[key] = val;
    return obj;
  }
});

module.exports = Object;
