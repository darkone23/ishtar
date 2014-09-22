"use strict";

var Immutable = require("immutable"),
    Vec = Immutable.Vector,
    Set = Immutable.Set,
    Map = Immutable.Map,
    equals = Immutable.is;

var protocols = Map();
var protofns = Map();

var Seq = defprotocol("Seq", {
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

function nil(type) {
  // represents nothingness, not there (next element of an empty list)
  // currently used to maintain proper dispatch for protocols,
  // impls can use nil instances as non-existent instance of their Type
  this.type = type;
}
nil.prototype.toString = function() { return "nil"; };
function isNil(x) { return x instanceof nil || x === nil; };

var nilArr = new nil(Array);
extend(Array, "Seq", {
  first: function(coll) { return coll.length ? coll[0] : nilArr; },
  rest: function(coll) { return isNil(coll) ? [] : coll.slice(1); },
  cons: function(coll, el) { return isNil(coll) ? [el] : [el].concat(coll); }
});

var nilVec = new nil(Vec);
extend(Vec, "Seq", {
  first: function(coll) { return coll.length ? coll.first() : nilVec; },
  rest: function(coll) { return isNil(coll) ? Vec() : coll.rest().toVector(); },
  cons: function(coll, el) { return isNil(coll) ? Vec(el) : Vec(el).concat(coll).toVector(); }
});

function map(fn, coll) {
  // Map a function over a collection.
  // Requires the collection implement the 'Seq' protocol
  switch (arguments.length) {
    case 1: // transducer
	return function(f1) {
	  return function(result, input) {
	    switch (arguments.length) {
	      case 0: return f1();
	      case 1: return f1(result);
	      case 2: return f1(result, fn(input));
	      default: return nil;
	    };
	  };
	};
    case 2: // regular coll map
	// TODO: return a lazy sequence instead of eager cons
	var head = Seq.first(coll),
	    tail = Seq.rest(coll);
	if (isNil(head)) return head;
	return Seq.cons(map(fn, tail), fn(head));
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
  var name = x.constructor.name;
  return (name === "nil") ? x.type.name : name;
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
  isNil: isNil,

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
