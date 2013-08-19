var fs = require('fs')
var path = require('path')

require('colors')
var utils = require('./utils')

/*  todo:
    * a way to specify how many asserts a test should expect to get
    * default html reporter
    * report the amount of time a test took
    * allow individual tests be cherry picked (for rerunning tests or testing specific things in development)
    * some kind of helper handling for asynchronous crap - QUnit has a function that's called once asynchronous functions are done
        * you'd either have to know beforehand the number of 'start's you're
        * Mocha allows you to pass a callback to a test group, in which case it will wait for the "done" call
            * this might need to be extended a bit if you have multiple callbacks that must happen before its really "done"
            * Tho maybe a test case can be aware of all the callbacks that have been setup and wait for a done on each of them
    * Note that a test group can have setup right in the test group construction
        * add something to allow teardown after a test group is completed
        * better yet, check out jasmine's beforeEach and afterEach
    * stream semantics for faster running tests (maybe?)
 */


// default
var unhandledErrorHandler = function(e) {
    setTimeout(function() { //  nextTick
        console.log(e.toString().red)
    },0)
}

// setup unhandled error handler
// unhandled errors happen when done is called, and  then an exception is thrown from the future
exports.error = function(handler) {
    unhandledErrorHandler = handler
}


exports.test = function(/*mainName=undefined, groups*/) {
    // unnamed test
    if(arguments.length === 1) {
        var mainTest = arguments[0]

    // named test
    } else {
        var mainName = arguments[0]
        var mainTest = arguments[1]
    }

	var testResults = testGroup(new UnitTester(mainName), mainTest)
	return new UnitTest(testResults)
}

function testGroup(tester, test) {
	utils.async({
		 try: function() {
			 try {
				 test.call(tester)
			 } catch(e) {
				 tester.exceptions.push(e)
			 }
		 },
		 catch: function(e) {
			 tester.exceptions.push(e)
			 if(tester.mainTester.resultsAccessed) {
                 unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."
								 +" Got error: "+ e.message+" "+ e.stack))
			 }
		 }
	})

	return {
		type: 'group',

		name: tester.name,
		results: tester.results,
		exceptions: tester.exceptions,
        tester: tester
	}
}


var UnitTester = function(name, mainTester) {
	if(!mainTester) mainTester = this

	this.mainTester = mainTester // the mainTester is used to easily figure out if the test results have been accessed (so early accesses can be detected)
	this.name = name
    this.results = []
    this.exceptions = []
}

    UnitTester.prototype = {
    	test: function(name, test) {
			var tester = new UnitTester(name, this.mainTester)
			this.results.push(testGroup(tester, test))
		},

        ok: function(success, actualValue, expectedValue, functionName, stackIncrease/*=0*/) {
            if(!stackIncrease) stackIncrease = 0
            if(!functionName) functionName = "ok"

            var backTrace = utils.grabStack();
            var stackPosition = backTrace[1+stackIncrease]

            var filename = stackPosition.getFileName()
            var lineNumber = stackPosition.getLineNumber()
            var column = stackPosition.getColumnNumber()

            var sourceLines = getFunctionCallLines(filename, functionName, lineNumber)

            var result = {
            	type: 'assert',
                success:success,

                sourceLines: sourceLines,
                file: path.basename(filename),
                line: lineNumber,
                column: column
            }

            if(actualValue)     result.actual = actualValue
            if(expectedValue)   result.expected = expectedValue

            this.results.push(result)

            if(this.mainTester.resultsAccessed) {
                 unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."+
                                 " Got assert result: "+ JSON.stringify(result)))
            }
        },
        equal: function(expectedValue, testValue) {
            this.ok(expectedValue === testValue, expectedValue, testValue, "equal", 1)
        },

        log: function(msg) {
            this.results.push({
                type: 'log',
                msg: msg
            })
        }
    }

var UnitTest = function(test) {
    this.results = function() {
        // resultsAccessed allows the unit test to do special alerting if asynchronous tests aren't completed before the test is completed
		test.tester.resultsAccessed = true
        return test
    }
}
    UnitTest.prototype.string =  // alias
    UnitTest.prototype.toString = function() {
        return textOutput(this, false)
    }

    UnitTest.prototype.writeConsole = function() {
        console.log(textOutput(this, true))
    }

    function textOutput(unitTest, consoleColoring) {

        function color(theColor, theString) {
            if(consoleColoring)
                return theString.toString()[theColor]
            else
                return theString.toString()
        }

        return formatBasic(unitTest, {
            group: function(name, testSuccesses, testFailures,
                                  assertSuccesses, assertFailures, exceptions,
                                  testResults, exceptionResults, nestingLevel) {

                var total = testSuccesses+testFailures

                var addResults = function() {
                    var result = ''
                    if(testResults.length > 0)
                        result += '\n'+utils.indent('   ', testResults.join('\n'))
                    if(exceptionResults.length > 0)
                        result += '\n'+utils.indent('   ', exceptionResults.join('\n'))
                    return result
                }


                var testColor, exceptionColor, finalColor
                testColor = exceptionColor = finalColor = 'green'
                if(testFailures > 0) {
                    testColor = finalColor = 'red'
                }
                if(exceptions > 0) {
                    exceptionColor = finalColor = 'red'
                }

                if(nestingLevel == 0) {
                    var resultsLine = color('cyan', name+' - ')+
                                        color(finalColor, testSuccesses+'/'+(testSuccesses+testFailures)+' successful groups. ')+
                            color('green', assertSuccesses+' pass'+plural(assertSuccesses,"es",""))+
                            ', '+color('red', assertFailures+' fail'+plural(assertFailures))+
                            ', and '+color('magenta', exceptions+' exception'+plural(exceptions))+"."

                    var result = ''
                    if(name) result += color('cyan', name)+'\n'
                    result += addResults()
                    result += '\n\n'+resultsLine
                } else {
                    var result = color(finalColor, name)+':           '
                                    +color(testColor, testSuccesses+'/'+total)
                                    +" and "+color(exceptionColor, exceptions+" exception"+plural(exceptions))
                    result += addResults()
                }

                return result
            },
            assert: function(result, test) {
                if(result.success) {
                    var word = "Success:";
                    var c = 'green'
                } else {
                    var word = "Fail:   ";
                    var c = 'red'
                }

                var linesDisplay = result.sourceLines.join("\n")
                if(result.sourceLines.length > 1) {
                    linesDisplay = "\n"+linesDisplay;
                }

                var expectations = ""
                if(result.actual) {
                    if(result.expected)
                        expectations = "  -  Expected "+result.expected
                    expectations += ", Got "+result.actual
                }

                return color(c, word)+" "+test
                            +" ["+color('grey', ":"+result.file)+" "+result.line+color('grey', ":"+result.column)+"] "
                            +color(c, linesDisplay)
                            +expectations
            },
            exception: function(e) {
                return color('red', 'Exception: ')
                            +color('magenta', e.stack)
            }
        })
    }

    UnitTest.prototype.html = function() {

        var getSqoolUnitTester = function() {
            return {
                onToggle: function(displayNone, $bgcolor, innerSelector, outerSelector) {
                    if(displayNone == true) {
                        $(innerSelector).css({"display":""});
                        if(outerSelector != undefined) {
                            $(outerSelector).css({"border":"1px solid "+$bgcolor});
                        }
                    } else {
                        $(innerSelector).css({"display":"none"});
                        if(outerSelector != undefined) {
                            $(outerSelector).css({"border":""});
                        }
                    }
                }
            }
        }

        return '<script src="jquery.js"></script>'+
            '<style>\
                .green\
                {   color: green;\
                }                \
             </style>'+
            '<script type="text/javascript">                      \
                 var SqoolUnitTester = ('+getSqoolUnitTester+')() \
              </script>'+
            formatBasic(this, {
                group: function(name, testSuccesses, testFailures, assertSuccesses, assertFailures, exceptions, testResults) {
                    var nameLine = ""
                    if(name)
                        nameLine = '<h1>'+name+'</h1>'

                    var mainId = getMainId(name)
                    var linkStyle = "cursor:pointer;";

                    if(testFailures > 0 || exceptions > 0)
                    {	var bgcolor="red";
                        var show = "true";
                    }else
                    {	var bgcolor="green";
                        var show = "false";
                    }

                    var initTestGroup = function(mainId, bgcolor, show) {
                        $(function()
                        {	$('#'+mainId).css({"border-color":"'+$bgcolor+'"});
                            SqoolUnitTester.onToggle(show, bgcolor, '#'+mainId);

                            $('#'+mainId+'_final').click(function()
                            {	SqoolUnitTester.onToggle($('#'+mainId).css("display") == "none", bgcolor, '#'+mainId);
                            });
                        });
                    }

                    return nameLine+
                           '<div id="'+mainId+'">'+
                                testResults.join('\n')+
                           '</div>'+
                           '<div style="border:2px solid '+bgcolor+';background-color:white;color:white;margin:4px 0;padding: 1px 3px;'+linkStyle+'" id="'+mainId+'_final">'+
                                '<div style="background-color:'+bgcolor+';color:white;margin:4px 0;padding: 1px 3px">'+
                                    '<div style="float:right;"><i>click on this bar</i></div>'+
                                    testSuccesses+'/'+(testSuccesses+testFailures)+' test groups fully successful+ '+
                                    '<b>'+assertSuccesses+'</b> pass'+plural(assertSuccesses,"es","")+
                                    ', <b>'+assertFailures+'</b> fail'+plural(assertFailures)+
                                    ', and <b>'+exceptions+'</b> exception'+plural(exceptions)+"+"+
                                '</div>'+
                           '</div>'+

                           '<script>;('+initTestGroup+')('+mainId+', '+bgcolor+', '+show+')</script>'+
                           '</div>'
                },
                test: function(name, resultSuccesses, resultFailures, resultExceptions, assertResults, exceptionResults) {
                    var total = resultSuccesses+resultFailures

                    var mainId = getMainId(name)
                    var n = getNewNumber()
                    var linkStyle = "cursor:pointer;";

                    var testId = mainId+n

                    if(resultFailures > 0 || resultExceptions > 0) {
                        var bgcolor="red";
                        var show = "true";
                    } else {
                        var bgcolor="green";
                        var show = "false";
                    }

                    var initTest = function(mainId, bgcolor, show) {
                        $(function()
                        {	$('#'+mainId).css({borderColor:bgcolor});
                            SqoolUnitTester.onToggle(show, bgcolor, '#'+mainId+n+'_inner', '#'+mainId+n);

                            $('.'+mainId+n+'_status').click(function()
                            {	SqoolUnitTester.onToggle
                                (	$('#'+mainId+n+'_inner').css("display") == "none",
                                    bgcolor,
                                    '#'+mainId+n+'_inner',
                                    '#'+mainId+n+''
                                );
                            });
                        });
                    }

                    return '<div id="'+mainId+n+'" style="margin:1px;">'+
                                '<div id="'+testId+'_inner">'+
                                    '<h2 class="'+testId+'_status" style="'+linkStyle+'">'+name+'</h2>'+
                                    assertResults.join('\n')+"\n"+
                                    exceptionResults.join('\n')+"\n"+
                                '</div>'+
                                '<div style="background-color:'+bgcolor+';color:white;margin:4px 0;padding: 1px 3px;'+linkStyle+'" class="'+mainId+n+'_status">'+
                                    "<b>"+name+"</b>"+': &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+
                                    resultSuccesses+'/'+total+" and "+resultExceptions+" exception"+plural(resultExceptions)+"+"+
                                '</div>'+
                                '<script>;('+initTest+')('+mainId+', '+bgcolor+', '+show+')</script>'+
                          '</div>';
                },
                assert: function(result) {
                    if(false === result.success) {
                        var color = "red";
                        var word = "Fail";
                    } else {
                        var color = "green";
                        var word = "Success";
                    }

                    var linesDisplay = "'<i>"+result.sourceLines.join("<br>\n")+"</i>'";
                    if(result.sourceLines.length > 1) {
                        linesDisplay = "<br>\n"+linesDisplay;
                    }

                    return '<div><span style="color:'+color+';">'+word+':</span> '+result.function+
                            " at ["+result.file+" line "+result.line+"] "+linesDisplay+"</div>";
                },
                exception: function(exception) {
                    return '<span style="color:red;">Exception:</span> '+exception.stack;
                }
            })
    }



// built in test formatting helper
var formatBasic = exports.formatBasic = function(unitTest, format) {
    //group, assert, exception

    return formatGroup(unitTest.results(), format, 0).result;
}

function formatGroup(test, format, nestingLevel) {
    var assertSuccesses = 0
    var assertFailures = 0
    var exceptions = 0

	var testCaseSuccesses= 0, testCaseFailures=0;
    var results = []
    test.results.forEach(function(result) {
        if(result.type === 'assert') {
            if(result.success) {
                testCaseSuccesses++
                assertSuccesses ++
            } else {
                testCaseFailures++
                assertFailures++
            }

            results.push(format.assert(result, test.name))

        } else if(result.type === 'group') {
            var group = formatGroup(result, format, nestingLevel+1)
            exceptions+= group.exceptions

            if(group.failures === 0)
                testCaseSuccesses++
            else
                testCaseFailures++

            results.push(group.result)
            assertSuccesses+= group.assertSuccesses
            assertFailures+= group.assertFailures

        } else if(result.type === 'log') {
            results.push(result.msg)
        } else {
            throw new Error("Unknown result type: "+result.type)
        }
    })

    var exceptionResults = []
    test.exceptions.forEach(function(e) {
        exceptionResults.push(format.exception(e))
    })

    exceptions+= test.exceptions.length

    var formattedGroup = format.group(test.name,
                                      testCaseSuccesses, testCaseFailures,
                                      assertSuccesses, assertFailures, exceptions,
                                      results, exceptionResults, nestingLevel)
    return {result: formattedGroup,
            successes: testCaseSuccesses,
            failures: testCaseFailures,
            assertSuccesses: assertSuccesses,
            assertFailures: assertFailures,
            exceptions: exceptions
    }
}


var getMainId = function(name) {
    return 'unitTest_'+name.replace(/[^a-zA-Z]/g, "") // get rid of all characters except letters
}
var getNewNumber = function() {
    getNewNumber.n++
    return getNewNumber.n
}
getNewNumber.n = 0

function plural(num, plural, singular) {
	var plur = num!==1;

    if(singular === undefined) {
    	if(plur)	return "s"
        else        return ""
    } else {
    	if(plur)	return plural
        else		return singular
    }
}

// gets the actual lines of the call
// todo: make this work when call is over multiple lines (you would need to count parens and check for quotations)
function getFunctionCallLines(fileName, functionName, lineNumber) {
    var file = fs.readFileSync(fileName).toString().split("\n")

    var lines = []
    for(var n=0; true; n++) {
    	lines.push(file[lineNumber - 1 - n].trim())
        var containsFunction = file[lineNumber - 1 - n].indexOf(functionName) !== -1
        if(containsFunction) {
        	return lines.reverse()
        }
        if(lineNumber - n < 0) {
        	throw Error("Didn't get any lines")//return ""	// something went wrong if this is being returned (the functionName wasn't found above - means you didn't get the function name right)
        }
    }
}

