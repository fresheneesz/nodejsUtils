var tr = require('../../requireTraverser')

tr(__dirname, './analyzeThis.js', function(e, files) {
    if(e) throw e

    console.dir(files);
    for(var n in files) {
        console.dir(files[n].dependencies)
    }
});
