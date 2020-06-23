var bouncy = require('../');
var http = require('http');

bouncy(function (req, res, bounce) {
    if (req.headers.host === 'robot') {
        bounce(8001);
    }
    else {
        res.statusCode = 404;
        res.end('not found\n');
    }
}).listen(8000);

http.createServer(function (req, res) {
    res.end('beep boop\n');
}).listen(8001);
