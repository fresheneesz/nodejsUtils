// should be called with (this, resolveLocations)
;(function(global, resolveLocations) {
    var fakeResolve = {sync: function(module, options) {
        var baseDirectoryMap = resolveLocations[options.basedir]

        if(baseDirectoryMap && baseDirectoryMap[module]) {
            return baseDirectoryMap[module]
        } else {
            throw new Error("Cannot find module '" + module + "'");
        }
    }}

    global.resolve = fakeResolve
})