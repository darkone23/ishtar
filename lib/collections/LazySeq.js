var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    ICollection = protocols.ICollection;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

extend(LazySeq, ISeq, {
  seq: function(coll) {
    return coll.step();
  },
  first: function(coll) { 
    coll.step();
    return first(coll.seq);
  },
  rest: function(coll) { 
    coll.step();
    return rest(coll.seq);
  },
  cons: function(el, coll) {
    return Cons(el, coll);
  }
});

extend(LazySeq, ICollection, {
  count: function(coll) {
    var c = 0;
    for(var s = seq(coll); s !== nil; s = rest(s)) c += 1;
    return c;
  },
  empty: function(coll) {
    return Vector();
  }
});

extend(LazySeq, IPending, {
  realized: function(coll) { return coll.fn === nil; }
});

extend(Cons, ISeq, {
  seq: function(coll) { return coll; },
  first: function(coll) { return coll.el; },
  rest: function(coll) { return coll.coll; },
  cons: function(el, coll) { return Cons(el, coll); }
});

extend(Cons, ICollection, {
  count: function(coll) { return 1 + count(coll.coll); },
  empty: function(coll) { return Vector(); }
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
  this.cache = nil;
}
var $LazySeq = LazySeq;
LazySeq.prototype.getCache = function() {
  if (this.fn !== nil) {
    this.cache = this.fn();
    this.fn = nil;
  }
  if (this.cache !== nil) return this.cache;
  return this.seq;
}
LazySeq.prototype.step = function() {
  this.getCache();
  if (this.cache !== nil) {
    var step = this.cache;
    this.cache = nil;
    while(step instanceof $LazySeq) {
      step = step.getCache();
    }
    this.seq = seq(step);
  }
  return this.seq;
}

module.exports = LazySeq;
