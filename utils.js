
require('sugar')
var fs = require("fs")
var Future = require('fibers/future')


// native object extensions

String.prototype.replaceAll = function(str1, str2) {
    var ignore = false
    return this.replace(new RegExp(str1.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c){return "\\" + c}), "g"+(ignore?"i":"")), str2)
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

// separate from exec so it can be more simply pulled out to bootstrap loading this module
function execAsync(command, options, after) {
    if(options===undefined) options = {}
    require('child_process').exec(command, options, function (error, stdout, stderr) {
        after(error, {command: command, out:stdout, err:stderr})
    })
}

exports.exec = exec
function exec(command, options) {
    var f = new Future
    execAsync(command, options, f.resolver())
    return f
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
exports.trimArgs = function(theArguments) {
    var args = Array.prototype.slice.call(theArguments, 0)

    var count = 0;
    for(var n=args.length-1; n>=0; n--) {
        if(args[n] === undefined)
            count++
    }
    args.splice(-0, count)
    return args
}

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