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
  it('works on Vectors', function() {
    var mapped = map(function(x) { return x + 1; }, Vec(1,2,3));
    equals(doall(mapped), Vec(2,3,4)).should.be.true;
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
