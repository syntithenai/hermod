var Microphone = require('./MicStream')
//var mic = require('mic')
var Speaker = require('audio-speaker')
var stream = require('stream') 
var ge = stream.Readable;
var Writable = stream.Writable;
var Readable = stream.Readable;
var VAD= require('node-vad')
// var rec = require('node-record-lpcm16')
var WaveFile = require('wavefile');

var silenceStream = new Readable()
silenceStream._read = () => {} // _read is required but you can noop it
var wordBreakStream = new Readable()
wordBreakStream._read = () => {} // _read is required but you can noop it
var hotwordStream = new Readable()
hotwordStream._read = () => {} // _read is required but you can noop it
var wavConfig = {
  "channels": 1,
  "sampleRate": 16000,
  "bitDepth": 16
};
var micInstance = Microphone(Object.assign({debug:true},wavConfig));
micInstance.start()
var stream = micInstance.getAudioStream()
var vadSilent = false;
var inWordBreak = false;

//console.log('STREAM')		
//console.log(stream)

stream.on('error', function () {
	console.log('error');
});

let wavPacketCount = 0;
//// push audio to multiple streams
stream.on('data', function(chunk) {
	//console.log(['DATA',chunk]);
	silenceStream.push(chunk);
	wordBreakStream.push(chunk);
	if (wavPacketCount ===0 ) {
		let wav = new WaveFile();
		// Create a mono wave file, 44.1 kHz, 32-bit and 4 samples
		wav.fromScratch(1, 16000, '16', chunk);
		console.log(['first wav packet',wav.toBuffer().length]);
		hotwordStream.push(wav.toBuffer());
		wavPacketCount++;
	} else {
		hotwordStream.push(chunk);
	}
	//silenceStream.push(Buffer.from(chunk.data));
	//wavWriter.push(chunk);
});


/**
 * Long silence detector
 */
const silenceDetector = VAD.createStream({
	mode: VAD.Mode.NORMAL,
	audioFrequency: 16000,
	debounceTime: 1000
});

silenceDetector.on("data", function(data) {
	//console.log('silence data')
		//console.log(data)		
	if (vadSilent !== data.speech.state) {
		if (!data.speech.state) console.log('end utterance')
		if (data.speech.state) console.log('start utterance')
		//console.log('silence data')
		//console.log(data.speech.state)		
	}
	vadSilent = data.speech.state;
});
silenceStream.pipe(silenceDetector)

/**
 * Word break silence detector
 */
const wordBreakDetector = VAD.createStream({
	mode: VAD.Mode.NORMAL,
	audioFrequency: 16000,
	debounceTime: 5
});

wordBreakDetector.on("data", function(data) {
	//console.log('silence data')
		//console.log(data)		
	if (inWordBreak !== data.speech.state) {
		if (!data.speech.state) console.log('end word')
//		if (data.speech.state) console.log('start utterance')
		//console.log('silence data')
		//console.log(data.speech.state)		
	}
	inWordBreak = data.speech.state;
});
wordBreakStream.pipe(wordBreakDetector)



/**	
 * Hotword
 */

var config = {
	models: [{
		file: './node_modules/snowboy/resources/models/snowboy.umdl',
		sensitivity: '0.5',
		hotwords : 'snowboy'
	}],
	detector: {
		resource: "./node_modules/snowboy/resources/common.res",
		audioGain: 2.0,
		applyFrontend: true
	}
};
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
var silent = true;
 // snowboy setup
var models = new Models();
//if (typeof this.props.models !== 'object') throw new Exception('Missing hotword configuration for models')
config.models.map(function(thisModel) {
	models.add(thisModel);
})

detector = new Detector(Object.assign({models:models},config.detector));
detector.on('silence', function () {
  if (!silent) console.log('silence');
  silent = true;
});

detector.on('sound', function (buffer) {
  if (silent)  console.log(['sound',buffer.length]);
  silent = false;		  // <buffer> contains the last chunk of the audio that triggers the "sound"
  // event. It could be written to a wav stream.
  //console.log('sound');
});

detector.on('error', function () {
  console.log('error');
});

detector.on('hotword', function (index, hotword, buffer) {
  // <buffer> contains the last chunk of the audio that triggers the "hotword"
  // event. It could be written to a wav stream. You will have to use it
  // together with the <buffer> in the "sound" event if you want to get audio
  // data after the hotword.
  console.log(['hotword', index, hotword]);
  console.log(['sound',buffer.length]);
  //console.log(buffer);
  //if (that.listening) that.sendMqtt('hermod/' + that.props.siteId + '/hotword/detected',{});    
});
 
hotwordStream.pipe(detector)


/**
 * Read wav stream, extract header to configure speaker output then pipe to speaker
 */
//var speaker = null;
//var wav = require('wav');
//var wavReader = new wav.Reader(wavConfig);
//wavReader.on('format', function (format) {					 
  //console.log(['format',format]);
  //// the WAVE header is stripped from the output of the reader
  //speaker = new Speaker(format);
  //wavReader.pipe(speaker)
//});
//stream.pipe(wavReader);






//var wav = require('wav');
//var wavWriter = new wav.Writer(wavConfig);

//const fs = require('fs');
//const file = fs.createWriteStream('./stream6.wav');


//stream.pipe(speaker())

//wavWriter.pipe(file)

//// the "format" event gets emitted at the end of the WAVE header
//var speaker = null
//wavWriter.on('format', function (format) {					 
  //// the WAVE header is stripped from the output of the reader
  //speaker = new Speaker(format);
  //wavWriter.pipe(speaker)
//});
//stream.pipe(reader)
//pe(file)
		



//micInstance.start()
//console.log(micInstance)
//var stream = micInstance.getAudioStream();
//var stream = rec.start({threshhold:0,verbose : true,silence:'1.0'})

//var vadSilent = false;
//var inWordBreak = false;

//console.log('STREAM')		
//console.log(stream)

//stream.on('error', function () {
	//console.log('error');
//});

//// push audio to multiple streams
//stream.on('data', function(chunk) {
	//console.log(['DATA',chunk]);
	////silenceStream.push(Buffer.from(chunk.data));
	//silenceStream.push(chunk);
//});


//const silenceDetector = VAD.createStream({
	//mode: VAD.Mode.NORMAL,
	//audioFrequency: 16000,
	//debounceTime: 100
//});

//silenceDetector.on("data", function(data) {
	//console.log('silence data')
		//consop.stdout.on('data', (data) => {
	  //console.log(`stderr: ${data}`);
	//});le.log(data)		
	//if (vadSilent !== data.speech.state) {
		//console.log('silence data')
		//console.log(data.speech.state)		
	//}
	//vadSilent = data.speech.state;
//});
//silenceStream.pipe(silenceDetector)





//var mic = require('mic-stream')
//var speaker = require('speaker')

//var chunkingStreams = require('chunking-streams');

//var SizeChunker = chunkingStreams.SizeChunker;

//var chunker = new SizeChunker({
	//chunkSize: 512
//});
//var stream = require('stream') 
//var Readable = stream.Readable;

////var output;
 //// mqtt to stream - pushed to when audio packet arrive        
////stream.pipe(hotwordStream)        


// silence detection short (word break) and long(end utterance)

////const wordBreakDetector = VAD.createStream({
	////mode: VAD.Mode.NORMAL,
	////audioFrequency: 16000,
	////debounceTime: 50
//});

////wordBreakDetector.on("data", function(data) {
	////if (inWordBreak !== data.speech.state) {
		////console.log('word break data')
		////console.log(data.speech.state)		
	////}
	////inWordBreak = data.speech.state;
////});
////wordBreakStream.pipe(wordBreakDetector)



////// nodejs index.js & sleep 3; mqtt pub -t 'hermod/default/microphone/start' -h 'localhost' -m '{"text":"this is a v"}'; mqtt pub -t 'hermod/default/hotword/start' -h 'localhost' -m '{"text":"this is a v"}'
////// mqtt pub -t 'hermod/default/microphone/stop' -h 'localhost' -m '{}'


/////** //const fs = require('fs');
//const file = fs.createWriteStream('./stream5.wav');
	

//////setTimeout(function() {
	//////stream.stop(function() {
		//////console.log('stopped');
	//////})
//////},1000)

//////const writable = new stream.Writable({encoding:false,highWaterMark:'1kb'})
//////writable._write = (chunk,encoding,cb) => {
    //////console.log('data')
    //////console.log(chunk ? chunk.length : 'NULL')
    //////cb();
//////}


 
//////mic().pipe(writable)


//var stream = mic({
		  //bitDepth: 16,
		  //channels: 1,
		  //sampleRate: 16000,
		//});;
		
//console.log('STREAM')		
//console.log(stream)
//stream.on('error', function () {
	//console.log('error');
//});

//// push audio to multiple streams
//stream.on('end', function(chunk) {
	//console.log(['DATA',chunk]);
	////silenceStream.push(chunk.data)
	////wordBreakStream.push(chunk.data)
	////hotwordStream.push(chunk.data)
    ////output.write(chunk.data);
//});
//stream.on('finish', function(chunk) {
	//console.log(['finish',chunk]);
//} );


//const fs = require('fs');
//const file = fs.createWriteStream('./stream5.wav');
		

////stream.pipe(file)
////var output;
 ////// mqtt to stream - pushed to when audio packet arrives
////var silenceStream = new Readable()
////silenceStream._read = () => {} // _read is required but you can noop it
////var wordBreakStream = new Readable()
////wordBreakStream._read = () => {} // _read is required but you can noop it
////var hotwordStream = new Readable()
////hotwordStream._read = () => {} // _read is required but you can noop it
        
////stream.pipe(hotwordStream)        
////var vadSilent = false;
////var inWordBreak = false;


////// silence detection short (word break) and long(end utterance)
////const silenceDetector = VAD.createStream({
	////mode: VAD.Mode.NORMAL,
	////audioFrequency: 16000,
	////debounceTime: 2000
////});/var output;
 ////// mqtt to stream - pushed to when audio packet arrives
////var silenceStream = new Readable()
////silenceStream._read = () => {} // _read is required but you can noop it
////var wordBreakStream = new Readable()
////wordBreakStream._read = () => {} // _read is required but you can noop it
////var hotwordStream = new Readable()
////hotwordStream._read = () => {} // _read is required but you can noop it
        
////stream.pipe(hotwordStream)        
////var vadSilent = false;
////var inWordBreak = false;


////// silence detection short (word break) and long(end utterance)
////const silenceDetector = VAD.createStream({
	////mode: VAD.Mode.NORMAL,
	////audioFrequency: 16000,
	////debounceTime: 2000
////});
////const wordBreakDetector = VAD.createStream({
	////mode: VAD.Mode.NORMAL,
	////audioFrequency: 16000,
	////debounceTime: 50
////});

////silenceDetector.on("data", function(data) {
	////console.log('silence data')
		////console.log(data.speech.state)		
	////if (vadSilent !== data.speech.state) {
		////console.log('silence data')
		////console.log(data.speech.state)		
	////}
	////vadSilent = data.speech.state;
////});
////silenceStream.pipe(silenceDetector)

////wordBreakDetector.on("data", function(data) {
	////if (inWordBreak !== data.speech.state) {
		////console.log('word break data')
		////console.log(data.speech.state)		
	////}
	////inWordBreak = data.speech.state;
////});
////wordBreakStream.pipe(wordBreakDetector)



////// nodejs index.js & sleep 3; mqtt pub -t 'hermod/default/microphone/start' -h 'localhost' -m '{"text":"this is a v"}'; mqtt pub -t 'hermod/default/hotword/start' -h 'localhost' -m '{"text":"this is a v"}'
////// mqtt pub -t 'hermod/default/microphone/stop' -h 'localhost' -m '{}'


/////** 
 ////* Hotword
 ////*/
////const Detector = require('snowboy').Detector;
////const Models = require('snowboy').Models;
////var silent = true;
 ////// snowboy setup
////var models = new Models();
//////if (typeof this.props.models !== 'object') throw new Exception('Missing hotword configuration for models')
////config.models.map(function(thisModel) {
	////models.add(thisModel);
////})

////detector = new Detector(Object.assign({models:models},config.detector));
////detector.on('silence', function () {
  ////if (!silent) console.log('silence');
  ////silent = true;
////});

////detector.on('sound', function (buffer) {
  ////if (silent)  console.log(['sound',buffer.length]);
  ////silent = false;		  // <buffer> contains the last chunk of the audio that triggers the "sound"
  ////// event. It could be written to a wav stream.
  //////console.log('sound');
////});

////detector.on('error', function () {
  ////console.log('error');
////});

////detector.on('hotword', function (index, hotword, buffer) {
  ////// <buffer> contains the last chunk of the audio that triggers the "hotword"
  ////// event. It could be written to a wav stream. You will have to use it
  ////// together with the <buffer> in the "sound" event if you want to get audio
  ////// data after the hotword.
  ////console.log(['hotword', index, hotword]);
  ////console.log(['sound',buffer.length]);
  //////console.log(buffer);
  //////if (that.listening) that.sendMqtt('hermod/' + that.props.siteId + '/hotword/detected',{});    
////});
 


//////setTimeout(function() {
	//////stream.stop(function() {
		//////console.log('stopped');
	//////})
//////},1000)

//////const writable = new stream.Writable({encoding:false,highWaterMark:'1kb'})
//////writable._write = (chunk,encoding,cb) => {
    //////console.log('data')
    //////console.log(chunk ? chunk.length : 'NULL')
    //////cb();
//////}


 
//////mic().pipe(writable)

////const wordBreakDetector = VAD.createStream({
	////mode: VAD.Mode.NORMAL,
	////audioFrequency: 16000,
	////debounceTime: 50
////});

////silenceDetector.on("data", function(data) {
	////console.log('silence data')
		////console.log(data.speech.state)		
	////if (vadSilent !== data.speech.state) {
		////console.log('silence data')
		////console.log(data.speech.state)		
	////}
	////vadSilent = data.speech.state;
////});
////silenceStream.pipe(silenceDetector)

////wordBreakDetector.on("data", function(data) {
	////if (inWordBreak !== data.speech.state) {
		////console.log('word break data')
		////console.log(data.speech.state)		
	////}
	////inWordBreak = data.speech.state;
////});
////wordBreakStream.pipe(wordBreakDetector)



////// nodejs index.js & sleep 3; mqtt pub -t 'hermod/default/microphone/start' -h 'localhost' -m '{"text":"this is a v"}'; mqtt pub -t 'hermod/default/hotword/start' -h 'localhost' -m '{"text":"this is a v"}'
////// mqtt pub -t 'hermod/default/microphone/stop' -h 'localhost' -m '{}'


/////** 
 ////* Hotword
 ////*/
////const Detector = require('snowboy').Detector;
////const Models = require('snowboy').Models;
////var silent = true;
 ////// snowboy setup
////var models = new Models();
//////if (typeof this.props.models !== 'object') throw new Exception('Missing hotword configuration for models')
////config.models.map(function(thisModel) {
	////models.add(thisModel);
////})

////detector = new Detector(Object.assign({models:models},config.detector));
////detector.on('silence', function () {
  ////if (!silent) console.log('silence');
  ////silent = true;
////});

////detector.on('sound', function (buffer) {
  ////if (silent)  console.log(['sound',buffer.length]);
  ////silent = false;		  // <buffer> contains the last chunk of the audio that triggers the "sound"
  ////// event. It could be written to a wav stream.
  //////console.log('sound');
////});

////detector.on('error', function () {
  ////console.log('error');
////});

////detector.on('hotword', function (index, hotword, buffer) {
  ////// <buffer> contains the last chunk of the audio that triggers the "hotword"
  ////// event. It could be written to a wav stream. You will have to use it
  ////// together with the <buffer> in the "sound" event if you want to get audio
  ////// data after the hotword.
  ////console.log(['hotword', index, hotword]);
  ////console.log(['sound',buffer.length]);
  //////console.log(buffer);
  //////if (that.listening) that.sendMqtt('hermod/' + that.props.siteId + '/hotword/detected',{});    
////});
 


//////setTimeout(function() {
	//////stream.stop(function() {
		//////console.log('stopped');
	//////})
//////},1000)

//////const writable = new stream.Writable({encoding:false,highWaterMark:'1kb'})
//////writable._write = (chunk,encoding,cb) => {
    //////console.log('data')
    //////console.log(chunk ? chunk.length : 'NULL')
    //////cb();
//////}


 
//////mic().pipe(writable)



let CalculateRMS = function (arr) { 
    let Squares = arr.map((val) => (val*val)); 
    let Sum = Squares.reduce((acum, val) => (acum + val)); 
    return Math.sqrt(Sum/arr.length); 
} 