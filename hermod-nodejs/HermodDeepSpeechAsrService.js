var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
var PassThrough = stream.PassThrough;
var WaveFile = require('wavefile')
var VAD= require('node-vad')


//const config = require('./config');
const Ds = require('deepspeech');
const MemoryStream = require('memory-stream');
const Wav = require('node-wav');
const Duplex = require('stream').Duplex;
const util = require('util');

// TODO post wav data for transcription
//var fs = require('fs');
//var express = require('express');

//var app = express();

//app.post('/', function (req, res, next) {
  ////let detector = getDetector(args);
  //console.log('post /');
  ////req.pipe(detector);
  //console.log(req);
  //req.pipe(new stream.PassThrough())
  //req.on('end', next);
//});
//app.use(function (err, req, res, next) {
  //console.error(err.stack)
  //res.status(500).send('Something broke!')
//})

//app.listen(3009);


 
class HermodDeepSpeechAsrService extends HermodService  {
    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = [];
		this.listening = {};
		this.silent = {};
		this.messageCount = 0;
		
		this.mqttStreams = {};
		this.silenceStreams = {};
		this.wordBreakStreams = {};
		this.asrStreams = {};
		this.asrBuffers = {};
		this.vadSilent = {};
		this.inWordBreak = {};
		this.processes = {};
		
		this.audioBuffers = {};
		
        let eventFunctions = {
        // SESSION
            'hermod/#/asr/start' : function(topic,siteId,payload) {
				// TODO access control check siteId against props siteId or siteIds
				that.listening[siteId] = true;
				that.startProcess(siteId)
		    },
		    'hermod/#/asr/stop' : function(topic,siteId,payload) {
				console.log('stop hotword')
				that.listening[siteId] = false;
				that.stopProcess(siteId)
		    }
        }
		console.log(' DS CON');
		
        this.manager = this.connectToManager(props.manager,eventFunctions);
    }
    
    startProcess(siteId) {
		let that = this;
		console.log('START DS PROCESSING');
		let process = require('child_process').spawn('nodejs',['HermodDeepSpeechAsrDetector','--siteId',siteId]);
		//console.log(that.processes[siteId])
		process.stdout.on('error', function( err ){ throw err })
		process.stdin.on('error', function( err ){ throw err })
		
		process.stderr.on('data', chunk => {
			console.log('stderr:');
			console.log(String(chunk));
		})
		process.stdout.on('data', chunk => {
			console.log('data',String(chunk));
			if (String(chunk).indexOf('transcription:') === 0) {
				console.log('transcription:'+String(chunk).slice(13));
				//process.end();
			}
			
		});

		process.stdout.on('close', code => {
			console.log(['finish ',code]);
		})
	
		that.processes[siteId] = process;
	}

    stopProcess(siteId) {
		//	this.processes[siteId].end();
	}

}

module.exports=HermodDeepSpeechAsrService

    //startMqttListener(siteId) {
		//let that = this;
		//// subscribe to audio packets
		//// use siteId from start message
		////let callbacks = {}
		////callbacks['hermod/'+siteId+'/microphone/audio'] = this.onAudioMessage.bind(this)
		////this.callbackIds = this.manager.addCallbacks(callbacks)
		//////let model = this.getAsrModel()
		
		////const fs = require('fs');
		////const detector = fs.createWriteStream('./dsout.wav');
		////var Speaker = require("speaker");
		
		//////let detector = new Speaker();
		////let detector = this.getDetector(siteId);
		//////let detector = new Writable();
		//////detector._write = function(chunk,encoding,cb) {
			//////console.log('write',chunk.length)
			//////cb()
		//////}
		//////console.log(detector)
		////this.audioBuffers[siteId] = [];
		////// mqtt to stream - pushed to when audio packet arrives
		////this.mqttStreams[siteId] = new Readable()
		////this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        ////this.mqttStreams[siteId].pipe(detector)	 
        //////this.mqttStreams[siteId].on('data',function(buffer) {
			//////console.log(['mq data',buffer]);
		//////})       
	////}
	
	////stopMqttListener(siteId) {
		////let that = this;
		////if (this.callbackIds) {
			////this.callbackIds.map(function(callbackId) {
				////that.manager.removeCallbackById(callbackId)
			////})
			////delete that.mqttStreams[siteId]
			////delete that.audioBuffers[siteId]
		////}
	////}
	
	//onAudioMessage(topic,siteId,buffer) {
		////console.log(['audio message',buffer.length])
		////console.log(this.mqttStream)
		//if (this.mqttStreams.hasOwnProperty(siteId)) {
			//// add wav header to first packet for hotword and asr streams
			////if (this.messageCount == 0) {
				////this.mqttStreams[siteId].push(buffer);
				////this.messageCount++;	
			////} else {
				////console.log('wav buffer')
				////console.log(buffer.length);
				//this.mqttStreams[siteId].push(buffer)
				//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
			////}
		//}
	//}
	
	
	//getDetector(siteId) {
		//// launch deepspeech transcriber in a new process to protect this service against crashes
		//let deepSpeech = require('child_process').spawn('node', ['HermodDeepSpeechAsrDetector']);
		////,{stdio: [process.stdin, process.stdout, process.stderr]}
		//var silenceCount = 0;
		
		//function finishStream(code ) {
			//console.log('process ended '+code)
		//}
		
		//deepSpeech.stdout.on('error', function( err ){ throw err })
		//deepSpeech.stdin.on('error', function( err ){ throw err })
		
		//deepSpeech.stderr.on('data', chunk => {
			//console.log('stderr:');
			//console.log(String(chunk));
		//})
		//deepSpeech.stdout.on('data', chunk => {
			////console.log('data',String(chunk));
			//if (String(chunk).indexOf('transcription:') === 0) {
				//console.log('transcription:'+String(chunk).slice(13));
			//}
		//});

		//deepSpeech.stdout.on('close', code => {
			//finishStream(code);
		//})
		////deepSpeech.stdin.on('data', (buffer,encoding,cb) => {
			////codeepSpeech.stdin.on('data', (buffer,encoding,cb) => {
			////console.log('stdin data',buffer);
			////cb();
		////});nsole.log('stdin data',buffer);
			////cb();
		////});
		//return deepSpeech.stdin;
	//}
	
	 
	//totalTime(hrtimeValue) {
		//return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
	//}

	//getAsrModel() {
		//const BEAM_WIDTH = this.props.BEAM_WIDTH;
		//const LM_ALPHA = this.props.LM_ALPHA;
		//const LM_BETA = this.props.LM_BETA;
		//const N_FEATURES = this.props.N_FEATURES;
		//const N_CONTEXT = this.props.N_CONTEXT;
		//var args = this.props.files;
		
		
		//console.error('Loading model from file %s', args['model']);
		//const model_load_start = process.hrtime();
		//let model = new Ds.Model(args['model'], N_FEATURES, N_CONTEXT, args['alphabet'], BEAM_WIDTH);
		//const model_load_end = process.hrtime(model_load_start);
		//console.error('Loaded model in %ds.', this.totalTime(model_load_end));

		//if (args['lm'] && args['trie']) {
			////console.error('Loading language model from files %s %s', args['lm'], args['trie']);
			////const lm_load_start = process.hrtime();
			////model.enableDecoderWithLM(args['alphabet'], args['lm'], args['trie'],
				////LM_ALPHA, LM_BETA);
			////const lm_load_end = process.hrtime(lm_load_start);
			////console.error('Loaded language model in %ds.', this.totalTime(lm_load_end));
		////}
		
		////return model;
	////}

	
	////getDetector(siteId,model) {
		////const vad = new VAD(VAD.Mode.NORMAL);
		////let that = this;
		////const voice = {START: true, STOP: false};
		////let sctx = model.setupStream(150, 16000);
		////let state = voice.START;
		
		////function finishStream() {
			////try {
				////// save audio
				////let wav = new WaveFile();
				////console.log('wav header')
				////wav.fromScratch(1, 16000, '16', that.audioBuffers[siteId]);
				////var fs = require('fs');
				////let f = fs.createWriteStream('./dsne.wav')
				////f.write(wav.toBuffer())
				////f.end()
				
				////// inference
				////const model_load_start = process.hrtime();
				////console.error('Running inference.');
				////console.log('Transcription: ', model.finishStream(sctx));
				////const model_load_end = process.hrtime(model_load_start);
				////console.error('Inference took %ds.', that.totalTime(model_load_end));
			////} catch (e) {
				////console.log(['FINISH STREAM ERROR',e])
			////}
		////}

		////let detector = new Writable();
		////var silenceCount = 0;
		////detector._write = function(chunk,encoding,cb) {
			////try {
				////vad.processAudio(chunk, 16000).then(res => {
					////console.log([res,silenceCount]);
					////switch (res) {
						//////case VAD.Event.ERROR:
							//////console.log('VAD ERROR');
							//////break;
						////case VAD.Event.SILENCE:
							////silenceCount++;
							////console.log([res,silenceCount]);
								
							////if (state === voice.START && silenceCount > 30) {
								////state = voice.STOP;
								//////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								////silenceCount = 0;
								////finishStream();
								////console.log('finishStream');
								////try {
									////sctx = model.setupStream(150,16000);
								////} catch (e) {
									////console.log(e);
								////}
								//////console.log('setup stream');
								
								
							////} else if (state === voice.START && silenceCount === 5) {
								////console.log('interim');
								////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								//////console.log(' Stream fed');
								////console.log(model.intermediateDecode(sctx));
								//////console.log(' Stream decoded');
								
							////} else {
								////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
								//////console.log('Stream fed silent');
								
							////}
							////break;
						////case VAD.Event.VOICE:
						////case VAD.Event.NOISE:
							////// restart mic
							////if (state === voice.STOP) {
								//////sctx = model.setupStream(150,16000);
								////console.log('restart');
							////}
							////silenceCount = 0;
							////state = voice.START;
							////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
							//////console.log('Stream fed noise');
							////break;
					////}
				////});
				////cb()
			////} catch (e) {
				////console.log(['STREAM ERROR',e])
			////}
		////}
		////return detector;
	////}

	
		
//}     


		////let ffmpeg = require('child_process').spawn('ffmpeg', [
			////'-hide_banner',
			////'-nostats',
			////'-loglevel', 'fatal',
			////'-i', 'pipe:', //args['audio'],
			////'-af', 'highpass=f=200,lowpass=f=3000',
			////'-vn',
			////'-acodec', 'pcm_s16le',
			////'-ac', 1,
			////'-ar', 16000,
			////'-f', 's16le',
			////'pipe:'
		////]);
////		,{stdio: [process.stdin, process.stdout, process.stderr]}
		////var silenceCount = 0;
		
		////ffmpeg.stderr.on('data', chunk => {
			////console.log('err');
			////console.log(chunk);
		////})
		////ffmpeg.stdout.on('data', chunk => {
			////console.log('data');
			////vad.processAudio(chunk, 16000).then(res => {
				////switch (res) {
					////case VAD.Event.SILENCE:
						////silenceCount++;
						////if (state === voice.START && silenceCount > 4) {
							////state = voice.STOP;
							////finishStream();
							////sctx = model.setupStream(150,16000);
						////} else {
							////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
						////}
						////break;
					////case VAD.Event.VOICE:
					////case VAD.Event.NOISE:
						////state = voice.START;
						////model.feedAudioContent(sctx, chunk.slice(0, chunk.length / 2));
						////break;
				////}
			////});
		////});

		////ffmpeg.stdout.on('close', code => {
			////finishStream();
		////})
		////ffmpeg.stdin.on('data', (buffer,encoding,cb) => {
			////console.log('stdin data');
			////cb();
		////});
