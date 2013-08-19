"use strict";

var path = require("path")
var Unit = require('../../unit')

Unit.test("Testing requireTraverser", function() {
    var tr = require('../../requireTraverser')
    var t = this

    tr(__dirname, './testFiles/inner/analyzeThis.js', function(e, files) {
        if(e) throw e

        var r = resolveRelativePath


        var keys = []
        for(var n in files) {
            keys.push(n)
        }

        t.ok(keys.length === 8)

        var analyzeThis = r('inner/analyzeThis.js')
        var dependencyA = r('inner/dependencyA.js')
        var doom = r('node_modules/doom.js')
        var a = r('inner/node_modules/a.js')
        var c = r('inner/node_modules/c.js')
        var d = r('inner/node_modules/d.js')
        var moose = r('inner/node_modules/moose.js')
        var curl = r('../../../node_modules/curl/src/curl.js')

        console.log('\n'+r('../../node_modules/curl/src/curl.js')+'\n')

        function basicTest(filePath, resolved, unresolved, unfound) {
            var info = files[filePath]
            this.ok(info)

            this.ok(info.resolved.length === resolved)
            this.ok(info.unresolved.length === unresolved)
            this.ok(info.unfound.length === unfound)

            return info
        }

        t.test("analyzeThis.js", function() {
            var info = basicTest.call(this, analyzeThis, 6, 2, 2)
            var resolved = info.resolved

            this.ok(resolved[0].relative === './dependencyA')
            this.ok(resolved[0].absolute === dependencyA)
            this.ok(resolved[1].relative === 'c')
            this.ok(resolved[1].absolute === c)
            this.ok(resolved[2].relative === 'doom')
            this.ok(resolved[2].absolute === doom)
            this.ok(resolved[3].relative === 'curl')
            this.ok(resolved[3].absolute === curl)
            this.ok(resolved[4].relative === 'moose')
            this.ok(resolved[4].absolute === moose)
            this.ok(resolved[5].relative === 'a')
            this.ok(resolved[5].absolute === a)

            this.ok(info.unresolved[0] === "'dep' + 'endency'")
            this.ok(info.unresolved[1] === 'x')

            this.ok(info.unfound[0] === 'util')
            this.ok(info.unfound[1] === 'fs')
        })

        t.test("dependencyA.js", function() {
            var info = basicTest.call(this, dependencyA, 0, 0, 0)
        })

        t.test("c.js", function() {
            var info = basicTest.call(this, c, 1, 0, 0)
            var resolved = info.resolved

            this.ok(resolved[0].relative === './d')
            this.ok(resolved[0].absolute === d)
        })

        t.test("doom.js", function() {
            var info = basicTest.call(this, doom, 0, 0, 0)
        })

        t.test("curl.js", function() {
            var info = basicTest.call(this, curl, 0, 0, 0)
        })

        t.test("moose.js", function() {
            var info = basicTest.call(this, moose, 0, 0, 0)
        })

        t.test("a.js", function() {
            var info = basicTest.call(this, a, 1, 0, 0)

            this.ok(info.resolved[0].relative === 'c')
            this.ok(info.resolved[0].absolute === c)
        })

        console.dir(files)

    });
}).writeConsole()

function resolveRelativePath(relativePath) {
    return path.resolve(__dirname, 'testFiles/', relativePath)
}

