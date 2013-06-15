// separate from exec so it can be more simply pulled out to bootstrap loading this module
var execAsync = function(command, options, after) {
    if(options===undefined) options = {};
    require('child_process').exec(command, options, function (error, stdout, stderr) {
        after(error, {out:stdout, err:stderr});
    });
};

var gitResetAsync = function(location, revision, after) {
    if(revision === undefined) revision = 'HEAD';

    execAsync('git reset --hard '+revision, {cwd:location}, function (err, data) { // use a specific revision
        after(err, data);
    });
};

// separate from gitRepo so it can be more simply pulled out to bootstrap loading this module
var gitRepoAsync = function(url, name, installDirectory, revision, after) {
    var data = {};
    var location = installDirectory+'/'+name+'/';

    var reset = function() {
        gitResetAsync(location, revision, function (err, resetData) { // use a specific revision
            data['reset'] = resetData;
            after(err, data);
        });
    };

    if(require('fs').existsSync(location)) {
        data['clone'] = {'out': 'Skipping clone because '+location+' already exists.'};
        reset();

    } else {
        execAsync('git clone '+url+' '+location, {}, function (err, cloneData) {
            data['clone'] = cloneData;
            if(err) after(err, data);

            reset();
        });
    }
};

// with two parameters, this installs a package at the location
// with three parameters, this installs a specific package in the location
var npmInstallAsync = function(location, param2, param3) {
    if(param3 === undefined) { // 2 parameters
        var after = param2;
        var package = '';
    } else {
        var after = param3;
        var package = " "+param2;
    }

    execAsync('npm install'+package, {cwd:location}, function (err, data) {
        after(err, data);
    });
};

// separate from gitPackage so it can be more simply pulled out to bootstrap loading this module
var gitPackageAsync = function(url, name, installDirectory, revision, after) {
    gitRepoAsync(url, name, installDirectory, revision, function(err, data) {
        npmInstallAsync(installDirectory+'/'+name+'/', function (err, installData) {
           data['install'] = installData;
           after(err, data);
        });
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
    return f.wait();
}
exports.gitRepo = gitRepo;
function gitRepo(url, name, installDirectory, revision) {
    var f = new Future;
    gitRepoAsync(url, name, installDirectory, revision, f.resolver());
    return f.wait();
}
exports.gitPackage = gitPackage;
function gitPackage(url, name, installDirectory, revision) {
    var f = new Future;
    gitPackageAsync(url, name, installDirectory, revision, f.resolver());
    return f.wait();
}

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
