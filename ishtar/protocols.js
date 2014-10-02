var dispatch = require("./dispatch"),
    defprotocol = dispatch.defprotocol,
    self = dispatch.self;

var ISeq = defprotocol({
  seq: {
    doc: "Returns a seq on the collection. If the collection is empty, returns nil",
    args: [ self ]
  },
  first: {
    doc: "Returns the first item in the collection",
    args: [ self ]
  },
  rest: {
    doc: "Returns the rest of the collection or an empty coll",
    args: [ self ]
  },
  cons: {
    doc: "Constructs a new collection with x as the first element and coll as the rest",
    args: [ 'x', self ]
  }
});

var IPending = defprotocol({
  realized: {
    doc: "Returns true if a value is no longer pending.",
    args: [ self ]
  }
});

var ICountable = defprotocol({
  count: {
    doc: "Return the size of the collection",
    args: [ self ]
  }
});

var IAssociative = defprotocol({
  has: {
    doc: "Returns true if associative contains an entry at key",
    args: [ self, 'key' ]
  },
  set: {
    doc: "Returns an associative with the key set to val",
    args: [ self, 'key', 'val' ]
  },
  get: {
    doc: "Returns the value at key, or the default",
    args: [ self, 'key', 'default' ]
  }
});

var IAppend = defprotocol({
  append: {
    doc: "append an element to the collection",
    args: [ self, "el" ]
  },
  empty: {
    doc: "Return an empty collection",
    args: [ self ]
  }
});

var IWrap = defprotocol({
  unwrap: {
    doc: "unwrap a wrapped or deferred value",
    args: [ self ]
  }
});

module.exports = {
  ISeq: ISeq,
  ICountable: ICountable,
  IAssociative: IAssociative,
  IPending: IPending,
  IWrap: IWrap,
  IAppend: IAppend
};
