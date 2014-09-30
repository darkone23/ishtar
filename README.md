### ishtar

ishtar is a functional programming library with an emphasis on immutability & laziness

built on top of [immutable-js](https://github.com/facebook/immutable-js) and inspired by [clojure](http://clojure.org/), ishtar enables familiar functional techniques for powerful, reusable abstractions.

some interesting features include transducers, lazy sequence generators, immutable data structures, & protocol based polymorphism

## Getting started

grab the latest copy of ishtar (not published yet, so pull from github)

~~~sh
git clone https://github.com/eggsby/ishtar
cd ishtar; npm install --production; node
require("./core").exports(global)
// >
~~~

### Immutable Data

ishtar exposes some useful immutable data structures like:

`Map`, `Vector`, `Set`, and `Range`

~~~js
Range(0, 10, 2).toVector()
// Vector [ 0, 2, 4, 6, 8 ]
~~~

You can interact with these types directly or use *[transducers](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming)* to pipeline `xforms` across them.

### Transducers

~~~js
function alpha(num) {
  return String.fromCharCode(num + 97)
}

function caps(key) {
  return key.toUpperCase();
}

// juxt returns a list built from applying each of the provided fns
var alphaKey = juxt(alpha, identity);
// alphaKey(3) => [ 'd', 3 ]

// comp lets us compose functions, in this case transducers
var xform = comp(takeNth(3), map(alphaKey))
var a = into({}, xform, range(21));
// a => { ... }

var b = into(Map(), xform, range(70, 100));
// b => Map( ... )

into(a, mapKeys(caps), a);
// { ... }

into([], b);
// [ [ .. ] ]
~~~ 


The `into` fn let's us draw values out of one sequence and pour them into another.

by providing a transducer between the seqs we can apply transformations across them.

play around and get a feel for the way transducers work, they are incredibly powerful and fun!

### Lazy Sequences

Lazy Sequences are deferred seqs and can represent infinite lists. 

One infinite list is the list of all successive numbers:

~~~js
var nums = iterate(inc, 0);
take(5, nums);
~~~

`iterate` let's us build lazy-seqs by successive calls to a fn. 

Here the step is `inc` so we get a list where the next value is always one higher than the previous.

Another infinite list is the *fibonacci sequence*.

~~~js
function step(x) {
  var pred = x[0], succ = x[1];
  return [ succ, pred + succ ]
}

var fibs = map(first, iterate(step, [0, 1]))

function nthFib(n) {
  return first(drop(n, fibs))
}
// nthFib(1337) => 1.1667827829692572e+279
~~~

To calculate the nth fibonacci number we simply shift the list of fibs by n and take the first value inside. 

Lazy Sequences are a powerful way to structure *just enough* computation, and can be built easily using the `LazySeq` constructor, given a thunk that will return the next `seq`.

~~~js
function iterate(fn, x) {
  return cons(x, LazySeq(function thunk() {
    return iterate(fn, fn(x));
  });
}
~~~

Iterate is implemented by `cons`tructing a list where the first is `x`, and the rest is a lazy seq that will return a the recursion with `f(x)`, then `f(f(x))`, as many times as asked for.

All of ishtars core transformations like `map`, `filter`, `concat`, and others are represented as lazy sequences and work seamlessly with transducers.

~~~js
into([], take(7), drop(21, fibs));
//[ 10946, ..., 196418 ]
~~~

### Protocols

TODO

## Core Library

TODO

Want to know more? Read the [tests](https://github.com/eggsby/ishtar/blob/master/test/core_test.js)! [Contribute](https://github.com/eggsby/ishtar/pulse/weekly)!
