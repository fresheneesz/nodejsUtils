function proto() {
	if(arguments.length == 1) {
		var parent = {}
		var prototype = arguments[0]
		
	} else { // length == 2
		var parent = arguments[0]
		var prototype = arguments[1]
	}
	
	// run the prototype-building function to get an instantiated prototype object
	var p = new prototype()
		
	// add parent prototype properties
	for(var n in parent.__proto__) {
		var property = parent.__proto__[n]
		console.log(n+": "+property)
		if(p[n] === undefined) // make sure you're not overwriting newer properties
			p[n] = property
	}	
	
	// constructor for empty object which will be populated via the constructor
	var F = function() {}    
		F.prototype = p		// set the prototype for created instances
	
	var result = function() { 	// result object factory
		var x = new F()					// empty object
		p.construct.apply(x, arguments)	// populate object via the constructor
		return x
	}
	result.construct = p.construct 	// this is so the constructor can be accessed statically
	result.__proto__ = p			// this is so the prototype can be accessed statically
	return result
}
