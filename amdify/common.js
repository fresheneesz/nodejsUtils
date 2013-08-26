exports.processArguments = function(args) {
    /* must have a module argument, otherwise node.js can't function right (can't do the right module.require's
    if(args.length === 1) {
        var callback = args[0]
        var modules = getModulesFromCallbackParameters(callback)

    } else */if(args.length === 2) {
        if(args[0] instanceof Array) {
            var moduleOverrides = args[0]
            var callback = args[1]
            var modules = getOverriddenModules(getModulesFromCallbackParameters(callback), moduleOverrides)
        } else {
            var module = args[0]
            var callback = args[1]
            var modules = getModulesFromCallbackParameters(callback)
        }


    } else if(args.length === 3) {
        var module = args[0]
        var moduleOverrides = args[1]
        var callback = args[2]
        var modules = getOverriddenModules(getModulesFromCallbackParameters(callback), moduleOverrides)

    } else {
        throw Error("Invalid number of arguments ("+args.length+"), should be 1, 2, or 3.")
    }

    return {
        module: module,
        callback: callback,
        modules: modules
    }
}

function getOverriddenModules(originalModules, overrides) {

    // overrides first
    var modules = [].concat(overrides)

    // fill in unoverridden modules
    originalModules.forEach(function(alias, index) {
        if(overrides[alias] && overrides[index])
            throw Error("You can't override a module path via its alias *and* index")

        if(!overrides[alias] && !overrides[index]) { // if there's no override
            modules.push(alias) // now we know alias is the real name
        }
    })

    return modules
}

function getModulesFromCallbackParameters(callback) {
    var params = getParamNames(callback)
    params.splice(0,1) // strip off the error parameter
    return params
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '')
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
    if(result === null)
    	result = []

	return result
}