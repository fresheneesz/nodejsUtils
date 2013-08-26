'use strict';
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

// todo:
// * implement options like detective has for redefining isFile and readFile / readFileSync

var detective = require('detective')
var path = require('path')
var resolve = require('resolve')
var fs = require('fs')

//todo: use asynchronous fs calls

// takes either two or three arguments, either:
    // two arguments:
        // directory path from which to search for the module
        // module
        // errback
    // one argument:
        // an array of objects like: {dir: <directory path>, module: <module>}
        // errback
// returns an object like:
    // {<filename>:
        // {resolved: <dependencies>,
        //  unresolved: <require expressions that couldn't be resolved>,
        //  unfound: <require dependencies that couldn't be found>
        // }
    // }
// Doesn't resolve node.js native libraries (returns them as 'unfound')
module.exports = function() {
    try {
        if(arguments.length === 3) {
            var dependencies = [{dir: arguments[0], module: arguments[1]}]
            var errback = arguments[2]
        } else { // length === 2
            var dependencies = arguments[0]
            var errback = arguments[1]
        }

        var modulesToTraverse = dependencies.map(function(dependency) {
            return resolveDependencyFileName(dependency.dir, dependency.module)
        })

        var dependencyMap = {}
        traverse(modulesToTraverse, dependencyMap)

        errback(undefined, dependencyMap)
    }catch(e) {
        errback(e)
    }
}

// takes two arguments:
    // an array of objects like: {dir: <base directory>, module: <module>}, and
    // a cache of the already-parsed file paths
// mutates dependencyMap, adding more dependencies
var traverse = function(dependencies, dependencyMap) {
    dependencies.forEach(function(dependencyFile) {
        if(dependencyMap[dependencyFile] === undefined) { // only traverse a file if it hasn't already been traversed
            var filePath = path.resolve(dependencyFile)
            var fileDirectory = path.dirname(filePath)
            var source = fs.readFileSync(dependencyFile)
            var detectiveWork = detective.find(source)

            var subdependencies = []
            var unfoundSubDependencies = []
            detectiveWork.strings.forEach(function(subdependency) {
                var file = resolveDependencyFileName(fileDirectory, subdependency)

                if(fs.existsSync(file)) {
                    subdependencies.push({relative: subdependency, absolute: file})
                } else {
                    unfoundSubDependencies.push(subdependency)
                }
            })

            dependencyMap[dependencyFile] = {   resolved: subdependencies,
                                                unresolved: detectiveWork.expressions,
                                                unfound: unfoundSubDependencies}

            var newDependencies = subdependencies.map(function(subdependency) {
                return subdependency.absolute
            })

            traverse(newDependencies, dependencyMap)
        }
    })
}

function resolveDependencyFileName(directory, dependency) {
    return resolve.sync(dependency, { basedir: directory })
}