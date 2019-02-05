

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
//let audioBuffers = {};
//let messageCount = {};
let audioDump = {};
        				
var speaker = require('speaker')
var WaveFile = require('wavefile')

class HermodDeepSpeechAsrDetector extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.asrTimeouts={}
		this.sctx = {}
		this.models = {}
		this.isStarted = false;
		let eventFunctions = {
		
        // SESSION
            // keep the service alive by subscribing to one fake topic
            //'nosub' : function(topic,siteId,payload) {
			//}
        }
		
        this.manager = new HermodSubscriptionManager({siteId:props.siteId});
		
		//console.log(['ASR connect ']);
		this.manager.mqttConnect().then(function() {
			//this.connectToManager(this.manager,eventFunctions);
			//console.log(['ASR connecteds ']);
			eventFunctions['hermod/+/microphone/audio'] = that.onAudioMessage.bind(that)
			//console.log(['CONNECT TO ASR ',eventFunctions]);
			that.connectToManager(that.manager,eventFunctions);
			//that.startDetector(props.siteId);
			//that.startDetector(props.siteId);
			that.startMqttListener(props.siteId);
		})
		
    }
    
    startMqttListener(siteId) {
		let that = this;
		//console.log('create ASR TIMEOUT');
			
		
		// LOGGING
		var FileWriter = require('wav').FileWriter;	
		audioDump[siteId] = new FileWriter('./asr.wav', {
		  sampleRate: 16000,
		  channels: 1
		});
		//this.audioBuffers[siteId]=[];
		//audioDump[siteId] = new Readable()
		//audioDump[siteId]._read = () => {} // _read is required but you can noop it
		//audioDump[siteId].pipe(outputFileStream) // consume the stream
				
		
		
		// subscribe to audio packets
		// use siteId from start message
		//let callbacks = {}
		//callbacks['hermod/'+siteId+'/microphone/audio/#'] = this.onAudioMessage.bind(this)
		//this.callbackIds[siteId] = this.manager.addCallbacks(callbacks)
		//audioBuffers[siteId]=[];
		//messageCount[siteId] = 0;
		//let detector = new PassThrough()
		let detector = this.getDetector(siteId);
		// mqtt to stream - pushed to when audio packet arrives
		mqttStreams[siteId] =  new Wav.Writer();
		//mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        mqttStreams[siteId].pipe(detector)
        //this.mqttStreams[siteId].pipe(file)
        //mqttStreams[siteId].resume();	

	}
	
	stopMqttListener(siteId) {
		audioDump[siteId].push(null)
		//let wav = new WaveFile();
		//let that = this;
		//console.log('write file and add wav header',siteId,audioBuffers[siteId].length)
		//wav.fromScratch(1, 16000, '16', audioBuffers[siteId]);
		////console.log(wav);
		//var fs = require('fs');
		//fs.writeFileSync('./supersmart.wav',wav.toBuffer())	
		////process.exit();
					
					////let that = this;
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
		let that = this;
		//console.log(['onmessage',messageCount[siteId],topic,siteId,buffer.length]);
		//messageCount[siteId]++;
		if (mqttStreams.hasOwnProperty(siteId)) {
			// wait for first voice before starting to push audio packets to detector
			if (!this.isStarted) {
				const vad = new VAD(VAD.Mode.NORMAL);
				
				// push into stream buffers for the first time (and start timeout)
				function pushBuffers(siteId,buffer) {
					if (that.isStarted) mqttStreams[siteId].push(buffer)
					if (that.isStarted) audioDump[siteId].push(buffer)	
				}
				
					vad.processAudio(buffer, 16000).then(res => {
						//console.log(['chunk',chunk.length,res,silenceCount]);
						switch (res) {
							case VAD.Event.ERROR:
								console.log('VAD ERROR');
								break;
							case VAD.Event.SILENCE:
								pushBuffers(siteId,buffer)
								break;
							case VAD.Event.NOISE:
								pushBuffers(siteId,buffer)
								break;
							case VAD.Event.VOICE:
								that.isStarted = true;     
								pushBuffers(siteId,buffer)
								that.asrTimeouts[siteId] = setTimeout(function() {
									console.log('ASR TIMEOUT');
									that.finishStream(siteId)
								},4000);
								
								break;
						}
					})
				
			} else {
				if (that.isStarted) mqttStreams[siteId].push(buffer)
				if (that.isStarted) audioDump[siteId].push(buffer)	
			}
			//if (messageCount[siteId] < 200) {
				//// add wav header to first packet
				//if (messageCount[siteId] == 0) {
					////let wav = new WaveFile();
					////wav.fromScratch(1, 16000, '16', buffer);
					//mqttStreams[siteId].push(buffer)
					//audioBuffers[siteId].push.apply(audioBuffers[siteId],buffer)
				//} else {
					//audioBuffers[siteId].push.apply(audioBuffers[siteId],buffer)
				//}
			//} else {
				//this.stopMqttListener(siteId);
			//}
			
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
			// save audio
			//let f = fs.createWriteStream('./joel.wav')
			//that.audioBuffers[siteId].map(function(buffer) {
				//console.log(['write',buffer.length]);
				//f.write(buffer)
			//});
			//f.end()
			// inference
			const model_load_start = process.hrtime();
			//console.error('Running inference.');
			let transcription = model.finishStream(sctx);
			console.log('transcription:'+ transcription);
			//console.log(['hermod/'+siteId+'/asr/text',{text:transcription}]);
			
			//that.sendMqtt('hermod/'+siteId+'/asr/text',{text:transcription});
			const model_load_end = process.hrtime(model_load_start);
			console.error('Inference took %ds.', that.totalTime(model_load_end));
			//that.audioDump[siteId].push(null)
	
			that.stopMqttListener(siteId);
		} catch (e) {
			console.log(['FINISH STREAM ERROR',e])
		}
	}
	
	getDetector(siteId) {
		if (!this.models[siteId]) this.models[siteId] = this.getAsrModel();
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
					//console.log(['chunk',chunk.length,res,silenceCount]);
					switch (res) {
						case VAD.Event.ERROR:
							console.log('VAD ERROR');
							break;
						case VAD.Event.SILENCE:
							silenceCount++;
						//	console.log([res,silenceCount]);
							if (state === voice.START && silenceCount > 30) { //30
								state = voice.STOP;
								//model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								silenceCount = 0;
								that.finishStream(siteId,model,that.sctx[siteId]);
								//console.log('finishStream');
								//try {
									//sctx = model.setupStream(150,16000);
								//} catch (e) {
									//console.log(e);
								//}
								//console.log('setup stream');
								
							//} else if (config.services.HermodDeepSpeechAsrService.interimResults && false && state === voice.START && silenceCount === 10) { //5
							//} else if (config.services.HermodDeepSpeechAsrService.interimResults && false && state === voice.START && silenceCount === 10) { //5
								//console.log();
								////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								////console.log(' Stream fed');
								//console.log('intermediate:'+model.intermediateDecode(sctx));
								////console.log(' Stream decoded');
								
							} else {
								that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
								//console.log('Stream fed silent');
								
							}
							break;
						case VAD.Event.VOICE:
						case VAD.Event.NOISE:
							// restart mic
							if (state === voice.STOP) {
								//sctx = model.setupStream(150,16000);
								//console.log('restart');
							}
							silenceCount = 0;
							state = voice.START;
							that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
							//console.log('Stream fed noise');
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
