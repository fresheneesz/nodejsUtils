require('util') // by itself
var fs = require('fs') // assigned to a variable
var A = require('./dependencyA') // directory relative
require('c').hello().goodbye() // methods off it
var doom = require('doom')(5,6,7); // called as a function
require("curl")

require("dep"+"endency");	// statement

var x = "test"
require(x);	// "variable"

function test() {
	require("moose")	// in a function
}

function test2() {
	var require = function() {
		console.log('test')	
	}
	
	// require("notactuallyrequire")  fails for this...
	// require("I'm not actually require!")  .. and this
}

if (true) {
    (function () {
        require('a');
    })();
}

// require("this is a comment")