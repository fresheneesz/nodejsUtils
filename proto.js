"use strict";

/*  usage:
    var Parent = proto(function() {
        this.make = function(v) {   // sets constructor
            if(v) {
                this.x = v                // you can normally access the object with this inside methods
                return this               // you have to return yourself from the constructor
            } else {
                return undefined          // ^ this allows you to return anything you want from a constructor!
            }
        }
                  }
        // this.self            // is set automatically to the proto object itself (so you can reference it from the instance)
        this.anythingElse = 5   // sets class methods/properties (on the prototype and the constructor object)

        var privateFn = function(me, arg1, etc) {  // private functions don't have access to the correct 'this', so pass it in
            me.x = arg1 + etc
        }
        this.usePrivate = function() {
            privateFn(this, this.x, 1)
        }
    })

    // you can inherit from any object!
    var Child = proto(Parent, function() {
        this.make = function() {
            Parent.make.call(this, arguments) // super-class method call
            this.r = 10
            return this
        }

        this.staticMethod = function(x) {        // create static methods just like instance methods - you can access them from the constructor
            return this.self(x+12)               // uses its own constructor to create a Child object
        }
    })

    var object = Child(1)                // instantiation
    object.usePrivate()                  // method call (as usual)
    var object2 = Child.staticMethod(1)  // static method call


    // note: instanceof doesn't work for proto types
    // note2: you can't access the 'name' property from parent classes (the Function.name property gets in the way),
    //   though the name property will work correctly on instances
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

	var objectFactory = function() { 	// result object factory
		var x = new F()					// empty object
		if(prototype.make)
            return prototype.make.apply(x, arguments)	// populate object via the constructor
		return x
	}

    // add reference to the returned object factory
    prototype.self = objectFactory;

    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	for(var n in prototype) {
        objectFactory[n] = prototype[n]
	}

    return objectFactory;
}

module.exports = proto