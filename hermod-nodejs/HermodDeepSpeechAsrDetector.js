var HermodService = require('./HermodService')
var HermodSubscriptionManager = require('./HermodSubscriptionManager')

var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
var PassThrough = stream.PassThrough;
var WaveFile = require('wavefile')
var VAD= require('node-vad')

const argparse = require('argparse');
const config = require('./config');
const Ds = require('deepspeech');
const MemoryStream = require('memory-stream');
const Wav = require('node-wav');
const Duplex = require('stream').Duplex;
const util = require('util');

console.log(['ASR INC']);

let parser = new argparse.ArgumentParser({addHelp: true, description: 'Running DeepSpeech inference.'});
parser.addArgument(['--siteId'], {required: true, help: 'siteId to listen for mqtt messages'});
parser.addArgument(['--interimResults'], {required: false, help: 'send interim transcription results'});

let args = parser.parseArgs();

let mqttStreams = {};
let audioBuffers = {};
let messageCount = {};
		
var speaker = require('speaker')
var WaveFile = require('wavefile')

class HermodDeepSpeechAsrDetector extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		
		
        let eventFunctions = {
        // SESSION
            // keep the service alive by subscribing to one fake topic
            //'nosub' : function(topic,siteId,payload) {
			//}
        }
		
        this.manager = new HermodSubscriptionManager({siteId:props.siteId});
		
		console.log(['ASR connect ']);
		this.manager.mqttConnect().then(function() {
			//this.connectToManager(this.manager,eventFunctions);
			console.log(['ASR connecteds ']);
			eventFunctions['hermod/#/microphone/audio'] = that.onAudioMessage.bind(that)
			console.log(['CONNECT TO ASR ',eventFunctions]);
			that.connectToManager(that.manager,eventFunctions);
			//that.startDetector(props.siteId);
			that.startMqttListener(props.siteId);
		})
		
    }
    
    startMqttListener(siteId) {
		let that = this;
		// subscribe to audio packets
		// use siteId from start message
		//let callbacks = {}
		//callbacks['hermod/'+siteId+'/microphone/audio'] = this.onAudioMessage.bind(this)
		//this.callbackIds[siteId] = this.manager.addCallbacks(callbacks)
		audioBuffers[siteId]=[];
		messageCount[siteId] = 0;
		let detector = new PassThrough()
		// mqtt to stream - pushed to when audio packet arrives
		mqttStreams[siteId] = new Readable()
		mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        mqttStreams[siteId].pipe(detector)
        //this.mqttStreams[siteId].pipe(file)
        //this.mqttStreams[siteId].resume();	

	}
	
	stopMqttListener(siteId) {
		let wav = new WaveFile();
		let that = this;
		console.log('write file and add wav header',siteId,audioBuffers[siteId].length)
		wav.fromScratch(1, 16000, '16', audioBuffers[siteId]);
		//console.log(wav);
		var fs = require('fs');
		fs.writeFileSync('./supersmart.wav',wav.toBuffer())	
		//process.exit();
					
					//let that = this;
		//if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			//this.callbackIds[siteId].map(function(callbackId) {
				//that.manager.removeCallbackById(callbackId)
				//delete that.callbackIds[siteId];
				//delete that.mqttStreams[siteId]
				//delete that.listening[siteId]
				//delete that.audioBuffers[siteId]
			//1})
		//}
		process.exit()
	}
	
	onAudioMessage(topic,siteId,buffer) {
		console.log(['onmessage',messageCount[siteId],topic,siteId,buffer.length]);
		messageCount[siteId]++;
		if (mqttStreams.hasOwnProperty(siteId)) {
			if (messageCount[siteId] < 200) {
				// add wav header to first packet
				if (messageCount[siteId] == 0) {
					//let wav = new WaveFile();
					//wav.fromScratch(1, 16000, '16', buffer);
					mqttStreams[siteId].push(buffer)
					audioBuffers[siteId].push.apply(audioBuffers[siteId],buffer)
				} else {
					mqttStreams[siteId].push(buffer)
					audioBuffers[siteId].push.apply(audioBuffers[siteId],buffer)
				}
				messageCount[siteId]++;
			} else {
				this.stopMqttListener(siteId);
			}
		}
	}	

}     

let a = new HermodDeepSpeechAsrDetector({siteId:args.siteId});

module.exports = HermodDeepSpeechAsrDetector 
