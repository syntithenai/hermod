var HermodService = require('./HermodService')
var Microphone = require('./MicStream')
var VAD= require('node-vad')
var Chunker = require('stream-chunker');
var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;


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
        this.manager = this.connectToManager('MICROPHONE',props.manager,eventFunctions,false);
    }  
    
    startRecording(siteId) {
		if (!this.isRecording[siteId]) {
			let that = this;
			const vad = new VAD(VAD.Mode.NORMAL);

			var chunker = Chunker(512,{flush:true});
			chunker.on('data', function(data) {
				that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/microphone/audio",data);
			});
			let isStreaming = false;
			let splitStream = new Readable()
			splitStream._read = () => {} // _read is required but you can noop it
			splitStream.on('data', function(data) {
				function sendChunk() {
					if (isStreaming)  {
						chunker.push(data);
					}
				}
				vad.processAudio(data, 16000).then(res => {
					switch (res) {
						case VAD.Event.ERROR:
							//sendChunk()
							break;
						case VAD.Event.NOISE:
							sendChunk()
							break;
						case VAD.Event.SILENCE:
							that.silenceTimeout = setTimeout(function() {
								isStreaming = false;
								sendChunk()
							},2000);
							break;
						case VAD.Event.VOICE:
							isStreaming = true;
							sendChunk()
							if (that.silenceTimeout) clearTimeout(that.silenceTimeout);
							break;
					 }
					 
				})
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
			//   the WAVE header is stripped from the output of the reader
			 inBody = true;
			});
			wavReader.on('data', function (data) {
				if (inBody) splitStream.push(data);
			});
			this.stream.pipe(wavReader);
			
			micInstance.start()
		}
	}
    
	stopRecording(siteId) {
		this.started = false;
        this.voiceDetected = false;
       
		if (this.stream) {
			this.stream.pause();
			this.stream.destroy();
		}
	}
	
    
}
module.exports = HermodMicrophoneService
