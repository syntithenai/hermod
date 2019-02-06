const fs = require('fs');

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
            'hermod/+/asr/start' : function(topic,siteId,payload) {
				if (payload.model === that.props.model) {
					if (that.props.debug) console.log('start google asr');
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
	    this.manager = this.connectToManager(props.manager,eventFunctions);
    }
    
    startMqttListener(siteId) {
		let that = this;
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
			that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:data.results[0].alternatives[0].transcript});
			detector.pause()
			detector.destroy()
			that.stopMqttListener(siteId);
		  });
		// mqtt to stream - pushed to when audio packet arrives
		this.mqttStreams[siteId] = new Readable()
		this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        this.mqttStreams[siteId].pipe(detector)	
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
			this.mqttStreams[siteId].push(buffer)
			this.messageCount++;	
		}
	}	
}     
module.exports=HermodGoogleAsrService
 
