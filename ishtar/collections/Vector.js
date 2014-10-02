var Immutable = require("immutable"),
    Vector = Immutable.Vector,
    IndexedSequence = Immutable.Vector().rest().constructor,
    Sequence = Immutable.Sequence;

var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable;

var nil = require("../nil");

extend(Vector, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) {
    try {
      return coll.shift();
    } catch (e) {
      return coll.rest();
    }
  },
  cons: function(el, coll) { return coll.unshift(el); }
});

extend(Vector, ICountable, {
  count: function(coll) { return coll.length; }
});

extend(Vector, IAppend, {
  append: function(coll, el) { return coll.push(el); },
  empty: function(coll) { return Vector(); }
});

// underlying immutable js types for lazy structs

extend(IndexedSequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Vector(el).concat(coll); }
});

extend(Sequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Sequence(el).concat(coll); }
});

module.exports = Vector;
