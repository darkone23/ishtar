var dispatch = require("./dispatch"),
    extend = dispatch.extend;

var protocols = require("./protocols"),
    IWrap = protocols.IWrap;

extend(Reduced, IWrap, {
  unwrap: function(coll) { return coll.val; }
});

function Reduced(x) {
  if (!(this instanceof $Reduced)) {
    return new $Reduced(x);
  }
  this.val = x;
}
var $Reduced = Reduced;

function isReduced(x) {
  return (x instanceof Reduced);
}

module.exports = {
  Reduced: Reduced,
  isReduced: isReduced
}
