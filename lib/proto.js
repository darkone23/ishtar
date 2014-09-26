var Immutable = require("immutable"),
    Map = Immutable.Map,
    Set = Immutable.Set;

var protofns = [];

function Self() {};
var self = new Self();

function iter(seq, fn) {
  for (var step = seq.next(); ! step.done; step = seq.next()) {
    fn.call(null, step.value);
  }
}

var protocol_id = 0;
function defprotocol(methods) {
  function valid(methods) {
    valid = true;
    valid = valid && methods.length > 0;
    iter(methods.values(), function(val) {
      var defn = Map(val);
      var keyset = defn.keySeq().toSet();
      valid = valid && Immutable.is(keyset, Set('doc', 'args'));
      valid = valid && defn.get('args').indexOf(self) !== -1;
    });
    return valid;
  }
  function genfn(protocol, method, index) {
    var protocol = protofns[protocol["::id"]];
    var fn = function(/* args */) {
      var dispatch = arguments[index].constructor.name;
      var fns = protocol[dispatch];
      if (fns) {
        return fns[method].apply(null, arguments);
      } else {
        throw new Error(dispatch + " does not implement " + method);
      }
    };
    fn.name = method;
    return fn;
  }
  methods = Map(methods);
  if (valid(methods)) {
    var protocol = [];
    protocol["::def"] = methods;
    protocol["::id"] = ++protocol_id;
    protofns[protocol_id] = [];
    iter(methods.keys(), function(method) {
      var index = methods.get(method)['args'].indexOf(self);
      protocol[method] = genfn(protocol, method, index);
    });
    return protocol;
  }
}

function extend(type, protocol, fns) {
  // extend a protocol for a type
  if (! protocol["::def"]) throw new Error("Must extend an existing prototype");
  if (typeof type === "undefined") throw new Error("Cannot extend undefined");
  var dispatchName = type.name || (new type).constructor.name;
  var impls = protofns[protocol["::id"]];
  impls[dispatchName] = fns;
  return protocol;
}

function satisfies(protocol, x) {
  // Returns true if x satisfies a given protocol
  var name = x.constructor.name;
  var impls = protofns[protocol["::id"]];
  return !! (impls && impls[name]);
}

module.exports = {
  defprotocol: defprotocol,
  self: self,
  extend: extend,
  satisfies: satisfies
}
