# stream-chunker

A transform stream which chunks incoming data into `chunkSize` byte chunks.

[![NPM](https://nodei.co/npm/stream-chunker.png)](https://nodei.co/npm/stream-chunker/)

[![Build Status](https://travis-ci.org/klyngbaek/stream-chunker.svg?branch=master)](https://travis-ci.org/klyngbaek/stream-chunker)
[![Coverage Status](https://coveralls.io/repos/github/klyngbaek/stream-chunker/badge.svg?branch=master)](https://coveralls.io/github/klyngbaek/stream-chunker?branch=master)
[![Dependency Status](https://david-dm.org/klyngbaek/stream-chunker.svg)](https://david-dm.org/klyngbaek/stream-chunker)
[![devDependency Status](https://david-dm.org/klyngbaek/stream-chunker/dev-status.svg)](https://david-dm.org/klyngbaek/stream-chunker#info=devDependencies)

## API

#### `var chunker = require('stream-chunker')(chunkSize, [opts])`
Returns a new chunker. Chunker is a duplex (transform) stream. You can write data into the
chunker, and regardless of the incoming data, the readable side will emit data
in `chunkSize` byte chunks. This modules has no notion of `objectMode`, everything
written to this stream must be a `string` or a `buffer`.

- `chunkSize`: `integer` - Size in bytes of the desired chunks.
- `opts`
  - `flush`: `boolean` - Optional. Flush incomplete chunk data on stream end. Default is `false`.
  - `align`: `boolean` - Optional. Pad incomplete chunk data on stream end. Should be used in combination with `flush`. Default is `false`.
  - `encoding`: `string` - Optional. Encoding of String chunks. Must be a valid Buffer encoding, such as `utf8` or `ascii`.

## Simple Example
```javascript
var fs = require('fs');
var chunker = require('stream-chunker');

fs.createReadStream('/someFile')
  	.pipe(chunker(16))
  	.pipe(somethingThatExpects16ByteChunks());
```

## Full Working Example
```javascript
// Create sample input stream with 10 byte chunks
var Lorem = require('loremipstream');
var sampleStream = new Lorem({
	size: 100,
	dataSize: 10,
	dataInteval: 100
});

// Create stream chunker with 16 byte chunks
var Chunker = require('stream-chunker');
var opts = {
	flush: true,
	encoding: 'utf8'
};
var chunker = Chunker(16, opts);
// make sure to add any data event listeners to chunker stream
// before you write any data to it
chunker.on('data', function(data) {
    // do something with a chunk of data
    // notice the last chunk is the flushed data
    console.log('Chunk: ' + data);
});
sampleStream.pipe(chunker); // write some data to chunker to get chunked

```

## License
MIT
