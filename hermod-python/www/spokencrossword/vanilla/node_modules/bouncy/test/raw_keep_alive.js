var test = require('tap').test;
var bouncy = require('../');
var net = require('net');
var http = require('http');
var through = require('through');

test('raw keep alive', function (t) {
    t.plan(5);
    t.on('end', function () {
        s0.close();
        s1.close();
    });
    
    var s0 = bouncy(function (req, res, bounce) {
        // only the first request should pass through the proxy
        t.equal(req.url, '/a');
        bounce(s1.address().port);
    });
    
    var u = [ '/a', '/b', '/c' ];
    var s1 = http.createServer(function (req, res) {
        t.equal(req.url, u.shift());
        setTimeout(function () {
            res.end(req.url.slice(1).toUpperCase());
        }, 75);
    });
    
    s0.listen(0, ready);
    s1.listen(0, ready);
    
    var pending = 2;
    function ready () {
        if (--pending !== 0) return;
        
        var port = s0.address().port;
        var c = net.connect(port);
        
        setTimeout(function () {
            c.write([
                'GET /a HTTP/1.1',
                'Host: z',
                'Connection: keep-alive',
                '',
                ''
            ].join('\r\n'));
        }, 50);
        
        setTimeout(function () {
            c.write([
                'GET /b HTTP/1.1',
                'Host: z',
                'Connection: keep-alive',
                '',
                ''
            ].join('\r\n'));
        }, 100);
        
        setTimeout(function () {
            c.write([
                'GET /c HTTP/1.1',
                'Host: z',
                'Connection: close',
                '',
                ''
            ].join('\r\n'));
        }, 150);
        
        var data = '';
        c.on('data', function (buf) { data += buf });
        c.on('end', function () {
            t.deepEqual(
                data.split(/\r?\n/).filter(function (line) {
                    return /^[A-Z]$/.test(line)
                }),
                [ 'A', 'B', 'C' ]
            );
        });
    }
});
