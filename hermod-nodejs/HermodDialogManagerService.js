var HermodService = require('./HermodService')

const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;

var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')

class HermodDialogManagerService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = [];
        this.dialogs = {};
		function startDialog(siteId,payload) {
				//Start a dialog 
				var dialogId = String(parseInt(Math.random()*100000000,10))
				that.dialogs[dialogId] = {asrModels:payload.asrModels ? payload.asrModels : 'default', nluModels:payload.nluModels ? payload.nluModels : 'default'};
				that.sendMqtt('hermod/'+siteId+'/dialog/started',{id:dialogId})
				//that.sendMqtt('hermod/'+siteId+'/hotword/stop',{})
				that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
				that.sendMqtt('hermod/'+siteId+'/asr/start',{id:dialogId,models:that.dialogs[dialogId].asrModels})
		}
		function startNlu(siteId,payload) {
				//Start a dialog 
				var dialogId = String(parseInt(Math.random()*100000000,10))
				that.dialogs[dialogId] = {asrModels:payload.asrModels ? payload.asrModels : 'default', nluModels:payload.nluModels ? payload.nluModels : 'default'};
				//that.sendMqtt('hermod/'+siteId+'/hotword/stop',{})
				//that.sendMqtt('hermod/'+siteId+'/microphone/stop',{})
				that.sendMqtt('hermod/'+siteId+'/dialog/sstarted',{id:dialogId})
				that.sendMqtt('hermod/'+siteId+'/asr/stop',{id:dialogId,models:that.dialogs[dialogId].asrModels})
				that.sendMqtt('hermod/'+siteId+'/nlu/parse',{id:dialogId,models:that.dialogs[dialogId].nluModels,text:payload.text,confidence:payload.confidence})
						
		}
        let eventFunctions = {
        // SESSION
            'hermod/+/hotword/detected' : function(topic,siteId,payload) {
				that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id})
				let callbacks={};
				callbacks['hermod/'+siteId+'/dialog/ended'] = function() {
					startDialog(siteId,payload)
				}
				// automatic cleanup after single message with true parameter
				that.callbackIds[siteId] = that.manager.addCallbacks(callbacks,true)
			}
		    ,
		    'hermod/+/dialog/start' : function(topic,siteId,payload) {
				// if text is sent with start message, jump straight to nlu
				if (payload.text && payload.text.length > 0) {
					startNlu(siteId,payload)
				} else {
					startDialog(siteId,payload)
				}
		    }
		    ,
		    'hermod/+/dialog/continue' : function(topic,siteId,payload) {			
				//Sent by an action to continue a dialog and seek user input.
				//text - text to speak before waiting for more user input
				//ASR Model - ASR model to request
				//NLU Model - NLU model to request
				//Intents - Allowed Intents
				if (that.dialogs.hasOwnProperty(payload.id)) {
					if (payload.nluModels)  that.dialogs[payload.id].nluModels = payload.nluModels  
					if (payload.asrModels)  that.dialogs[payload.id].asrModels = payload.asrModels 
					if (payload.text && payload.text.length > 0) {
						//that.sendMqtt('hermod/'+siteId+'/microphone/stop',{})
						that.sendMqtt('hermod/'+siteId+'/tts/say',{id:payload.id,text:payload.text})
						// After hermod/<siteId>/tts/finished, send message to restart conversation
						let callbacks = {}
						callbacks['hermod/'+siteId+'/tts/finished'] = function() {
							that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
							that.sendMqtt('hermod/'+siteId+'/asr/start',{id:payload.id,models: that.dialogs[payload.id].asrModels})
						}
						// automatic cleanup after single message with true parameter
						that.callbackIds[siteId] = that.manager.addCallbacks(callbacks,true)						
					} else {
						that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
						that.sendMqtt('hermod/'+siteId+'/asr/start',{id:payload.id,models: that.dialogs[payload.id].asrModels})
					}
				} else {
					console.error('missing id in dialog continue')
				}
			}
		    ,
		    'hermod/+/asr/text' : function(topic,siteId,payload) {
				//Sent by asr service
			//	if (that.dialogs.hasOwnProperty(payload.id)) {
					//if (payload.text && payload.text.length > 0) {
						//that.dialogs[payload.id].text = payload.text
						that.sendMqtt('hermod/'+siteId+'/microphone/stop')
						that.sendMqtt('hermod/'+siteId+'/nlu/parse',{id:payload.id,text:payload.text,confidence:payload.confidence})
					//} else {
						//console.error('empty asr text')
					//}
				//} else {
					//console.error('missing id in asr text')
				//}
		    }
		    ,
		    'hermod/+/nlu/intent' : function(topic,siteId,payload) {
				//Sent by nlu service
				if (that.dialogs.hasOwnProperty(payload.id)) {
					that.dialogs[payload.id].parse = payload
				}
				that.sendMqtt('hermod/'+siteId+'/intent',payload)
			}
		    ,
		    'hermod/+/nlu/fail' : function(topic,siteId,payload) {
				that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id})
			}
		    ,
		    'hermod/+/dialog/end' : function(topic,siteId,payload) {
				//The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
				// Garbage collect dialog resources.
				// Respond with 
				if (that.dialogs.hasOwnProperty(payload.id)) {
					delete that.dialogs[payload.id]
				}
				that.sendMqtt('hermod/'+siteId+'/dialog/ended',{id:payload.id})
				that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
				that.sendMqtt('hermod/'+siteId+'/hotword/start',{})
		    }
		    ,
		    'hermod/+/router/action' : function(topic,siteId,payload) {
				//The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
				//Garbage collect dialog resources.
				//Respond with 
				that.sendMqtt('hermod/'+siteId+'/action',payload)
		    }
        }
        
        this.manager = this.connectToManager(props.manager,eventFunctions);
		
		// initialise the dialog manager to start the hotword listener
		setTimeout(function() {
			that.sendMqtt('hermod/'+that.props.siteId+'/microphone/start',{})
			that.sendMqtt('hermod/'+that.props.siteId+'/hotword/start',{})
		},1000);
    }
   

}     
module.exports=HermodDialogManagerService
 
