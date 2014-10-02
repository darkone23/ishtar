// represents nothingness, not there (next element of an empty list)
var dispatch = require("./dispatch"),
    extend = dispatch.extend;

var protocols = require("./protocols"),
    IAppend = protocols.IAppend,
    ICountable = protocols.ICountable,
    ISeq = protocols.ISeq;

var Cons = require("./collections/Cons");

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
  cons: function(el, coll) { return Cons(el, nil); }
});

extend(NIL, IAppend, {
  append: function(coll) { return Cons(el, nil); },
  empty: function(coll) { return nil; },
});

extend(NIL, ICountable, {
  count: function(coll) { return 0; },
});

module.exports = nil;
