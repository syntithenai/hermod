var HermodService = require('./HermodService')
var Microphone = require('./MicStream')
//var chunkingStreams = require('chunking-streams');
var VAD= require('node-vad')
//var SizeChunker = chunkingStreams.SizeChunker;
var Chunker = require('stream-chunker');

//var ReadableStreamClone = require("readable-stream-clone");
var stream = require('stream') 
var Readable = stream.Readable;

		var Speaker = require("speaker");

class HermodMicrophoneService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.state={}
        if (!props.siteId || props.siteId.length === 0) {
            throw "Microphone must be configured with a siteId property";
        }
        this.packetCount={}
        this.isRecording={}
        this.started = false;
        this.voiceDetected = true;
        let eventFunctions = {
        // SESSION
            'hermod/+/microphone/start' : function(topic,siteId,payload) {
				that.packetCount[siteId] = 0;
                that.startRecording(siteId);
                that.isRecording[siteId] = true;
            },
            'hermod/+/microphone/stop' : function(topic,siteId,payload) {
                that.stopRecording(siteId);
                that.isRecording[siteId] = false;
            }
        }
        this.stream = null;
        this.vadStream = null;
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }  
    
    startRecording(siteId) {
		if (!this.isRecording[siteId]) {
			//console.log('start recording')
			let that = this;
			//var chunker = new SizeChunker({
				//chunkSize: 512,
				//flushTail: true
			//});
			var chunker = Chunker(512,{flush:true});
			this.started = true;
			var output;
			 
			 
			chunker.on('data', function(data) {
				//console.log(['DATA',data.length]);
				//if (that.vadStream) that.vadStream.push(chunk.data)
				//if (that.voiceDetected) {
					that.packetCount[siteId]++;
					//console.log(['senddata',"hermod/"+that.props.siteId+"/microphone/audio/"+that.packetCount[siteId]]);
					that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/microphone/audio",data);
				//}
				//that.sendAudioBuffer(chunk.data,context.sampleRate); 
				//output.write(chunk.data);
			});
			 
			//this.stream = mic({
			  //bitDepth: 16,
			  //channels: 1,
			  //sampleRate: 16000
			//});
			
			var wavConfig = {
			  "channels": 1,
			  "sampleRate": 16000,
			  "bitDepth": 16
			};
			var micInstance = Microphone(Object.assign({debug:true},wavConfig));
			micInstance.start()
			this.stream = micInstance.getAudioStream()
			
			//let vadStream = new Readable()
			//vadStream._read = () => {} // _read is required but you can noop it
			
			//this.stream.on("data", function(data) {
				//vadStream.push(data)
			//});
			//var stream1 = new ReadableStreamClone(this.stream)
			//var stream2 = new ReadableStreamClone(this.stream)
			
			//const vadProcessor = VAD.createStream({
				//mode: VAD.Mode.NORMAL,
				//audioFrequency: 16000,
				//debounceTime: 4000
			//});
			//vadStream.pipe(vadProcessor)
			
	//// nodejs index.js & sleep 3; mqtt pub -t 'hermod/default/microphone/start' -h 'localhost' -m '{"text":"this is a v"}'; mqtt pub -t 'hermod/default/hotword/start' -h 'localhost' -m '{"text":"this is a v"}'
	//// mqtt pub -t 'hermod/default/microphone/stop' -h 'localhost' -m '{}'
			
			//vadProcessor.on("data", function(data) {
				////console.log('vad data')
				////console.log(data.speech.state)
				//that.voiceDetected = data.speech.state;
			//});
			
			//const fs = require('fs');
					//const file = fs.createWriteStream('./dsout.wav');
			//const fs = require('fs');
			//const file = fs.createWriteStream('./stream6.wav');
			var FileWriter = require('wav').FileWriter;	
			//var outputFileStream = new FileWriter('./hotword.wav', {
			  //sampleRate: 16000,
			  //channels: 1
			//});
			var fileStream = new FileWriter('./microphone.wav', {
			  sampleRate: 16000,
			  channels: 1
			});
			var speaker = null;
			var wav = require('wav');
			var wavReader = new wav.Reader(wavConfig);
			wavReader.on('format', function (format) {					 
			 // console.log(['format',format]);
			//   the WAVE header is stripped from the output of the reader
			  wavReader.pipe(chunker)
			  speaker = new Speaker(format)
			  //wavReader.pipe(speaker);
				chunker.pipe(fileStream);

			});
			wavReader.on('data', function (format) {
				//console.log(['data',format.length]);
			  
			});
			this.stream.pipe(wavReader);
			
			
			//this.stream.pipe(chunker);
			//this.stream.pipe(file);
			//chunker.pipe(vadStream)
		}
	}
    
	stopRecording(siteId) {
		this.started = false;
        this.voiceDetected = false;
       
		if (this.stream) {
			this.stream.pause();
			this.stream.destroy();
			//function() {
				//console.log('stopped');
			//})
		}
	}
	
    
}
module.exports = HermodMicrophoneService
