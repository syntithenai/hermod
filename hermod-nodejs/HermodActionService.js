var HermodService = require('./HermodService')

var yaml = require('js-yaml');
var fs   = require('fs');
const config = require('./config')

class HermodActionService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        let eventFunctions = {
            'hermod/+/action' : this.runAction.bind(this)
        }
		
		try {
		  let doc = yaml.safeLoad(fs.readFileSync(props.domainFile, 'utf8'));
		  this.domain = doc;
		} catch (e) {
		  console.log(e);
		}
		this.manager = this.connectToManager(props.manager,eventFunctions);
    }
    
    runAction(topic,siteId,payload) {
		let that = this;
		let action = payload.action;
		if (action && action.length) {
			if (action.indexOf('use_model_')>=0) {
				that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'use_model_ not implemented yet'})
			} else if (action.indexOf('utter_')>=0) {
				if (this.domain && this.domain.templates && this.domain.templates.hasOwnProperty(action)) {
					if (this.domain.templates[action].length > 0) {
						// replace slot values in utterance template
						let utterances = this.domain.templates[action];
						let randomUtterance = parseInt(Math.random() * utterances.length,10);
						let utterance = utterances[randomUtterance];
						if (utterance) utterance = utterance.text;
						for (var slot in payload.slots) {
							utterance = utterance.replace('{'+slot+'}',payload.slots[slot]);
						}
						let callbacks = {}
						callbacks['hermod/'+siteId+'/tts/finished'] = function() {
							that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action})
						}
						// automatic cleanup after single message with true parameter
						this.manager.addCallbacks(callbacks,true)
						
						that.sendMqtt('hermod/'+siteId+'/action/started',{})
						that.sendMqtt('hermod/'+siteId+'/tts/say',{text:utterance});
					} else {
						that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'no matching template for utter_ action'})
					}
				} 
			} else {
				if (this.domain.actions.indexOf(action) !== -1) {
					let parts = action.split("_");
					if (parts.length > 1) {
						if (config.skills.hasOwnProperty(parts[0])) {
							let functions = require(config.skills[parts[0]]+'/actions');
							if (functions.hasOwnProperty(action)) {
								let thisAction = functions[action].bind(this);
								let result = thisAction(siteId,action,payload.slots);
								// allow for async actions, if action returns a promise
								if (Promise.resolve(result) == result) {
									result.then(function() {
										that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action});
									});
								} else {
									that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action});
								}
							} else {
								that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'action not in domain'})
							}
						} else {
							that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'no matching skill'})
						}
					} else {
						that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'invalid action name'})
					}
				} else {
					that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'action not in domain'})
				}
			}
		} else {
			that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'required missing parameter action'})
		}
	}
    
}     
module.exports=HermodActionService
 
 