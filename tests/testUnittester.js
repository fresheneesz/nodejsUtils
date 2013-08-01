"use strict";

var Unit = require('../unit')
var utils = require('../utils')

var simpleGroup = Unit.test(function() {
	this.ok(5==5)
	this.ok(false)
})

var testGroups = Unit.test("Testing the Unit Tester", function() {

	this.test("Test Some Stuff", function() {
		this.test("assertSomething", function() {
			this.ok(5 === 5)
		})
		this.test("shouldFail", function() {
			this.ok(5 === 3)
            this.log("test log")
		})
		this.test("shouldThrowException", function() {
            this.ok(true)
			throw new Error("Ahhhhh!")
		})
	})
	this.test("SuccessfulTestGroup", function() {
		this.test("yay", function() {
			this.equal(true, true)
		})
	})
})

var test = testGroups.test()

function stringTestResults(test) {
	if(test.type == 'group') {
		var results = '[ '+test.results.map(function(x) {
            return utils.indent("  ",stringTestResults(x))
        }).join(",\n").trim()+"\n"
        +"]"

        var exceptionMessages = "["+test.exceptions.join(",")+"]"

		return  "{ type: "+test.type+",\n"
		       +"  name: "+test.name+",\n"
		       +"  results: \n"+utils.indent("  ",results)+",\n"
			   +"  exceptions: "+exceptionMessages+",\n"
			   +"}"
	} else {
		return  "{ type: "+test.type+",\n"
			   +"  success: "+test.success+",\n"
			   +"  sourceLines: "+test.sourceLines+",\n"
			   +"  test: "+test.test+",\n"
			   +"  file: "+test.file+",\n"
			   +"  line: "+test.line+",\n"
			   +"  column: "+test.column+",\n"
			   +"}"
	}
}

console.log(stringTestResults(test))
console.log(" ----------- ")

console.log(testGroups.toString())	// returns plain text
testGroups.writeConsole() 		// writes color console output

//console.log(testGroups.html())		// returns html
/*testGroups.write.html()			// appends html to the current (html) page the tests are running in
*/