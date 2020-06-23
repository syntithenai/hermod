var test = require('tap').test;
var http = require('http');
var bouncy = require('../');

test('bounce opts.path', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce({ port : port, path : '/rewritten' });
    });
});

test('bounce opts.path with separate port', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce(port, { path : '/rewritten' });
    });
});

test('bounce opts.path with a shorthand url', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce(':' + port + '/rewritten');
    });
});

test('bounce opts.path with a non-http abbreviated url', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce('localhost:' + port + '/rewritten');
    });
});

test('bounce opts.path with a full url', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce('http://localhost:' + port + '/rewritten');
    });
});

test('bounce with a root path', function (t) {
    testUrl(t, function (port, req, bounce) {
        bounce(':' + port + '/');
    }, '/');
});

function testUrl (t, bouncer, target) {
    t.plan(4);
    if (!target) target = '/rewritten';
    
    var s0 = http.createServer(function (req, res) {
        t.equal(req.url, target);
        res.setHeader('content-type', 'text/plain');
        res.write('beep boop');
        res.end();
    });
    s0.listen(connect);
    
    var s1 = bouncy(function (req, res, bounce) {
        bouncer(s0.address().port, req, bounce);
    });
    s1.listen(connect);
    
    var connected = 0;
    function connect () {
        if (++connected !== 2) return;
        var opts = {
            method : 'GET',
            host : 'localhost',
            port : s1.address().port,
            path : '/beep',
            headers : { connection : 'close' }
        };
        var req = http.request(opts, function (res) {
            t.equal(res.statusCode, 200)
            t.equal(res.headers['content-type'], 'text/plain');
            
            var data = '';
            res.on('data', function (buf) {
                data += buf.toString();
            });
            
            res.on('end', function () {
                t.equal(data, 'beep boop');
                s0.close();
                s1.close();
                t.end();
            });
        });
        req.end();
    }
}
