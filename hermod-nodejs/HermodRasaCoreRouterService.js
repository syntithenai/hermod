var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaCoreRouterService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        //console.log('RAS PRROPS');
        //console.log(props);
        this.recursionDepth={};
        let eventFunctions = {
        // SESSION
            'hermod/+/intent' : this.sendRequest.bind(this),
            'hermod/+/dialog/started' : this.resetTracker.bind(this)
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
 
	resetTracker(topic,siteId,payload) {
		  let that =this;
		  console.log('reset tracker');
			 
		axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{
			"event": "restart",
			})
			.then(response => {
			   //console.log('posted reset response');
			   //console.log(response.data);
			}).catch(error => {
						  console.log(error);
					  });	
	}
	
	predictAndRun (siteId,payload)  {
		let that = this;
		//console.log('predict and run');
		//console.log('================================================================');
		//console.log('================================================================');
		
		return new Promise(function(resolve,reject) {
			axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
			.then(response => {
			   //console.log('posted predict response');
				//console.log(response.data);
				if (response.data.scores && response.data.scores.length > 0 && response.data.scores[0].action  && response.data.scores[0].action.length > 0) {
					let scores = response.data.scores;
					scores.sort(function(a,b) {
						if (a.score > b.score) return -1
						else return 1;
					});
					//console.log('===========================1');
					//console.log(scores);
					//console.log('===========================1');
					let action =  scores[0].action;
					let confidence = scores[0].action.score;
					console.log(['ACTION',action]);
					// get current state of slots for action message
					axios.get(that.props.coreServer+"/conversations/"+siteId+"/tracker",{})
					  .then(tracker => {
						console.log(['TRACKER',tracker.data]);
					
     					that.sendMqtt('hermod/'+siteId+'/action',{id:payload.id,action:action,slots:tracker.data.slots});
						//console.log(['send action message '+action,{action:action,slots:tracker.data.slots}])
						
						let callbacks = {}
						callbacks['hermod/'+siteId+'/action/finished'] = function() {
							axios.post(that.props.coreServer+"/conversations/"+siteId+"/execute",{name:action,confidence:confidence})
							//axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{event:'action',name:action})
						  .then(response => {
								//console.log('sent action event to tracker')
					//			console.log(response.data)
								axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
								.then(response => {
									//console.log('final next action')
									console.log(response.data)
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
					that.manager.addCallbacks(callbacks,true)
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
		that.sendMqtt('hermod/'+siteId+'/conversations/core/started',{dialogId:payload.dialogId});				
		// TODO access control check siteId against props siteId or siteIds
		//console.log('post message ');
		axios.post(this.props.coreServer+"/conversations/"+siteId+"/messages",{text:payload.text,sender:"user",parse_data:payload})
		  .then(function(response) {
			  //console.log('posted message response');
				//console.log(response.data);
			  that.predictAndRun(siteId,payload).then(function(action) {
				 
				if (action === 'action_restart') {
					// restart hotword
					console.log(['END AND RESTART HOTWORD']);
					that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id});
					
				} else if (action === 'action_listen') {
					// restart asr
					//console.log(['NOW LISTEN']);
					console.log(['END AND asr']);
					that.sendMqtt('hermod/'+siteId+'/dialog/continue',{id:payload.id});
					
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
 
 