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

function forall(fn, seq) {
  return reduce(function(bool, el) {
    return fn(el) || Reduced(false);
  }, true, seq);
}

function nth(n, seq) {
  seq = drop(n, seq);
  return seqable(seq) ? first(seq) : nil;
}

function second(seq) {
  return nth(1, seq);
}

function last(seq) {
  var x = nil;
  while(seqable(seq)) {
    x = first(seq); 
    seq = rest(seq);
  }
  return x;
}

function seqable(seq) {
  return ISeq.seq(seq) !== nil;
}

var isEmpty = complement(seqable);

function each(seq, fn) {
  while (seqable(seq)) {
    fn.call(null, first(seq));
    seq = rest(seq);
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

function take(n, seq) {
  switch (arguments.length) {
    case 1: return taking(n);
    case 2:
      if (n > 0 && seqable(seq)) {
        return LazySeq(function thunk() {
          return cons(first(seq), take(n-1, rest(seq)));
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

function takeNth(n, seq) {
  switch (arguments.length) {
    case 1: return takingNth(n);
    case 2: 
      if(n > 0 && seqable(seq)) {
        return LazySeq(function () {
            return cons(first(seq), takeNth(n, drop(n, seq)));
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

function drop(n, seq) {
  switch (arguments.length) {
    case 1: return dropping(n);
    case 2:
      while (n > 0 && seqable(seq)) {
        seq = rest(seq);
        n -= 1;
      }
      return seq;
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

function dropWhile(pred, seq) {
  switch (arguments.length) {
    case 1: return droppingWhile(pred);
    case 2: 
      if(seqable(seq)) {
        var next = first(seq);
        if (pred(next)) {
          return dropWhile(pred, rest(seq));
        }
        return seq;
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

function takeWhile(pred, seq) {
  switch(arguments.length) {
    case 1: return takingWhile(pred);
    case 2: 
      if(seqable(seq)) {
        var next = first(seq);
        if (pred(next)) return cons(next, takeWhile(pred, rest(seq)));
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

function map(fn, seq) {
  // Map a function over a collection.
  switch (arguments.length) {
    case 1: return mapping(fn);
    case 2:
      if (seqable(seq)) { 
        return LazySeq(function() {
          return cons(fn(first(seq)), map(fn, rest(seq)));
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

function mapKeys(fn, seq) {
  function keyFn(x) {
    return MapEntry(fn(first(x)), second(x));
  }
  switch (arguments.length) {
    case 1: return map(keyFn);
    case 2: return map(keyFn, seq);
    default: return nil;
  }
}

function mapVals(fn, seq) {
  function valFn(x) {
    return MapEntry(first(x), fn(second(x)));
  }
  switch (arguments.length) {
    case 1: return map(valFn);
    case 2: return map(valFn, seq);
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

function filter(fn, seq) {
  switch (arguments.length) {
    case 1: return filtering(fn);
    case 2:
      if (seqable(seq)) { 
        return LazySeq(function() {
          var fst = first(seq),
              rst = filter(fn, rest(seq));
          return fn(fst) ? cons(fst, rst) : rst;
        });
      }
    default: return nil;
  }
}

function remove(fn, seq) {
  switch (arguments.length) {
    case 1: return filter(complement(fn));
    case 2: return filter(complement(fn), seq);
  }
}

function keeping(fn) {
  return comp(map(fn), filter(exists));
}

function keep(fn, seq) {
  // discards non-existy values
  switch (arguments.length) {
    case 1: return keeping(fn);
    case 2:
      return LazySeq(function thunk() {
        if (isEmpty(seq)) return nil;
        var x = fn(first(seq)),
            ys = keep(fn, rest(seq));
        return exists(x) ? cons(x, ys) : ys;
      });
  }
}

function partition(n, step, seq) {
  switch (arguments.length) {
    case 2:
      seq = arguments[1];
      return partition(n, n, seq);
    case 3:
      return LazySeq(function thunk() {
        var part = collect(take(n), seq);
        if (count(part) !== n) {
          return empty(seq);
        } else {
          return cons(part, partition(n, step, drop(step, seq)));
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

function reduce(fn, init, seq) {
  // reduces sequences
  switch (arguments.length) {
    case 2: // init not supplied, seq is second arg
      seq = arguments[1]; 
      return seqable(seq) ? reduce(fn, first(seq), rest(seq)) : fn();
    case 3:
      if (seqable(seq)) {
        var result = init;
        while(seqable(seq)) {
          result = fn(result, first(seq));
          if (isReduced(result)) return unwrap(result);
          seq = rest(seq);
        }
        return result;
      }
      return init;
    default: return nil;
  }
}

function transduce(xform, step, init, seq) {
  switch (arguments.length) {
    case 3: // no init supplied, seq as third arg
      seq = arguments[2];
      return reduce(xform(step), step(), seq);
    case 4:
      return reduce(xform(step), init, seq);
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

function collect(xform, seq) {
  switch (arguments.length) {
    case 1: // no xform supplied, seq as first arg
      seq = arguments[0];
      return into(empty(seq), seq);
    case 2:
      return into(empty(seq), xform, seq);
  }
}

function initAppend() {
   switch (arguments.length) {
     case 0: return Vector();
     default: return append.apply(null, arguments);
   }
}

function exhaust(seq) {
  // used when a lazy sequence is meant to side effect when running
  while(seqable(seq)) seq = rest(seq);
  return nil;
}

function iterate(fn, x) {
  // lazy sequence generator
  return cons(x, LazySeq(function() {
    return iterate(fn, fn(x));
  }));
}

function cycle(seq) {
  if (seqable(seq)) {
    return LazySeq(function () {
      return concat(seq, cycle(seq));
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
  nth: nth,
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
