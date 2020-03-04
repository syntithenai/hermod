var HermodService = require('./HermodService')
var Microphone = require('./MicStream')
//var VAD= require('node-vad')
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
        this.isRecording=false
        this.micInstance = null
        this.stream = null
        
        let eventFunctions = {
            'hermod/+/microphone/start' : function(topic,siteId,payload) {
				//console.log('mic start')
				that.startRecording(siteId);
                that.isRecording = true;
            },
            'hermod/+/microphone/stop' : function(topic,siteId,payload) {
                //console.log('mic stop')
                that.stopRecording(siteId);
                that.isRecording = false;
            }
        }
        this.manager = this.connectToManager('MICROPHONE',props.manager,eventFunctions,false);
    }  
    
    startRecording(siteId) {
		if (!this.isRecording) {
			let that = this;
			//const vad = new VAD(VAD.Mode.NORMAL);

			var chunker = Chunker(512,{flush:true});
			chunker.on('data', function(data) {
				//console.log('data chunk')
				that.manager.sendAudioMqtt("hermod/"+that.props.siteId+"/microphone/audio",data);
			});
			//let isStreaming = false;
			//let splitStream = new Readable()
			//splitStream._read = () => {} // _read is required but you can noop it
			//splitStream.on('data', function(data) {
				////function sendChunk() {
					//if (isStreaming)  {
						//chunker.write(data);
					//}
				////}
				////vad.processAudio(data, 16000).then(res => {
					////switch (res) {
						////case VAD.Event.ERROR:
							//////sendChunk()
							////break;
						////case VAD.Event.NOISE:
							////sendChunk()
							////break;
						////case VAD.Event.SILENCE:
							////that.silenceTimeout = setTimeout(function() {
								////isStreaming = false;
								////sendChunk()
							////},2000);
							////break;
						////case VAD.Event.VOICE:
							////isStreaming = true;
							////sendChunk()
							////if (that.silenceTimeout) clearTimeout(that.silenceTimeout);
							////break;
					 ////}
					 
				////})
			//});
			
			//this.started = true;
			//var output;
			 
			var wavConfig = {
			  "channels": 1,
			  "sampleRate": 16000,
			  "bitDepth": 16
			};
			this.micInstance = Microphone(Object.assign({debug:false},wavConfig));
			this.stream = this.micInstance.getAudioStream()
			
			
			var wav = require('wav');
			var wavReader = new wav.Reader(wavConfig);
			var inBody = false;
			wavReader.on('format', function (format) {					 
			//   the WAVE header is stripped from the output of the reader
				inBody = true;
			});
			wavReader.on('data', function (data) {
				//console.log('wav data')
				if (inBody) chunker.write(data);
			});
			this.stream.pipe(wavReader);
			
			this.micInstance.start()
		}
	}
    
	stopRecording(siteId) {
		if (this.micInstance && this.micInstance.stop) this.micInstance.stop()
		if (this.stream) {
			this.stream.pause();
			this.stream.destroy();
		}
	}
	
    
}
module.exports = HermodMicrophoneService
