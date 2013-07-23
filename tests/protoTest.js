var proto = require('../proto')

// create
var Pirate = proto(function() {
	this.maxLegs = 2	// don't bother with static variables, just prototype variables

	// constructor
	this.construct = function(name, legs) {
		this.name = name
		this.legs = legs	
	}
	
	this.eat = function() {
		this.legs += 1
		this.maxLegs = 1
	}	
})

// subclass
var Captain = proto(Pirate, function() {
	this.construct = function(name, legs) {
		Pirate.construct.call(this, name, 1)
	}	
	
	this.eyepatch = true
})


var x = Pirate("moo", 2)

console.log(x.name+" "+x.legs)
x.eat()
console.log(x.name+" "+x.legs)

var y = Captain("moe", 4)
console.log(y.name+" "+y.legs)
y.eat()
console.log(y.name+" "+y.legs)