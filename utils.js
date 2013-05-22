
var fs = require("fs");

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
var mergeInternal = exports.merge = function(obj1, obj2){
    obj2.foreach(function(value, key) {
        obj1[key] = value;
    });
};
Object.prototype.merge = function(obj2){
    mergeInternal(this, obj2);
};


exports.log = function(m, e) {
    var msg = m;
    if(e !== undefined) msg += " - "+e.stack;
    fs.writeSync(process.stdout.fd, msg+"\n");
};