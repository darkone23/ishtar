var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable;

var nil = require("../nil");
var Cons = require("./Cons");

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

extend(LazySeq, ICountable, {
  count: function(coll) {
    var c = 0;
    for(var s = seq(coll); s !== nil; s = rest(s)) c += 1;
    return c;
  }
});

extend(LazySeq, IAppend, {
  append: function(coll, el) {
    // lazy seqs append to the beginning
    return cons(el, coll);
  },
  empty: function(coll) {
    return Vector();
  }
});

extend(LazySeq, IPending, {
  realized: function(coll) { return coll.fn === nil; }
});

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

LazySeq.prototype.toString = function() {
  var inside;
  if (this.fn !== nil) inside = "thunk";
  if (this.cache !== nil) inside = this.cache;
  if (this.seq !== nil) inside = this.seq;
  return "LazySeq => [ " + inside + " ]";
}
LazySeq.prototype.inspect = LazySeq.prototype.toString;

module.exports = LazySeq;
