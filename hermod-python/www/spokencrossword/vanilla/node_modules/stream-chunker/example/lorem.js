// Create sample input stream with 10 byte chunks
var Lorem = require('loremipstream');
var sampleStream = new Lorem({
	size: 100,
	dataSize: 10,
	dataInteval: 100
});

// Create stream chunker with 16 byte chunks
var Chunker = require('../index.js');
var opts = {
	flush: true,
	encoding: 'utf8'
};
var chunker = Chunker(16, opts); // split the stream of data into 4 byte chunks
// make sure to add any data event listeners to chunker stream
// before you write any data to it
chunker.on('data', function(data) {
    // do something with a chunk of data
    // notice the last chunk is the flushed data
    console.log('Chunk: ' + data);
});
sampleStream.pipe(chunker); // write some data to chunker to get chunked
