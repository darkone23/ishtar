var assert = require("assert");
var should = require('should');

var ishtar = require("../core");
ishtar.exports(global);

describe('map', function() {

  it('works on arrays', function() {
    var mapped = map(function(x) { return x + 1; }, [1,2,3]);
    into([], mapped).should.eql([2,3,4]);
    first(mapped).should.eql(2);
  });

  it('works on objects', function() {
    var obj = {a: 1, b: 2, c: 3};
    var mapped = map(function(x) {
      return [ x[0], x[1] + 1 ];
    }, obj);
    into({}, mapped).should.eql({a:2, b:3, c:4});
    obj.should.eql({a:1, b:2, c:3});
  });

  it('works on Ranges', function() {
    var mapped = map(inc, Range(0,10));
    eq(range(1, 11), mapped).should.be.true;
  });

  it('works on Vectors', function() {
    var mapped = map(inc, Vector(1,2,3));
    eq(Vector(2,3,4), collect(mapped)).should.be.true;
  });

  it('works on Maps', function() {
    var mapped = map(function(entry) {
      var key = entry[0], val = entry[1];
      return [ key, val + 1 ];
    }, Map({a: 1, b: 2, c: 3}));
    eq(into(Map(), mapped), Map({a: 2, b: 3, c: 4})).should.be.true;
  });

  it('works on Sets', function() {
    var set = Set.from([1, 2, 3]),
        mapped = map(function(entry) {
          return entry * entry;
        }, set);
    eq(into(Set(), mapped), Set(1, 4, 9)).should.be.true;
  });
});

describe('concat', function() {
  it('lazily concatenates seqs', function() {
    var lst = concat(Set("a", "b", "c"), Vector(1, 2, 3));
    realized(lst).should.be.false;
    into([], lst).should.eql(["a", "b", "c", 1, 2, 3]);
    realized(lst).should.be.true;
  });
});

describe('filter', function() {
  it('filters by a predicate fn', function() {
    function odd(entry) { return entry[1] % 2; }
    into({}, filter(odd, {a: 1, b: 2, c: 3, d: 4})).should.eql({a: 1, c: 3});
  });
  it('works as a transducer', function() {
    function odd(x) { return x % 2; }
    into([], filter(odd), range(0, 4)).should.eql([1,3]);
  });
});

describe('remove', function() {
  it('removes by a predicate fn', function() {
    function odd(entry) { return entry[1] % 2; }
    into({}, remove(odd, {a: 1, b: 2, c: 3, d: 4})).should.eql({b: 2, d: 4});
  });
  it('works as a transducer', function() {
    function odd(x) { return x % 2; }
    into([], remove(odd), range(0, 4)).should.eql([0,2]);
  });
});

describe('comp', function() {
  it('composes functions', function() {
    var plusZero = comp(inc, dec);
    plusZero(3).should.equal(3);
  });
  it('works with many functions', function() {
    var pipeline = comp(
      function(n) { return n + 2; },
      function(n) { return n / 2; },
      function(n) { return n * n; },
      function(n) { return n + 1; } 
    );
    pipeline(1).should.equal(4);
  });
});

describe('each', function() {
  it('sequentially invokes fn', function() {
     var x = 0;
     each(range(10), function(n) { x += n; });
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
    take(0, range()).should.eql(Vector());;
    take(3, [0,1,2,3,4,5]).should.eql([0,1,2]);
    take(10, [0,1,2,3,4,5]).should.eql([0,1,2,3,4,5]);
  });
  it('works as a transducer', function() {
    into([], take(3), [1,2,3,4,5]).should.eql([1,2,3]);
  });
});

describe('takeWhile', function() {
  it('takes given a predicate function', function() {
    var nums = [1,1,2,3,4];
    takeWhile(function(n) { return n < 3; }, nums).should.eql([1,1,2]);
  });
  it('works as a transducer', function () {
    var lessThan6 = function lessThan6(x) { return x < 6; };
    into([], takeWhile(lessThan6), [2,3,4,5,6,7,8]).should.eql([2,3,4,5]);
  });
});

describe('drop', function() {
  it('drops from seqs', function() {
    drop(3, [0,1,2,3,4,5]).should.eql([3,4,5]);
    drop(10, [0,1,2,3,4,5]).should.eql([]);
  });
  it('works as a transducer', function() {
    transduce(drop(2), append, [], [1,2,3,4,5]).should.eql([3,4,5]);
  });
});

describe('dropWhile', function() {
  it('drops while a predicate holds', function() {
    dropWhile(function(n) { return n <= 5; }, [1,2,3,4,5,6,7,8,9]).should.eql([6,7,8,9]);
  });
  it('drops while works a transducer', function() {
    transduce(dropWhile(function(n) { return n <= 5; }), append, [], [1,2,3,4,5,6,7,8,9]).should.eql([6,7,8,9]);
  });
});

describe('range', function() {
  it('returns a lazy range of numbers', function() {
    var threes = range(0, 100, 3);
    eq(take(5, threes), Vector(0, 3, 6, 9, 12)).should.be.true;
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
    eq(take(10, fibs), Vector(0, 1, 1, 2, 3, 5, 8, 13, 21, 34)).should.be.true;
  });
});

describe('transduce', function() {
  describe('map transducer', function() {
    it('works as a transducer', function() {
      var inc = map(function(x) { return x+1; });
      var mapped = transduce(inc, append, Vector(), Vector(1,2,3));
      eq(collect(mapped), Vector(2,3,4)).should.be.true;
    });
    it('works without an initial value', function() {
      var inc = map(function(x) { return x+1; });
      var mapped = transduce(inc, append, Vector(1,2,3));
      eq(collect(mapped), Vector(2,3,4)).should.be.true;
    });
  });
});

describe('mapcat', function() {
  it('transduces by reducing', function() {
    var pair = function(x) { return [ x, x ]; };
    var repeating = mapcat(pair);
    transduce(repeating, append, [], [1,2,3]).should.eql([1,1,2,2,3,3]);;
  });
  it('can escape from infinite lists', function() {
    var expected = 4, counter = 0;
    var ensureLaziness = function(step) {
      return function(x, y) {
	if (++counter > expected) throw new Error("transducer isn't lazy");
	return step(x, y);
      };
    };
    var pair = function(x) { return Vector(x, x); };
    var square = function(x) { return x * x; };
    var xform = comp(
      ensureLaziness,
      mapcat(pair),
      map(square),
      drop(expected - 1),
      take(expected)
    );
    eq(transduce(xform, append, range()), Vector(1,4,4,9)).should.be.true;
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

describe('take-nth', function () {
  it('creates a sequence of every nth element in the collection', function () {
    var result = takeNth(2, [0,1,2,3,4,5,6,7,8,9]);
    into([], result).should.eql([0,2,4,6,8]);

    var cycled = takeNth(2, cycle(['a', 'b', 'c']));
    into([], take(4, cycled)).should.eql(['a','c','b','a']);
  });
  it('works as a transducer', function () {
    transduce(takeNth(2), append, [], [0,1,2,3,4,5]).should.eql([0,2,4]);
  });
});

describe('cycle', function () {
  it('produces a sequence which is the repetition of the items in the collection', function () {
    var collection = [1,2,3],
        cycled = cycle(collection);
    eq(take(6, cycled), Vector(1,2,3,1,2,3)).should.be.true;
    eq(take(12, cycled), Vector(1,2,3,1,2,3,1,2,3,1,2,3)).should.be.true;
  });
});
