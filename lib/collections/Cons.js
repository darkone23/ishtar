var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable;

extend(Cons, ISeq, {
  seq: function(coll) { return coll; },
  first: function(coll) { return coll.el; },
  rest: function(coll) { return coll.coll; },
  cons: function(el, coll) { return Cons(el, coll); }
});

extend(Cons, IAppend, {
  append: function(coll, el) { return ISeq.cons(el, coll); },
  empty: function(coll) { return Vector(); }
});

extend(Cons, ICountable, {
  count: function(coll) { return 1 + ICountable.count(coll.coll) }
});

function Cons(el, coll) {
  if (!(this instanceof $Cons)) {
    return new $Cons(el, coll);
  }
  this.el = el;
  this.coll = coll;
}
var $Cons = Cons;
Cons.prototype.toString = function() {
  var sequence = (this.coll === nil) ? "nil" : "rest...";
  return "cons " + this.el + " ∘ " + sequence;
};
Cons.prototype.inspect = Cons.prototype.toString;

module.exports = Cons;
