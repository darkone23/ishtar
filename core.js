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

function map(fn, coll) {
  // Map a function over a collection.
  // Requires the collection implement the 'Seq' protocol
  switch (arguments.length) {
    case 1: // transducer
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
    case 2: // regular seqable
      if (seq(coll) === nil) {
        return coll;
      } else {
        return LazySeq(function() {
          var head = first(coll),
              tail = rest(coll);
          return cons(fn(head), map(fn, tail));
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
  second: second,

  nil: nil,

  // xform 
  doall: doall,
  map: map,
  iterate: iterate,

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
