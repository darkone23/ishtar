var assert = require("assert");
var should = require('should');

var ishtar = require("../core");
ishtar.exports(global);

describe('IAssociative', function() {
  it('works on Maps', function() {
    var a = Map({a: 1, b: 2});
    has(a, "a").should.be.true;
    has(a, "z").should.be.false;
    equals(set(a, "b", 1), Map({a: 1, b: 1})).should.be.true;
    get(a, "b").should.eql(2);
  });
  it('works on Objects', function() {
    var a = {a: 1, b: 2};
    has(a, "a").should.be.true;
    has(a, "z").should.be.false;
    set(a, "b", 1).should.eql({a: 1, b: 1});
    get(a, "b").should.eql(2);
  });
});

describe('getPath', function() {
  it('gets nested assocs by a path', function() {
    getPath({a: {b: 23}}, ['a', 'b']).should.eql(23);
    getPath({a: {b: 23}}, ['a', 'z']).should.eql(nil);
    getPath({a: {b: 23}}, ['a', 'b', 'c'], 42).should.eql(42);
  });
});
