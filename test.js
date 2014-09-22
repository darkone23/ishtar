var assert = require("assert");
var ishtar = require("./core");
var should = require('should');

ishtar.exports(global);

describe('protocols', function(){

  var Seq = defprotocol('seq', {
    head: {
      doc: "return the first item of a sequence",
      args: [ 'coll' ]
    },
    tail: {
      doc: "return everything but the first item of a sequence",
      args: [ 'coll' ]
    }
  });

  describe('#defprotocol() #getprotocol()', function(){
    it('can store and retrieve protocols', function(){
      getprotocol('seq').should.equal(Seq);
      (Seq).should.exist;
      (Seq).should.have.properties('head', 'tail');
      should.not.exist(getprotocol('bzzt'));
    });
    it('only stores valid protocols', function() {
      should.not.exist(defprotocol('xxx'));
      should.not.exist(getprotocol('xxx'));
    });
  });

  describe('#extend() #satisfies()', function() {
    it("extends a protocol", function() {
      satisfies('seq', vec()).should.be.false;
      extend(vec, 'seq', {
	head: function(coll) {
	  return coll.first();
	},
	tail: function(coll) {
	  return coll.shift();
	}
      });
      satisfies('seq', vec()).should.be.true;
      var list = vec(1,2,3),
          hd = Seq.head(list),
	  tl = Seq.tail(list);
      hd.should.equal(1);
      equals(tl, vec(2,3)).should.be.true;
    });
    it("throws for things that do not implement the protocol", function() {
      (function() { Seq.head([1,2,3]) }).should.throw();
      extend(Array, 'seq', {
	head: function(x) { return x[0]; },
	tail: function(x) { return x.slice(1); }
      });
      Seq.tail([1,2,3]).should.eql([2,3]);
    });
  });
});
