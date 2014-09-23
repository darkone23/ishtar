var Immutable = require("immutable"),
    Map = Immutable.Map,
    Set = Immutable.Set;

var protofns = Map();

function iter(seq, fn) {
  for (var step = seq.next(); ! step.done; step = seq.next()) {
    fn.call(null, step.value);
  }
}

function defprotocol(methods) {
  function valid(methods) {
    valid = true;
    valid = valid && methods.length > 0;
    iter(methods.values(), function(val) {
      var keyset = Map(val).keySeq().toSet();
      valid = valid && Immutable.is(keyset, Set('doc', 'args'));
    });
    return valid;
  }
  function genfn(protocol, key) {
    var fn = function(instance) {
      var args = Array.prototype.slice.call(arguments, 0);
      var name = getDispatchName(instance);
      try {
	var impl = protofns.get(protocol).get(name).get(key);
      } catch (e) {
	throw new Error(name + " does not implement " + key);
      }
      return impl.apply(null, args);
    };
    fn.name = key;
    return fn;
  }
  methods = Map(methods);
  if (valid(methods)) {
    var protocol = {};
    protocol["::def"] = methods;
    iter(methods.keys(), function(key) {
      protocol[key] = genfn(protocol, key);
    });
    protofns = protofns.set(protocol, Map());
    return protocol;
  }
}

function extend(type, protocol, fns) {
  // extend a protocol for a type
  if (! protocol["::def"]) throw new Error("Must extend an existing prototype");
  var dispatchName = type.name || getDispatchName(new type);
  var impls = protofns.get(protocol);
  protofns = protofns.set(protocol, impls.set(dispatchName, Map(fns)));
  return protocol;
}

function satisfies(protocol, x) {
  // Returns true if x satisfies a given protocol
  var name = getDispatchName(x);
  var impls = protofns.get(protocol);
  return !! (impls && impls.get(name));
}

function getDispatchName(x) {
  return x.constructor.name;
}

module.exports = {
  defprotocol: defprotocol,
  extend: extend,
  satisfies: satisfies
}
