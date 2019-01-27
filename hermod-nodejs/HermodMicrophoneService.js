var HermodService = require('./HermodService')
var Microphone = require('./MicStream')
var chunkingStreams = require('chunking-streams');
var VAD= require('node-vad')
var SizeChunker = chunkingStreams.SizeChunker;

//var ReadableStreamClone = require("readable-stream-clone");
var stream = require('stream') 
var Readable = stream.Readable;

		
class HermodMicrophoneService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.state={}
        if (!props.siteId || props.siteId.length === 0) {
            throw "Microphone must be configured with a siteId property";
        }
        this.started = false;
        this.voiceDetected = true;
        let eventFunctions = {
        // SESSION
            'hermod/#/microphone/start' : function(topic,siteId,payload) {
                that.startRecording();
            },
            'hermod/#/microphone/stop' : function(topic,siteId,payload) {
                that.stopRecording();
            }
        }
        this.stream = null;
        this.vadStream = null;
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }  
    
    startRecording() {
		console.log('start recording')
		let that = this;
		var chunker = new SizeChunker({
			chunkSize: 512,
			flushTail: true
		});
		this.started = true;
        var output;
		 
		chunker.on('chunkStart', function(id, done) {
			//console.log(['START',id]);
			//output = fs.createWriteStream('./output-' + id);
			done();
		});
		 
		chunker.on('chunkEnd', function(id, done) {
			//console.log(['END',id]);
			//output.end();
			done();
		});
		 
		chunker.on('data', function(chunk) {
			//console.log(['DATA',chunk.data.length]);
			//if (that.vadStream) that.vadStream.push(chunk.data)
			//if (that.voiceDetected) {
				console.log(['senddata',chunk.data.length]);
				that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/microphone/audio",chunk.data);
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
		//const detector = fs.createWriteStream('./dsout.wav');
		//this.stream.pipe(detector);
		this.stream.pipe(chunker);
		//chunker.pipe(vadStream)
	}
    
	stopRecording() {
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
