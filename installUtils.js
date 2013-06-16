// separate from exec so it can be more simply pulled out to bootstrap loading this module
var execAsync = function(command, options, after) {
    if(options===undefined) options = {};
    require('child_process').exec(command, options, function (error, stdout, stderr) {
        after(error, {out:stdout, err:stderr});
    });
};


/*
// requires a module, and if it doesn't exist, npm it in
// after gets stdout, stderr, and a possible exception as arguments
function requireNpm(module, after) {
    try {
        after(require(module));
    } catch(e) {
        exec('npm install '+module, {cwd:"."}, function () {
            after(require(installUtilsName));
        });
    }
}
*/

var childExec = require('child_process').exec;
var fs = require('fs');
var utils = require('./utils');
var Future = require('fibers/future');

// returns false if the file already exists
exports.file = function file(source, destination) {
	if( ! fs.existsSync(destination)) {
	    var sourceContents = fs.readFileSync(source);
	    var destinationFile = fs.writeFileSync(destination, sourceContents);
        return true;
	} else {
	    return false;
	}	
};

exports.exec = exec;
function exec(command, options) {
    var f = new Future;
    execAsync(command, options, f.resolver());
    return f;
}
exports.gitReset = gitReset;
function gitReset(location, revision) {
    if(revision === undefined) revision = 'HEAD';
    return exec('git reset --hard '+revision, {cwd:location}); // use a specific revision
}
exports.gitRepo = gitRepo;
function gitRepo(url, name, installDirectory, revision) {
    var data = {};
    var location = installDirectory+'/'+name+'/';

    if( ! fs.existsSync(location)) {
        data['clone'] = exec('git clone '+url+' '+location).wait();
    } else {
        data['clone'] = {'out': 'Skipping clone because '+location+' already exists.'};
    }

    var future = new Future;
    gitReset(location, revision).resolve(future, function(data) {
        data['reset'] = fReset.wait();
        future.return(data);
    });

    return future;
}

exports.gitPackage = gitPackage;
function gitPackage(url, name, installDirectory, revision, after) {
    var future = new Future;
    gitRepo(url, name, installDirectory, revision).resolve(future, function(data) {
        data['install'] = exec('npm install', {cwd:location}).wait();
        future.return(data);
    });

    return future;
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
		exec("npm install "+destination+module);
	}

    return moduleIsShrinkwrapped;
};
