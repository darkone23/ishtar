var dispatch = require("./dispatch"),
    defprotocol = dispatch.defprotocol,
    self = dispatch.self;

var ISeq = defprotocol({
  seq: {
    doc: "Returns a seq on the collection. If the collection is empty, returns nil",
    args: [ self ]
  },
  first: {
    doc: "Returns the first item in the collection or the nil coll",
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

var ICollection = defprotocol({
  count: {
    doc: "Return the size of the collection",
    args: [ self ]
  },
  empty: {
    doc: "Return an empty collection",
    args: [ self ]
  }
});

var IAppend = defprotocol({
  conj: {
    doc: "append an element to the collection",
    args: [ self, "el" ]
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
  ICollection: ICollection,
  IPending: IPending,
  IWrap: IWrap,
  IAppend: IAppend
}

