module.exports = {
  // plain js types
  Array: require("./collections/Array"),
  Object: require("./collections/Object"),

  // immutable js types
  Map: require("./collections/Map"),
  Set: require("./collections/Set"),
  Vector: require("./collections/Vector"),
  Range: require("./collections/Range"),

  // lazy sequence
  LazySeq: require("./collections/LazySeq"),

  // assoc helper
  MapEntry: require("./collections/MapEntry")
};
