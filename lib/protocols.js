var proto = require("./proto"),
    defprotocol = proto.defprotocol;

var ISeq = defprotocol({
  seq: {
    doc: "Returns a seq on the collection. If the collection is empty, returns nil",
    args: ['coll']
  },
  first: {
    doc: "Returns the first item in the collection or the nil coll",
    args: ['coll']
  },
  rest: {
    doc: "Returns the rest of the collection or an empty coll",
    args: ['coll']
  },
  cons: {
    doc: "Constructs a new collection with x as the first element and coll as the rest",
    args: ['coll', 'x']
  }
});

var IPending = defprotocol({
  realized: {
    doc: "Returns true if a value is no longer pending.",
    args: ['x']
  }
});

module.exports = {
  ISeq: ISeq,
  IPending: IPending
}
