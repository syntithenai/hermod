var HermodService = require('./HermodService')
var Microphone = require('./MicStream')
//var chunkingStreams = require('chunking-streams');
var VAD= require('node-vad')
//var SizeChunker = chunkingStreams.SizeChunker;
var Chunker = require('stream-chunker');

//var ReadableStreamClone = require("readable-stream-clone");
var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;

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
        this.isStreaming = false;
        this.silenceTimeout = null;
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
			const vad = new VAD(VAD.Mode.NORMAL);
 
			//const vadProcessor = new Writable();
			//vadProcessor._write = function(data,encoding,cb) {
				//vad.processAudio(data, 16000).then(res => {
					//switch (res) {
						//case VAD.Event.ERROR:
							////console.log("ERROR");
							//break;
						//case VAD.Event.NOISE:
							////console.log("NOISE");
							//break;
						//case VAD.Event.SILENCE:
							//console.log("SILENCE");
							//that.silenceTimeout = setTimeout(function() {
								//that.isStreaming = false;
							//},2000);
							//break;
						//case VAD.Event.VOICE:
							//console.log("VOICE");
							//that.silenceTimeout = setTimeout(function() {
								//that.isStreaming = true;
							//},1);
							//if (that.silenceTimeout) clearTimeout(that.silenceTimeout);
							//break;
					 //}
					 
				//})
				//cb();
				
				////console.log('vad data')
				////console.log(data.speech,data)
				//////that.voiceDetected = data.speech.state;
			//};
			
			var chunker = Chunker(512,{flush:true});
			chunker.on('data', function(data) {
				//console.log('chunk send mqtt data')
				that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/microphone/audio",data);
			});
			let isStreaming = false;
			let splitStream = new Readable()
			splitStream._read = () => {} // _read is required but you can noop it
			splitStream.on('data', function(data) {
				//console.log('ss on data');
				//vadProcessor.write(data);

				function sendChunk() {
					if (isStreaming)  {
						//console.log('push chunk data')
						chunker.push(data);
					}
				}
				vad.processAudio(data, 16000).then(res => {
					switch (res) {
						case VAD.Event.ERROR:
							sendChunk()
							//console.log("ERROR");
							break;
						case VAD.Event.NOISE:
							//console.log("NOISE");
							sendChunk()
							break;
						case VAD.Event.SILENCE:
							//console.log("SILENCE");
							that.silenceTimeout = setTimeout(function() {
								isStreaming = false;
								sendChunk()
							},2000);
							break;
						case VAD.Event.VOICE:
							//console.log("VOICE");
							isStreaming = true;
							sendChunk()
							if (that.silenceTimeout) clearTimeout(that.silenceTimeout);
							break;
					 }
					 
				})
				//console.log('ss data');
			});
			
			this.started = true;
			var output;
			 
			var wavConfig = {
			  "channels": 1,
			  "sampleRate": 16000,
			  "bitDepth": 16
			};
			var micInstance = Microphone(Object.assign({debug:true},wavConfig));
			this.stream = micInstance.getAudioStream()
			
			
			var wav = require('wav');
			var wavReader = new wav.Reader(wavConfig);
			var inBody = false;
			wavReader.on('format', function (format) {					 
			  //console.log(['format',format]);
			//   the WAVE header is stripped from the output of the reader
			 // wavReader.pipe(splitStream)
			 inBody = true;
			});
			wavReader.on('data', function (data) {
				//console.log(['data',data.length]);
				if (inBody) splitStream.push(data);
			});
			this.stream.pipe(wavReader);
			
			micInstance.start()
			
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
			