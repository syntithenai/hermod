const fs = require('fs');
const main = require('./main.js');

fs.writeFileSync('./test.wav', Buffer.from(main(10, 6, 11000)));