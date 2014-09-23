// represents nothingness, not there (next element of an empty list)

function NIL() {};

NIL.prototype.toString = function toString() {
  return "nil";
};

var nil = new NIL();

module.exports = nil;
