/* global window */


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
const Duplex = require('stream').Duplex;
const util = require('util');
var Wav = require('wav')

let parser = new argparse.ArgumentParser({addHelp: true, description: 'Running DeepSpeech inference.'});
parser.addArgument(['--siteId'], {required: true, help: 'siteId to listen for mqtt messages'});
parser.addArgument(['--interimResults'], {required: false, help: 'send interim transcription results'});

let args = parser.parseArgs();

let mqttStreams = {};
let audioDump = {};
        				
var speaker = require('speaker')
var WaveFile = require('wavefile')

var siteId='standalone'

class HermodDeepSpeechAsrDetector extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.asrTimeouts={}
		this.startTimeouts={}
		this.sctx = {}
		this.models = {}
		this.isStarted = false;
		let eventFunctions = {
		
        }
        
		console.log('HermodDeepSpeechAsrDetector',props.siteId);
			
        this.manager = new HermodSubscriptionManager({siteId:props.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites});
		
		this.manager.mqttConnect().then(function() {
			console.log('STANDALONE CONNECTION');
			// timeout if never starts
			if (!that.startTimeout) {
				console.log(['start TIMEOUT ADD',config.services.HermodDeepSpeechAsrService.timeout])
				//if (that.startTimeout) clearTimeout(that.startTimeouts[siteId]);		
				that.startTimeout = setTimeout(function() {
					console.log('start TIMEOUT FORCE END')
					that.finishStream(props.siteId)
				},config.services.HermodDeepSpeechAsrService.timeout);
			}
			eventFunctions['hermod/+/microphone/audio'] = that.onAudioMessage.bind(that)
			that.manager.addCallbacks(eventFunctions,false,false)
			//that.connectToManager(that.manager,eventFunctions);
			console.log('STANDALONE CONNECTION CONNECTED');
			that.startMqttListener(props.siteId);
		})
	}
    
    startMqttListener(siteId) {
		let that = this;
		// LOGGING
		var FileWriter = require('wav').FileWriter;	
		audioDump[siteId] = new FileWriter('./asr.wav', {
		  sampleRate: 16000,
		  channels: 1
		});
		let detector = this.getDetector(siteId);
		// mqtt to stream - pushed to when audio packet arrives
		mqttStreams[siteId] =  new Wav.Writer();
	    mqttStreams[siteId].pipe(detector)
    }
	
	stopMqttListener(siteId) {
		audioDump[siteId].push(null)
		process.exit()
	}
	
	onAudioMessage(topic,siteId,buffer) {
		let that = this;
		console.log('audio message ',topic,buffer)
		if (mqttStreams.hasOwnProperty(siteId)) {
		//console.log('audio message2 ',siteId)
			// wait for first voice before starting to push audio packets to detector
			if (!this.isStarted) {
				const vad = new VAD(VAD.Mode.NORMAL);
				console.log('start listening ',buffer)
				
				// push into stream buffers for the first time (and start timeout)
				function pushBuffers(sitHermodDeepSpeechAsrServiceeId,buffer) {
					if (that.isStarted) mqttStreams[siteId].push(buffer)
					if (that.isStarted) audioDump[siteId].push(buffer)	
				}
				
				vad.processAudio(buffer, 16000).then(res => {
					switch (res) {
						case VAD.Event.ERROR:
							break;
						case VAD.Event.SILENCE:
						console.log('silence')
							pushBuffers(siteId,buffer)
							break;
						case VAD.Event.NOISE:
							console.log('noise')
							pushBuffers(siteId,buffer)
							break;
						case VAD.Event.VOICE:
							console.log('voice')
							that.isStarted = true;     
							pushBuffers(siteId,buffer)
							// timeout once voice starts
							console.log(['TIMEOUT ADD',config.services.HermodDeepSpeechAsrService.timeout])
							clearTimeout(that.startTimeouts[siteId] )
							that.asrTimeouts[siteId] = setTimeout(function() {
								console.log('TIMEOUT FORCE END')
								that.finishStream(siteId)
							},config.services.HermodDeepSpeechAsrService.timeout);
							
							break;
					}
				})
				
			} else {
				if (that.isStarted) mqttStreams[siteId].push(buffer)
				if (that.isStarted) audioDump[siteId].push(buffer)	
			}
		}
	}	
	
	totalTime(hrtimeValue) {
		return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
	}

	getAsrModel() {
		const BEAM_WIDTH = config.services.HermodDeepSpeechAsrService.BEAM_WIDTH;
		const LM_ALPHA = config.services.HermodDeepSpeechAsrService.LM_ALPHA;
		const LM_BETA = config.services.HermodDeepSpeechAsrService.LM_BETA;
		const N_FEATURES = config.services.HermodDeepSpeechAsrService.N_FEATURES;
		const N_CONTEXT = config.services.HermodDeepSpeechAsrService.N_CONTEXT;
		var args = config.services.HermodDeepSpeechAsrService.files;
		
		console.error('Loading model from file %s', args['model']);
		const model_load_start = process.hrtime();
		let model = new Ds.Model(args['model'], N_FEATURES, N_CONTEXT, args['alphabet'], BEAM_WIDTH);
		const model_load_end = process.hrtime(model_load_start);
		console.error('Loaded model in %ds.', this.totalTime(model_load_end));

		if (args['lm'] && args['trie']) {
			console.error('Loading language model from files %s %s', args['lm'], args['trie']);
			const lm_load_start = process.hrtime();
			model.enableDecoderWithLM(args['alphabet'], args['lm'], args['trie'],
				LM_ALPHA, LM_BETA);
			const lm_load_end = process.hrtime(lm_load_start);
			console.error('Loaded language model in %ds.', this.totalTime(lm_load_end));
		}
		
		return model;
	}

	finishStream(siteId) {
		let that = this;
		let model = this.models[siteId]
		let sctx = this.sctx[siteId]
		try {
			const model_load_start = process.hrtime();
			let transcription = model.finishStream(sctx);
			console.log('transcription:'+ transcription);
			const model_load_end = process.hrtime(model_load_start);
			console.error('Inference took %ds.', that.totalTime(model_load_end));
			that.stopMqttListener(siteId);
		} catch (e) {
			console.log(['FINISH STREAM ERROR',e])
		}
	}
	
	getDetector(siteId) {
		//if (!this.models[siteId]) 
		this.models[siteId] = this.getAsrModel();
		const vad = new VAD(VAD.Mode.NORMAL);
		let that = this;
		const voice = {START: true, STOP: false};
		this.sctx[siteId] = this.models[siteId].setupStream(150, 16000);
		let state = voice.START;
		
		let detector = new Writable();
		var silenceCount = 0;
		detector._write = function(chunk,encoding,cb) {
			try {
				vad.processAudio(chunk, 16000).then(res => {
					switch (res) {
						case VAD.Event.ERROR:
							break;
						case VAD.Event.SILENCE:
							silenceCount++;
							if (state === voice.START && silenceCount > 30) { //30
								state = voice.STOP;
								silenceCount = 0;
								that.finishStream(siteId,model,that.sctx[siteId]);
							} else {
								that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
							}
							break;
						case VAD.Event.VOICE:
						case VAD.Event.NOISE:
							// restart mic
							silenceCount = 0;
							state = voice.START;
							that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
							break;
					}
				});
				cb()
			} catch (e) {
				console.log(['STREAM ERROR',e])
			}
		}
		return detector;
	}

}     

let a = new HermodDeepSpeechAsrDetector({siteId:args.siteId});

module.exports = HermodDeepSpeechAsrDetector 
