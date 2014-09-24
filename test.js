var assert = require("assert");
var should = require('should');

var ishtar = require("./core");
ishtar.exports(global);

describe('LazySeq', function() {
  describe('pending', function() {
    var lazy = map(function(x) { return x; }, [1,2,3]);
    realized(lazy).should.be.false;
    first(lazy);
    realized(lazy).should.be.true;
    realized(rest(lazy)).should.be.false;
    second(lazy);
    realized(rest(lazy)).should.be.true;
  });
});

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

describe('protocols', function(){

  var Seq = defprotocol({
    head: {
      doc: "return the first item of a sequence",
      args: [ self ]
    },
    tail: {
      doc: "return everything but the first item of a sequence",
      args: [ self ]
    }
  });

  describe('#defprotocol()', function(){
    it('can store and retrieve protocols', function(){
      (Seq).should.exist;
      (Seq).should.have.properties('head', 'tail');
    });
    it('only stores valid protocols', function() {
      should.not.exist(defprotocol('xxx'));
      should.not.exist(defprotocol({}));
    });
  });

  describe('#extend() #satisfies()', function() {
    it("extends a protocol", function() {
      satisfies(Seq, Vec()).should.be.false;
      extend(Vec, Seq, {
	    head: function(coll) {
	      return coll.first();
	    },
	    tail: function(coll) {
	      return coll.shift();
	    }
      });
      satisfies(Seq, Vec()).should.be.true;
      var list = Vec(1,2,3),
          hd = Seq.head(list),
	  tl = Seq.tail(list);
      hd.should.equal(1);
      equals(tl, Vec(2,3)).should.be.true;
    });
    it("throws for things that do not implement the protocol", function() {
      (function() { Seq.head([1,2,3]); }).should.throw();
      extend(Array, Seq, {
	head: function(x) { return x[0]; },
	tail: function(x) { return x.slice(1); }
      });
      Seq.tail([1,2,3]).should.eql([2,3]);
    });
  });

});
