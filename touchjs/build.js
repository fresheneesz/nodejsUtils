var fs = require('fs')

var buildDirectory = __dirname+'/generatedBuilds'
if(!fs.existsSync(buildDirectory)) {
    fs.mkdirSync(buildDirectory)
}


var touch = fs.readFileSync(__dirname + '/touch.js').toString()
var copy = ''

console.log('building and minifying...')
buildFile(storeJS, 'store.min.js')
buildFile(jsonJS + '\n\n' + storeJS, 'store+json2.min.js')
console.log('done')

function buildFile(js, name) {
var ast = uglify.parser.parse(js)
ast = uglify.uglify.ast_mangle(ast)
ast = uglify.uglify.ast_squeeze(ast)
var minifiedJS = uglify.uglify.gen_code(ast)
fs.writeFile(__dirname + '/' + name, copy + '\n' + minifiedJS)
}