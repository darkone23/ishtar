(function init(root) {
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
    MapEntry = collections.MapEntry,
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

function identity(x) {
  return x;
}

function constantly(x) {
  return function () {
    return x;
  };
}

function exists(x) {
  return x != null && x !== nil;
}

function forall(fn, coll) {
  return reduce(function(bool, el) {
    return fn(el) || Reduced(false);
  }, true, coll);
}

function second(coll) {
  return first(rest(coll));
}

function last(coll) {
  var x = nil;
  while(seqable(coll)) {
    x = first(coll); 
    coll = rest(coll);
  }
  return x;
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

function juxt(f, g /* fns... */ ) {
  switch (arguments.length) {
    case 0: return nil;
    case 1: return function() { return Vector( f.apply(null, arguments) ); };
    case 2:
      return function() {
        return Vector( f.apply(null, arguments), g.apply(null, arguments) );
      };
    default:
      var fns = arguments;
      return function() {
        var args = arguments;
        return reduce(function(results, fn) {
          return append(results, fn.apply(null, args));
        }, Vector(), Array.prototype.slice.call(fns));
      };
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
        return LazySeq(function thunk() {
          return cons(first(coll), take(n-1, rest(coll)));
        });
      }
      return nil;
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
      return nil;
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
      return nil;
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
      return nil;
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
      }
    return nil;
  }
}

function zip(a, b /* c... */) {
  var args = Array.prototype.slice.call(arguments);
  return LazySeq(function thunk() {
    var e = empty(a);
    if (forall(seqable, args)) {
      var xs = into(e, map(first, args));
      var ys = zip.apply(null, into([], map(rest, args)));
      return cons(xs, ys);
    } else {
      return e;
    }
  });
}

function keys(assoc) {
  return into(Vector(), map(first), assoc);
}

function vals(assoc) {
  return into(Vector(), map(second), assoc);
}

function zipMap(keys, vals) {
  return into(Map(), zip(keys, vals));
}

function mapKeys(fn, coll) {
  function keyFn(x) {
    return MapEntry(fn(x.key), x.val);
  }
  switch (arguments.length) {
    case 1: return map(keyFn);
    case 2: return map(keyFn, coll);
    default: return nil;
  }
}

function mapVals(fn, coll) {
  function valFn(x) {
    return MapEntry(x.key, fn(x.val));
  }
  switch (arguments.length) {
    case 1: return map(valFn);
    case 2: return map(valFn, coll);
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

function keeping(fn) {
  return comp(map(fn), filter(exists));
}

function keep(fn, coll) {
  // discards non-existy values
  switch (arguments.length) {
    case 1: return keeping(fn);
    case 2:
      return LazySeq(function thunk() {
        if (isEmpty(coll)) return nil;
        var x = fn(first(coll)),
            ys = keep(fn, rest(coll));
        return exists(x) ? cons(x, ys) : ys;
      });
  }
}

function partition(n, step, coll) {
  switch (arguments.length) {
    case 2:
      coll = arguments[1];
      return partition(n, n, coll);
    case 3:
      return LazySeq(function thunk() {
        var part = collect(take(n), coll);
        if (count(part) !== n) {
          return empty(coll);
        } else {
          return cons(part, partition(n, step, drop(step, coll)));
        }
      });
    default: return nil;
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
  return nil;
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

function setEach(assoc, key, val /* key, val... */ ) {
  var err = new Error("Must call set with key/value pairs");
  switch (arguments.length) {
    case 0: throw err;
    case 1: throw err;
    case 2: throw err;
    case 3: return set(assoc, key, val);
    default:
      var args = Array.prototype.slice.call(arguments, 1);
      if (count(args) % 2 !== 0) throw err;
      return reduce(function(x, y) {
        var key = first(y), val = second(y);
        return set(x, key, val);
      }, assoc, partition(2, args));
  }
}

function setPath(assoc, path, val, missing) {
  var key = first(path), keys = rest(path);
  if (!satisfies(IAssociative, assoc)) {
    assoc = exists(missing) ? missing : Map();
  }
  if (isEmpty(keys)) {
    return set(assoc, key, val);
  } else {
    var node = get(assoc, key),
        _missing = empty(assoc);
    return set(assoc, key, setPath(node, keys, val, _missing));
  }
}

module.exports = {

  seqable: seqable,
  isEmpty: isEmpty,

  seq: seq,
  first: first,
  rest: rest,
  cons: cons,
  second: second,
  last: last,

  has: has,
  get: get,
  set: setEach,
  getPath: getPath,
  setPath: setPath,
  keys: keys,
  vals: vals,
  mapKeys: mapKeys,
  mapVals: mapVals,
  zipMap: zipMap,

  append: initAppend,
  empty: empty,

  count: count,

  realized: realized,
  unwrap: unwrap,
  isReduced: isReduced,

  exists: exists,
  nil: nil,
  eq: eq,
  inc: inc,
  dec: dec,

  // iterating 
  into: into,
  collect: collect,
  each: each,

  // lazy seq xformers
  map: map,
  filter: filter,
  remove: remove,
  keep: keep,
  partition: partition,
  concat: concat,
  mapcat: mapcat,
  take: take,
  takeWhile: takeWhile,
  takeNth: takeNth,
  drop: drop,
  dropWhile: dropWhile,
  zip: zip,

  // low level xformers
  reduce: reduce,
  transduce: transduce,

  // lazy seqs
  iterate: iterate,
  range: range,
  cycle: cycle,
  exhaust: exhaust,

  // fn fns
  comp: comp,
  juxt: juxt,
  identity: identity,
  constantly: constantly,
  forall: forall,

  // data structures
  Reduced: Reduced,
  LazySeq: LazySeq,
  Map: Immutable.Map,
  MapEntry: MapEntry,
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

})(this);
