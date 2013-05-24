var exec = require('child_process').exec
var utils = require('utils')
var future = require('./robustFuture')
var fs = require('fs')

exports.file = function file(source, destination) {
	if( ! fs.existsSync(destination)) {
	    var sourceContents = fs.readFileSync(source);
	    var destinationFile = fs.writeFileSync(destination, sourceContents);
	} else {
	    utils.log('Skipping installing '+destination+' since it already exists.');
	}	
};

exports.runCommand = runCommand;
function runCommand(command, cwd) {
	var options = {};
	if(cwd!==undefined) options.cwd = cwd;
    return exec(command, options, function (error, stdout, stderr) {
		if (error !== null) throw error;

		utils.log('-stdout-\n' + stdout + "\n"
	  			+ '-stderr-\n' + stderr + "\n"
	  	);
	});
};


var shrinkwrapCache = {};
function getShrinkwrap(source) {
    if(shrinkwrapCache[source] === undefined) {
        var fullPath = source+"npm-shrinkwrap.json";
        if(fs.existsSync(fullPath)) {
            shrinkwrapCache[source] = JSON.parse(fs.readFileSync(fullPath)).dependencies;
        } else {
            shrinkwrapCache[source] = null;
        }
    }

    return shrinkwrapCache[source];
}

// installs a module
// returns whether or not the module has been shrinkwrapped
exports.module = function module(module, destination) {	
	var shrinkwrap = getShrinkwrap(destination);
    if(shrinkwrap === null) throw Error("No shrinkwrap! Failing."); // require shrinkwrap file
    var moduleIsShrinkwrapped = shrinkwrap[module] !== undefined;

    var packagePath = destination+"node_modules/"+module+"/package.json";
    var packageExists = fs.existsSync(packagePath);
	if(packageExists) {
        var package = JSON.parse(fs.readFileSync(packagePath));
    }

	if(packageExists && (!moduleIsShrinkwrapped || shrinkwrap[module].version === package.version)) {
		utils.log("Skipping installing module '"+module+"' since it already exists with the right version (or is a new module).");
	} else {
		runCommand("npm install "+destination+module);
	}

    return moduleIsShrinkwrapped;
};
