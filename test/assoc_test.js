var assert = require("assert");
var should = require('should');

var ishtar = require("../core");
ishtar.exports(global);

describe('IAssociative', function() {
  it('works on Maps', function() {
    var a = Map({a: 1, b: 2});
    has(a, "a").should.be.true;
    has(a, "z").should.be.false;
    eq(set(a, "b", 1), Map({a: 1, b: 1})).should.be.true;
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

describe('mapKeys', function() {
  it('maps over keys', function() {
    var a = {a: 1, b: 2};
    into({}, mapKeys(function(x) { return x.toUpperCase() }), a).should.eql({A: 1, B: 2});
  });
});

describe('mapVals', function() {
  it('maps over vals', function() {
    var a = {a: 1, b: 2};
    into({}, mapVals(inc), a).should.eql({a: 2, b: 3});
  });
});


describe('getPath', function() {
  it('gets nested assocs by a path', function() {
    getPath({a: {b: 23}}, ['a', 'b']).should.eql(23);
    getPath({a: {b: 23}}, ['a', 'z']).should.eql(nil);
    getPath({a: {b: 23}}, ['a', 'b', 'c'], 42).should.eql(42);
  });
});
