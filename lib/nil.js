// represents nothingness, not there (next element of an empty list)
var dispatch = require("./dispatch"),
    extend = dispatch.extend;

var protocols = require("./protocols"),
    ISeq = protocols.ISeq;

function NIL() {}

NIL.prototype.toString = function toString() {
  return "nil";
};
NIL.prototype.inspect = NIL.prototype.toString;

var nil = new NIL();

extend(NIL, ISeq, {
  seq: function(coll) { return nil; },
  first: function(coll) { throw new Error("Cannot take first of nil"); },
  rest: function(coll) { throw new Error("Cannot take rest of nil"); },
  cons: function(el, coll) { return Vector(el); }
});

module.exports = nil;
