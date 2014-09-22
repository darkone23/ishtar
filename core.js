"use strict";

var Immutable = require("immutable"),
    seq = Immutable.Sequence,
    vec = Immutable.Vector,
    set = Immutable.Set,
    map = Immutable.Map,
    equals = Immutable.is;

var protocols = map();
var protofns = map();

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
      var signature = map(iter.next().value);
      var keyset = signature.keySeq().toSet();
      valid = valid && equals(keyset, set('doc', 'args'));
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

  methods = map(methods);
  if (valid(methods)) {
    var method = {};
    method["::meta"] = methods;
    doseq(methods.keys(), function(key) {
      method[key] = genfn(protocol, key);
    });
    protocols = protocols.set(protocol, method);
    protofns = protofns.set(method, map());
    return protocols.get(protocol);
  }
}

function getName(x) {
  return x.constructor.name;
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
    protofns = protofns.set(key, impls.set(name, map(fns)));
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
  map: Immutable.Map,
  vec: Immutable.Vector,
  defprotocol: defprotocol,
  getprotocol: getprotocol,
  extend: extend,
  satisfies: satisfies,
  exports: function(obj) {
    Object.keys(module.exports).forEach(function(key) {
      obj[key] = module.exports[key];
    });
  }
};
