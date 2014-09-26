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
          return entry * 2;
        }, set);
    equals(doall(mapped), Set([2, 3, 4]));
  });
});

describe('doseq', function() {
  it('sequentially invokes fn', function() {
     var x = 0;
     doseq(range(10), function(n) { x += n; })
     x.should.equal(45);
  });
});


describe('take', function() {
  it('takes from seqs', function() {
    take(3, [0,1,2,3,4,5]).should.eql([0,1,2]);
    take(10, [0,1,2,3,4,5]).should.eql([0,1,2,3,4,5]);
  });
});

describe('takeWhile', function() {
  it('takes given a predicate function', function() {
    var nums = [1,1,2,3,4];
    takeWhile(function(n) { return n < 3; }, nums).should.eql([1,1,2]);
  });
});

describe('drop', function() {
  it('drops from seqs', function() {
    drop(3, [0,1,2,3,4,5]).should.eql([3,4,5]);
    drop(10, [0,1,2,3,4,5]).should.eql([]);
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
