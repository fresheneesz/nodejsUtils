
var fs = require('fs');
var os = require('os');
var utils = require('./utils');
var Fiber = require('fibers');
var Future = require('fibers/future');

// returns false if the file already exists
exports.file = function file(source, destination) {
	var future = new Future;
    process.nextTick(function() { new Fiber(function(){
        if( ! fs.existsSync(destination)) {
            var sourceContents = fs.readFileSync(source);
            fs.writeFileSync(destination, sourceContents);
            return true;
        } else {
            return false;
        }
    }).run();});
    return future;
};

exports.gitReset = gitReset;
function gitReset(location, revision) {
    if(revision === undefined) revision = 'HEAD';
    return utils.exec('git reset --hard '+revision, {cwd:location}); // use a specific revision
}
exports.gitRepo = gitRepo;
function gitRepo(url, name, installDirectory, revision) {
    var future = new Future;
    process.nextTick(function() { new Fiber(function(){
        var data = {};
        var location = installDirectory+'/'+name+'/';

        if( ! fs.existsSync(location)) {
            data['clone'] = utils.exec('git clone '+url+' '+location).wait();
        } else {
            data['clone'] = {'out': 'Skipping clone because '+location+' already exists.'};
        }

        data['reset'] = gitReset(location, revision).wait();

        future.return(data);
    }).run();});

    return future;
}
exports.gitPackage = gitPackage;
function gitPackage(url, name, installDirectory, revision) {
    var future = new Future;
    process.nextTick(function() { new Fiber(function(){
        var data = gitRepo(url, name, installDirectory, revision).wait();
        data['install'] = utils.exec('npm install', {cwd:installDirectory+"/"+name}).wait();
        future.return(data);
    }).run();});

    return future;
};

exports.rm = rm;
function rm(path) {
    if(['win32','win64'].indexOf(os.platform()) !== -1) {
        var command = 'rmdir /s/q '+path;
    } else { // assume its linux-like
        var command = 'rm -R '+path;
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
