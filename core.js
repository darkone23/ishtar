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
    Vector = collections.Vector,
    Set = collections.Set,
    Reduced = collections.Reduced,
    LazySeq = collections.LazySeq;

var protocols = require("./lib/protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    IAppend = protocols.IAppend,
    IWrap = protocols.IWrap,
    ICollection = protocols.ICollection;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

var count = ICollection.count,
    empty = ICollection.empty;

var conj = IAppend.conj;

var unwrap = IWrap.unwrap;

var realized = IPending.realized;

function inc(x) {
  return x + 1;
}

function dec(x) {
  return x - 1;
}

function second(coll) {
  return first(rest(coll));
}

function isEmpty(coll) {
  return seq(coll) === nil;
}

function seqable(coll) {
  return seq(coll) !== nil;
}

function doseq(coll, fn) {
  while (seqable(coll)) {
    fn.call(null, first(coll));
    coll = rest(coll);
  }
  return nil;
}

function compose(f, g /* fns... */) {
  switch (arguments.length) {
    case 0: return nil;
    case 1: return f;
    case 2: return function() { return f(g.apply(null, arguments)); };
    default: return reduce(compose, Array.prototype.slice.call(arguments));
  }
}

function taking(n) {
 return function(step) {
    var iter = n;
    return function(result, input) {
      switch (arguments.length) {
	case 0: return step();
	case 1: return step(result);
	case 2:
	  var curr = iter;
	  var next = --iter;
	  if (curr > 0) result = step(result, input);
	  if (next === 0) result = Reduced(result);
	  return result;
	default: return nil;
      }
    };
  };
}

function take(n, coll) {
  switch (arguments.length) {
    case 1: return taking(n);
    case 2:
      if (n > 0 && seqable(coll)) {
	return cons(first(coll), take(n-1, rest(coll)));
      } else {
	return empty(coll);
      }
  }
}

function dropping(n) {
  return function(step) {
    var i = n;
    return function(result, input) {
      switch (arguments.length) {
        case 0: return step();
        case 1: return step(result);
        case 2: return (n-- > 0) ? result : step(result, input);
        default: return nil;
      }
    };
  };
}

function drop(n, coll) {
  switch (arguments.length) {
    case 1: return dropping(n);
    case 2:
      while (n > 0 && seqable(coll)) {
        coll = rest(coll);
        n -= 1;
      }
      return coll;
  }
}

function dropWhile(pred, coll) {
  if(seqable(coll)) {
    var next = first(coll);
    if (pred(next)) {
      return dropWhile(pred, rest(coll));
    }
    return coll;
  }
  return empty(coll);
}

function takingWhile(pred) {
  return function (step) {
    return function (result, input) {
      switch(arguments.length) {
        case 0: return step();
        case 1: return step(result);
        case 2: 
          if(pred(input)) {
            return step(result, input);
          } else {
            return Reduced(result);
          }
        default: return nil;
      }
    };
  };
}

function takeWhile(pred, coll) {
  switch(arguments.length) {
    case 1: return takingWhile(pred);
    case 2: 
      if(seqable(coll)) {
        var next = first(coll);
        if (pred(next)) return cons(next, takeWhile(pred, rest(coll)));
      }
      return empty(coll);
  }
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
      if (seqable(coll)) { 
        return LazySeq(function() {
          return cons(fn(first(coll)), map(fn, rest(coll)));
        });
      } else {
        return coll;
      }
    default: return nil;
  }
}

function cat(step) {
  // mapcat transducer
  return function(result, input) {
    switch (arguments.length) {
      case 0: return step();
      case 1: return step(result);
      case 2:
        var reducer = function(r, i) {
          // it is possible for step to return a reduced val from a prior xform
          // if we don't wrap this reduced val our call to reduce()
          // will unwrap the reduced wrapper and break short circuiting
          var val = step(r, i);
          return isReduced(val) ? Reduced(val) : val;
        };
        return reduce(reducer, result, input);
      default: return nil;
    };
  };
};

function mapcat(fn) {
  return compose(map(fn), cat);
}

function reduce(fn, init, coll) {
  // reduces sequences
  switch (arguments.length) {
    case 2: // init not supplied, coll is second arg
      coll = arguments[1]; 
      return seqable(coll) ? reduce(fn, first(coll), rest(coll)) : fn();
    case 3:
      if (seqable(coll)) {
        var result = init;
        while(seqable(coll)) {
          result = fn(result, first(coll));
          if (isReduced(result)) {
            result = unwrap(result);
            break;
          }
          coll = rest(coll);
        }
        return result;
      }
      return init;
    default: return nil;
  }
}

function isReduced(x) {
  return (x instanceof Reduced);
}

function transduce(xform, step, init, coll) {
  switch (arguments.length) {
    case 3: // no init supplied, coll as third arg
      coll = arguments[2];
      return reduce(xform(step), step(), coll);
    case 4:
      return reduce(xform(step), init, coll);
    default: return nil;
  }
}

function transconj() {
   // conj with transducer arity
   switch (arguments.length) {
     case 0: return Vector();
     default:
       return conj.apply(null, arguments);
   };
}

function doall(coll) {
  if (isEmpty(coll)) return coll;
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
	return nil;
      }
  }
}

var module = module || {};
module.exports = {
  equals: Immutable.is,

  realized: realized,

  unwrap: unwrap,
  isReduced: isReduced,

  seq: seq,
  first: first,
  rest: rest,
  cons: cons,

  conj: transconj,

  inc: inc,
  dec: dec,

  count: count,
  empty: empty,

  take: take,
  takeWhile: takeWhile,
  drop: drop,
  dropWhile: dropWhile,
  second: second,

  nil: nil,

  // xform 
  doall: doall,
  doseq: doseq,
  map: map,
  mapcat: mapcat,
  reduce: reduce,
  iterate: iterate,
  range: range,

  transduce: transduce,
  compose: compose,

  // data structures
  Reduced: Reduced,
  LazySeq: LazySeq,
  Map: Immutable.Map,
  Vector: Immutable.Vector,
  Range: Immutable.Range,
  Set: Immutable.Set,

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
