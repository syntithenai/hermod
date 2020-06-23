Simple browser/node module to generate a dummy wav file of a specific duration, sample rate, and number of channels. The wav file contains only white noise.

## Installation
    $ npm install wav-dummy

## Usage
    const wavDummy = require('wav-dummy');

	// Generates a 10 second stereo wav file with a 44.1kHz sample rate
	const wavFile = wavDummy(10, 2, 44100)

## API
    wavDummy(nbSeconds: number, nbChannels: number, sampleRate: number): ArrayBuffer