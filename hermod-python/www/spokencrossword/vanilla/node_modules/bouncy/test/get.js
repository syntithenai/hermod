var test = require('tap').test;
var bouncy = require('../');
var http = require('http');
var through = require('through');

test('GET with http', function (t) {
    t.plan(3);
    var s = bouncy(function (req, bounce) {
        t.equal(req.headers.host, 'localhost:' + s.address().port);
        
        var stream = through(
            function () {},
            function () {}
        );
        bounce(stream);
        
        stream.emit('data', [
            'HTTP/1.1 200 200 OK',
            'Content-Type: text/plain',
            'Connection: close',
            '',
            'oh hello'
        ].join('\r\n'));
        stream.emit('end');
    });
    
    s.listen(function () {
        var opts = {
            method : 'GET',
            host : 'localhost',
            port : s.address().port,
            path : '/'
        };
        var req = http.request(opts, function (res) {
            t.equal(res.headers['content-type'], 'text/plain');
            
            var data = '';
            res.on('data', function (buf) {
                data += buf.toString();
            });
            
            res.on('end', function () {
                t.equal(data, 'oh hello');
                s.close();
                t.end();
            });
        });
        
        req.end();
    });
});
