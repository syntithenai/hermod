var test = require('tap').test;
var insert = require('../lib/insert.js');
var chunky = require('chunky');

test('update url', function (t) {
    var times = 50;
    t.plan(times);
    var msg = new Buffer([
        'POST /beepity HTTP/1.1',
        'Host: beep',
        '',
        'sound=boop'
    ].join('\r\n'));
    
    for (var i = 0; i < times; i++) (function () {
        var chunks = chunky(msg);
        
        var s = insert({ path: '/boop' });
        var data = '';
        s.on('data', function (buf) { data += buf });
        s.on('end', function () {
            t.equal(
                data,
                msg.toString().replace('/beepity', '/boop')
            );
        });
        
        for (var i = 0; i < chunks.length; i++) {
            s.write(chunks[i]);
        }
        s.end();
    })();
});
