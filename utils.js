
require('sugar')
var fs = require("fs")
var Future = require('fibers/future')
var domain = require('domain').create
var trimArgs = require("trimArguments")   // todo: remove this and have modules depend on the trimArguments module directly


// native object extensions

String.prototype.replaceAll = function(needle, replacer) {
    replaceAll(this, needle, replacer)
}
exports.replaceAll = replaceAll
function replaceAll(stringToMutate, needle, replacer) {
    var ignore = false
    return stringToMutate.replace(new RegExp(
            needle.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c){return "\\" + c}), "g"+(ignore?"i":"")),
            replacer)
}

// methods

// Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
exports.merge = merge; function merge(obj1, obj2){
    for(var key in obj2){
       if(Object.hasOwnProperty.call(obj2, key))
          obj1[key] = obj2[key]
    }

    /*  this is less performant \/\/
    Object.extended(obj2).each(function(key, value) {
        obj1[key] = value
    })
    */
}

exports.log = function(m, e) {
    var msg = m
    if(e !== undefined) msg += " - "+e.stack
    console.log(msg)
}

// returns a ChildProcess event emitter object with:
//  on exit: code, signal
//  stdout.on data: data
//  stderr.on data: data
//  on error: error
exports.exec = exec; function exec(command, options) {
    if(options===undefined) options = {}
    return require('child_process').exec(command, options)
}

// either used like futureWrap(function(){ ... })(arg1,arg2,etc) or
//  futureWrap(object, 'methodName')(arg1,arg2,etc)
exports.futureWrap = function() {
    // function
    if(arguments.length === 1) {
        var fn = arguments[0]
        var object = undefined

    // object, function
    } else {
        var object = arguments[0]
        var fn = object[arguments[1]]
    }

	return function() {
		var args = Array.prototype.slice.call(arguments)
		var future = new Future
		args.push(future.resolver())
		var me = this
        if(object) me = object
        fn.apply(me, args)
		return future
	}
}

// resolves varargs variable into more usable form
// args - should be a function arguments variable
// returns a javascript Array object of arguments that doesn't count trailing undefined values in the length
exports.trimArgs = trimArgs

exports.grabStack = function() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
        return stack;
    };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

// asynchronous try catch using domains
exports.async = function(options) {
    // basically does the same thing as process.on('uncaughtException') but much more flexibly
    // see http://nodejs.org/api/domain.html
    var d = domain()
    d.on('error', function(err) {
        options.catch(err)
    })

    d.run(function() {
        options.try()
    })
}

exports.indent = function(i, str) {
    return i+str.split("\n")       // get all lines
              .join("\n"+i)      // join all lines with an indent
}

exports.arrayRemove = function(array, value) {
    var i = array.indexOf(value);
    if(i != -1) {
        array.splice(i, 1);
    }
}


exports.addslashes = addslashes; function addslashes(string) {
    return string.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"');
}

exports.toJavascriptArrayString = function(array) {
    var stringifiedArray = array.map(function(item) {
        return '"'+addslashes(item)+'"'
    })

    return '['+stringifiedArray.join(',')+']'
}