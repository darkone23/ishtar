"use strict";

var Immutable = require("immutable"),
    equals = Immutable.is;

var nil = require("./lib/nil");

var proto = require("./lib/proto"),
    defprotocol = proto.defprotocol,
    self = proto.self,
    extend = proto.extend,
    satisfies = proto.satisfies;

var collections = require("./lib/collections"),
    Map = collections.Map,
    Vec = collections.Vec,
    Set = collections.Set,
    LazySeq = collections.LazySeq;

var protocols = require("./lib/protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    ICollection = protocols.ICollection;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

var count = ICollection.count,
    empty = ICollection.empty;

var realized = IPending.realized;

function second(coll) {
  return first(rest(coll));
}

function take(n, coll) {
  if (n > 0 && seq(coll) !== nil) {
    return cons(first(coll), take(n - 1, rest(coll)));
  } else {
    return empty(coll);
  }
}

function takeWhile(pred, coll) {
  if(seq(coll) !== nil) {
    var next = first(coll);
    if (pred(next)) return cons(next, takeWhile(pred, rest(coll)));
  }
  return empty(coll);
}

function mapping(fn) {
  return function(step) {
    return function(result, input) {
      switch (arguments.length) {
	case 0: return step();
	case 1: return step(result);
	case 2: return step(result, fn(input));
	default: return nil;
      };
    };
  };
}

function map(fn, coll) {
  // Map a function over a collection.
  switch (arguments.length) {
    case 1: return mapping(fn);
    case 2:
      if (seq(coll) === nil) { 
	return coll;
      } else {
        return LazySeq(function() {
          return cons(fn(first(coll)), map(fn, rest(coll)));
        });
      }
    default: return nil;
  }
}

function doall(coll) {
  if (seq(coll) === nil) return coll;
  return cons(first(coll), doall(rest(coll)));
}

function iterate(fn, x) {
  // lazy sequence generator
  return cons(x, LazySeq(function() {
    return iterate(fn, fn(x));
  }));
}

function range(start, end, step) {
  // returns a lazy, possibly infinite range of numbers
  switch (arguments.length) {
    case 0: return range(0, Infinity, 1);
    case 1: return range(0, start, 1);
    case 2: return range(start, end, 1);
    case 3:
      var compare;
      if (step === 0 || start === end) compare = function(x, end) { return x !== end; };
      if (step > 0) compare = function(x, end) { return x < end; };
      if (step < 0) compare = function(x, end) { return x > end; };
      if (compare(start, end)) {
	return cons(start, LazySeq(function() {
	  return range(start + step, end, step);
	}));
      } else {
	return Vec();
      }
  }
}

var module = module || {};
module.exports = {
  equals: Immutable.is,

  realized: realized,

  seq: seq,
  first: first,
  rest: rest,
  cons: cons,

  count: count,
  empty: empty,

  take: take,
  takeWhile: takeWhile,
  second: second,

  nil: nil,

  // xform 
  doall: doall,
  map: map,
  iterate: iterate,
  range: range,

  // data structures
  LazySeq: LazySeq,
  Map: Immutable.Map,
  Vec: Immutable.Vector,

  // protocols
  defprotocol: defprotocol,
  self: self,
  extend: extend,
  satisfies: satisfies,

  // utility fns
  exports: function(obj) {
    Object.keys(module.exports).forEach(function(key) {
      obj[key] = module.exports[key];
    });
  }
};
