var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaCoreRouterService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        this.recursionDepth={};
        let eventFunctions = {
            'hermod/+/intent' : this.sendRequest.bind(this),
            'hermod/+/dialog/started' : this.resetTracker.bind(this)
        }
        this.manager = this.connectToManager('CORE',props.manager,eventFunctions);
    }
 
	resetTracker(topic,siteId,payload) {
		let that =this;
			 
		axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{
			"event": "restart",
			})
			.then(response => {
			}).catch(error => {
			  console.log(error);
   		  });	
 	}
	
	predictAndRun (siteId,payload)  {
		let that = this;
		return new Promise(function(resolve,reject) {
			axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
			.then(response => {
				if (response.data.scores && response.data.scores.length > 0 && response.data.scores[0].action  && response.data.scores[0].action.length > 0) {
					let scores = response.data.scores;
					scores.sort(function(a,b) {
						if (a.score > b.score) return -1
						else return 1;
					});
					let action =  scores[0].action;
					let confidence = scores[0].action.score;
					if (that.props.debug) console.log(['ACTION',action]);
					// get current state of slots for action message
					axios.get(that.props.coreServer+"/conversations/"+siteId+"/tracker",{})
					  .then(tracker => {
						if (that.props.debug) console.log(['TRACKER',tracker.data]);
					
     					let callbacks = {}
						callbacks['hermod/'+siteId+'/action/finished'] = function() {
							axios.post(that.props.coreServer+"/conversations/"+siteId+"/execute",{name:action,confidence:confidence})
						  .then(response => {
								axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
								.then(response => {
									let scores = response.data.scores;
									if (scores.length > 0) {
										scores.sort(function(a,b) {
											if (a.score > b.score) return -1
											else return 1;
										});	
												
										if (scores[0].action === "action_listen"|| scores[0].action === "action_restart") {
											resolve(scores[0].action);
										} else {
											that.recursionDepth[siteId]++;
											// avoid infinite recursion if getting garbage from core
											if (that.recursionDepth[siteId] > 15) {
												resolve("action_restart");
											} else {
												that.predictAndRun(siteId,payload).then(function(action) {
													resolve(action);
												});
											}
										}						
											

									} else {
										resolve();
									}
								}).catch(error => {
									  console.log(error);
									  resolve();
								});;
						
							  }).catch(error => {
								  console.log(error);
								  resolve();
							  });						  
								
						}
					// automatic cleanup after single message with true parameter
					that.manager.addCallbacks('CORE',callbacks,true)
					// trigger action server
					that.sendMqtt('hermod/'+siteId+'/action',{id:payload.id,action:action,slots:tracker.data.slots});
	
				}).catch(error => {
								  console.log(error);
								  resolve();
							  });;
			}	else {
				resolve
			}		
		   }).catch(error => {
								  console.log(error);
								  resolve();
							  });;
		  });
	  }
 
    sendRequest(topic,siteId,payload) {
		let that = this;
		this.recursionDepth[siteId] = 0;
		that.sendMqtt('hermod/'+siteId+'/core/started',{dialogId:payload.dialogId});				
		axios.post(this.props.coreServer+"/conversations/"+siteId+"/messages",{text:payload.text,sender:"user",parse_data:payload})
		  .then(function(response) {
			  that.predictAndRun(siteId,payload).then(function(action) {
				if (action === 'action_restart') {
					// restart hotword
					that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id});
					if (that.props.debug) console.log('RESTART ASR')
				} else if (action === 'action_listen') {
					// restart asr
					that.sendMqtt('hermod/'+siteId+'/dialog/continue',{id:payload.id});
					if (that.props.debug) console.log('RESTART HOTWORD')
				} 
			  }).catch(error => {				  
				  console.log(error);
			  });;
		  })
		  .catch(error => {
			  console.log(error);
		  });
	}
    
}     
module.exports=HermodRasaCoreRouterService
 
 
