// npm install mori lodash
// node test/compare

/*
Naive comparison of performance between lodash, mori, and ishtar
Granted, the projects have different goals - still we don't want to be unnecessarily slow.
*/

/* =============================
L O D A S H ====================
============================= */
var _ = require("lodash");
var lstart = new Date();
_.first(_.drop(_.map(_.range(0, 100001), function(x) { return x - 1; }), 100000));
var lend = new Date();
console.log("lodash:", lend - lstart + "ms");

/* =============================
I S H T A R ====================
============================= */
var ishtar = require("../core");
var istart = new Date();
ishtar.first(ishtar.drop(100000, ishtar.map(ishtar.dec, ishtar.iterate(ishtar.inc, 0))));
var iend = new Date();
console.log("ishtar:", iend - istart + "ms");

/* =============================
M O R I ========================
============================= */
var mori = require("mori");
var mstart = new Date();
mori.first(mori.drop(100000, mori.map(mori.dec,  mori.iterate(mori.inc, 0))));
var mend = new Date();
console.log("mori:", (mend - mstart) + "ms");
