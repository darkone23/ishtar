var assert = require("assert");
var should = require('should');

var ishtar = require("../core");
ishtar.exports(global);

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
      satisfies(Seq, Vector()).should.be.false;
      extend(Vector, Seq, {
	    head: function(coll) {
	      return coll.first();
	    },
	    tail: function(coll) {
	      return coll.shift();
	    }
      });
      satisfies(Seq, Vector()).should.be.true;
      var list = Vector(1,2,3),
          hd = Seq.head(list),
	  tl = Seq.tail(list);
      hd.should.equal(1);
      equals(tl, Vector(2,3)).should.be.true;
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
