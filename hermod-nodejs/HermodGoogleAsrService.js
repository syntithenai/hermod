const fs = require('fs');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');


var HermodService = require('./HermodService')

  
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;

var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')

class HermodGoogleAsrService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.messageCount = 0;
		
		this.mqttStreams = {};
		
        let eventFunctions = {
        // SESSION
            'hermod/+/asr/start' : function(topic,siteId,payload) {
				// TODO access control check siteId against props siteId or siteIds
				if (payload.model === that.props.model) {
					console.log('start google asr');
					that.dialogIds[siteId]= payload.id;
					that.listening[siteId] = true;
					that.startMqttListener(siteId)
				}
		    },
		    'hermod/+/asr/stop' : function(topic,siteId,payload) {
				if (payload.model === that.props.model) {
					that.listening[siteId] = false;
					that.stopMqttListener(siteId)
				}
		    }
        }
	//	console.log('google asr '+this.props.siteId);
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
    
    startMqttListener(siteId) {
		let that = this;
	//	console.log('start mqtt listener');
		// subscribe to audio packets
		// use siteId from start message
		let callbacks = {}
		callbacks['hermod/'+siteId+'/microphone/audio/#'] = this.onAudioMessage.bind(this)
		this.callbackIds[siteId] = this.manager.addCallbacks(callbacks)
		

		// Creates a client
		const client = new speech.SpeechClient();
		const encoding = 'LINEAR16';
		const sampleRateHertz = 16000;
		const languageCode = 'en-AU';
		//console.log('created client');
		const request = {
		  config: {
			encoding: encoding,
			sampleRateHertz: sampleRateHertz,
			languageCode: languageCode,
		  },
		  interimResults: false, // If you want interim results, set this to true
		};

		// Stream the audio to the Google Cloud Speech API
		const detector = client
		  .streamingRecognize(request)
		  .on('error', console.log)
		  .on('data', data => {
			//console.log(data.results);
			//console.log(data.results[0].alternatives);
			//console.log(
			  //`Transcription: ${data.results[0].alternatives[0].transcript}`
			//);
			that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:data.results[0].alternatives[0].transcript});
			detector.pause()
			detector.destroy()
			that.stopMqttListener(siteId);
		  });
		console.log('got detector');
		// mqtt to stream - pushed to when audio packet arrives
		this.mqttStreams[siteId] = new Readable()
		this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        this.mqttStreams[siteId].pipe(detector)	
		console.log('piped ');		
	}
	
	stopMqttListener(siteId) {
		let that = this;
		if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			this.callbackIds[siteId].map(function(callbackId) {
				that.manager.removeCallbackById(callbackId)
				delete that.callbackIds[siteId];
				delete that.mqttStreams[siteId]
				delete that.listening[siteId]
				delete that.silent[siteId]
			1})
		}
	}
	
	onAudioMessage(topic,siteId,buffer) {
		if (this.mqttStreams.hasOwnProperty(siteId)) {
			// add wav header to first packet
			//if (this.messageCount == 0) {
				//let wav = new WaveFile();
				//wav.fromScratch(1, 16000, '16', buffer);
				//this.mqttStreams[siteId].push(wav.toBuffer())
			//} else {
				this.mqttStreams[siteId].push(buffer)
			//}
			this.messageCount++;
	
		}
	}	

}     
module.exports=HermodGoogleAsrService
 
