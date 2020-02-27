const DeepSpeech = require('deepspeech');
const VAD = require('node-vad');
const fs = require('fs');
const wav = require('wav');
var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')
var HermodService = require('./HermodService')

class HermodDeepSpeechAsrService extends HermodService  {

	constructor(props) {
		super(props);
		let that = this;
		this.hotword = props.hotword;
		this.mqttStreams = {};
		this.callbackIds = {};
		this.listening = {};
		this.audioDump = {}
		
		this.modelStream = {};
		this.recordedChunks = {};
		this.silenceStart = {};
		//this.recordedAudioLength = {};
		this.endTimeout = {};
		this.silenceBuffers = {};
		this.firstChunkVoice = {};	
		
		this.DEEPSPEECH_MODEL="/home/pi/deepspeech-0.6.1-models"

		this.SILENCE_THRESHOLD = 900; // how many milliseconds of inactivity before processing the audio

		// const VAD_MODE = VAD.Mode.NORMAL;
		// const VAD_MODE = VAD.Mode.LOW_BITRATE;
		// const VAD_MODE = VAD.Mode.AGGRESSIVE;
		this.VAD_MODE = VAD.Mode.NORMAL;
		
		this.onAudioMessage = this.onAudioMessage.bind(this) 
		//this.onRecognize = this.onRecognize.bind(this) 
		this.englishModel = this.createModel(this.DEEPSPEECH_MODEL, {
			BEAM_WIDTH: 1024,
			LM_ALPHA: 0.75,
			LM_BETA: 1.85
		});

	
		let eventFunctions = {
			'hermod/+/microphone/start' : function(topic,siteId,payload) {
				that.startMqttListener(siteId)
			},
			'hermod/+/microphone/stop' : function(topic,siteId,payload) {
				that.stopMqttListener(siteId)
			},
			'hermod/+/asr/activate' : function(topic,siteId,payload) {
				that.startMqttListener(siteId)
			},
			'hermod/+/asr/deactivate' : function(topic,siteId,payload) {
				that.stopMqttListener(siteId)
			},
			'hermod/+/asr/start' : function(topic,siteId,payload) {
				that.listening[siteId] = true;
			},
			'hermod/+/asr/stop' : function(topic,siteId,payload) {
				that.listening[siteId] = false;
			}
		}
		this.manager = this.connectToManager('DSASR',props.manager,eventFunctions);
		//console.log('DS constructor')
	}
    
	createModel(modelDir, options) {
		let modelPath = modelDir + '/output_graph.tflite';
		let lmPath = modelDir + '/lm.binary';
		let triePath = modelDir + '/trie';
		let model = new DeepSpeech.Model(modelPath, options.BEAM_WIDTH);
		model.enableDecoderWithLM(lmPath, triePath, options.LM_ALPHA, options.LM_BETA);
		//console.log('created model')
		return model;
	}

	createStream(siteId) {
		//console.log('create stream '+siteId)
		
		if (siteId) {
			this.modelStream[siteId] = this.englishModel.createStream();
			this.recordedChunks[siteId] = 0;
			//this.recordedAudioLength[siteId] = 0;
			this.silenceBuffers[siteId] = [];
			this.firstChunkVoice[siteId] = false;
		}
		//console.log('created stream '+siteId)
		
		return this.modelStream[siteId]
	} 
	
	onRecog(siteId,results) {
		//console.log('recog - ' + results)
		//id:( (this.dialogIds && this.dialogIds.hasOwnProperty(siteId)) ? this.dialogIds[siteId] : 'noid'),
		let text = results;
		// require hotword
		if (results) { // && results.indexOf(this.hotword) !== -1) {
			//let remainderParts = results.split(this.hotword);
			//text = remainderParts.length > 0 ? remainderParts[1] : '';
			console.log('SEND MQTT TRANSCRIPT - '+text)
			this.sendMqtt('hermod/'+siteId+'/asr/text',{text:text});			
		} 
	}
	
	startMqttListener(siteId) {
		if (siteId) {
			let that = this;
			// subscribe to audio packets
			// use siteId from start message
			//console.log('start listener '+siteId)
			
			//// Stream the audio to the Google Cloud Speech API
			//const detector = client
			  //.streamingRecognize(request)
			  //.on('error', console.log)
			  //.on('data', data => {
				//that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:data.results[0].alternatives[0].transcript});
				//detector.pause()
				//detector.destroy()
				//that.stopMqttListener(siteId);
			  //});
			// deepspeech detection stream in this.modelStream[siteId]
			var FileWriter = require('wav').FileWriter;	
			let rand=new Date().getTime();
			let daname = './audio-'+siteId+'-'+rand+'.wav'
			this.audioDump[siteId] = new FileWriter(daname, {
			  sampleRate: 16000,
			  channels: 1
			});

			
			this.createStream(siteId);
			//function callback(p) {console.log(p)}
			// mqtt to stream - pushed to when audio packet arrives
			this.mqttStreams[siteId] = new Readable()
			this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
			this.mqttStreams[siteId].on('data', function(data) {
				that.processAudioStream(siteId,data, (results) => {
					//console.log('data processed')
					//console.log(results)
					this.onRecog(siteId,results)
				});
			});

			let callbacks = {}
			callbacks['hermod/+/microphone/audio'] = this.onAudioMessage
			this.callbackIds[siteId] = this.manager.addCallbacks('DSASRaudio',callbacks,false,true,siteId)

			//this.mqttStreams[siteId].pipe(detector)	
		}
	}
	
	// incoming message onto mqtt stream
	onAudioMessage(topic,siteId,buffer) {
		//console.log([this])
		//console.log('audio message')
		//console.log(buffer.length)
		//console.log(siteId)
		//console.log([this.mqttStreams])
		
		if (this.mqttStreams && this.mqttStreams.hasOwnProperty(siteId)) {
			//this.audioDump[siteId].push(buffer)
			this.mqttStreams[siteId].push(buffer)
		} else {
			console.log('stream not started')
		}
		//let that = this;
		//let bufferCopy = Buffer.from(buffer)
		
		//this.processAudioStream(siteId,bufferCopy, (results) => {
			//that.onRecog(siteId,results)  //console.log('data processed')
			////console.log(results)
			////callback(results);
		//});
		
	}
	
	stopMqttListener(siteId) {
		let that = this;
		if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			this.callbackIds[siteId].map(function(callbackId) {
				that.manager.removeCallbackById(callbackId)
				delete that.callbackIds[siteId];
				delete that.mqttStreams[siteId]
				delete that.listening[siteId]
			})
		}
	}
	
	processAudioStream(siteId, data, callback) {
		//console.log('process audio str')
		//console.log(data.length)
		//console.log(data)
		let that = this;
		let vad = new VAD(this.VAD_MODE);
		vad.processAudio(data, 16000).then((res) => {
			//console.log('process audio str vad')
				
			if (that.firstChunkVoice[siteId]) {
				//console.log('process audio first chunk voice')
		
				that.firstChunkVoice[siteId] = false;
				that.processVoice(siteId,data);
				return;
			}
			//console.log('process audio options')

			switch (res) {
				case VAD.Event.ERROR:
					//console.log("VAD ERROR");
					break;
				case VAD.Event.NOISE:
					//console.log("VAD NOISE");
					break;
				case VAD.Event.SILENCE:
					that.processSilence(siteId,data, callback);
					break;
				case VAD.Event.VOICE:
					that.processVoice(siteId,data);
					break;
				default:
					//console.log('default', res);
			}
		});
		
		// timeout after 1s of inactivity
		clearTimeout(that.endTimeout[siteId]);
		that.endTimeout[siteId] = setTimeout(function() {
			//console.log('timeout');
			that.resetAudioStream(siteId);
		},that.SILENCE_THRESHOLD*3);
	}
	
	

	endAudioStream(siteId,callback) {
		//console.log('[end]');
		let results = this.intermediateDecode(siteId);
		if (results) {
			if (callback) {
				callback(results);
			}
		}
	}

	resetAudioStream(siteId) {
		if (this.endTimeout && this.endTimeout.hasOwnProperty(siteId)) clearTimeout(this.endTimeout[siteId]);
		//console.log('[reset]');
		this.intermediateDecode(siteId); // ignore results
		this.recordedChunks[siteId] = 0;
		this.silenceStart[siteId] = null;
	}

	
	processSilence(siteId,data, callback) {
		//console.log('silence ')
		
		if (this.recordedChunks[siteId] > 0) { // recording is on
			process.stdout.write('-'); // silence detected while recording
			
			this.feedAudioContent(siteId,data);
			
			if (this.silenceStart[siteId] === null) {
				this.silenceStart[siteId] = new Date().getTime();
			}
			else {
				let now = new Date().getTime();
				if (now - this.silenceStart[siteId] > this.SILENCE_THRESHOLD) {
					this.silenceStart[siteId] = null;
					//console.log('[end]');
					let results = this.intermediateDecode(siteId);
					if (results) {
						if (callback) {
							callback(results);
						}
					}
				}
			}
		}
		else {
			process.stdout.write('.'); // silence detected while not recording
			this.bufferSilence(siteId,data);
		}
	}
	
	

	bufferSilence(siteId,data) {
		//console.log('buf sil ')
		
		// VAD has a tendency to cut the first bit of audio data from the start of a recording
		// so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
		this.silenceBuffers[siteId].push(data);
		if (this.silenceBuffers[siteId].length >= 3) {
			this.silenceBuffers[siteId].shift();
		}
	}


		
	addBufferedSilence(siteId,data) {
		let audioBuffer;
		if (this.silenceBuffers[siteId].length) {
			this.silenceBuffers[siteId].push(data);
			let length = 0;
			this.silenceBuffers[siteId].forEach(function (buf) {
				length += buf.length;
			});
			audioBuffer = Buffer.concat(this.silenceBuffers[siteId], length);
			this.silenceBuffers[siteId] = [];
		}
		else audioBuffer = data;
		return audioBuffer;
	}
	
	


	processVoice(siteId,data) {
		//console.log('voice ')
		
		this.silenceStart[siteId] = null;
		//if (this.recordedChunks[siteId] === 0) {
			//console.log('');
			//process.stdout.write('[start]'); // recording started
		//}
		//else {
			//process.stdout.write('='); // still recording
		//}
		this.recordedChunks[siteId]++;
		
		data = this.addBufferedSilence(siteId,data);
		this.feedAudioContent(siteId,data);
	}
	
		
	finishStream(siteId) {
		//console.log('finish text: ')
		
		if (this.modelStream[siteId]) {
			let start = new Date();
			let text = this.englishModel.finishStream(this.modelStream[siteId]);
			//console.log(text)
				
			if (text) {
				if (text === 'i' || text === 'a') {
					// bug in DeepSpeech 0.6 causes silence to be inferred as "i" or "a"
					return;
				}
				//let recogTime = new Date().getTime() - start.getTime();
				//return {
					//text,
					//recogTime,
					//audioLength: Math.round(this.recordedAudioLength[siteId])
				//};
				this.onRecog(siteId,text)
			} else {
				this.onRecog(siteId,'')
			}
		}
		this.silenceBuffers[siteId] = [];
		this.modelStream[siteId] = null;
	}
	

	intermediateDecode(siteId) {
		//console.log('inter decode ')
		
		let results = this.finishStream(siteId);
		this.createStream(siteId);
		return results;
	}

	feedAudioContent(siteId,chunk) {
		//console.log('feed audio ')
		
		if (chunk) {
			//this.recordedAudioLength[siteId] += (chunk.length / 2) * (1 / 16000) * 1000;
			this.englishModel.feedAudioContent(this.modelStream[siteId], chunk.slice(0, chunk.length / 2));
		}
	}
	

		
}     
module.exports=HermodDeepSpeechAsrService
