var test = require('tap').test;
var bouncy = require('../');
var net = require('net');

test('raw without a host', function (t) {
    t.plan(1);
    
    var s = bouncy(function (req, bounce) {
        t.strictEqual(req.headers.host, undefined);
        t.end();
        req.socket.end();
        s.close();
    });
    
    s.listen(function () {
        var c = net.createConnection(s.address().port, function () {
            c.write('GET /lul HTTP/1.0\r\n\r\n');
        });
    });
});
