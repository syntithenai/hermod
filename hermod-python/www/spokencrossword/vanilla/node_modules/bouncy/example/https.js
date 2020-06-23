var fs = require('fs');
var opts = {
    key : fs.readFileSync(__dirname + '/https/privatekey.pem'),
    cert : fs.readFileSync(__dirname + '/https/certificate.pem')
};

var bouncy = require('../');
bouncy(opts, function (req, bounce) {
    bounce(9000);
}).listen(7005);

console.log('https://localhost:7005');
