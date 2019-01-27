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
		
      
class HermodDeepSpeechAsrDetector extends HermodService  {
    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = [];
		this.listening = {};
		this.silent = {};
		this.messageCount = {};
		
		this.mqttStreams = {};
		this.silenceStreams = {};
		this.wordBreakStreams = {};
		this.asrStreams = {};
		this.asrBuffers = {};
		this.vadSilent = {};
		this.inWordBreak = {};
		
		this.audioBuffers = {};
		this.mqttStreams = {};
		this.props = Object.assign(this.props,config.services.HermodDeepSpeechAsrService);
		
        this.props.siteId = args.siteId;
		
		this.manager = new HermodSubscriptionManager({siteId:config.siteId});
		this.manager.mqttConnect().then(function() {

			let eventFunctions = {};
			eventFunctions['hermod/'+args.siteId+'/microphone/audio'] = that.onAudioMessage.bind(that)
			that.connectToManager(that.manager,eventFunctions);
		})
		this.startDetector(args['siteId']);
    }
    
    startDetector(siteId) {
		let that = this;
		let model = this.getAsrModel()
		
		//const fs = require('fs');
		//const detector = fs.createWriteStream('./dsout.wav');
		//var Speaker = require("speaker");		
		//let detector = new Speaker();
		let detector = this.getDetector(siteId,model);
		
		//let detector = new Writable();
		//detector._write = function(chunk,encoding,cb) {
			//console.log('write',chunk.length)
			//cb()
		//}
		this.audioBuffers[siteId] = [];
		 //mqtt to stream - pushed to when audio packet arrives
		this.mqttStreams[siteId] = new Readable()
		this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        this.mqttStreams[siteId].pipe(detector)	 
        //this.mqttStreams[siteId].pipe(new PassThrough())	 
    }
	
	stopDetector(siteId) {
		let that = this;
		if (this.callbackIds) {
			this.callbackIds.map(function(callbackId) {
				that.manager.removeCallbackById(callbackId)
			})
		}
		delete that.mqttStreams[siteId]
		delete that.audioBuffers[siteId]
		process.exit()
	}
	
	chunkArrayInGroups(arr, size) {
		var myArray = [];
		for(var i = 0; i < arr.length; i += size) {
			myArray.push(arr.slice(i,size));
		}

		return myArray;
	}
	
	onAudioMessage(topic,siteId,buffer) {
		let that = this;
		if (this.mqttStreams.hasOwnProperty(siteId)) {
			// add wav header to first packet
			//if (this.messageCount[siteId] == 0) {
				//let wav = new WaveFile();
				//wav.fromScratch(1, 16000, '16', buffer);
				//this.mqttStreams[siteId].push(wav.toBuffer())
				////this.audioBuffers[siteId].push(wav.toBuffer())
				//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],wav.toBuffer())
				//this.messageCount[siteId]++;
	
			//} else {
				this.mqttStreams[siteId].push(buffer)
				//this.audioBuffers[siteId].push(buffer)
				this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
			//}
			
		}
		//let buffer = wholeBuffer;
		////console.log(['audio message',wholeBuffer.length])
		////let chunks = that.chunkArrayInGroups(wholeBuffer,128);
		//////console.log(chunks);
		////chunks.map(function(buffer,key) {
			//if (that.mqttStreams.hasOwnProperty(siteId)) {
				//// add wav header to first packet for hotword and asr streams
				//if (that.messageCount == 0) {
					//that.mqttStreams[siteId].push(buffer);
					//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
					//that.messageCount++;	
				//} else {
					//console.log('wav buffer')
					//console.log(buffer.length);
					//that.mqttStreams[siteId].push(buffer)
					//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
				//}
			//} 
			//else {
				////console.log('not recording');
			//}			
		//});
		//////console.log(['audio message',buffer.length])
		////if (this.mqttStreams.hasOwnProperty(siteId)) {
			////// add wav header to first packet for hotword and asr streams
			////if (this.messageCount == 0) {
				////this.mqttStreams[siteId].push(buffer);
				////this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
				////this.messageCount++;	
			////} else {
			//////	console.log('wav buffer')
				//////console.log(buffer.length);
				////this.mqttStreams[siteId].push(buffer)
				////this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
			////}
		////} else {
			//////console.log('not recording');
		////}
	}
	
	
	totalTime(hrtimeValue) {
		return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
	}

	getAsrModel() {
		const BEAM_WIDTH = this.props.BEAM_WIDTH;
		const LM_ALPHA = this.props.LM_ALPHA;
		const LM_BETA = this.props.LM_BETA;
		const N_FEATURES = this.props.N_FEATURES;
		const N_CONTEXT = this.props.N_CONTEXT;
		var args = this.props.files;
		
		
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

	
	getDetector(siteId,model) {
		const vad = new VAD(VAD.Mode.NORMAL);
		let that = this;
		const voice = {START: true, STOP: false};
		let sctx = model.setupStream(150, 16000);
		let state = voice.START;
		
		function finishStream() {
			try {
				// save audio
				let wav = new WaveFile();
				console.log('write file and add wav header',siteId,that.audioBuffers[siteId].length)
				wav.fromScratch(1, 16000, '16', that.audioBuffers[siteId]);
				//console.log(wav);
				var fs = require('fs');
				fs.writeFileSync('./nate.wav',wav.toBuffer())
				//let f = fs.createWriteStream('./joel.wav')
				//that.audioBuffers[siteId].map(function(buffer) {
					//console.log(['write',buffer.length]);
					//f.write(buffer)
				//});
				//f.end()
				
				// inference
				const model_load_start = process.hrtime();
				console.error('Running inference.');
				let transcription = model.finishStream(sctx);
				console.log('Transcription: ', transcription);
				console.log(['hermod/'+siteId+'/asr/text',{text:transcription}]);
				
				that.sendMqtt('hermod/'+siteId+'/asr/text',{text:transcription});
				const model_load_end = process.hrtime(model_load_start);
				console.error('Inference took %ds.', that.totalTime(model_load_end));
				that.stopDetector(siteId);
			} catch (e) {
				console.log(['FINISH STREAM ERROR',e])
			}
		}

		let detector = new Writable();
		var silenceCount = 0;
		detector._write = function(chunk,encoding,cb) {
			try {
				vad.processAudio(chunk, 16000).then(res => {
					//console.log(['chunk',chunk.length]);
					switch (res) {
						//case VAD.Event.ERROR:
							//console.log('VAD ERROR');
							//break;
						case VAD.Event.SILENCE:
							silenceCount++;
						//	console.log([res,silenceCount]);
								
							if (state === voice.START && silenceCount > 60) { //30
								state = voice.STOP;
								//model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								silenceCount = 0;
								finishStream();
								//console.log('finishStream');
								try {
									sctx = model.setupStream(150,16000);
								} catch (e) {
									console.log(e);
								}
								//console.log('setup stream');
								
								
							} else if (that.props.interimResults && false && state === voice.START && silenceCount === 10) { //5
								console.log();
								//model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								//console.log(' Stream fed');
								console.log('intermediate:'+model.intermediateDecode(sctx));
								//console.log(' Stream decoded');
								
							} else {
								model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								//console.log('Stream fed silent');
								
							}
							break;
						case VAD.Event.VOICE:
						case VAD.Event.NOISE:
							// restart mic
							if (state === voice.STOP) {
								//sctx = model.setupStream(150,16000);
								console.log('restart');
							}
							silenceCount = 0;
							state = voice.START;
							model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
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
