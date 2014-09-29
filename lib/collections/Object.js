var dispatch = require("../dispatch"),
    extend = dispatch.extend;

var protocols = require("../protocols"),
    ISeq = protocols.ISeq,
    IAppend = protocols.IAppend,
    ICollection = protocols.ICollection;

extend(Object, ISeq, {
  seq: function(coll) { return Object.keys(coll).length ? coll : nil; },
  first: function(coll) {
    var keys = Object.keys(coll);
    if (keys.length) {
      return [keys[0], coll[keys[0]]];
    } else {
      return nil;
    }
  },
  rest: function(coll) {
    var keys = Object.keys(coll);
    if (keys.length) {
      var obj = Object.create(coll.prototype || Object.prototype);
      keys.slice(1).forEach(function(key) {
	obj[key] = coll[key];
      });
      return obj;
    } else {
      return {};
    }
  },
  cons: function(el, coll) {
    var key = el[0], val = el[1];
    var obj = Object.create(coll.prototype || Object.prototype);
    Object.keys(coll).forEach(function(key) {
      obj[key] = coll[key];
    });
    obj[key] = val;
    return obj;
  }
});

extend(Object, ICollection, {
  count: function(coll) { return Object.keys(coll).length; },
  empty: function(coll) { return {}; }
});

extend(Object, IAppend, {
  conj: function(coll, el) { return cons(el, coll); }
});

module.exports = Object;
