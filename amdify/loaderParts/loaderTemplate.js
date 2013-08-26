// todo:
// * when you convert code for the browser, make sure you always change the 'use' calls to have an explicit module list, so that minification doesn't mess it up
// * synchronously load modules requested through 'require' that couldn't be statically loaded (maybe?)
    // * provide a callback for handling warnings of this kind (default to logging to the console)
// * figure out how you want to handle errors (does each module that failed to load store a pointer to the exception that made it fail?)
// * figure out how to handle circular dependencies

// requires: curl-for-jQuery-0.7.3.js, resolve
;(function(global) {
    // useCommon will be replaced with actual code by loader.js
    var common = !(useCommon)

    var cache = {}
    var fileManifest = {}

    function use() {
        var args = common.processArguments(arguments)

        if(args.module!==undefined && cache[args.module] === undefined)
            cache[args.module] = {done: false, waiting: []}

        var absolutizedModules = args.modules.map(function(module) {
            return absolutizeModulePath(args.module, module)
        })

        var unrequestedModules = absolutizedModules.filter(function(modulePath) {
            return !(modulePath in cache)
        })

        if(unrequestedModules.length > 0) {
            var alreadyRequestedModules = keys(cache).sort() // to eliminate the possibility of duplicative cache entries
            requestModules(args.module, unrequestedModules, alreadyRequestedModules)
        }

        awaitDependencies(args.module, absolutizedModules, args.callback) // in browser-land, module will be the requested path-name of the loaded module
    }

    use.applyModule = function(module) {
        return function() {
            if(arguments.length === 1) {
                return use.apply(this, [module, arguments[0]])
            } else {
                return use.apply(this,arguments)
            }
        }
    }
    use.requireApplyModule = function(requiererModule) {
        return function() {
            if(arguments.length === 1) {
                return require.apply(this, [requiererModule, arguments[0]])
            } else {
                return require.apply(this,arguments)
            }
        }
    }


    function require(requirer, module) {
        var modulePath = absolutizeModulePath(requirer, module)
        if(cache[modulePath] === undefined) {
            throw Error('Unresolved require: '+module+" from "+requirer)
        }
        return cache[modulePath].exports
    }

    function keys(object) {
        var theKeys = []
        for(var k in object) {
            theKeys.push(k)
        }
        return theKeys
    }

    function requestModules(requirer, unrequestedModules, alreadyRequestedModules) {

        // mark these modules as being requested
        unrequestedModules.forEach(function(modulePath) {
            if(!cache[modulePath])
                cache[modulePath] = {done: false, waiting: []}
        })

        // make the request
        var requestPackage = serialize({requirer: requirer, modules: {new: unrequestedModules, old: alreadyRequestedModules}})
        curl(['js!'+use.url+'?request='+requestPackage]).then(function() {
                // nothing to do, the modules themselves will run appropriate code to activate waiting module code
            },
            // err handling callback
            function(e) {
                unrequestedModules.forEach(function(modulePath) {
                    cache[modulePath].done = true
                    cache[modulePath].error = e
                })
            }
        );
    }

    function addFile(path, contents) {
        fileManifest[path] = contents
    }

    function absolutizeModulePath(requierer, module) {
        var readFileSync = function(file) {
            if(file in fileManifest) {
                return fileManifest[file]
            } else {
                throw Error("File not in manifest :(")
            }
        }

        var isFile = function (file) {
            return file in fileManifest
        }

        return resolve.sync(module, { basedir: dirname(requierer), readFileSync:readFileSync, isFile: isFile });
    }

    function dirname(absolutePath) {
        // find last slash
        var forwardSlash = absolutePath.indexOf('/') !== -1
        if(forwardSlash) {
            var slash = '/'
        } else { // backslash
            var slash = '\\'
        }

        var parts = absolutePath.split(slash)
        parts.splice(parts.length-1, 1) // remove last part
        return parts.join(slash)
    }

    function serialize(request) {
        return encodeURIComponent(JSON.stringify(request))
    }

    function awaitDependencies(module, modules, callback) {
        var awaiter = function() {
            return runModuleIfDependenciesAreReady(module, modules, callback)
        }

        var ran = awaiter()
        if(!ran) { // add a callback to each module's queue
            modules.forEach(function(modulePath) {
                cache[modulePath].waiting.push(awaiter)
            })
        }
    }

    // returns true if it ran
    function runModuleIfDependenciesAreReady(module, modules, callback) {
        var unloadedDependencies = modules.filter(function(modulePath) {
            return cache[modulePath].done === false
        })

        if(unloadedDependencies.length === 0) { // run the module
            var errors = modules.filter(function(modulePath) {
                return cache[modulePath].error !== undefined
            }).map(function(modulePath) {
                return cache[modulePath].error
            })

            if(errors.length > 0) {
                var err = Error("Errors loading some dependencies (see error.causes)")
                err.causes = errors
                callback.call(this, err)
            } else {
                var loadedModules = []
                modules.forEach(function(modulePath) {
                    loadedModules.push(cache[modulePath].exports)
                })

                var parameters = [undefined].concat(loadedModules)
                var moduleResult = callback.apply(this, parameters)
                if(module !== undefined) {
                    cache[module].done = true
                    if(moduleResult !== undefined)
                        cache[module].exports = moduleResult
                    else
                        cache[module].exports = {}

                    runWaitingModules(module)
                }
            }

            return true
        } else {
            return false
        }
    }

    function runWaitingModules(module) {
        var queue = cache[module].waiting
        queue.forEach(function(awaiter) {
            var ran = awaiter()
            if(ran) {
                var index = queue.indexOf(awaiter) // this must be done dynamically because the index changes as items are removed
                queue.splice(index, 1)
            }
        })
    }

    global.use = use
    global.use.addFile = addFile
    global.use.cache = cache
    global.require = require
})(this)