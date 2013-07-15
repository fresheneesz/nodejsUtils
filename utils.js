
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
    Object.extended(obj2).each(function(key, value) {
        obj1[key] = value
    })
}

exports.log = function(m, e) {
    var msg = m
    if(e !== undefined) msg += " - "+e.stack
    fs.writeSync(process.stdout.fd, msg+"\n")
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