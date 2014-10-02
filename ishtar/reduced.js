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

Reduced.prototype.toString = function toString() {
  return "Reduced [" + this.val + " ]";
};
Reduced.prototype.inspect = Reduced.prototype.toString;


function isReduced(x) {
  return (x instanceof Reduced);
}

module.exports = {
  Reduced: Reduced,
  isReduced: isReduced
};
