
var fs = require('fs')
var os = require('os')
var path = require('path')
var utils = require('./utils')
var Fiber = require('fibers')
var Future = require('fibers/future')
var resumer = require("resumer")
var ss = require('stream-stream')


var cp = exports.cp = function(source, destination) {
	var sourceContents = fs.readFileSync(source)
    fs.writeFileSync(destination, sourceContents)
}.future()

// returns false if the file already exists
var file = exports.file = function(source, destination) {
    if( ! fs.existsSync(destination)) {
        cp(source, destination).wait()
        return true
    } else {
        return false
    }
}.future()

var folder = exports.folder = function(name) {
    if( ! fs.existsSync(name)) {
        return utils.futureWrap(fs.mkdir)(name).wait();
    }
}

exports.gitReset = gitReset; function gitReset(location, revision, hard) {
    if(revision === undefined) revision = 'HEAD'
    var hardOption = hard?'--hard':''
    return utils.exec('git reset '+hardOption+' '+revision, {cwd:location}) // use a specific revision
}

var gitRepo = exports.gitRepo = function(url, name, installDirectory, revision) {
    var location = installDirectory+'/'+name+'/'

    var stdout = ss()
    var stderr = ss()

    var result = (function() {
        if( ! fs.existsSync(location)) {
            var command = 'git clone '+url+' '+location
            var cloneData = utils.exec(command)

            stdout.write(streamImmediate(command))
            stdout.write(cloneData.stdout)
            stderr.write(cloneData.stderr)
            cloneData.wait()
        } else {
            stdout.write(streamImmediate('Skipping clone because '+location+' already exists.'))
        }

        var reset = gitReset(location, revision)
        stdout.write(cloneData.stdout)
        stderr.write(cloneData.stderr)
        reset.wait()
    }.future())()

    result.stdout = stdout
    result.stderr = stderr

    return result
}

var gitPackage = exports.gitPackage = function(url, name, installDirectory, revision) {
        var stdout = ss()
        var stderr = ss()

        var result = (function() {
            var data = gitRepo(url, name, installDirectory, revision)
            stdout.write(data.stdout)
            stderr.write(data.stderr)
            data.wait()

            var installData = utils.exec('npm install', {cwd:installDirectory+"/"+name})
            stdout.write(installData.stdout)
            stderr.write(installData.stderr)
            installData.wait()
        }.future())()

        result.stdout = stdout
        result.stderr = stderr

        return result
}

exports.rm = rm; function rm(path) {
    var isDir = fs.lstatSync(path).isDirectory()
    if(['win32','win64'].indexOf(os.platform()) !== -1) {
        if(isDir)   var command = 'rmdir /s/q "'+path+'"'
        else        var command = 'rm "'+path+'"'
    } else { // assume its linux-like
        if(isDir)   var command = 'rm -R "'+path+'"'
        else        var command = 'rm "'+path+'"'
    }

    return utils.exec(command)
}

exports.symlink = symlink; function symlink(source, destination) {
    var isDir = fs.lstatSync(source).isDirectory()
    if(['win32','win64'].indexOf(os.platform()) !== -1) {
        var flag = ""
        if(isDir) var flag = "/D "

        var command = 'mklink '+flag+'"'+path.resolve(destination)+'" "'+path.resolve(source)+'"'
    } else { // assume its linux-like
        var command = 'ln -s "'+source+'" "'+destination+'"'
    }

    return utils.exec(command)
}

// create a stream from a string
exports.streamImmediate = streamImmediate; function streamImmediate(stringImmediate) {
    return resumer().queue(stringImmediate).end()
}

/*
// requires a module, and if it doesn't exist, npm it in
// after gets stdout, stderr, and a possible exception as arguments
function requireNpm(module, after) {
    try {
        after(require(module))
    } catch(e) {
        exec('npm install '+module, {cwd:"."}, function () {
            after(require(installUtilsName))
        })
    }
}
*/
