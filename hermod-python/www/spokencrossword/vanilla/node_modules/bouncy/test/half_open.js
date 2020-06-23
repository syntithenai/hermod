var test = require('tap').test;
var bouncy = require('../');
var http = require('http');
var net = require('net');

var proxy = bouncy(function (req, res, bounce) {
    if (req.headers.host === 'robot') {
        bounce(server.address().port);
    }
    else {
        res.statusCode = 404;
        res.end('not found\n');
    }
});
proxy.listen(0);

var server = http.createServer(function (req, res) {
    res.write('beep ');
    
    setTimeout(function () {
        res.end('boop.');
    }, 100);
});
server.listen(0);

test('half-open', function (t) {
    t.plan(1);
    var c = net.connect(proxy.address().port);
    
    var data = '';
    c.on('data', function (buf) { data += buf });
    c.on('end', function () {
        var lines = data.split(/\r?\n/);
        for (var ix = 0; lines[ix] !== ''; ix++);
        
        t.same(lines.slice(ix+1), [
            '5',
            'beep ',
            '5',
            'boop.',
            '0',
            '',
            ''
        ]);
    });
    
    c.write([
        'GET / HTTP/1.1',
        'Host: robot',
        'Connection: close',
        '',
        ''
    ].join('\r\n'));
});

test(function (t) {
    server.close();
    proxy.close();
    t.end();
});
