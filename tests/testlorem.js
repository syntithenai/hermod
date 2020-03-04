// Create sample input stream with 10 byte chunks
var Lorem = require('loremipstream');
var sampleStream = new Lorem({
    size: 50,
    dataSize: 10,
    dataInteval: 10
});
 
// Create stream chunker with 4 byte chunks
var CHUNK_SIZE = 7;
Chunker = require('stream-chunker');
var chunker = Chunker(CHUNK_SIZE,{flush:true}) // split the stream of data into 4 byte chunks
// make sure to add any data event listeners to chunker stream
// before you write any data to it
chunker.on('data', function(data) {
    // do something with a 16 byte chunk of data
   console.log(data ? data.length : -1)
		 console.log('Handle '+CHUNK_SIZE+'bytes at a time: ' + data.toString('utf8'));
});
sampleStream.pipe(chunker); // write some data to chunker to get chunked
