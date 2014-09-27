var Immutable = require("immutable"),
    Vector = Immutable.Vector,
    Map = Immutable.Map,
    Set = Immutable.Set,
    IndexedSequence = Immutable.Vector().rest().constructor,
    Sequence = Immutable.Sequence,
    equals = Immutable.is;

var nil = require("./nil");

var proto = require("./proto"),
    extend = proto.extend;

var protocols = require("./protocols"),
    ISeq = protocols.ISeq,
    IPending = protocols.IPending,
    IAppend = protocols.IAppend,
    IWrap = protocols.IWrap,
    ICollection = protocols.ICollection;

var seq = ISeq.seq,
    first = ISeq.first,
    rest = ISeq.rest,
    cons = ISeq.cons;

extend(Array, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll[0] : nil; },
  rest: function(coll) { return coll.slice(1); },
  cons: function(el, coll) { return [el].concat(coll); }
});

extend(Array, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return []; }
});

extend(Array, IAppend, {
  conj: function(coll, el) { return coll.concat([el]); }
});

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

extend(Vector, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Vector(el).concat(coll); }
});

extend(Vector, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return Vector(); }
});

extend(Vector, IAppend, {
  conj: function(coll, el) { return coll.push(el); }
});

extend(IndexedSequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Vector(el).concat(coll); }
});

extend(IndexedSequence, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return new Vector(); }
});

extend(Sequence, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest(); },
  cons: function(el, coll) { return Sequence(el).concat(coll); }
});

extend(Set, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) { return coll.length ? coll.first() : nil; },
  rest: function(coll) { return coll.rest().toSet(); },
  cons: function(el, coll) { return coll.add(el); }
});

extend(Map, ISeq, {
  seq: function(coll) { return coll.length ? coll : nil; },
  first: function(coll) {
    if (coll.length) {
      var next = coll.entries().next();
      if (! next.done) {
	var key = next.value[0], val = next.value[1];
	return [key, val];
      }
    }
    return nil;
  },
  rest: function(coll) {
    if (coll.rest().length) return coll.rest().toMap();
    return Map();
  },
  cons: function(el, coll) {
    return coll.set(el[0], el[1]);
  }
});

extend(Map, ICollection, {
  count: function(coll) { return coll.length; },
  empty: function(coll) { return Map(); }
});

extend(Cons, ISeq, {
  seq: function(coll) { return coll; },
  first: function(coll) { return coll.el; },
  rest: function(coll) { return coll.coll; },
  cons: function(el, coll) { return Cons(el, coll); }
});

extend(Cons, ICollection, {
  count: function(coll) { return 1 + count(coll.coll); },
  empty: function(coll) { return Vector(); }
});

extend(LazySeq, ISeq, {
  seq: function(coll) {
    return coll.step();
  },
  first: function(coll) { 
    coll.step();
    return first(coll.seq);
  },
  rest: function(coll) { 
    coll.step();
    return rest(coll.seq);
  },
  cons: function(el, coll) {
    return Cons(el, coll);
  }
});

extend(LazySeq, ICollection, {
  count: function(coll) {
    var c = 0;
    for(var s = seq(coll); s !== nil; s = rest(s)) c += 1;
    return c;
  },
  empty: function(coll) {
    return Vector();
  }
});

extend(LazySeq, IPending, {
  realized: function(coll) { return coll.fn === nil; }
});

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

function Cons(el, coll) {
  if (!(this instanceof $Cons)) {
    return new $Cons(el, coll);
  }
  this.el = el;
  this.coll = coll;
}
var $Cons = Cons;

function LazySeq(fn) {
  if (!(this instanceof $LazySeq)) {
    return new $LazySeq(fn);
  }
  this.fn = fn;
  this.seq = nil;
  this.cache = nil;
}
var $LazySeq = LazySeq;
LazySeq.prototype.getCache = function() {
  if (this.fn !== nil) {
    this.cache = this.fn();
    this.fn = nil;
  }
  if (this.cache !== nil) return this.cache;
  return this.seq;
}
LazySeq.prototype.step = function() {
  this.getCache();
  if (this.cache !== nil) {
    var step = this.cache;
    this.cache = nil;
    while(step instanceof $LazySeq) {
      step = step.getCache();
    }
    this.seq = seq(step);
  }
  return this.seq;
}

module.exports = {
  Map: Immutable.Map,
  Set: Immutable.Set,
  Vector: Immutable.Vector,
  LazySeq: LazySeq,
  Reduced: Reduced
};
