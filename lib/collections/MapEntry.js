var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ICountable = protocols.ICountable,
    ISeq = protocols.ISeq;

var nil = require("../nil");

extend(MapEntry, ICountable, {
 count: function(coll) {
    return (coll.val === nil) ? 1 : 2;
  }
});

extend(MapEntry, ISeq, {
  seq: function(coll) {
    return (coll.val === nil) ? nil : coll;
  },
  first: function(coll) { 
    return coll.key;
  },
  rest: function(coll) { 
    return MapEntry(coll.val, nil);
  },
  cons: function(el, coll) {
    throw new Error("not implemented: cons onto a map entry");
  }
});

function MapEntry(key, val) {
  if (!(this instanceof $MapEntry)) {
    return new $MapEntry(key, val);
  }
  this[0] = this.key = key;
  this[1] = this.val = val;
}
var $MapEntry = MapEntry;

MapEntry.prototype.toString = function() {
  return "MapEntry [" + this.key + ", " + this.val + " ]";
}
MapEntry.prototype.inspect = MapEntry.prototype.toString;

module.exports = MapEntry;
