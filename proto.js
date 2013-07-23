"use strict";

/*  usage:
    proto(function() {
        this.make           // sets constructor
        this.anythingElse   // sets class methods/properties (on the prototype)
    })

    // inherit from a proto-created class (or any object that has the __proto__ property
    proto(Parent, function() {
        this.make = function() {
            Parent.make.call(this,arguments) // super-class method call
        }
    })

    // note: instanceof doesn't work for these
    // note2: you can't access the 'name' property from parent classes (the Function.name property gets in the way),
    //   though the name property will work correctly on objects
*/
function proto() {
	if(arguments.length == 1) {
		var parent = {}
		var prototypeBuilder = arguments[0]

	} else { // length == 2
		var parent = arguments[0]
		var prototypeBuilder = arguments[1]
	}

    var prototype = {}

	// add parent prototype properties
	for(var n in parent) {
        prototype[n] = parent[n]
	}

	// run the prototype-building function on the resultant class-function to get an instantiated prototype object
	prototypeBuilder.call(prototype)

	// constructor for empty object which will be populated via the constructor
	var F = function() {}
		F.prototype = prototype		// set the prototype for created instances

	var result = function() { 	// result object factory
		var x = new F()					// empty object
		if(prototype.make)
            prototype.make.apply(x, arguments)	// populate object via the constructor
		return x
	}

    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	for(var n in prototype) {
        result[n] = prototype[n]
	}

    return result;
}

module.exports = proto