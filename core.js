"use strict";

var Immutable = require("immutable"),
    Vec = Immutable.Vector,
    Set = Immutable.Set,
    Map = Immutable.Map,
    equals = Immutable.is;

var protocols = Map();
var protofns = Map();

var Seq = defprotocol("Seq", {
  seq: {
    doc: "Returns a seq on the collection. If the collection is empty, returns nil",
    args: ['coll']
  },
  first: {
    doc: "Returns the first item in the collection or the nil coll",
    args: ['coll']
  },
  rest: {
    doc: "Returns the rest of the collection or an empty coll",
    args: ['coll']
  },
  cons: {
    doc: "Constructs a new collection with x as the first element and coll as the rest",
    args: ['coll', 'x']
  }
});

// represents nothingness, not there (next element of an empty list)
function NIL() {};
NIL.prototype.toString = function() { return "nil"; };
var nil = new NIL();

extend(Array, "Seq", {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll[0] : nil; },
  rest: function(coll) { return coll.slice(1); },
  cons: function(coll, el) { return [el].concat(coll); }
});

extend(Vec, "Seq", {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest().toVector(); },
  cons: function(coll, el) { return Vec(el).concat(coll).toVector(); }
});

function Cons(el, coll) {
  if (!(this instanceof $Cons)) {
    return new $Cons(el, coll);
  }
  this.el = el;
  this.coll = coll;
}
var $Cons = Cons;

extend(Cons, "Seq", {
  seq: function(coll) { return coll; },
  first: function(coll) { return coll.el; },
  rest: function(coll) { return coll.coll; },
  cons: function(coll, el) { return Cons(el, coll); }
});

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

extend(LazySeq, "Seq", {
  seq: function(coll) {
    coll.getCachedVal();
    if (coll.cachedVal !== nil) {
      var x = coll.cachedVal;
      coll.cachedVal = nil;
      while(x instanceof $LazySeq) {
        x = x.getCachedVal();
      }
      coll.seq = Seq.seq(x);
    }
    return coll.seq;
  },
  first: function(coll) { 
    Seq.seq(coll);
    if (coll.seq !== nil) {
      return Seq.first(coll.seq);
    } else {
      return nil;
    }
  },
  rest: function(coll) { 
    Seq.seq(coll);
    return Seq.rest(coll.seq);
  },
  cons: function(coll, el) {
    return Cons(el, coll);
  }
});

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
      if (Seq.seq(coll) === nil) {
        return coll;
      } else {
        return LazySeq(function() {
          var head = Seq.first(coll),
              tail = Seq.rest(coll);
          return Seq.cons(map(fn, tail), fn(head));
        });
      }
    default: return nil;
  }
}

function getprotocol(protocol) {
  return protocols.get(protocol);
}

function doseq(seq, fn) {
  // sequential traversal of an iterator
  for (var step = seq.next(); ! step.done; step = seq.next()) {
    fn.call(null, step.value);
  }
}

function defprotocol(protocol, methods) {
  function valid(methods) {
    valid = true;
    valid = valid && methods.length > 0;
    doseq(methods.values(), function(val) {
      var keyset = Map(val).keySeq().toSet();
      valid = valid && equals(keyset, Set('doc', 'args'));
    });
    return valid;
  }
  function genfn(protocol, key) {
    var fnName = protocol + "#" + key;
    var fn = function(instance) {
      var args = Array.prototype.slice.call(arguments, 0);
      var name = getDispatchName(instance);
      try {
	var impl = protofns.get(protocols.get(protocol)).get(name).get(key);
      } catch (e) {
	throw new Error(name + " does not implement " + fnName);
      }
      return impl.apply(null, args);
    };
    fn.name = fnName;
    return fn;
  }
  methods = Map(methods);
  if (valid(methods)) {
    var method = {};
    method["::def"] = methods;
    doseq(methods.keys(), function(key) {
      method[key] = genfn(protocol, key);
    });
    protocols = protocols.set(protocol, method);
    protofns = protofns.set(method, Map());
    return protocols.get(protocol);
  }
}

function getDispatchName(x) {
  return x.constructor.name;
}

function extend(type, protocol, fns) {
  var name = getDispatchName(new type),
      key = protocols.get(protocol);
  if (key) {
    var impls = protofns.get(key);
    protofns = protofns.set(key, impls.set(name, Map(fns)));
  }
  return protofns.get(key);
}

function satisfies(protocol, x) {
  // Returns true if x satisfies a given protocol
  var name = getDispatchName(x);
  var impls = protofns.get(protocols.get(protocol));
  return !! (impls && impls.get(name));
}

var module = module || {};

module.exports = {
  equals: Immutable.is,

  first: Seq.first,
  rest: Seq.rest,
  cons: Seq.cons,

  nil: nil,

  // iter / xform 
  doseq: doseq,
  map: map,

  // data structures
  Map: Immutable.Map,
  Vec: Immutable.Vector,

  // protocols
  defprotocol: defprotocol,
  getprotocol: getprotocol,
  extend: extend,
  satisfies: satisfies,

  // utility fns
  exports: function(obj) {
    Object.keys(module.exports).forEach(function(key) {
      obj[key] = module.exports[key];
    });
  }
};
