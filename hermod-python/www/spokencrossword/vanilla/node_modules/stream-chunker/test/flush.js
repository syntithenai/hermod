var Chunker = require('../index.js');
var test = require('tape');
var concat = require('concat-stream');

test('Test flush option', function (t) {

    t.plan(2);
    
    var opts = {
        flush: false,
        encoding: 'utf8'
    }

    function check(data) {
        t.equals(data, '1234', 'Received only full chunks');
    }
    var chunker = Chunker(4, opts);
    var concatStream = concat(check);
    chunker.pipe(concatStream);
    chunker.write('12');
    chunker.write('34');
    chunker.write('56');
    chunker.end();
    
    var optsFlush = {
        flush: true,
        encoding: 'utf8'
    }

    function checkFlush(data) {
        t.equals(data, '123456', 'Received flush data');
    }
    var chunkerFlush = Chunker(4, optsFlush);
    var concatStreamFlush = concat(checkFlush);
    chunkerFlush.pipe(concatStreamFlush);
    chunkerFlush.write('12');
    chunkerFlush.write('34');
    chunkerFlush.write('56');
    chunkerFlush.end();
    
});

test('Test align option', function (t) {

    t.plan(2);

    var optsFlushAlign = {
        flush: true,
        align: true,
        encoding: 'utf8'
    }

    function checkFlushAlign(data) {
        t.equals(data, '12345\0\0\0', 'Received flush data');
    }
    var chunkerFlushAlign = Chunker(4, optsFlushAlign);
    var concatStreamFlushAlign = concat(checkFlushAlign);
    chunkerFlushAlign.pipe(concatStreamFlushAlign);
    chunkerFlushAlign.write('12');
    chunkerFlushAlign.write('34');
    chunkerFlushAlign.write('5');
    chunkerFlushAlign.end();

    function checkAlignedFlushAlign(data) {
        t.equals(data, '1234', 'Received flush data');
    }
    var chunkerAlignedFlushAlign = Chunker(4, optsFlushAlign);
    var concatStreamAlignedFlushAlign = concat(checkAlignedFlushAlign);
    chunkerAlignedFlushAlign.pipe(concatStreamAlignedFlushAlign);
    chunkerAlignedFlushAlign.write('12');
    chunkerAlignedFlushAlign.write('34');
    chunkerAlignedFlushAlign.end();

});
