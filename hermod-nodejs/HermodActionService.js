var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

const config = require('./config')

class HermodActionService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        //console.log('RAS PRROPS');
        //console.log(props);
        
        let eventFunctions = {
        // SESSION
            'hermod/+/action' : this.runAction.bind(this)
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);
		var yaml = require('js-yaml');
		var fs   = require('fs');
		 
		// Get document, or throw exception on error
		try {
		  let doc = yaml.safeLoad(fs.readFileSync(props.domainFile, 'utf8'));
		  console.log(doc.templates);
		  this.domain = doc;
		} catch (e) {
		  console.log(e);
		}
    }
    
    runAction(topic,siteId,payload) {
		let that = this;
		console.log(payload);
		console.log(payload.slots);
		let action = payload.action;
		if (action && action.length) {
			if (action == 'action_end') {
				// restart hotword
			} else if (action == 'action_listen') {
				// restart asr
			} else if (action == 'action_restart') {
				// clear tracker and restart asr
			} else if (action.indexOf('use_model_')>=0) {
			
			} else if (action.indexOf('utter_')>=0) {
				if (this.domain && this.domain.utterances && this.domain.utterances.hasOwnProperty(action)) {
					if (this.domain.utterances[action].text && this.domain.utterances[action].text.length > 0) {
						// send text as tts
						// replace slot values in utterance template
						let utterance = this.domain.utterances[action].text;
						for (var slot in payload.slots) {
							utterance = utterance.replace('{'+slot+'}',payload[slot]);
						}
						let callbacks = {}
						// TODO PASSTHRU DIALOGID
						callbacks['hermod/'+siteId+'/tts/sayFinished'] = function() {
							that.sendMqtt('hermod/'+siteId+'/action/finished',{})
						}
						// automatic cleanup after single message with true parameter
						that.callbackIds[siteId] = this.manager.addCallbacks(callbacks,true)
						
						that.sendMqtt('hermod/'+siteId+'/action/started',{})
						this.sendMqtt('hermod/'+siteId+'/tts/say',{text:utterance});
					}
				} 
			} else {
				if (this.domain.actions.indexOf(action) !== -1) {
					let parts = action.split(".");
					
					// run the action
					// allow for async actions
					// TODO CONFIG FOR ACTIONS API
					//Promise.resolve(obj) == obj
					//Promise.resolve(valueOrPromiseItDoesntMatter).then(function(value) {
						
						//that.sendMqtt('hermod/'+siteId+'/action/finished',{})
					//})
				}
			}
		} else {
			console.error('no action to run');
		}
	}
    
}     
module.exports=HermodActionService
 
 