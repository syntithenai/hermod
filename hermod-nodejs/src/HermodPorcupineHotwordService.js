var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
var Wav = require('wav')
var kill  = require('tree-kill');	

//	 TODO RESTORE THIS CLASS. FIRST NEED TO BE ABLE TO INSTALL PICOVOICE ..... ON PI ALSO
class HermodPorcupineHotwordService extends HermodService  {

    constructor(props) {
        super(props);

		this.child = {};
		let that = this;
		let eventFunctions = {
            'hermod/+/hotword/activate' : function(topic,siteId,payload) {
				
				console.log('start python service')
				// start python hotword service
				that.child[siteId] = require('child_process').spawn( 'porcupine/bin/python' , ['./porcupine/hotword_exec.py','localhost','1883','jest', 'picovoice,porcupine,bumblebee']); //, '--keywords picovoice', '--site '+props.siteId 
				//var child = require('child_process').execFile( 'ls' , [ '-al' ]); 
				//var child = require('child_process').execFile( 'porcupine/bin/python' , [ './porcupine/test.py' ]); //, '--keywords picovoice', '--site '+props.siteId 
				
				// use event hooks to provide a callback to execute when data are available: 
				console.log('started python service')
				that.child[siteId].stdout.on('data', function(data) {
					console.log(data.toString()); 
				});
				that.child[siteId].stderr.on('data', function(data) {
					console.log(data.toString()); 
				});

			}
		    ,
		    'hermod/+/hotword/deactivate' : function(topic,siteId,payload) {
				//console.log('stop python service')
				if (parseInt(that.child[siteId]) > 0) kill(parseInt(that.child[siteId]))
		    }
        }
		
        this.manager = this.connectToManager('HOTWORD',props.manager,eventFunctions);

	}
}
module.exports=HermodPorcupineHotwordService
  
        //let that = this;
        //this.callbackIds = {};
		//this.listening = {};
		//this.messageCount = {};
		//this.porcupine = null;
		//this.inputBuffer = [];
		//this.mqttStreams = {};
		//this.audioBuffers = {};
		//this.audioDump = {}
		//this.isStarted = {};
        

    //}
    
    //startMqttListener(siteId) {
		//let that = this;
		
				
		//// subscribe to audio packets
		//// use siteId from start message
		//let callbacks = {}
		//callbacks['hermod/'+siteId+'/microphone/audio'] = this.onAudioMessage.bind(this)
		//this.callbackIds[siteId] = this.manager.addCallbacks('HOTWORD',callbacks)
		
		////// LOGGING
		////var FileWriter = require('wav').FileWriter;	
		////this.audioDump[siteId] = new FileWriter('./hotword.wav', {
		  ////sampleRate: 16000,
		  ////channels: 1
		////});
				
		////// Hotword
		////let config = this.props;
		
		////const Detector = require('snowboy').Detector;
		////const Models = require('snowboy').Models;
		 //// snowboy setup
		////var models = new Models();
		
		////this.props.models.map(function(thisModel) {
		   ////models.add(thisModel);
		////})
		////var detector = new Detector(Object.assign({models:models},this.props.detector));
		////detector.on('error', function () {
		  ////console.log('error');
		////});

		////const detector = new PorcupineStream({
			////modelFilePath: 'node_modules/pv-porcupine/Porcupine/lib/common/porcupine_params.pv',
			////keywords: 'porcupine/hotwords/bumblebee'
		////});

		////detector.on('keyword', (chunk, keyword) => {
			////console.log(['hotword '+siteId, chunk, keyword]);
			////that.sendMqtt('hermod/'+siteId+'/hotword/detected',{hotword:keyword});
		////});

		////fs.createReadStream('path/to/raw/audio/file').pipe(detector);
		//this.porcupine = Porcupine.create(hotwords, sensitivities);
		
	
		//this.mqttStreams[siteId] = new Wav.Writer();		 
        ////this.mqttStreams[siteId].pipe(detector)
		//this.mqttStreams[siteId].on('data', (data) => {
			//let float32arr = pcmConvert(data, 'int16 mono le', 'float32');
			//this.processAudio(siteId,float32arr);
		//});
		
		
		////detector.on('hotword', function (index, hotword, buffer) {
			////console.log(['hotword '+siteId, index, hotword]);
			////that.sendMqtt('hermod/'+siteId+'/hotword/detected',{hotword:hotword});
		////});
		
	//}
	
	
	//processAudio(siteId,inputFrame) {
		//let inputSampleRate = 16000;
		
		//for (let i = 0; i < inputFrame.length; i++) {
			//this.inputBuffer.push((inputFrame[i]) * 32767);
		//}
		
		//const PV_SAMPLE_RATE = 16000;
		//const PV_FRAME_LENGTH = 512;
		
		//while ((this.inputBuffer.length * PV_SAMPLE_RATE / inputSampleRate) > PV_FRAME_LENGTH) {
			//let outputFrame = new Int16Array(PV_FRAME_LENGTH);
			//let sum = 0;
			//let num = 0;
			//let outputIndex = 0;
			//let inputIndex = 0;
			
			//while (outputIndex < PV_FRAME_LENGTH) {
				//sum = 0;
				//num = 0;
				//while (inputIndex < Math.min(this.inputBuffer.length, (outputIndex + 1) * inputSampleRate / PV_SAMPLE_RATE)) {
					//sum += this.inputBuffer[inputIndex];
					//num++;
					//inputIndex++;
				//}
				//outputFrame[outputIndex] = sum / num;
				//outputIndex++;
			//}
			
			//this.processPorcupine(siteId,outputFrame);
			//this.inputBuffer = this.inputBuffer.slice(inputIndex);
		//}
	//}
	
	//processPorcupine(siteId,data) {
		//var id = this.porcupine.process(data);
		//if (id > -1) {
			//var label = (this.hotwordLabels[id]) ? this.hotwordLabels[id] : ''
			//console.log(['hotword '+siteId, id,label]);
			//this.sendMqtt('hermod/'+siteId+'/hotword/detected',{hotword:label});
		//}
	//}
	
	
	
	//stopMqttListener(siteId) {
		//let that = this;
		//this.audioDump[siteId].push(null)
		
		//if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			//this.callbackIds[siteId].map(function(callbackId) {
				//that.manager.removeCallbackById(callbackId)
				//delete that.callbackIds[siteId];
				//delete that.mqttStreams[siteId]
				//delete that.listening[siteId]
			//})
		//}
	//}
	
	//onAudioMessage(topic,siteId,buffer) {
		//if (this.mqttStreams.hasOwnProperty(siteId)) {
			//this.mqttStreams[siteId].push(buffer)
			//this.audioDump[siteId].push(buffer)
			//this.messageCount[siteId]++;
		//}
	//}	
	
	
	//startPorcupine() {
		
		////let keywordIDs = {};
		////let sensitivities = [];
		////this.keywordIndex = [];
		////for (let id in this.hotwords) {
			////let h = this.hotwords[id];
			////keywordIDs[id] = h.data;
			////this.keywordIndex[sensitivities.length] = id;
			////sensitivities.push(h.sensitivity);
		////}
		
		////let keywordIDArray = Object.values(keywordIDs);
		
		//this.porcupine = Porcupine.create(hotwords, sensitivities);
		
		//this.recorder = new AudioRecorder({
			//program: process.platform === 'win32' ? 'sox' : 'rec',
			//silence: 0
		//});
		
		//this.recorder.start();
		
		//let stream = this.recorder.stream();
		//stream.on(`error`, () => {
			//console.log('Recording error.');
		//});
		
		//stream.on('data', (data) => {
			//if (this.state.muted) {
				//// muted just ignores the incoming audio data but keeps the stream open
				//this.emit('muted');
				//return;
			//}
			
			//// records as int16, convert back to float for porcupine
			//let float32arr = pcmConvert(data, 'int16 mono le', 'float32');
			//this.processAudio(float32arr);
			//this.emit('data', data, 16000);
		//});
		
		//this.emit('start');
	//}
	
	

//}     
 
