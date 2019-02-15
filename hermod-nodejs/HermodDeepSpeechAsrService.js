var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
var PassThrough = stream.PassThrough;
var WaveFile = require('wavefile')
var VAD= require('node-vad')
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
		this.dialogIds={};
		
		this.audioBuffers = {};
		
        let eventFunctions = {
        // SESSION
            'hermod/+/asr/start' : function(topic,siteId,payload) {
				let selectModel = payload.model ? payload.model : 'default';
				if (selectModel === that.props.model) {
					that.dialogIds[siteId]= payload.id;
					that.listening[siteId] = true;
					that.startProcess(siteId)					
				}
		    },
		    'hermod/+/asr/stop' : function(topic,siteId,payload) {
				if (payload.model === that.props.model) {
					that.listening[siteId] = false;
					that.stopProcess(siteId)
				}
		    }
        }
		this.manager = this.connectToManager('ASR',props.manager,eventFunctions);
    }
    
    startProcess(siteId) {
		let that = this;
		let process = require('child_process').spawn('nodejs',['HermodDeepSpeechAsrDetector','--siteId',siteId]);
		process.stdout.on('error', function( err ){ throw err })
		process.stdin.on('error', function( err ){ throw err })
		
		process.stderr.on('data', chunk => {
			console.log('stderr:');
			console.log(String(chunk));
		})
		process.stdout.on('data', chunk => {
			console.log('data',String(chunk));
			if (String(chunk).indexOf('transcription:') === 0) {
				let transcription = String(chunk).slice(13);
			//	console.log('transcription:'+transcription);
				that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:transcription});
				
			}
			
		});

		process.stdout.on('close', code => {
			//console.log(['finish ',code]);
		})
	
		that.processes[siteId] = process;
	}

    stopProcess(siteId) {
		//	this.processes[siteId].end();
	}

}

module.exports=HermodDeepSpeechAsrService

