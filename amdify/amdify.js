var path = require("path")

var loader = require('./loader')
var common = require('./common')
var buildPackage = require("./buildPackage")
var utils = require('../utils')

// todo: load files asynchronously for better performance

// creates the initial package that includes curl and the amdify loader
exports.starterPackage = function(directory, mainModule, packageServerUrl, callback) {
    buildPackage(directory, {new: [mainModule], old: []}, function(e, mainPackage) {
        if(e) callback(e)

        var serverUrlSetup = 'use.url = "'+utils.addslashes(packageServerUrl)+'"'

        loader(function(e, loaderSource) {
            callback(e, [loaderSource, serverUrlSetup, mainPackage].join('\n'))
        })
    })
}

exports.use = function() {
    var args = common.processArguments(arguments)

	var loadedModules = args.modules.map(function(moduleName) {
		return args.module.require(moduleName)
	})

	var moduleResult = args.callback.apply(this, loadedModules)
    if(moduleResult !== undefined && args.modules !== undefined)
        args.modules.exports = moduleResult
}

// takes a parameter object like:
    // {requirer: <file path of file requiring the modules>,
    //  new: <array of modules to require>,
    //  old: <array of modules already requested>>
    // }
exports.buildPackage = function(parameters, errback) {
    var request = JSON.parse(parameters.request)
    var baseDirectory = path.dirname(request.requirer)
    buildPackage(baseDirectory, request.modules, errback)
};
