var http = require('http')
var url = require('url')
var querystring = require('querystring')
var amdify = require('../../amdify/amdify')
var utils = require('../../utils')

utils.async({try: function() {
    http.createServer(function (request, res) {
        try {
            var requestUrl = url.parse(request.url)
            var path = requestUrl.pathname
            var params = querystring.parse(requestUrl.query)

            if(path === "/") {
                amdify.starterPackage(__dirname, "./main", '/script/', function(e, package) {
                    if(e) throw e

                    writeResponse({
                        body: '<script>'+package+'</script>'
                    }, res)
                })
            } else if(path === "/script/") {
                amdify.buildPackage(params, function(e, package) {
                    if(e) throw e

                    writeResponse({
                        body: package,
                        'content-type': 'text/javascript'
                    }, res)
                })
            } else {
                writeResponse({
                    code: 404, body: ''
                }, res)
            }
        } catch(e) {
            console.log(e.stack)
            res.end()
        }

    }).listen(80)
}, catch: function(e) {
    console.log(e.stack)
}})

function writeResponse(result, response) {
    if(!result.code) result.code = 200
    if(result.headers === undefined) result.headers = {}
    if(!result.headers['content-type']) result.headers['content-type'] = 'text/html'
    result.headers['content-length'] = result.body.length

	response.writeHead(result.code, result.headers)
    if(result.body)
        response.write(result.body)
    response.end()
}