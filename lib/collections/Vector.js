var Immutable = require("immutable"),
    Vector = Immutable.Vector,
    IndexedSequence = Immutable.Vector().rest().constructor,
    Sequence = Immutable.Sequence;

var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    ICollection = protocols.ICollection;

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

extend(Vector, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return Vector(); }
});

extend(Vector, IAppend, {
  conj: function(coll, el) { return coll.push(el); }
});

// underlying immutable js types for lazy structs

extend(IndexedSequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Vector(el).concat(coll); }
});
extend(IndexedSequence, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return new Vector(); }
});

extend(Sequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Sequence(el).concat(coll); }
});

module.exports = Vector;
