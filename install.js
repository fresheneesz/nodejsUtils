
var fs = require('fs');
var os = require('os');
var path = require('path');
var utils = require('./utils');
var Fiber = require('fibers');
var Future = require('fibers/future');


// returns false if the file already exists
exports.file = function file(source, destination) {
    return utils.futureEnv(function() {
        if( ! fs.existsSync(destination)) {
            cp(source, destination).wait();
            return true;
        } else {
            return false;
        }
    });
};
exports.cp = cp;
function cp(source, destination) {
	return utils.futureEnv(function() {
        var sourceContents = fs.readFileSync(source);
        fs.writeFileSync(destination, sourceContents);
    });
};

exports.gitReset = gitReset;
function gitReset(location, revision) {
    if(revision === undefined) revision = 'HEAD';
    return utils.exec('git reset --hard '+revision, {cwd:location}); // use a specific revision
}
exports.gitRepo = gitRepo;
function gitRepo(url, name, installDirectory, revision) {
    return utils.futureEnv(function() {
        var data = {};
        var location = installDirectory+'/'+name+'/';

        if( ! fs.existsSync(location)) {
            data['clone'] = utils.exec('git clone '+url+' '+location).wait();
        } else {
            data['clone'] = {'out': 'Skipping clone because '+location+' already exists.'};
        }

        data['reset'] = gitReset(location, revision).wait();

        return data;
    });

    return future;
}
exports.gitPackage = gitPackage;
function gitPackage(url, name, installDirectory, revision) {
    return utils.futureEnv(function() {
        var data = gitRepo(url, name, installDirectory, revision).wait();
        data['install'] = utils.exec('npm install', {cwd:installDirectory+"/"+name}).wait();
        return data;
    });
};

exports.rm = rm;
function rm(path) {
    var isDir = fs.lstatSync(path).isDirectory();
    if(['win32','win64'].indexOf(os.platform()) !== -1) {
        if(isDir)   var command = 'rmdir /s/q "'+path+'"';
        else        var command = 'rm "'+path+'"';
    } else { // assume its linux-like
        if(isDir)   var command = 'rm -R "'+path+'"';
        else        var command = 'rm "'+path+'"';

    }

    return utils.exec(command);
}

exports.symlink = symlink;
function symlink(source, destination) {
    var isDir = fs.lstatSync(source).isDirectory();
    if(['win32','win64'].indexOf(os.platform()) !== -1) {
        var flag = "";
        if(isDir) var flag = "/D ";

        var command = 'mklink '+flag+'"'+path.resolve(destination)+'" "'+path.resolve(source)+'"';
    } else { // assume its linux-like
        var command = 'ln -s "'+source+'" "'+destination+'"';
    }

    return utils.exec(command);
}

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
