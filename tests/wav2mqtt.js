var VAD= require('node-vad')
var Chunker = require('stream-chunker');
var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
var fs = require('fs')

let started = false;
let dastream = null;
let voiceDetected = false;
let silenceTimeout = null;
// stream selected audio file onto mqtt bus
function  start(mqttClient,siteId,filename) {
	// const vad = new VAD(VAD.Mode.NORMAL);
	
	var chunker = Chunker(512,{flush:true});
	chunker.on('data', function(data) {
		//console.log('send audio data to '+"hermod/"+siteId+"/microphone/audio")
		//console.log(data ? data.length : -1)
		mqttClient.publish("hermod/"+siteId+"/microphone/audio",data);
	});
	////let isStreaming = false;
	//let splitStream = new Readable()
	//splitStream._read = () => {} // _read is required but you can noop it
	//splitStream.on('data', function(data) {
		////function sendChunk() {
			////if (isStreaming)  {
				////chunker.push(data);
			////}
		////}
		//console.log('send audio chunk')
		//console.log(data ? data.length : -1)
		
		////vad.processAudio(data, 16000).then(res => {
			//chunker.push(data);
			////switch (res) {
				////case VAD.Event.ERROR:
					//////sendChunk()
					////break;
				////case VAD.Event.NOISE:
					////sendChunk()
					////break;
				////case VAD.Event.SILENCE:
					////silenceTimeout = setTimeout(function() {
						////isStreaming = false;
						////sendChunk()
					////},2000);
					////break;
				////case VAD.Event.VOICE:
					////isStreaming = true;
					////sendChunk()
					////if (silenceTimeout) clearTimeout(silenceTimeout);
					////break;
			 ////}
			 
		////})
	//});
	
	//started = true;
	//var output;
	 
	var wavConfig = {
	  "channels": 1,
	  "sampleRate": 16000,
	  "bitDepth": 16
	};
	//this.micInstance = Microphone(Object.assign({debug:false},wavConfig));
	dastream = fs.createReadStream(filename);
	//this.micInstance.getAudioStream()
	console.log('stream '+filename)
	
	var wav = require('wav');
	var wavReader = new wav.Reader(wavConfig);
	var inBody = false;
	// strip the wav header
	wavReader.on('format', function (format) {					 
	//   the WAVE header is stripped from the output of the reader
	 //console.log('read hgeader')
	 inBody = true;
	});
	wavReader.on('data', function (data) {
		if (inBody) {
			//console.log('read body')
			//console.log(data && data.buffer ? data.buffer .length : -1)
			//console.log(data.buffer)
			chunker.write(data);
		}
	});
	dastream.pipe(wavReader);
	
	//this.micInstance.start()

}
    
function stopRecording(siteId) {
		started = false;
        voiceDetected = false;
       // if (this.micInstance && this.micInstance.stop) this.micInstance.stop()
		if (dastream) {
			dastream.pause();
			dastream.destroy();
		}
	}


module.exports = {start : start}
