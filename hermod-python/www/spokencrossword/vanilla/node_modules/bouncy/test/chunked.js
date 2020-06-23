var test = require('tap').test;
var bouncy = require('../');
var http = require('http');
var net = require('net');
var split = require('split');
var concat = require('concat-stream');
var through = require('through');

test('chunked transfers should be transparent', function (t) {
    t.plan(2);
    
    var s0 = bouncy(function (req, bounce) {
        t.equal(req.headers.host, 'beepity.boop');
        bounce(s1.address().port);
    });
    
    var s1 = net.createServer(function (c) {
        var sentHeader = false;
        c.pipe(split()).pipe(through(function (buf) {
            var line = String(buf);
            if (!sentHeader && line === '' || line === '\r') {
                sentHeader = true;
                c.write([
                    'HTTP/1.1 200 200 OK',
                    'Content-Type: text/plain',
                    'Transfer-Encoding: chunked',
                    'Connection: close',
                    '',
                    ''
                ].join('\r\n'));
            }
        }));
        
        var chunks = [
            function () { c.write('4\r\nabcd\r\n') },
            function () { c.write('5\r\nefghi\r\n') },
            function () { c.write('7\r\njklmnop\r\n') },
            function () { c.write('0\r\n'); c.end() },
        ];
        
        var iv = setInterval(function () {
            var fn = chunks.shift();
            if (fn) fn()
            else clearInterval(iv)
        }, 25);
    });
    
    s1.listen(connect);
    s0.listen(connect);
    
    var connected = 0;
    function connect () {
        if (++connected !== 2) return;
        
        var c = net.connect(s0.address().port, function () {
            c.write([
                'GET / HTTP/1.1',
                'Host: beepity.boop',
                '',
                ''
            ].join('\r\n'));
            
            c.pipe(concat(function (body) {
                t.equal(body.toString(), [
                    'HTTP/1.1 200 200 OK',
                    'Content-Type: text/plain',
                    'Transfer-Encoding: chunked',
                    'Connection: close',
                    '',
                    '4',
                    'abcd',
                    '5',
                    'efghi',
                    '7',
                    'jklmnop',
                    '0',
                    ''
                ].join('\r\n'));
                
                t.end();
                s0.close();
                s1.close();
            }));
        });
    }
});
