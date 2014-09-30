(function init() {
"use strict";

var Immutable = require("immutable");

var nil = require("./lib/nil");

var dispatch = require("./lib/dispatch"),
    defprotocol = dispatch.defprotocol,
    self = dispatch.self,
    extend = dispatch.extend,
    satisfies = dispatch.satisfies;

var collections = require("./lib/collections"),
    Map = collections.Map,
    Vector = collections.Vector,
    Set = collections.Set,
    LazySeq = collections.LazySeq;

var reduced = require("./lib/reduced"),
    Reduced = reduced.Reduced,
    isReduced = reduced.isReduced;

var protocols = require("./lib/protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    IAppend = protocols.IAppend,
    IAssociative = protocols.IAssociative,
    IWrap = protocols.IWrap,
    ICountable = protocols.ICountable;

var has = IAssociative.has,
    get = IAssociative.get,
    set = IAssociative.set;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

var count = ICountable.count;

var append = IAppend.append,
    empty = IAppend.empty;

var unwrap = IWrap.unwrap;

var realized = IPending.realized;

function inc(x) {
  return x + 1;
}

function dec(x) {
  return x - 1;
}

function complement(fn) {
  return function() {
    return ! fn.apply(null, arguments);
  };
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

function each(coll, fn) {
  while (seqable(coll)) {
    fn.call(null, first(coll));
    coll = rest(coll);
  }
  return nil;
}

function eq(x, y) {
  return Immutable.is(
    collect(x),
    collect(y)
  );
}

function comp(f, g /* fns... */) {
  switch (arguments.length) {
    case 0: return nil;
    case 1: return f;
    case 2: return function() { return f(g.apply(null, arguments)); };
    default: return reduce(comp, Array.prototype.slice.call(arguments));
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

function takingNth(n) {
  return function (step) {
    var iter = -1;
    return function (result, input) {
      switch (arguments.length) {
        case 0: return step();
        case 1: return step(result);
        case 2: 
          if(++iter % n === 0) {
            return step(result, input);
          }
          return result;
      }
    };
  };
}

function takeNth(n, coll) {
  switch (arguments.length) {
    case 1: return takingNth(n);
    case 2: 
      if(n > 0 && seqable(coll)) {
        return LazySeq(function () {
            return cons(first(seq(coll)), takeNth(n, drop(n, seq(coll))));
        });
      }
      return empty(coll);
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

function droppingWhile(pred) {
  return function (step) {
    return function (result, input) {
      switch (arguments.length) {
        case 0: return step();
        case 1: return step(result);
        case 2:
          if(pred(input)) {
            return result;
          } else {
            return step(result, input);
          }
        default: return nil;
      }
    };
  };
}

function dropWhile(pred, coll) {
  switch (arguments.length) {
    case 1: return droppingWhile(pred);
    case 2: 
      if(seqable(coll)) {
        var next = first(coll);
        if (pred(next)) {
          return dropWhile(pred, rest(coll));
        }
        return coll;
      }
      return empty(coll);
  }
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
      }
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

function filtering(fn) {
  return function(step) {
    return function(result, input) {
      switch (arguments.length) {
        case 0: return step();
        case 1: return step(result);
        case 2: return fn(input) ? step(result, input) : result;
        default: return nil;
      }
    };
  };
}

function filter(fn, coll) {
  switch (arguments.length) {
    case 1: return filtering(fn);
    case 2:
      if (seqable(coll)) { 
        return LazySeq(function() {
          var fst = first(coll),
              rst = filter(fn, rest(coll));
          return fn(fst) ? cons(fst, rst) : rst;
        });
      } else {
        return coll;
      }
    default: return nil;
  }
}

function remove(fn, coll) {
  switch (arguments.length) {
    case 1: return filter(complement(fn));
    case 2: return filter(complement(fn), coll);
  }
}

function concat(a, b) {
  switch (arguments.length) {
    case 0: return LazySeq(function() { return Vector(); });
    case 1: return LazySeq(function() { return a; });
    case 2:
      return LazySeq(function() {
        if (seqable(a)) {
          return cons(first(a), concat(rest(a), b));
        }
        return b;
      });
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
    }
  };
}

function mapcat(fn) {
  return comp(map(fn), cat);
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
          if (isReduced(result)) return unwrap(result);
          coll = rest(coll);
        }
        return result;
      }
      return init;
    default: return nil;
  }
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

function into(to, xform, from) {
  switch (arguments.length) {
    case 1: return to;
    case 2: // no xform supplied, from as second arg
      from = arguments[1];
      return reduce(append, to, from);
    case 3:
      return transduce(xform, append, to, from);
    default: return nil;
  }
}

function collect(xform, coll) {
  switch (arguments.length) {
    case 1: // no xform supplied, coll as first arg
      coll = arguments[0];
      return into(empty(coll), coll);
    case 2:
      return into(empty(coll), xform, coll);
  }
}

function initAppend() {
   switch (arguments.length) {
     case 0: return Vector();
     default: return append.apply(null, arguments);
   }
}

function exhaust(coll) {
  // used when a lazy sequence is meant to side effect when running
  while(seqable(coll)) coll = rest(coll);
  return nil;
}

function iterate(fn, x) {
  // lazy sequence generator
  return cons(x, LazySeq(function() {
    return iterate(fn, fn(x));
  }));
}

function cycle(coll) {
  if (seqable(coll)) {
    return LazySeq(function () {
      return concat(seq(coll), cycle(seq(coll)));
    });
  }
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

function getPath(assoc, path, notFound) {
  switch (arguments.length) {
    case 2: return getPath(assoc, path, nil);
    case 3:
      var missing = {};
      while (seqable(path)) {
        if (satisfies(IAssociative, assoc)) {
          assoc = get(assoc, first(path), missing);
          if (assoc === missing) return notFound;
        } else {
          return notFound;
        }
        path = rest(path);
      }
      return assoc;
  }
}

module.exports = {
  eq: eq,

  realized: realized,

  unwrap: unwrap,
  isReduced: isReduced,

  seq: seq,
  first: first,
  rest: rest,
  cons: cons,

  has: has,
  get: get,
  set: set,
  getPath: getPath,

  append: initAppend,

  inc: inc,
  dec: dec,

  count: count,
  empty: empty,

  take: take,
  takeWhile: takeWhile,
  takeNth: takeNth,
  drop: drop,
  dropWhile: dropWhile,
  second: second,

  nil: nil,

  // xform 
  into: into,
  collect: collect,
  each: each,
  map: map,
  filter: filter,
  remove: remove,
  concat: concat,
  mapcat: mapcat,
  reduce: reduce,
  iterate: iterate,
  exhaust: exhaust,
  range: range,
  cycle: cycle,

  transduce: transduce,
  comp: comp,

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

})();
