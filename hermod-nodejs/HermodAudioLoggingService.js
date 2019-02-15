var HermodService = require('./HermodService')
var HermodMqttServer = require('./HermodMqttServer')

const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
var stream = require('stream') 
var Readable = stream.Readable;
var Wav = require('wav')

class HermodAudioLoggingService extends HermodMqttServer  {

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
        //let eventFunctions = {
            //'hermod/+/microphone/start' : function(topic,siteId,payload) {
				//if (!that.isStarted[siteId]) {
					//that.messageCount[siteId]=0;
		this.mqttConnect().then(function() {
			that.startMqttListener('demo')
		});
	
    }
    
	onMessageArrived(topic,message) {
		let parts = topic.split('/');
		this.onAudioMessage(topic,parts[1],message);
	}
    
    startMqttListener(siteId) {
		let that = this;
		// subscribe to audio packets
		// use siteId from start message
		this.mqttClient.subscribe('hermod/'+siteId+'/microphone/audio')
		
		// LOGGING
		var FileWriter = require('wav').FileWriter;	
		let rand=new Date().getTime();
		this.audioDump[siteId] = new FileWriter('./audio-'+siteId+'-'+rand+'.wav', {
		  sampleRate: 16000,
		  channels: 1
		});
		
	}
	
	stopMqttListener(siteId) {
		
		let that = this;
		this.audioDump[siteId].push(null)
		
		if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			this.callbackIds[siteId].map(function(callbackId) {
				that.manager.removeCallbackById(callbackId)
				delete that.callbackIds[siteId];
				delete that.messageCount[siteId]
				delete that.audioDump[siteId]
			})
		}
	}
	
	onAudioMessage(topic,siteId,buffer) {
	//	console.log(['LOGGER onAudioMessage',topic,siteId,buffer])
		if (this.audioDump.hasOwnProperty(siteId)) {
			this.audioDump[siteId].push(buffer)
			this.messageCount[siteId]++;
		}
	}	

}     
module.exports=HermodAudioLoggingService
 
