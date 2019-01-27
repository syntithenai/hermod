var HermodService = require('./HermodService')

  
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;

var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')

class HermodDialogManager extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = [];
		console.log(['CON DIALOG MANAGER',this.props]);
		function startDialog(siteId) {
				//Start a dialog 
				var dialogId = parseInt(Math.random()*100000000,10)
				that.sendMqtt('hermod/'+siteId+'/hotword/stop',{})
				that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
				that.sendMqtt('hermod/'+siteId+'/asr/start',{})
				that.sendMqtt('hermod/'+siteId+'/dialog/started',{id:dialogId})
		}
		
        let eventFunctions = {
        // SESSION
            'hermod/#/hotword/detected' : function(topic,siteId,payload) {
				that.sendMqtt('hermod/'+siteId+'/dialog/end',{})
				let callbacks={};
				callbacks['hermod/'+siteId+'/dialog/ended'] = function() {
					startDialog(siteId)
				}
				// automatic cleanup after single message with true parameter
				that.callbackIds[siteId] = that.manager.addCallbacks(callbacks,true)
			}
		    ,
		    'hermod/#/dialog/start' : function(topic,siteId,payload) {
				startDialog(siteId)
		    }
		    ,
		    'hermod/#/dialog/continue' : function(topic,siteId,payload) {			
				//Sent by an action to continue a dialog and seek user input.
				//text - text to speak before waiting for more user input
				//ASR Model - ASR model to request
				//NLU Model - NLU model to request
				//Intents - Allowed Intents
				that.sendMqtt('hermod/'+siteId+'/microphone/stop',{id:payload.siteId})
				that.sendMqtt('hermod/'+siteId+'/tts/say',{text:payload.text})
				// After hermod/<siteId>/tts/sayFinished, send message to restart conversation
				let callbacks = {}
				callbacks['hermod/'+siteId+'/tts/sayFinished'] = function() {
					//if (that.callbackIds.hasOwnProperty(siteId) && that.callbackIds[siteId]) {
					that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
					that.sendMqtt('hermod/'+siteId+'/asr/start',{})
						//that.callbackIds[siteId].map(function(callbackId) {
							////that.manager.removeCallbackById(callbackId)
							//delete that.callbackIds[siteId];
						//}
					//}
				}
				// automatic cleanup after single message with true parameter
				that.callbackIds[siteId] = this.manager.addCallbacks(callbacks,true)
			}
		    ,
		    'hermod/#/asr/text' : function(topic,siteId,payload) {
				//Sent by asr service
				that.sendMqtt('hermod/'+siteId+'/microphone/stop')
				that.sendMqtt('hermod/'+siteId+'/nlu/parse',{text:payload.text,confidence:payload.confidence})
				//=> hermod/<siteId>/nlu/query
		    }
		    ,
		    'hermod/#/nlu/intent' : function(topic,siteId,payload) {
				//Sent by nlu service
				that.sendMqtt('hermod/'+siteId+'/intent',payload)
				//=> hermod/<siteId>/intent
				//Wait for voiceid if enabled.
				//OR
				//Sent when entity recognition fails because there are no results of sufficient confidence value.
				//that.sendMqtt('hermod/'+siteId+'/nlu/fail',{})
				//??? => hermod/<siteId>/dialog/end
				// that.sendMqtt('hermod/'+siteId+'/dialog/end',{})
		    }
		    ,
		    'hermod/#/dialog/end' : function(topic,siteId,payload) {
				//The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
				//Garbage collect dialog resources.
				//Respond with 
				that.sendMqtt('hermod/'+siteId+'/dialog/ended',{})
				that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
				that.sendMqtt('hermod/'+siteId+'/hotword/start',{})
		    }
		    ,
		    'hermod/#/router/action' : function(topic,siteId,payload) {
				//The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
				//Garbage collect dialog resources.
				//Respond with 
				that.sendMqtt('hermod/'+siteId+'/action',payload)
		    }
        }
        
		
        
        this.manager = this.connectToManager(props.manager,eventFunctions);
		
		console.log(['DIALOG MANAGER CONSTRUCTOR NOW SEND START MESSAGES',that.props.siteId]);
		setTimeout(function() {
			that.sendMqtt('hermod/'+that.props.siteId+'/microphone/start',{})
			that.sendMqtt('hermod/'+that.props.siteId+'/hotword/start',{})
		},1000);
    }
   

}     
module.exports=HermodDialogManager
 
