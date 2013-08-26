var fs = require('fs')
var path = require("path")
var requireTraverser = require('../requireTraverser')
var resolve = require('resolve')
var utils = require("../utils")

// creates a package the contains the depenency tree for each module-to-load, excluding modules that are already in-transit
module.exports = function(baseDirectory, modules, errback) {
    var traverserInput = modules.new.map(function(requestedModule) {
        return {dir: baseDirectory, module: requestedModule}
    })

    requireTraverser(traverserInput, function(e, dependencyMap) {
        if(e) errback(e)

        var modulesToLoad = []
        for(var file in dependencyMap) {
            var dependencies = dependencyMap[file]

            dependencies.unfound = dependencies.unfound.filter(function(module) {
                if(resolve.isCore(module)) {

                }
            })
            // use this for requires that require node.js builtin modules like path or util
                    //* https://github.com/alexgorbatchev/node-browser-builtins

            if(dependencies.unresolved.length > 0 || dependencies.unfound.length > 0)
                throw Error("Can't create package with file '"+file+"', because it contains unresolved or unfound dependencies: "
                            +dependencies.unresolved+" "+dependencies.unfound)

            modulesToLoad.push(file)
        }

        var cachePrimer = ";"+utils.toJavascriptArrayString(modulesToLoad)+".forEach(function(module) {\n\
            use.cache[module] = {done: false, waiting: []}\n\
        })"

        var package = modulesToLoad.reduce(function(acc, moduleFile) {
            var module = amdifyModule(moduleFile, dependencyMap[moduleFile].resolved)
            return acc+"\n"+module
        }, "")

        errback(e, cachePrimer+"\n"+package)
    })
}

function amdifyModule(module, dependencies) {

    var source = fs.readFileSync(module)
    if(path.extname(module).toLowerCase() === 'json') {

        return 'use("'+utils.addslashes(module)+'", function() {\n\
            return '+source+'\n\
        })'

    } else {
        var dependencyPaths = dependencies.map(function(dependency) {
            return dependency.relative
        })

        var dependencyJavascriptArray = utils.toJavascriptArrayString(dependencyPaths)

        var theReturn = ""
        if(endsWith(module.toLowerCase(), ".json")) {
            theReturn = "return "
        }

        return 'use("'+utils.addslashes(module)+'", '+dependencyJavascriptArray+', function() {\n\
            var module = "'+utils.addslashes(module)+'"\n\
            var newUse = use.applyModule(module)\n\
            var newRequire = use.requireApplyModule(module)\n'+
            'return (function() {\n'+
                'var use = newUse\n'+
                'var require = newRequire\n'+
                'var module = "'+utils.addslashes(module)+'"\n'+
                theReturn+source+
            '\n})()'+
        '\n})'
    }
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}