var HermodService = require('./HermodService')

const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
var stream = require('stream') 
var Readable = stream.Readable;
var Wav = require('wav')

class HermodHotwordService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.messageCount = {};
		
		this.mqttStreams = {};
		this.audioBuffers = {};
		this.audioDump = {}
		this.isStarted = {};
        let eventFunctions = {
            'hermod/+/hotword/start' : function(topic,siteId,payload) {
				if (!that.isStarted[siteId]) {
					that.listening[siteId] = true;
					that.messageCount[siteId]=0;
					that.startMqttListener(siteId)
					that.isStarted[siteId]= true;					
				}
			}
		    ,
		    'hermod/+/hotword/stop' : function(topic,siteId,payload) {
				if (that.isStarted[siteId]) {
					that.listening[siteId] = false;
					that.stopMqttListener(siteId)
					that.isStarted[siteId] = false;
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
		callbacks['hermod/'+siteId+'/microphone/audio'] = this.onAudioMessage.bind(this)
		this.callbackIds[siteId] = this.manager.addCallbacks(callbacks)
		
		// LOGGING
		var FileWriter = require('wav').FileWriter;	
		this.audioDump[siteId] = new FileWriter('./hotword.wav', {
		  sampleRate: 16000,
		  channels: 1
		});
				
		// Hotword
		let config = this.props;
		
		const Detector = require('snowboy').Detector;
		const Models = require('snowboy').Models;
		var silent = {};
		 // snowboy setup
		var models = new Models();
		
		this.props.models.map(function(thisModel) {
		   models.add(thisModel);
		})
		var detector = new Detector(Object.assign({models:models},this.props.detector));
		detector.on('error', function () {
		  console.log('error');
		});

		detector.on('hotword', function (index, hotword, buffer) {
			console.log(['hotword '+siteId, index, hotword]);
			that.sendMqtt('hermod/'+siteId+'/hotword/detected',{hotword:hotword});
		});
		this.mqttStreams[siteId] = new Wav.Writer();		 
        this.mqttStreams[siteId].pipe(detector)
	}
	
	stopMqttListener(siteId) {
		let that = this;
		this.audioDump[siteId].push(null)
		
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
			this.audioDump[siteId].push(buffer)
			this.messageCount[siteId]++;
		}
	}	

}     
module.exports=HermodHotwordService
 
