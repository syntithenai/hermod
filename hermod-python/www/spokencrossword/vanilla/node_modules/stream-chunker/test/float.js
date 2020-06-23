var Chunker = require('../index.js');
var test = require('tape');
var chunky = require('chunky');

test('Test back-to-back float encoding', function (t) {

    t.plan(500);

    var buffer = new Buffer(16*100);
    for (var i=0 ; i<100 ; i++) {
        buffer.writeFloatBE(i/8, i*16+0);
        buffer.writeFloatBE(-i*4, i*16+4);
        buffer.writeFloatBE(i*2, i*16+8);
        buffer.writeFloatBE(-i, i*16|+12);
    }

    var chunks = chunky(buffer);

    var chunker = Chunker(16);
    
    var k=0;

    chunker.on('data', function (data) {
        t.equals(data.length, 16, 'Chunk size correct');

        var a = data.readFloatBE(0);
        var b = data.readFloatBE(4);
        var c = data.readFloatBE(8);
        var d = data.readFloatBE(12);

        t.equals(a, k/8, 'First float correctly parsed');
        t.equals(b, -k*4, 'Second float correctly parsed');
        t.equals(c, k*2, 'Third float correctly parsed');
        t.equals(d, -k, 'Fourth float correctly parsed');

        k++;
    });

    for (var j=0 ; j<chunks.length ; j++) {
        chunker.write(chunks[j]);
    }

});