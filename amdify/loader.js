var fs = require('fs')
var utils = require('../utils')
var Future = require('../asyncFuture')
var buildPackage = require("./buildPackage")
var resolve = require('resolve')
var path = require('path')

var cache = undefined
module.exports = function(errback) {
    try {
        if(cache) errback(undefined, cache)
        else {

            var templateParameter = '!(useCommon)'
            var loaderTemplate = fs.readFileSync(__dirname+'/loaderParts/loaderTemplate.js').toString()
            var common = fs.readFileSync(__dirname+'/common.js')

            var wrappedCommon = '(function() {\n'+
                                    'var exports = {}\n'+
                                    common+'\n'+
                                    'return exports;'+
                                '})()'

            var curl = fs.readFileSync(__dirname+'/loaderParts/curl-for-jQuery-0.7.3.js')
            var temporaryResolve = fs.readFileSync(__dirname+'/loaderParts/fakeResolve.js')
            var loader = utils.replaceAll(loaderTemplate, templateParameter, wrappedCommon) // should only replace one instance

            Future.all(Future.wrap(buildPackage)(__dirname, {new: ['resolve'], old: []}),
                       Future.wrap(buildPackage)(__dirname, {new: ['./loaderParts/globalizeResolve.js'], old: ['resolve']}))
            .then(function(v) {
                var realResolve = v[0]
                var globalizeResolve = v[1]

                var resolveBaseDirectory = path.dirname(resolve.sync('resolve', {basedir: __dirname}))
                var resolveLibDirectory = path.join(path.dirname(resolve.sync('resolve', {basedir: __dirname})), "lib")
                var globalizeResolveBaseDirectory = path.dirname(resolve.sync('./loaderParts/globalizeResolve.js', {basedir: __dirname}))

                // This should contain all the paths that need to be resolved before realResolve is loaded
                var resolveLocations = {}
                    resolveLocations[resolveBaseDirectory] = mapDependencies(resolveBaseDirectory,
                                                                            ["./lib/core", "./lib/async", "./lib/sync"])
                    resolveLocations[resolveLibDirectory] = mapDependencies(resolveLibDirectory, ["./core.json", "./core", "./caller.js"])
                    resolveLocations[globalizeResolveBaseDirectory] = {
                        "resolve": resolve.sync('resolve', {basedir: __dirname})
                    }

                errback(undefined,
                           curl+"\n"+
                           temporaryResolve+'(this, '+JSON.stringify(resolveLocations)+')\n'+
                           loader+'\n'+
                           realResolve+'\n'+
                           globalizeResolve+'\n')
            }).catch(function(e) {
                errback(e)
            }).done()
        }
    } catch(e) {
        errback(e)
    }
}

function mapDependencies(baseDirectory, dependencies) {
    var result = {}
    dependencies.forEach(function(d) {
        result[d] = resolve.sync(d, {basedir: baseDirectory})
    })
    return result
}
