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
    doc: "Returns the first item in the collection or nil",
    args: ['coll']
  },
  rest: {
    doc: "Returns the rest of the collection or nil",
    args: ['coll']
  },
  cons: {
    doc: "Prepends the item to the collection or seeds a new collection if coll is nil",
    args: ['coll', 'item']
  }
});

function NIL(type) {
  this.type = type;
}
NIL.prototype.toString = function() { return "nil"; };
function isNil(x) {
  return x instanceof NIL;
}
var nil = new NIL(NIL);

extend(Array, "Seq", {
  first: function(coll) { return coll.length ? coll[0] : new NIL(Array); },
  rest: function(coll) { return coll.slice(1).length ? coll.slice(1) : new NIL(Array); },
  cons: function(coll, el) { return isNil(coll) ? [el] : [el].concat(coll); }
});

extend(Vec, "Seq", {
  first: function(coll) { return coll.length ? coll.first() : new NIL(Vec); },
  rest: function(coll) { return coll.rest().length ? coll.rest().toVector() : new NIL(Vec); },
  cons: function(coll, el) { return isNil(coll) ? Vec(el) : Vec(el).concat(coll).toVector(); }
});

function map(fn, coll) {
  // Map a function over a collection.
  // Requires the collection implement the 'Seq' protocol
  switch(arguments.length) {
    case 1: // transducer
	return function(f1) {
	  return function(result, input) {
	    switch(arguments.length) {
	      case 0: return f1();
	      case 1: return f1(result);
	      case 2: return f1(result, fn(input));
	      default: return nil;
	    };
	  };
	};
    case 2: // regular coll map
	if (isNil(coll)) return coll;
	return Seq.cons(map(fn, Seq.rest(coll)), fn(Seq.first(coll)));
	// TODO: return a lazy sequence instead of eager cons
    default:
	return void 0;
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
    var iter = methods.values();
    for (var i = 0; i < methods.length; i++) {
      var signature = Map(iter.next().value);
      var keyset = signature.keySeq().toSet();
      valid = valid && equals(keyset, Set('doc', 'args'));
    }
    return valid;
  }
  function genfn(protocol, key) {
    var fnName = protocol + "#" + key;
    var fn = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var instance = args[0];
      var name = getName(instance);
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
    method["::meta"] = methods;
    doseq(methods.keys(), function(key) {
      method[key] = genfn(protocol, key);
    });
    protocols = protocols.set(protocol, method);
    protofns = protofns.set(method, Map());
    return protocols.get(protocol);
  }
}

function getName(x) {
  var name = x.constructor.name;
  if (name === "NIL") {
    name = x.type.name;
  }
  return name;
}

function extend(type, protocol, fns) {
  /*
   Extend a particular constructor with the implementation
   of a particular protocol. e.g.

   var Countable = defprotocol('Countable', {
     size: {
       doc: "returns the count of x",
       args: [ 'x' ]
     }
   });

   extend(Array, Countable, {
     size: function(x) { return x.length; }
   });

   extend(Object, Countable, {
     size: function(x) { return Object.keys(x).length; }
   });

   Countable.size([1,2,3]) === 3;
   Countable.size({a:1, b:2}) === 2;
   */
  var name = getName(new type()),
      key = protocols.get(protocol);
  if (key) {
    var impls = protofns.get(key);
    protofns = protofns.set(key, impls.set(name, Map(fns)));
  }
  return protofns.get(key);
}

function satisfies(protocol, x) {
  var name = getName(x);
  var impls = protofns.get(protocols.get(protocol));
  if (impls) {
    return !! impls.get(name);
  } else {
    return false;
  }
}

var module = module || {};

module.exports = {
  equals: Immutable.is,

  // iter / xform 
  doseq: doseq,
  map: map,

  // data structurs
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
