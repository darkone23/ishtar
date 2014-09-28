// npm install mori lodash
// node test/compare

/*
Naive comparison of performance between lodash, mori, and ishtar
Granted, the projects have different goals - still we don't want to be unnecessarily slow.
*/

var x = 100000;
console.log("Running 100k transformations each");
console.log("=================================");
console.log();

var odd = function(x) { return x % 2 == 0; };

/* =============================
L O D A S H ====================
============================= */
var _ = require("lodash");
var lstart = new Date();
_.first(_.drop(_.filter(_.map(_.range(0, x+1), function(x) { return x - 1; }), odd), x / 4));
var lend = new Date();
console.log("lodash:", lend - lstart + "ms");

/* =============================
I M M U T A B L E ==============
============================= */
var Immutable = require("immutable");
var imstart = new Date();
Immutable.Range(0, x+1).map(function(x) { return x - 1; }).filter(odd).skip(x / 4).first();
var imend = new Date();
console.log("immutable-js:", (imend - imstart) + "ms");

/* =============================
I S H T A R ====================
============================= */
var ishtar = require("../core");
var istart = new Date();
var xform = ishtar.compose(ishtar.drop(x / 4), ishtar.map(ishtar.dec), ishtar.filter(odd), ishtar.take(1));
ishtar.transduce(xform, ishtar.conj, ishtar.Range(0, x+1)).first();
var iend = new Date();
console.log("ishtar:", iend - istart + "ms");

/* =============================
M O R I ========================
============================= */
var mori = require("mori");
var mstart = new Date();
mori.first(mori.drop(x/4, mori.filter(odd, mori.map(mori.dec,  mori.range(0, x+1)))));
var mend = new Date();
console.log("mori:", (mend - mstart) + "ms");
