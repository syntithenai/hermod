#!/usr/bin/env node
var http = require('http');
var p0 = 7500;
var p1 = 7501;

var name = process.argv[3];
var server = {
    simple : http.createServer(function (req, res) {
        res.end('beepity boop');
    }),
    big : (function () {
        var giganticBuffer = new Buffer(1024 * 1024 * 4);
        
        return http.createServer(function (req, res) {
            res.end(giganticBuffer);
        })
    })(),
}[process.argv[2]];
server.listen(p1);

if (name) {
    var proxy = require('./' + name)(p1);
    proxy.listen(p0);
}

console.log('ab -n 5000 -c 10 http://localhost:' + p0 + '/');

setInterval(function () {
    var mb = process.memoryUsage().heapTotal / 1024 / 1024;
    var s = String(Math.round(mb * 10) / 10);
    var pad = Array(Math.max(1, 6 - s.length + 1)).join(' ');
    console.log(pad + s + ' M');
}, 2000);
