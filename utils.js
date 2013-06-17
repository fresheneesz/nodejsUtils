
var fs = require("fs");
var Fiber = require('fibers');
var Future = require('fibers/future');
var childExec = require('child_process').exec;

String.prototype.replaceAll = function(str1, str2) {
    var ignore = false;
    return this.replace(new RegExp(str1.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c){return "\\" + c;}), "g"+(ignore?"i":"")), str2);
};

Object.prototype.toString = function() { // prettifies object's toString
    var s = JSON.stringify(this, null, " ");
    return s.replaceAll('\\n', '\n')
};

Object.prototype.keys = function () {
    var keys = [];
    for(var i in this) if (this.hasOwnProperty(i)) {
        keys.push(i);
    }
    return keys;
}

// object equivalent of Array.forEach
// loopBlock gets the arguments:
//  value
//  key
//  object
// this will be set identically to Array.forEach
Object.prototype.foreach = function (loopBlock, thiscontext) {
    return this.keys().forEach(function(key) {
        if(thiscontext===undefined) thiscontext = this;
        loopBlock.call(thiscontext, this[key], key, this);
    }, this);
}
Array.prototype.foreach = Array.prototype.forEach;

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
exports.merge = merge;
function merge(obj1, obj2){
    obj2.foreach(function(value, key) {
        obj1[key] = value;
    });
};
Object.prototype.merge = function(obj2){
    merge(this, obj2);
};


exports.log = function(m, e) {
    var msg = m;
    if(e !== undefined) msg += " - "+e.stack;
    fs.writeSync(process.stdout.fd, msg+"\n");
};

exports.futureEnv = futureEnv;
function futureEnv(f) {
    var future = new Future;
    process.nextTick(function() { new Fiber(function(){
        try {
            future.return(f());
        } catch(e) {
            future.throw(e);
        }
    }).run();});
    return future;
}

// separate from exec so it can be more simply pulled out to bootstrap loading this module
var execAsync = function(command, options, after) {
    if(options===undefined) options = {};
    console.log('wtf');
    require('child_process').exec(command, options, function (error, stdout, stderr) {
        after(error, {out:stdout, err:stderr});
    });
};

exports.exec = exec;
function exec(command, options) {
    var f = new Future;
    execAsync(command, options, f.resolver());
    return f;
}