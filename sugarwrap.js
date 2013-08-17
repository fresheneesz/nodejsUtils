"use strict;"

require('sugar')
var utils = require('bt/utils')

var extendedObjectPrototype = Object.extended({})

var relevantProperties = [  // properties to swap parameter order for
    'each',
    'map',
    'any',
    'all',
    'none',
    'count',
    'find',
    'findAll',
    'reduce',
    'isEmpty',
    'sum',
    'average',
    'min',
    'max',
    'least',
    'most'
]

var intermediateObject = function() {
    var me = this
    // change order of parameters for various enumerable methods to 'value, key, object'
    relevantProperties.each(function(method) {
        changeParamOrder(me, extendedObjectPrototype, method)
    })
}
    intermediateObject.prototype = extendedObjectPrototype


var newExtendedObject = function() {}
    newExtendedObject.prototype = new intermediateObject()

function changeParamOrder(object, prototype, methodName) {
    object[methodName] = function(callback) {
        var otherArgs = Array.prototype.splice.call(arguments, 1)

        var params = [function(key, value, object) {
            return callback(value, key, object)
        }].concat(otherArgs)

        prototype[methodName].apply(this, params)
    }
}

// set Object.extend
Object.extend = function(object) {
    var resultObject = new newExtendedObject()
    utils.merge(resultObject, object)
    return resultObject
}