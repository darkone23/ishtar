var assert = require("assert");
var should = require('should');

var ishtar = require("../core");
ishtar.exports(global);

describe('map', function() {

  it('works on arrays', function() {
    var mapped = map(function(x) { return x + 1; }, [1,2,3]);
    doall(mapped).should.eql([2,3,4]);
    first(mapped).should.eql(2);
  });

  it('works on objects', function() {
    var obj = {a: 1, b: 2, c: 3};
    var mapped = map(function(x) {
      return MapEntry(x.key, x.val+1);
    }, obj);
    doall(mapped).should.eql({a:2, b:3, c:4});
    obj.should.eql({a:1, b:2, c:3});
  });

  it('works on Vectors', function() {
    var mapped = map(function(x) { return x + 1; }, Vec(1,2,3));
    equals(doall(mapped), Vec(2,3,4)).should.be.true;
  });

  it('works on Maps', function() {
    var mapped = map(function(entry) {
      var key = entry.key, val = entry.val;
      return MapEntry(key, val + 1);
    }, Map({a: 1, b: 2, c: 3}));
    equals(doall(mapped), Map({a: 2, b: 3, c: 4}));
  });

  it('works on Sets', function() {
    var set = Set.from([1, 2, 3]),
        mapped = map(function(entry) {
          return entry * entry;
        }, set);
    equals(doall(mapped), Set(1, 4, 9)).should.be.true;
  });
});

describe('compose', function() {
  it('composes functions', function() {
    var plusZero = compose(inc, dec);
    plusZero(3).should.equal(3);
  });
  it('works with many functions', function() {
    var pipeline = compose(
      function(n) { return n + 2; },
      function(n) { return n / 2; },
      function(n) { return n * n; },
      function(n) { return n + 1; } 
    );
    pipeline(1).should.equal(4);
  });
});

describe('doseq', function() {
  it('sequentially invokes fn', function() {
     var x = 0;
     doseq(range(10), function(n) { x += n; });
     x.should.equal(45);
  });
});

describe('reduce', function() {
  it('reduces sequences', function() {
     // no initial value
     var x = reduce(function(x, y) { return x+y; }, range(10));
     x.should.equal(45);

     // empty sequence
     var y = reduce(function() { return 23; }, []);
     y.should.equal(23);

     // sequence of only one item (already reduced)
     var z = reduce(null, [1]);
     z.should.equal(1);

     // initial value and sequence
     var reduced = reduce(function(x, y) { return x+y; }, -45, range(10));
     reduced.should.equal(0);

     // initial value and empty sequence
     var init = reduce(null, 42, {});
     init.should.equal(42);
  });
  it('is interruptable', function() {
    var counter = 0;
    var reducer = function() { return (counter++ == 50) ? Reduced("interrupt") : "continue"; };
    reduce(reducer, 0, range(10)).should.equal("continue");
    reduce(reducer, range()).should.equal("interrupt");
  });
});

describe('take', function() {
  it('takes from seqs', function() {
    take(0, range()).should.eql(Vec());;
    take(3, [0,1,2,3,4,5]).should.eql([0,1,2]);
    take(10, [0,1,2,3,4,5]).should.eql([0,1,2,3,4,5]);
  });
  it('works as a transducer', function() {
    transduce(take(3), conj, [], [1,2,3,4,5]).should.eql([1,2,3]);
  });
});

describe('takeWhile', function() {
  it('takes given a predicate function', function() {
    var nums = [1,1,2,3,4];
    takeWhile(function(n) { return n < 3; }, nums).should.eql([1,1,2]);
  });
  it('works as a transducer', function () {
    var lessThan6 = function lessThan6(x) { return x < 6; };
    transduce(takeWhile(lessThan6), conj, [], [2,3,4,5,6,7,8]).should.eql([2,3,4,5]);
  });
});

describe('drop', function() {
  it('drops from seqs', function() {
    drop(3, [0,1,2,3,4,5]).should.eql([3,4,5]);
    drop(10, [0,1,2,3,4,5]).should.eql([]);
  });
  it('works as a transducer', function() {
    transduce(drop(2), conj, [], [1,2,3,4,5]).should.eql([3,4,5]);
  });
});

describe('range', function() {
  it('returns a lazy range of numbers', function() {
    var threes = range(0, 100, 3);
    equals(take(5, threes), Vec(0, 3, 6, 9, 12)).should.be.true;
  });
});

describe('iterate', function() {
  it('generates lazy sequences', function() {
    var seed = [0,1];
    var step = function(pair) {
      var x = pair[0], y = pair[1];
      return [y, x+y];
    };
    var fibs = map(first, iterate(step, seed));
    count(take(10, fibs)).should.equal(10);
    equals(take(10, fibs), Vec(0, 1, 1, 2, 3, 5, 8, 13, 21, 34)).should.be.true;
  });
});

describe('transduce', function() {
  describe('map transducer', function() {
    it('works as a transducer', function() {
      var inc = map(function(x) { return x+1; });
      var mapped = transduce(inc, conj, Vec(), Vec(1,2,3));
      equals(doall(mapped), Vec(2,3,4)).should.be.true;
    });
    it('works without an initial value', function() {
      var inc = map(function(x) { return x+1; });
      var mapped = transduce(inc, conj, Vec(1,2,3));
      equals(doall(mapped), Vec(2,3,4)).should.be.true;
    });
  });
});

describe('mapcat', function() {
  it('transduces by reducing', function() {
    var pair = function(x) { return [ x, x ]; };
    var repeating = mapcat(pair);
    transduce(repeating, conj, [], [1,2,3]).should.eql([1,1,2,2,3,3]);;
  });
  it('can escape from infinite lists', function() {
    var expected = 4, counter = 0;
    var ensureLaziness = function(step) {
      return function(x, y) {
	if (++counter > expected) throw new Error("transducer isn't lazy");
	return step(x, y);
      };
    };
    var pair = function(x) { return Vec(x, x); };
    var square = function(x) { return x * x; };
    var xform = compose(
      ensureLaziness,
      mapcat(pair),
      map(square),
      drop(expected - 1),
      take(expected)
    );
    equals(transduce(xform, conj, range()), Vec(1,4,4,9)).should.be.true;
  });
});

describe('Reduced', function () {
  it('isReduced', function () {
    var reduced = Reduced(3);
    isReduced(reduced).should.be.true;
  });
  it('unwrap', function () {
    var reduced = Reduced(3);
    unwrap(reduced).should.equal(3);
  });
});
