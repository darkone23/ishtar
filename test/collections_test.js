var assert = require("assert");
var should = require('should');

var ishtar = require("../ishtar");
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
