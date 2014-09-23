var Immutable = require("immutable"),
    Vec = Immutable.Vector,
    equals = Immutable.is;

var nil = require("./nil");

var proto = require("./proto"),
    extend = proto.extend;

var protocols = require("./protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

extend(Array, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll[0] : nil; },
  rest: function(coll) { return coll.slice(1); },
  cons: function(coll, el) { return [el].concat(coll); }
});

extend(Vec, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest().toVector(); },
  cons: function(coll, el) { return Vec(el).concat(coll).toVector(); }
});

extend(Cons, ISeq, {
  seq: function(coll) { return coll; },
  first: function(coll) { return coll.el; },
  rest: function(coll) { return coll.coll; },
  cons: function(coll, el) { return Cons(el, coll); }
});

extend(LazySeq, ISeq, {
  seq: function(coll) {
    coll.getCachedVal();
    if (coll.cachedVal !== nil) {
      var x = coll.cachedVal;
      coll.cachedVal = nil;
      while(x instanceof $LazySeq) {
        x = x.getCachedVal();
      }
      coll.seq = seq(x);
    }
    return coll.seq;
  },
  first: function(coll) { 
    seq(coll);
    if (coll.seq !== nil) {
      return first(coll.seq);
    } else {
      return nil;
    }
  },
  rest: function(coll) { 
    seq(coll);
    return rest(coll.seq);
  },
  cons: function(coll, el) {
    return Cons(el, coll);
  }
});

extend(LazySeq, IPending, {
  realized: function(coll) { return coll.fn === nil; }
});

function Cons(el, coll) {
  if (!(this instanceof $Cons)) {
    return new $Cons(el, coll);
  }
  this.el = el;
  this.coll = coll;
}
var $Cons = Cons;

function LazySeq(fn) {
  if (!(this instanceof $LazySeq)) {
    return new $LazySeq(fn);
  }
  this.fn = fn;
  this.seq = nil;
  this.cachedVal = nil;
}
var $LazySeq = LazySeq;
LazySeq.prototype.getCachedVal = function() {
  if (this.fn !== nil) {
    this.cachedVal = this.fn();
    this.fn = nil;
  }
  if (this.cachedVal !== nil) {
    return this.cachedVal;
  }
  return this.seq;
}

module.exports = {
  Map: Immutable.Map,
  Set: Immutable.Set,
  Vec: Immutable.Vector,
  LazySeq: LazySeq
};
