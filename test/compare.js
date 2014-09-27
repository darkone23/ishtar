// npm install mori lodash
// node test/compare

/*
Naive comparison of performance between lodash, mori, and ishtar
Granted, the projects have different goals - still we don't want to be unnecessarily slow.
*/

var x = 100000;
console.log("Running 100k transformations each");

/* =============================
L O D A S H ====================
============================= */
var _ = require("lodash");
var lstart = new Date();
_.first(_.drop(_.map(_.range(0, x+1), function(x) { return x - 1; }), x));
var lend = new Date();
console.log("lodash:", lend - lstart + "ms");

/* =============================
I M M U T A B L E ==============
============================= */
var Immutable = require("immutable");
var imstart = new Date();
Immutable.Vector.from(Immutable.Range(0, x+1)).map(function(x) { return x - 1; }).skip(x).first();
var imend = new Date();
console.log("immutable-js:", (imend - imstart) + "ms");

/* =============================
I S H T A R ====================
============================= */
var ishtar = require("../core");
var istart = new Date();
var xform = ishtar.compose(ishtar.drop(x), ishtar.map(ishtar.dec));
ishtar.first(ishtar.transduce(xform, ishtar.conj, ishtar.range(0, x+1)));
var iend = new Date();
console.log("ishtar:", iend - istart + "ms");

/* =============================
M O R I ========================
============================= */
var mori = require("mori");
var mstart = new Date();
mori.first(mori.drop(x, mori.map(mori.dec,  mori.iterate(mori.inc, 0))));
var mend = new Date();
console.log("mori:", (mend - mstart) + "ms");
